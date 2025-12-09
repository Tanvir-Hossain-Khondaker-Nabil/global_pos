<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\ReplacementProduct;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Stock;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PurchaseReturnController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = PurchaseReturn::latest()
            ->with(['purchase', 'supplier', 'warehouse', 'items.product', 'items.variant']);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('return_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('purchase', function ($q) use ($request) {
                        $q->where('purchase_no', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('supplier', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('company', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('return_type') && $request->return_type) {
            $query->where('return_type', $request->return_type);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('return_date', $request->date);
        }

        $returns = $query->paginate(10)->withQueryString();

        // Transform data for shadow users
        if ($isShadowUser) {
            $returns->getCollection()->transform(function ($return) {
                return $this->transformToShadowData($return);
            });
        }

        // Get recent purchases for the dropdown
        $recentPurchases = Purchase::where('status', 'completed')
            ->with(['supplier'])
            ->orderBy('purchase_date', 'desc')
            ->take(20)
            ->get();

        return Inertia::render('PurchaseReturn/PurchaseReturnList', [
            'filters' => $request->only(['search', 'status', 'return_type', 'date']),
            'returns' => $returns,
            'purchases' => $recentPurchases,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseId = $request->purchase_id;
        $purchase = null;
        $purchaseItems = [];

        if ($purchaseId) {
            $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
                ->findOrFail($purchaseId);

            // Filter items that still have stock
            foreach ($purchase->items as $item) {
                $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if ($stock && $stock->quantity > 0) {
                    $purchaseItems[] = [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name,
                        'variant_id' => $item->variant_id,
                        'variant_name' => $this->getVariantDisplayName($item->variant),
                        'max_quantity' => min($item->quantity, $stock->quantity),
                        'unit_price' => $item->unit_price,
                        'shadow_unit_price' => $item->shadow_unit_price,
                        'sale_price' => $item->sale_price,
                        'shadow_sale_price' => $item->shadow_sale_price,
                        'purchase_quantity' => $item->quantity
                    ];
                }
            }
        }

        // Get recent purchases for the dropdown
        $recentPurchases = Purchase::where('status', 'completed')
            ->with(['supplier'])
            ->orderBy('purchase_date', 'desc')
            ->take(20)
            ->get();

        return Inertia::render('PurchaseReturn/AddPurchaseReturn', [
            'purchase' => $purchase,
            'purchaseItems' => $purchaseItems,
            'purchases' => $recentPurchases,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function store(Request $request)
    {
        Log::info('Purchase Return Store Request:', $request->all());


        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        // Simple validation
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'return_type' => 'required|in:money_back,product_replacement',
            'return_date' => 'required|date',
            'reason' => 'required|string|min:3',
            'notes' => 'nullable|string',
            'payment_type' => 'nullable|in:cash,card,mobile_banking,adjust_to_advance',
            'refunded_amount' => 'nullable|numeric|min:0',
            'shadow_refunded_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'replacement_products' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            Log::info('Starting purchase return creation');

            // Generate return number
            $returnCount = PurchaseReturn::whereDate('created_at', today())->count();
            $returnNo = 'RTN-' . date('Ymd') . '-' . str_pad($returnCount + 1, 4, '0', STR_PAD_LEFT);

            Log::info('Generated Return No:', ['return_no' => $returnNo]);

            // Get purchase details
            $purchase = Purchase::findOrFail($request->purchase_id);
            Log::info('Purchase found:', ['purchase_id' => $purchase->id]);

            // Calculate total return amount
            $totalReturnAmount = 0;
            $shadowTotalReturnAmount = 0;

            foreach ($request->items as $item) {
                if (!isset($item['purchase_item_id'])) {
                    throw new \Exception('Purchase item ID is missing');
                }

                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem) {
                    throw new \Exception('Purchase item not found: ' . $item['purchase_item_id']);
                }

                $quantity = $item['return_quantity'] ?? 0;
                $totalReturnAmount += $quantity * $purchaseItem->unit_price;
                $shadowTotalReturnAmount += $quantity * $purchaseItem->shadow_unit_price;
            }

            Log::info('Calculated amounts:', [
                'totalReturnAmount' => $totalReturnAmount,
                'shadowTotalReturnAmount' => $shadowTotalReturnAmount
            ]);

            // For product replacement, calculate replacement value
            $replacementValue = 0;
            $shadowReplacementValue = 0;

            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    $quantity = $replacement['quantity'] ?? 0;
                    $unitPrice = $replacement['unit_price'] ?? 0;
                    $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;

                    $replacementValue += $quantity * $unitPrice;
                    $shadowReplacementValue += $quantity * $shadowUnitPrice;
                }
            }

            $refundedAmount = $request->refunded_amount ?? 0;
            $shadowRefundedAmount = $request->shadow_refunded_amount ?? 0;

            // For money back returns, check if adjusting to advance
            if ($request->return_type === 'money_back' && $request->payment_type === 'adjust_to_advance') {
                $supplier = Supplier::find($purchase->supplier_id);
                if ($supplier) {
                    $supplier->advance_amount += $refundedAmount;
                    $supplier->save();
                }
            }

            // Create purchase return
            $purchaseReturnData = [
                'return_no' => $returnNo,
                'purchase_id' => $request->purchase_id,
                'supplier_id' => $purchase->supplier_id,
                'warehouse_id' => $purchase->warehouse_id,
                'return_date' => $request->return_date,
                'return_type' => $request->return_type,
                'total_return_amount' => $totalReturnAmount,
                'refunded_amount' => $refundedAmount,
                'shadow_return_amount' => $shadowTotalReturnAmount,
                'shadow_refunded_amount' => $shadowRefundedAmount,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'status' => 'pending',
                'created_by' => $user->id,
                'user_type' => $user->type,
                'payment_type' => $request->payment_type,
            ];

            Log::info('Creating purchase return with data:', $purchaseReturnData);

            $purchaseReturn = PurchaseReturn::create($purchaseReturnData);

            Log::info('Purchase return created:', ['id' => $purchaseReturn->id]);

            // Create return items
            foreach ($request->items as $item) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if (!$purchaseItem)
                    continue;

                $quantity = $item['return_quantity'] ?? 0;
                if ($quantity <= 0)
                    continue;

                $returnItemData = [
                    'purchase_return_id' => $purchaseReturn->id,
                    'purchase_item_id' => $item['purchase_item_id'],
                    'product_id' => $purchaseItem->product_id,
                    'variant_id' => $purchaseItem->variant_id,
                    'return_quantity' => $quantity,
                    'unit_price' => $purchaseItem->unit_price,
                    'shadow_unit_price' => $purchaseItem->shadow_unit_price,
                    'sale_price' => $purchaseItem->sale_price,
                    'shadow_sale_price' => $purchaseItem->shadow_sale_price,
                    'total_price' => $quantity * $purchaseItem->unit_price,
                    'shadow_total_price' => $quantity * $purchaseItem->shadow_unit_price,
                    'reason' => $item['reason'] ?? 'Return requested',
                    'status' => 'pending',
                ];

                Log::info('Creating return item:', $returnItemData);
                PurchaseReturnItem::create($returnItemData);
            }

            // Create replacement products if applicable
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                foreach ($request->replacement_products as $replacement) {
                    if (!isset($replacement['product_id']) || !isset($replacement['variant_id'])) {
                        continue;
                    }

                    $replacementData = [
                        'purchase_return_id' => $purchaseReturn->id,
                        'product_id' => $replacement['product_id'],
                        'variant_id' => $replacement['variant_id'],
                        'quantity' => $replacement['quantity'] ?? 1,
                        'unit_price' => $replacement['unit_price'] ?? 0,
                        'shadow_unit_price' => $replacement['shadow_unit_price'] ?? 0,
                        'sale_price' => $replacement['sale_price'] ?? 0,
                        'shadow_sale_price' => $replacement['shadow_sale_price'] ?? 0,
                        'total_price' => ($replacement['quantity'] ?? 1) * ($replacement['unit_price'] ?? 0),
                        'shadow_total_price' => ($replacement['quantity'] ?? 1) * ($replacement['shadow_unit_price'] ?? 0),
                    ];

                    Log::info('Creating replacement product:', $replacementData);
                    ReplacementProduct::create($replacementData);
                }
            }

            DB::commit();
            Log::info('Purchase return created successfully');

            return redirect()->route('purchase-return.list')->with(
                'success',
                'Purchase return created successfully. Awaiting approval.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Purchase return creation error: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            return redirect()->back()
                ->with('error', 'Error creating purchase return: ' . $e->getMessage())
                ->withInput();
        }
    }
    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchaseReturn = PurchaseReturn::with([
            'purchase',
            'supplier',
            'warehouse',
            'items.product',
            'items.variant',
            'replacementProducts.product',
            'replacementProducts.variant',
            'creator'
        ])->findOrFail($id);

        // Transform data for shadow users
        if ($isShadowUser) {
            $purchaseReturn = $this->transformToShadowData($purchaseReturn);
        }

        return Inertia::render('PurchaseReturn/PurchaseReturnShow', [
            'return' => $purchaseReturn,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return redirect()->back()->with('error', 'You are not authorized to delete purchase returns.');
        }

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with(['items'])->findOrFail($id);

            if ($purchaseReturn->status !== 'pending') {
                throw new \Exception('Only pending returns can be deleted.');
            }

            $purchaseReturn->delete();

            DB::commit();
            return redirect()->route('purchase-return.list')->with('success', 'Purchase return deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting purchase return: ' . $e->getMessage());
        }
    }

    public function approve($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with(['items', 'replacementProducts', 'purchase'])
                ->findOrFail($id);

            if ($purchaseReturn->status !== 'pending') {
                throw new \Exception('This return cannot be approved.');
            }

            // Update stock for returned items
            foreach ($purchaseReturn->items as $item) {
                $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if (!$stock || $stock->quantity < $item->return_quantity) {
                    throw new \Exception('Insufficient stock for product: ' . $item->product->name);
                }

                // Reduce stock
                $stock->decrement('quantity', $item->return_quantity);

                // Update return item status
                $item->update(['status' => 'approved']);
            }

            // For product replacement, add replacement products to stock
            if ($purchaseReturn->return_type === 'product_replacement') {
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $replacement->product_id)
                        ->where('variant_id', $replacement->variant_id)
                        ->first();

                    if ($stock) {
                        $stock->increment('quantity', $replacement->quantity);
                        // Update prices if they're different
                        if ($replacement->unit_price > 0) {
                            $stock->purchase_price = $replacement->unit_price;
                            $stock->sale_price = $replacement->sale_price;
                        }
                        if ($replacement->shadow_unit_price > 0) {
                            $stock->shadow_purchase_price = $replacement->shadow_unit_price;
                            $stock->shadow_sale_price = $replacement->shadow_sale_price;
                        }
                        $stock->save();
                    } else {
                        Stock::create([
                            'warehouse_id' => $purchaseReturn->warehouse_id,
                            'product_id' => $replacement->product_id,
                            'variant_id' => $replacement->variant_id,
                            'quantity' => $replacement->quantity,
                            'purchase_price' => $replacement->unit_price,
                            'sale_price' => $replacement->sale_price,
                            'shadow_purchase_price' => $replacement->shadow_unit_price,
                            'shadow_sale_price' => $replacement->shadow_sale_price,
                        ]);
                    }
                }
            }

            // Update purchase return status
            $purchaseReturn->update(['status' => 'approved']);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error approving purchase return: ' . $e->getMessage());
        }
    }

    public function complete($id)
{
    $user = Auth::user();
    $isShadowUser = $user->type === 'shadow';

    DB::beginTransaction();
    try {
        $purchaseReturn = PurchaseReturn::with(['purchase', 'replacementProducts', 'items'])
            ->findOrFail($id);

        if ($purchaseReturn->status !== 'approved') {
            throw new \Exception('This return cannot be completed.');
        }

        // Get the purchase
        $purchase = $purchaseReturn->purchase;
        
        // For MONEY BACK returns
        if ($purchaseReturn->return_type === 'money_back') {
            if ($purchaseReturn->refunded_amount > 0) {
                // Update purchase amounts
                $purchase->decrement('paid_amount', $purchaseReturn->refunded_amount);
                $purchase->increment('due_amount', $purchaseReturn->refunded_amount);
                
                // Update shadow amounts if applicable
                if ($purchaseReturn->shadow_refunded_amount > 0) {
                    $purchase->decrement('shadow_paid_amount', $purchaseReturn->shadow_refunded_amount);
                    $purchase->increment('shadow_due_amount', $purchaseReturn->shadow_refunded_amount);
                }
                
                // Recalculate payment status
                $paymentStatus = $this->calculatePaymentStatus($purchase);
                $shadowPaymentStatus = $this->calculateShadowPaymentStatus($purchase);
                $purchase->update([
                    'payment_status' => $paymentStatus,
                    'shadow_payment_status' => $shadowPaymentStatus
                ]);
                
                // Create refund payment record
                Payment::create([
                    'purchase_id' => $purchase->id,
                    'amount' => -$purchaseReturn->refunded_amount, // Negative for refund
                    'shadow_amount' => -$purchaseReturn->shadow_refunded_amount,
                    'payment_method' => $purchaseReturn->payment_type,
                    'txn_ref' => 'REFUND-' . Str::random(10),
                    'note' => 'Refund for return: ' . $purchaseReturn->return_no,
                    'supplier_id' => $purchaseReturn->supplier_id,
                    'paid_at' => Carbon::now(),
                    'created_by' => $user->id,
                    'type' => 'refund'
                ]);
            }
        }
        
        // For PRODUCT REPLACEMENT returns
        elseif ($purchaseReturn->return_type === 'product_replacement') {
            // Calculate total value of replacement products
            $replacementValue = 0;
            $shadowReplacementValue = 0;
            
            foreach ($purchaseReturn->replacementProducts as $replacement) {
                $replacementValue += $replacement->total_price;
                $shadowReplacementValue += $replacement->shadow_total_price;
            }
            
            // If replacement products have value, adjust the purchase
            if ($replacementValue > 0) {
                // Get the total return amount
                $totalReturnValue = $purchaseReturn->total_return_amount;
                
                // If replacement value is less than return value, we need to refund the difference
                $refundAmount = max(0, $totalReturnValue - $replacementValue);
                $shadowRefundAmount = max(0, $purchaseReturn->shadow_return_amount - $shadowReplacementValue);
                
                if ($refundAmount > 0) {
                    // Update purchase for partial refund
                    $purchase->decrement('paid_amount', $refundAmount);
                    $purchase->increment('due_amount', $refundAmount);
                    
                    if ($shadowRefundAmount > 0) {
                        $purchase->decrement('shadow_paid_amount', $shadowRefundAmount);
                        $purchase->increment('shadow_due_amount', $shadowRefundAmount);
                    }
                    
                    // Create partial refund payment
                    Payment::create([
                        'purchase_id' => $purchase->id,
                        'amount' => -$refundAmount,
                        'shadow_amount' => -$shadowRefundAmount,
                        'payment_method' => $purchaseReturn->payment_type ?? 'cash',
                        'txn_ref' => 'REFUND-' . Str::random(10),
                        'note' => 'Partial refund for replacement return: ' . $purchaseReturn->return_no,
                        'supplier_id' => $purchaseReturn->supplier_id,
                        'paid_at' => Carbon::now(),
                        'created_by' => $user->id,
                        'type' => 'refund'
                    ]);
                }
                
                // Recalculate payment status
                $paymentStatus = $this->calculatePaymentStatus($purchase);
                $shadowPaymentStatus = $this->calculateShadowPaymentStatus($purchase);
                $purchase->update([
                    'payment_status' => $paymentStatus,
                    'shadow_payment_status' => $shadowPaymentStatus
                ]);
                
                // Add note about replacement
                $purchaseReturn->notes .= "\n\nReplacement completed on: " . now()->format('Y-m-d H:i:s');
                $purchaseReturn->notes .= "\nReplacement value: " . $replacementValue;
                $purchaseReturn->notes .= "\nRefund amount: " . $refundAmount;
            }
        }
        
        // Update purchase return status
        $purchaseReturn->update(['status' => 'completed']);
        
        DB::commit();
        
        return redirect()->back()->with('success', 'Purchase return completed successfully.');
    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()->back()->with('error', 'Error completing purchase return: ' . $e->getMessage());
    }
}

    private function calculatePaymentStatus($purchase)
    {
        if ($purchase->due_amount <= 0) {
            return 'paid';
        } elseif ($purchase->paid_amount > 0) {
            return 'partial';
        } else {
            return 'unpaid';
        }
    }

    private function calculateShadowPaymentStatus($purchase)
    {
        if ($purchase->shadow_due_amount <= 0) {
            return 'paid';
        } elseif ($purchase->shadow_paid_amount > 0) {
            return 'partial';
        } else {
            return 'unpaid';
        }
    }

    private function getVariantDisplayName($variant)
    {
        if ($variant->attribute_values && is_array($variant->attribute_values)) {
            $parts = [];
            foreach ($variant->attribute_values as $attribute => $value) {
                $parts[] = "$attribute: $value";
            }
            return implode(', ', $parts);
        }

        $parts = [];
        if ($variant->size)
            $parts[] = "Size: $variant->size";
        if ($variant->color)
            $parts[] = "Color: $variant->color";
        if ($variant->material)
            $parts[] = "Material: $variant->material";

        return !empty($parts) ? implode(', ', $parts) : 'Default Variant';
    }

    private function transformToShadowData($purchaseReturn)
    {
        // Replace real amounts with shadow amounts
        $purchaseReturn->total_return_amount = $purchaseReturn->shadow_return_amount;
        $purchaseReturn->refunded_amount = $purchaseReturn->shadow_refunded_amount;

        // Transform items
        if ($purchaseReturn->items) {
            $purchaseReturn->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        // Transform replacement products
        if ($purchaseReturn->replacementProducts) {
            $purchaseReturn->replacementProducts->transform(function ($product) {
                $product->unit_price = $product->shadow_unit_price;
                $product->sale_price = $product->shadow_sale_price;
                $product->total_price = $product->shadow_total_price;
                return $product;
            });
        }

        return $purchaseReturn;
    }
}