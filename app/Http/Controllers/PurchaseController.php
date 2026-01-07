<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequestStore;
use App\Models\BusinessProfile;
use App\Models\Payment;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\Variant;
use App\Models\Stock;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Str;
use DNS1D;

class PurchaseController extends Controller
{
    // Show purchase list with stocks and barcodes
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = Purchase::latest()
            ->with(['supplier', 'warehouse', 'items.product', 'items.variant']);

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('purchase_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('supplier', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('company', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('warehouse', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('code', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('items.stock', function ($q) use ($request) {
                        $q->where('barcode', 'like', '%' . $request->search . '%')
                            ->orWhere('batch_no', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('purchase_date', $request->date);
        }

        $purchases = $query->paginate(10)->withQueryString();

        // প্রতিটি purchase-এর জন্য stock এবং barcode ডেটা যোগ করুন
        $purchases->getCollection()->transform(function ($purchase) use ($isShadowUser) {
            // Purchase ট্রান্সফর্ম
            if ($isShadowUser) {
                $purchase = $this->transformToShadowData($purchase);
            }
            
            // Purchase items-এ stock ডেটা যোগ করুন
            if ($purchase->items) {
                $purchase->items->transform(function ($item) {
                    // এই purchase item-এর সাথে সম্পর্কিত stock খুঁজুন
                    $stock = Stock::where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->where(function ($q) use ($item) {
                            // Batch number match: PO-{item_id}-xxxx
                            $q->where('batch_no', 'LIKE', 'PO-' . $item->id . '-%')
                              ->orWhere('batch_no', 'LIKE', 'PO' . '-' . $item->id . '-%');
                        })
                        ->first();
                    
                    if ($stock) {
                        $item->stock = [
                            'id' => $stock->id,
                            'batch_no' => $stock->batch_no,
                            'barcode' => $stock->barcode,
                            'barcode_path' => $stock->barcode_path,
                            'quantity' => $stock->quantity,
                            'created_at' => $stock->created_at,
                            'has_barcode' => !empty($stock->barcode)
                        ];
                    } else {
                        $item->stock = null;
                    }
                    
                    return $item;
                });
                
                // Purchase-এর জন্য সব barcode সংগ্রহ করুন
                $barcodes = [];
                $hasBarcode = false;
                
                foreach ($purchase->items as $item) {
                    if ($item->stock && $item->stock['barcode']) {
                        $barcodes[] = [
                            'barcode' => $item->stock['barcode'],
                            'product_name' => $item->product->name,
                            'quantity' => $item->stock['quantity']
                        ];
                        $hasBarcode = true;
                    }
                }
                
                $purchase->barcodes = $barcodes;
                $purchase->has_barcode = $hasBarcode;
                $purchase->barcode_count = count($barcodes);
            }
            
            return $purchase;
        });

        return Inertia::render('Purchase/PurchaseList', [
            'filters' => $request->only(['search', 'status', 'date']),
            'purchases' => $purchases,
            'isShadowUser' => $isShadowUser,
            'accounts' => Account::where('is_active', true)->get()
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        return Inertia::render('Purchase/AddPurchase', [
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants', 'brand')->get(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }

    // Store purchase with barcode generation
    public function store(PurchaseRequestStore $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $request->validated();

        // Account validation for real users
        if (!$isShadowUser && $request->paid_amount > 0 && !$request->account_id) {
            return back()->withErrors(['error' => 'Please select a payment account when making payment']);
        }

        $account = null;
        if ($request->account_id) {
            $account = Account::find($request->account_id);
            $payment_type = $account->type;
            if (!$account) {
                return back()->withErrors(['error' => 'Selected account not found']);
            }
            if (!$account->is_active) {
                return back()->withErrors(['error' => 'Selected account is not active']);
            }
        }

        $adjustamount = $request->adjust_from_advance ?? false;

        if ($adjustamount == true) {
            $supplier = Supplier::find($request->supplier_id);
            $payment_type = 'advance_adjustment';

            if ($request->paid_amount > $supplier->advance_amount) {
                return back()->withErrors(['error' => 'If you want to adjust from advance, the advance adjustment cannot be greater than available advance amount.']);
            }

            $supplier->update([
                'advance_amount' => $supplier->advance_amount - $request->paid_amount,
            ]);
        }

        DB::beginTransaction();
        try {
            $purchaseCount = Purchase::count();
            $purchaseNo = 'PUR-' . date('Ymd') . '-' . str_pad($purchaseCount + 1, 4, '0', STR_PAD_LEFT);

            $totalAmount = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            $paidAmount = $request->paid_amount;
            $shadowPaidAmount = $request->shadow_paid_amount ?? 0;
            $dueAmount = $totalAmount - $paidAmount;

            // Create purchase
            $purchase = Purchase::create([
                'purchase_no' => $purchaseNo,
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'purchase_date' => $request->purchase_date,
                'grand_total' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $request->payment_status,
                'notes' => $request->notes,
                'status' => 'completed',
                'created_by' => $user->id,
                'user_type' => $user->type,
                'payment_type' => $payment_type ?? 'cash'
            ]);

            // Create purchase items and update stock
            foreach ($request->items as $item) {
                $totalPrice = $item['quantity'] * ($item['unit_price'] ?? 0);
                $unitPrice = $isShadowUser ? 0 : (float) ($item['unit_price'] ?? 0);
                $salePrice = $isShadowUser ? 0 : (float) ($item['sale_price'] ?? 0);

                if (!$isShadowUser && $salePrice <= 0) {
                    throw new \Exception("Sale price must be greater than 0 for product ID: {$item['product_id']}");
                }

                // Create purchase item
                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'sale_price' => $salePrice,
                    'total_price' => $totalPrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'warehouse_id' => $request->warehouse_id
                ]);

                // Generate batch number
                $batchNo = 'PO-' . $purchaseItem->id . '-' . Str::upper(Str::random(4));
                
                // Create stock
                $stock = Stock::create([
                    'warehouse_id' => $request->warehouse_id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $isShadowUser ? 0 : $unitPrice,
                    'sale_price' => $isShadowUser ? 0 : $salePrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'batch_no' => $batchNo,
                ]);

                // Generate barcode for stock
                if (!$isShadowUser) {
                    $this->generateStockBarcode($stock, $purchaseItem);
                }
            }

            if ($paidAmount > 0) {
                if ($account) {
                    // Check account balance before deducting
                    if (!$account->canWithdraw($paidAmount)) {
                        throw new \Exception("Insufficient balance in account: {$account->name}");
                    }

                    // Deduct amount from account
                    $account->updateBalance($paidAmount, 'withdraw');
                }

                $payment = new Payment();
                $payment->purchase_id = $purchase->id;
                $payment->amount = -$paidAmount; // Store as NEGATIVE
                $payment->payment_method = $request->payment_method ?? ($payment_type ?? 'cash');
                $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                $payment->note = $request->notes ?? null;
                $payment->supplier_id = $request->supplier_id ?? null;
                $payment->account_id = $request->account_id;
                $payment->paid_at = Carbon::now();
                $payment->created_by = Auth::id();
                $payment->save();
            }

            DB::commit();

            return redirect()->route('purchase.list')->with(
                'success',
                $isShadowUser ? 'Shadow purchase created successfully' : 'Purchase created successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error creating purchase: ' . $e->getMessage());
        }
    }

    // Generate barcode for stock
    private function generateStockBarcode($stock, $purchaseItem = null)
    {
        try {
            // Generate unique barcode
            $barcode = 'STK-' . str_pad($stock->id, 6, '0', STR_PAD_LEFT) . '-' . now()->format('YmdHis');
            
            // Generate barcode image
            $barcodePNG = DNS1D::getBarcodePNG($barcode, 'C128', 2, 60);
            $imageData = base64_decode($barcodePNG);
            
            // Save to storage
            $directory = 'public/barcodes/' . date('Y/m/d');
            Storage::makeDirectory($directory);
            
            $filename = 'barcode_' . $stock->id . '_' . time() . '.png';
            $path = $directory . '/' . $filename;
            
            Storage::put($path, $imageData);
            
            // Update stock with barcode
            $stock->update([
                'barcode' => $barcode,
                'barcode_path' => $path
            ]);
            
            // Log barcode generation
            Log::info('Barcode generated for stock', [
                'stock_id' => $stock->id,
                'barcode' => $barcode,
                'purchase_item_id' => $purchaseItem ? $purchaseItem->id : null,
                'batch_no' => $stock->batch_no
            ]);
            
            return $barcode;
            
        } catch (\Exception $e) {
            Log::error('Barcode generation failed for stock: ' . $stock->id, [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    // Generate barcode for purchase item
    public function generatePurchaseItemBarcode($purchaseId, $itemId)
    {
        try {
            $purchaseItem = PurchaseItem::where('purchase_id', $purchaseId)
                ->where('id', $itemId)
                ->firstOrFail();
            
            // Find associated stock
            $stock = Stock::where('product_id', $purchaseItem->product_id)
                ->where('variant_id', $purchaseItem->variant_id)
                ->where('batch_no', 'LIKE', 'PO-' . $purchaseItem->id . '-%')
                ->first();
            
            if (!$stock) {
                // Create stock if not exists
                $stock = Stock::create([
                    'warehouse_id' => $purchaseItem->warehouse_id,
                    'product_id' => $purchaseItem->product_id,
                    'variant_id' => $purchaseItem->variant_id,
                    'quantity' => $purchaseItem->quantity,
                    'purchase_price' => $purchaseItem->unit_price,
                    'sale_price' => $purchaseItem->sale_price,
                    'user_type' => $purchaseItem->user_type,
                    'created_by' => $purchaseItem->created_by,
                    'batch_no' => 'PO-' . $purchaseItem->id . '-' . Str::upper(Str::random(4)),
                ]);
            }
            
            // Generate barcode if not exists
            if (empty($stock->barcode)) {
                $barcode = $this->generateStockBarcode($stock, $purchaseItem);
                
                return redirect()->back()->with('success', 'Barcode generated successfully: ' . $barcode);
            } else {
                return redirect()->back()->with('info', 'Barcode already exists: ' . $stock->barcode);
            }
            
        } catch (\Exception $e) {
            Log::error('Barcode generation failed for purchase item: ' . $itemId, [
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to generate barcode: ' . $e->getMessage());
        }
    }

    // Generate barcodes for all items in a purchase
    public function generatePurchaseBarcodes($purchaseId)
    {
        try {
            $purchase = Purchase::with('items')->findOrFail($purchaseId);
            $generatedCount = 0;
            
            foreach ($purchase->items as $item) {
                // Find or create stock
                $stock = Stock::where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->where(function ($q) use ($item) {
                        $q->where('batch_no', 'LIKE', 'PO-' . $item->id . '-%')
                          ->orWhere('batch_no', 'LIKE', 'PO' . '-' . $item->id . '-%');
                    })
                    ->first();
                
                if (!$stock) {
                    $stock = Stock::create([
                        'warehouse_id' => $item->warehouse_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'quantity' => $item->quantity,
                        'purchase_price' => $item->unit_price,
                        'sale_price' => $item->sale_price,
                        'user_type' => $item->user_type,
                        'created_by' => $item->created_by,
                        'batch_no' => 'PO-' . $item->id . '-' . Str::upper(Str::random(4)),
                    ]);
                }
                
                // Generate barcode if not exists
                if (empty($stock->barcode)) {
                    $this->generateStockBarcode($stock, $item);
                    $generatedCount++;
                }
            }
            
            return redirect()->back()->with('success', "Generated barcodes for {$generatedCount} items");
            
        } catch (\Exception $e) {
            Log::error('Bulk barcode generation failed for purchase: ' . $purchaseId, [
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to generate barcodes: ' . $e->getMessage());
        }
    }

    // Print barcode for purchase item
    public function printItemBarcode($purchaseId, $itemId)
    {
        try {
            $purchaseItem = PurchaseItem::with(['product', 'variant', 'purchase'])
                ->where('purchase_id', $purchaseId)
                ->where('id', $itemId)
                ->firstOrFail();
            
            $stock = Stock::where('product_id', $purchaseItem->product_id)
                ->where('variant_id', $purchaseItem->variant_id)
                ->where('batch_no', 'LIKE', 'PO-' . $purchaseItem->id . '-%')
                ->first();
            
            // Generate barcode if not exists
            if (!$stock || empty($stock->barcode)) {
                if (!$stock) {
                    $stock = Stock::create([
                        'warehouse_id' => $purchaseItem->warehouse_id,
                        'product_id' => $purchaseItem->product_id,
                        'variant_id' => $purchaseItem->variant_id,
                        'quantity' => $purchaseItem->quantity,
                        'purchase_price' => $purchaseItem->unit_price,
                        'sale_price' => $purchaseItem->sale_price,
                        'user_type' => $purchaseItem->user_type,
                        'created_by' => $purchaseItem->created_by,
                        'batch_no' => 'PO-' . $purchaseItem->id . '-' . Str::upper(Str::random(4)),
                    ]);
                }
                
                $this->generateStockBarcode($stock, $purchaseItem);
                $stock->refresh();
            }
            
            $business = BusinessProfile::where('user_id', auth()->id())->first();
            
            return Inertia::render('Purchase/BarcodePrint', [
                'purchaseItem' => $purchaseItem,
                'stock' => $stock,
                'business' => $business,
                'barcode_svg' => DNS1D::getBarcodeSVG($stock->barcode, 'C128', 2, 60)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Barcode print failed for item: ' . $itemId, [
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to print barcode: ' . $e->getMessage());
        }
    }

    // Print all barcodes for a purchase
    public function printPurchaseBarcodes($purchaseId)
    {
        try {
            $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])->findOrFail($purchaseId);
            
            $itemsWithBarcodes = [];
            
            foreach ($purchase->items as $item) {
                $stock = Stock::where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->where('batch_no', 'LIKE', 'PO-' . $item->id . '-%')
                    ->first();
                
                // Generate barcode if not exists
                if (!$stock || empty($stock->barcode)) {
                    if (!$stock) {
                        $stock = Stock::create([
                            'warehouse_id' => $item->warehouse_id,
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'quantity' => $item->quantity,
                            'purchase_price' => $item->unit_price,
                            'sale_price' => $item->sale_price,
                            'user_type' => $item->user_type,
                            'created_by' => $item->created_by,
                            'batch_no' => 'PO-' . $item->id . '-' . Str::upper(Str::random(4)),
                        ]);
                    }
                    
                    $this->generateStockBarcode($stock, $item);
                    $stock->refresh();
                }
                
                $itemsWithBarcodes[] = [
                    'item' => $item,
                    'stock' => $stock,
                    'barcode_svg' => DNS1D::getBarcodeSVG($stock->barcode, 'C128', 2, 60)
                ];
            }
            
            $business = BusinessProfile::where('user_id', auth()->id())->first();
            
            return Inertia::render('Purchase/BulkBarcodePrint', [
                'purchase' => $purchase,
                'items' => $itemsWithBarcodes,
                'business' => $business
            ]);
            
        } catch (\Exception $e) {
            Log::error('Bulk barcode print failed for purchase: ' . $purchaseId, [
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to print barcodes: ' . $e->getMessage());
        }
    }

    // Show purchase with barcode details
    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchase = Purchase::with([
            'supplier',
            'warehouse',
            'items.product',
            'items.product.brand',
            'items.variant',
            'items.stock',
            'payments.account' 
        ])->findOrFail($id);

        if ($isShadowUser) {
            $purchase = $this->transformToShadowData($purchase);
        }

        // প্রতিটি item-এর জন্য stock ডেটা যোগ করুন
        if ($purchase->items) {
            $purchase->items->transform(function ($item) {
                // এই item-এর সাথে সম্পর্কিত stock খুঁজুন
                $stock = Stock::where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->where(function ($q) use ($item) {
                        $q->where('batch_no', 'LIKE', 'PO-' . $item->id . '-%')
                          ->orWhere('batch_no', 'LIKE', 'PO' . '-' . $item->id . '-%');
                    })
                    ->first();
                
                if ($stock) {
                    $item->stock_details = $stock;
                }
                
                return $item;
            });
            
            // Barcode statistics
            $purchase->barcode_stats = [
                'total_items' => $purchase->items->count(),
                'items_with_barcode' => $purchase->items->filter(function ($item) {
                    return $item->stock_details && !empty($item->stock_details->barcode);
                })->count(),
                'items_without_barcode' => $purchase->items->filter(function ($item) {
                    return !$item->stock_details || empty($item->stock_details->barcode);
                })->count(),
            ];
        }

        return Inertia::render('Purchase/PurchaseShow', [
            'purchase' => $purchase,
            'isShadowUser' => $isShadowUser
        ]);
    }


    //edit purchase method
    public function edit($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchase = Purchase::with(['supplier', 'warehouse', 'items.product', 'items.variant', 'payments'])
            ->findOrFail($id);

        if ($isShadowUser) {
            $purchase = $this->transformToShadowData($purchase);
        }

        return Inertia::render('Purchase/EditPurchase', [
            'purchase' => $purchase,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants', 'brand')->get(),
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }


    //update purchase method
    public function update(PurchaseRequestStore $request, $id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $request->validated();

        if ($user->role !== 'admin' && $user->id !== Purchase::find($id)->created_by) {
            return back()->withErrors(['error' => 'You are not authorized to edit this purchase.']);
        }

        $purchase = Purchase::with('items')->findOrFail($id);

        if ($purchase->status == 'approved' && $purchase->user_type == 'shadow') {
            return back()->withErrors(['error' => 'Cannot edit an approved shadow purchase.']);
        }

        // Account validation for real users
        if (!$isShadowUser && $request->paid_amount > 0 && !$request->account_id) {
            return back()->withErrors(['error' => 'Please select a payment account when making payment']);
        }

        $account = null;
        if ($request->account_id) {
            $account = Account::find($request->account_id);
            if (!$account) {
                return back()->withErrors(['error' => 'Selected account not found']);
            }
            if (!$account->is_active) {
                return back()->withErrors(['error' => 'Selected account is not active']);
            }
        }

        $adjustamount = $request->adjust_from_advance ?? false;
        $payment_type = 'cash';

        if ($adjustamount == true) {
            $supplier = Supplier::find($request->supplier_id);
            $payment_type = 'advance_adjustment';

            $previousAdjustment = $purchase->payment_type === 'advance_adjustment' ? $purchase->paid_amount : 0;
            if ($previousAdjustment > 0) {
                $supplier->update([
                    'advance_amount' => $supplier->advance_amount + $previousAdjustment,
                ]);
            }

            if ($request->paid_amount > $supplier->advance_amount) {
                return back()->withErrors(['error' => 'Advance adjustment cannot be greater than available advance amount.']);
            }

            $supplier->update([
                'advance_amount' => $supplier->advance_amount - $request->paid_amount,
            ]);
        } else {
            if ($purchase->payment_type === 'advance_adjustment') {
                $supplier = Supplier::find($purchase->supplier_id);
                $supplier->update([
                    'advance_amount' => $supplier->advance_amount + $purchase->paid_amount,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $totalAmount = collect($request->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            $paidAmount = $request->paid_amount;
            $dueAmount = $totalAmount - $paidAmount;

            // Update purchase
            $purchase->update([
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'purchase_date' => $request->purchase_date,
                'grand_total' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $request->payment_status,
                'notes' => $request->notes,
                'payment_type' => $payment_type
            ]);

            // Delete existing items and restore stock
            foreach ($purchase->items as $item) {
                $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if ($stock) {
                    $newQuantity = $stock->quantity - $item->quantity;
                    if ($newQuantity <= 0) {
                        $stock->delete();
                    } else {
                        $stock->update(['quantity' => $newQuantity]);
                    }
                }
                $item->delete();
            }

            // Create new items and update stock
            foreach ($request->items as $item) {
                $totalPrice = $item['quantity'] * ($item['unit_price'] ?? 0);
                $unitPrice = $isShadowUser ? 0 : (float) ($item['unit_price'] ?? 0);
                $salePrice = $isShadowUser ? 0 : (float) ($item['sale_price'] ?? 0);

                if (!$isShadowUser && $salePrice <= 0) {
                    throw new \Exception("Sale price must be greater than 0 for product ID: {$item['product_id']}");
                }

                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'sale_price' => $salePrice,
                    'total_price' => $totalPrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'warehouse_id' => $request->warehouse_id
                ]);

                $stock = Stock::where('warehouse_id', $request->warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->where('variant_id', $item['variant_id'])
                    ->first();

                if ($stock) {
                    $stock->increment('quantity', $item['quantity']);
                } else {
                    $stock = Stock::create([
                        'warehouse_id' => $request->warehouse_id,
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'],
                        'quantity' => $item['quantity'],
                        'purchase_price' => $isShadowUser ? 0 : $unitPrice,
                        'sale_price' => $isShadowUser ? 0 : $salePrice,
                        'user_type' => $user->type,
                        'created_by' => $user->id,
                        'batch_no' => 'PO' . '-' . $purchaseItem->id . '-' . Str::upper(Str::random(4)),
                    ]);

                    // Generate barcode for the stock
                    $this->generateStockBarcode($stock);
                }
            }

            // Handle payment update
            // Handle payment update
            $payment = Payment::where('purchase_id', $purchase->id)->first();

            if ($payment) {
                // If there's an existing payment and account
                if ($payment->account_id) {
                    $oldAccount = Account::find($payment->account_id);
                    if ($oldAccount) {
                        // Add back old amount to account (reverse the previous withdrawal)
                        // Since payment amount is stored negative, we need to use the signed value
                        $oldPaymentAmount = $payment->getSignedAmount(); // This will be negative
                        $oldAccount->updateBalance(abs($oldPaymentAmount), 'deposit'); // Use positive value for deposit
                    }
                }

                // Delete old payment if paid amount is 0
                if ($paidAmount <= 0) {
                    $payment->delete();
                } else {
                    // Update existing payment with negative amount
                    $payment->update([
                        'amount' => -$paidAmount, // Store as NEGATIVE
                        'payment_method' => $request->payment_method ?? $payment_type,
                        'note' => $request->notes,
                        'supplier_id' => $request->supplier_id,
                        'account_id' => $request->account_id
                    ]);

                    // Deduct new amount from new account
                    if ($account) {
                        if (!$account->canWithdraw($paidAmount)) {
                            throw new \Exception("Insufficient balance in account: {$account->name}");
                        }
                        $account->updateBalance($paidAmount, 'withdraw');
                    }
                }
            } elseif ($paidAmount > 0) {
                // Create new payment with negative amount
                if ($account) {
                    if (!$account->canWithdraw($paidAmount)) {
                        throw new \Exception("Insufficient balance in account: {$account->name}");
                    }
                    $account->updateBalance($paidAmount, 'withdraw');
                }

                Payment::create([
                    'purchase_id' => $purchase->id,
                    'amount' => -$paidAmount, // Store as NEGATIVE
                    'payment_method' => $request->payment_method ?? $payment_type,
                    'txn_ref' => 'nexoryn-' . Str::random(10),
                    'note' => $request->notes,
                    'supplier_id' => $request->supplier_id,
                    'account_id' => $request->account_id,
                    'paid_at' => Carbon::now(),
                    'created_by' => Auth::id()
                ]);
            }

            DB::commit();

            return redirect()->route('purchase.list')->with(
                'success',
                $isShadowUser ? 'Shadow purchase updated successfully' : 'Purchase updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error updating purchase: ' . $e->getMessage());
        }
    }




    private function transformToShadowItemData($purchase)
    {
        $purchase->unit_price = $purchase->shadow_unit_price;
        $purchase->sale_price = $purchase->shadow_sale_price;
        $purchase->total_price = $purchase->shadow_total_price;

        return $purchase;
    }


    //destroy purchase method
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::with('items')->findOrFail($id);

            // Restore account balance if payment exists
            $payment = Payment::where('purchase_id', $purchase->id)->first();
            if ($payment && $payment->account_id) {
                $account = Account::find($payment->account_id);
                if ($account && $payment->amount > 0) {
                    // Since payment amount is stored negative, get the absolute value
                    $paymentAmount = abs($payment->getSignedAmount());

                    // Add back the amount (deposit) to account (reverse withdrawal)
                    $account->updateBalance($paymentAmount, 'deposit');
                    Log::info('Payment restored to account on purchase deletion', [
                        'purchase_id' => $purchase->id,
                        'account_id' => $account->id,
                        'amount' => $paymentAmount
                    ]);
                }
            }

            // Reverse stock
            foreach ($purchase->items as $item) {
                $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if ($stock) {
                    $stock->decrement('quantity', $item->quantity);
                    if ($stock->quantity <= 0) {
                        $stock->delete();
                    }
                }
            }

            $purchase->delete();

            DB::commit();
            return redirect()->route('purchase.list')->with('success', 'Purchase deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting purchase: ' . $e->getMessage());
        }
    }


    //update payment method
    public function updatePayment(Request $request, $id)
    {
        $purchase = Purchase::with('supplier')->findOrFail($id);



        $request->validate([
            'payment_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'account_id' => 'required|exists:accounts,id',
        ]);


        DB::beginTransaction();
        try {
            $paymentAmount = $request->payment_amount;
            $account = Account::find($request->account_id);
            $payment_type = $account->type ?? 'cash';

            if (!$account) {
                return back()->withErrors(['error' => 'Selected account not found']);
            }

            if (!$account->canWithdraw($paymentAmount)) {
                return back()->withErrors(['account_id' => 'Insufficient balance in selected account']);
            }

            $newPaidAmount = $purchase->paid_amount + $paymentAmount;
            $newDueAmount = max(0, $purchase->grand_total - $newPaidAmount);
            $newPaymentStatus = $newDueAmount == 0 ? 'paid' : ($newPaidAmount > 0 ? 'partial' : 'unpaid');

            // Update purchase
            $purchase->update([
                'paid_amount' => $newPaidAmount,
                'due_amount' => $newDueAmount,
                'payment_status' => $newPaymentStatus,
                'status' => 'completed'
            ]);

            // Deduct from account (MINUS for purchase payment)
            $account->updateBalance($paymentAmount, 'withdraw');

            // Create payment record with negative amount
            Payment::create([
                'purchase_id' => $purchase->id,
                'amount' => -$paymentAmount, // Store as NEGATIVE
                'payment_method' => $request->payment_method ?? $payment_type,
                'txn_ref' => 'PYM-' . Str::random(10),
                'note' => $request->notes ?? 'Purchase due amount clearance',
                'supplier_id' => $purchase->supplier_id,
                'account_id' => $request->account_id,
                'paid_at' => Carbon::now(),
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Payment processed successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error processing payment: ' . $e->getMessage());
        }
    }


    //approve purchase method
    public function approve(Request $request, $id)
    {
        $purchase = Purchase::with('items')->findOrFail($id);

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_items,id',
            'items.*.purchase_price' => 'required|numeric|min:0.01',
            'items.*.sale_price' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $totalRealAmount = 0;

            foreach ($request->items as $approveItem) {
                $item = PurchaseItem::find($approveItem['id']);

                if ($item) {
                    $realTotalPrice = $approveItem['purchase_price'] * $item->quantity;
                    $totalRealAmount += $realTotalPrice;

                    $item->update([
                        'unit_price' => $approveItem['purchase_price'],
                        'sale_price' => $approveItem['sale_price'],
                        'total_price' => $realTotalPrice
                    ]);

                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if ($stock) {
                        $stock->update([
                            'purchase_price' => $approveItem['purchase_price'],
                            'sale_price' => $approveItem['sale_price']
                        ]);
                    }
                }
            }

            $purchase->update([
                'total_amount' => $totalRealAmount,
                'due_amount' => max(0, $totalRealAmount - $purchase->paid_amount),
                'status' => 'completed',
                'notes' => $purchase->notes . "\n\nApproved by: " . Auth::user()->name .
                    "\nApproval Date: " . now()->format('Y-m-d H:i:s') .
                    ($request->notes ? "\nApproval Notes: " . $request->notes : "")
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Shadow purchase approved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error approving purchase: ' . $e->getMessage());
        }
    }
private function transformToShadowData($purchase)
    {
        $purchase->grand_total = $purchase->shadow_grand_total;
        $purchase->paid_amount = $purchase->shadow_paid_amount;
        $purchase->due_amount = $purchase->shadow_due_amount;

        if ($purchase->items) {
            $purchase->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        return $purchase;
    }
}