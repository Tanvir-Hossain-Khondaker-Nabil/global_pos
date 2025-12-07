<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\Variant;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Str;



class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $query = Purchase::latest()
            ->with(['supplier', 'warehouse', 'items.product', 'items.variant']);

        // Apply filters
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

        // Transform data for shadow users
        if ($isShadowUser) {
            $purchases->getCollection()->transform(function ($purchase) {
                return $this->transformToShadowData($purchase);
            });
        }

        return Inertia::render('Purchase/PurchaseList', [
            'filters' => $request->only(['search', 'status', 'date']),
            'purchases' => $purchases,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        return Inertia::render('Purchase/AddPurchase', [
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get(),
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'purchase_date' => 'required|date',
            'notes' => 'nullable|string',
            'paid_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:unpaid,partial,paid',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'required|exists:variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.shadow_unit_price' => 'required|numeric|min:0',
            'items.*.shadow_sale_price' => 'required|numeric|min:0',
            // For shadow users, real prices are optional
            'items.*.unit_price' => $isShadowUser ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
            'items.*.sale_price' => $isShadowUser ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
            // Additional fields
            'items.*.product_name' => 'sometimes|string',
            'items.*.variant_name' => 'sometimes|string',
            'items.*.total_price' => 'sometimes|numeric',
            'items.*.shadow_total_price' => 'sometimes|numeric'
        ]);


        $adjustamount  = $request->adjust_from_advance;

        if($adjustamount == true){

            $supplier = Supplier::find($request->supplier_id);
            $payment_type = 'advance_adjustment';

            if( $request->paid_amount > $supplier->advance_amount){
                return back()->withErrors(['error' => 'If you want to adjust from advance, the advance adjustment cannot be greater than available advance amount.']);
            }

            $supplier->update([
                'advance_amount' => $supplier->advance_amount - $request->paid_amount ,
            ]);


        }

        DB::beginTransaction();
        try {
            // Generate purchase number
            $purchaseCount = Purchase::whereDate('created_at', today())->count();
            $purchaseNo = 'PUR-' . date('Ymd') . '-' . str_pad($purchaseCount + 1, 4, '0', STR_PAD_LEFT);

            if ($isShadowUser) {
                $totalAmount = collect($request->items)->sum(function ($item) {
                    return $item['quantity'] * $item['shadow_unit_price'];
                });
                $shadowTotalAmount = $totalAmount;
            } else {
                $totalAmount = collect($request->items)->sum(function ($item) {
                    return $item['quantity'] * $item['unit_price'];
                });
                $shadowTotalAmount = collect($request->items)->sum(function ($item) {
                    return $item['quantity'] * $item['shadow_unit_price'];
                });
            }

            // Calculate due amount
            $paidAmount = $request->paid_amount;
            $shadowPaidAmount = $request->shadow_paid_amount;
            $dueAmount = $totalAmount - $paidAmount;
            $shadowDueAmount = $shadowTotalAmount - $shadowPaidAmount;

            $purchase = Purchase::create([
                'purchase_no' => $purchaseNo,
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'purchase_date' => $request->purchase_date,
                'grand_total' => $totalAmount,
                'shadow_total_amount' => $shadowTotalAmount,
                'paid_amount' => $paidAmount,
                'shadow_paid_amount' => $shadowPaidAmount,
                'due_amount' => $dueAmount,
                'shadow_due_amount' => $shadowDueAmount,
                'payment_status' => $request->payment_status,
                'notes' => $request->notes,
                'status' => 'completed',
                'created_by' => $user->id,
                'user_type' => $user->type,
                'payment_type' => $payment_type ?? 'cash'
            ]);

            // Create purchase items and update stock
            foreach ($request->items as $item) {
                Log::info('Item data:', [
                    'product_id' => $item['product_id'],
                    'unit_price' => $item['unit_price'] ?? 'null',
                    'sale_price' => $item['sale_price'] ?? 'null',
                    'shadow_unit_price' => $item['shadow_unit_price'],
                    'shadow_sale_price' => $item['shadow_sale_price'],
                ]);

                // Calculate total prices
                $totalPrice = $item['quantity'] * ($item['unit_price'] ?? 0);
                $shadowTotalPrice = $item['quantity'] * $item['shadow_unit_price'];
                $unitPrice = $isShadowUser ? 0 : (float) ($item['unit_price'] ?? 0);
                $salePrice = $isShadowUser ? 0 : (float) ($item['sale_price'] ?? 0);
                $shadowUnitPrice = (float) $item['shadow_unit_price'];
                $shadowSalePrice = (float) $item['shadow_sale_price'];

                // Validate that sale prices are not zero
                if (!$isShadowUser && $salePrice <= 0) {
                    throw new \Exception("Sale price must be greater than 0 for product ID: {$item['product_id']}");
                }
                if ($shadowSalePrice <= 0) {
                    throw new \Exception("Shadow sale price must be greater than 0 for product ID: {$item['product_id']}");
                }

                // Create purchase item
                $purchaseItem = $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'sale_price' => $salePrice,
                    'shadow_unit_price' => $shadowUnitPrice,
                    'shadow_sale_price' => $shadowSalePrice,
                    'total_price' => $totalPrice,
                    'shadow_total_price' => $shadowTotalPrice,
                    'user_type' => $user->type,
                    'created_by' => $user->id,
                    'warehouse_id' => $request->warehouse_id
                ]);

                // Update or create stock
                $stock = Stock::where('warehouse_id', $request->warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->where('variant_id', $item['variant_id'])
                    ->first();

                if ($stock) {
                    $stock->increment('quantity', $item['quantity']);
                    if ($isShadowUser) {
                        $stock->shadow_purchase_price = $shadowUnitPrice;
                        $stock->shadow_sale_price = $shadowSalePrice;
                    } else {
                        $stock->purchase_price = $unitPrice;
                        $stock->sale_price = $salePrice;
                        $stock->shadow_purchase_price = $shadowUnitPrice;
                        $stock->shadow_sale_price = $shadowSalePrice;
                    }
                    $stock->save();
                } else {
                    Stock::create([
                        'warehouse_id' => $request->warehouse_id,
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'],
                        'quantity' => $item['quantity'],
                        'purchase_price' => $isShadowUser ? 0 : $unitPrice,
                        'sale_price' => $isShadowUser ? 0 : $salePrice,
                        'shadow_purchase_price' => $shadowUnitPrice,
                        'shadow_sale_price' => $shadowSalePrice,
                        'user_type' => $user->type
                    ]);
                }

                // Log the created purchase item for debugging
                Log::info('Created purchase item:', [
                    'purchase_item_id' => $purchaseItem->id,
                    'sale_price' => $purchaseItem->sale_price,
                    'shadow_sale_price' => $purchaseItem->shadow_sale_price,
                ]);
            }


                // create payment record if paid_amount > 0
            if ($paidAmount > 0) {
                $payment = new Payment();
                $payment->purchase_id = $purchase->id;
                $payment->amount = $paidAmount;
                $payment->shadow_amount = $shadowPaidAmount;
                $payment->payment_method = $request->payment_method 
                                ?? ($payment_type ?? 'cash');
                $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                $payment->note = $request->notes ?? null;
                $payment->supplier_id = $request->supplier_id ?? null;
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
            // \Log::error('Purchase creation error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error creating purchase: ' . $e->getMessage());
        }
    }


    public function show($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $purchase = Purchase::with(['supplier', 'warehouse', 'items.product', 'items.variant'])
            ->findOrFail($id);

        // Transform data for shadow users
        if ($isShadowUser) {
            $purchase = $this->transformToShadowData($purchase);
        }

        return Inertia::render('Purchase/PurchaseShow', [
            'purchase' => $purchase,
            'isShadowUser' => $isShadowUser
        ]);
    }

    private function transformToShadowData($purchase)
    {
        // Replace real amounts with shadow amounts for main purchase
        $purchase->grand_total = $purchase->shadow_total_amount;
        $purchase->paid_amount = $purchase->shadow_paid_amount;
        $purchase->due_amount = $purchase->shadow_due_amount;

        // Transform items
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

    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return redirect()->back()->with('error', 'You are not authorized to delete purchases.');
        }

        DB::beginTransaction();
        try {
            $purchase = Purchase::with('items')->findOrFail($id);

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

    public function updatePayment(Request $request, $id)
    {
        $purchase = Purchase::findOrFail($id);

        $request->validate([
            'paid_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:unpaid,partial,paid'
        ]);

        $totalAmount = $purchase->total_amount;
        $paidAmount = $request->paid_amount;
        $dueAmount = $totalAmount - $paidAmount;

        // Update purchase
        $purchase->update([
            'paid_amount' => $paidAmount,
            'due_amount' => max(0, $dueAmount),
            'payment_status' => $request->payment_status
        ]);

        return redirect()->back()->with('success', 'Payment status updated successfully');
    }

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

            // Update purchase items with real prices
            foreach ($request->items as $approveItem) {
                $item = PurchaseItem::find($approveItem['id']);

                if ($item) {
                    $realTotalPrice = $approveItem['purchase_price'] * $item->quantity;
                    $totalRealAmount += $realTotalPrice;

                    // Update purchase item with real prices
                    $item->update([
                        'unit_price' => $approveItem['purchase_price'],
                        'sale_price' => $approveItem['sale_price'],
                        'total_price' => $realTotalPrice
                        // shadow prices remain unchanged
                    ]);

                    // Update stock with real prices
                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if ($stock) {
                        $stock->update([
                            'purchase_price' => $approveItem['purchase_price'],
                            'sale_price' => $approveItem['sale_price']
                            // shadow prices remain unchanged
                        ]);
                    }
                }
            }

            // Update purchase with real amounts
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
            // \Log::error('Purchase approval error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error approving purchase: ' . $e->getMessage());
        }
    }
}
