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
                        'purchase_quantity' => $item->quantity,
                        'total_price' => $item->total_price,
                        'shadow_total_price' => $item->shadow_total_price
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

        // Enhanced validation
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
            'items.*.purchase_item_id' => 'required|exists:purchase_items,id',
            'items.*.return_quantity' => 'required|integer|min:1',
            'items.*.reason' => 'nullable|string',
            'replacement_products' => 'nullable|array',
            'replacement_products.*.product_id' => 'nullable|exists:products,id',
            'replacement_products.*.variant_id' => 'nullable|exists:variants,id',
            'replacement_products.*.quantity' => 'nullable|integer|min:1',
            'replacement_products.*.unit_price' => 'nullable|numeric|min:0',
            'replacement_products.*.shadow_unit_price' => 'nullable|numeric|min:0',
            'replacement_products.*.sale_price' => 'nullable|numeric|min:0',
            'replacement_products.*.shadow_sale_price' => 'nullable|numeric|min:0',
            'replacement_total' => 'nullable|numeric|min:0',
            'shadow_replacement_total' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            Log::info('Starting purchase return creation');

            // Generate return number
            $returnCount = PurchaseReturn::whereDate('created_at', today())->count();
            $returnNo = 'RTN-' . date('Ymd') . '-' . str_pad($returnCount + 1, 4, '0', STR_PAD_LEFT);

            Log::info('Generated Return No:', ['return_no' => $returnNo]);

            // Get purchase details
            $purchase = Purchase::with('items')->findOrFail($request->purchase_id);
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
                if ($quantity > 0) {
                    $totalReturnAmount += $quantity * $purchaseItem->unit_price;
                    $shadowTotalReturnAmount += $quantity * $purchaseItem->shadow_unit_price;
                }
            }

            Log::info('Calculated return amounts:', [
                'totalReturnAmount' => $totalReturnAmount,
                'shadowTotalReturnAmount' => $shadowTotalReturnAmount
            ]);

            // For product replacement, use provided replacement totals or calculate
            $replacementValue = $request->replacement_total ?? 0;
            $shadowReplacementValue = $request->shadow_replacement_total ?? 0;

            // If not provided in request, calculate from replacement products
            if ($request->return_type === 'product_replacement' && !empty($request->replacement_products)) {
                $calculatedReplacementValue = 0;
                $calculatedShadowReplacementValue = 0;

                foreach ($request->replacement_products as $replacement) {
                    $quantity = $replacement['quantity'] ?? 1;
                    $unitPrice = $replacement['unit_price'] ?? 0;
                    $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;

                    $calculatedReplacementValue += $quantity * $unitPrice;
                    $calculatedShadowReplacementValue += $quantity * $shadowUnitPrice;
                }

                // Use calculated values if not provided
                if ($replacementValue == 0) {
                    $replacementValue = $calculatedReplacementValue;
                }
                if ($shadowReplacementValue == 0) {
                    $shadowReplacementValue = $calculatedShadowReplacementValue;
                }

                Log::info('Calculated replacement values:', [
                    'calculated_replacement' => $calculatedReplacementValue,
                    'calculated_shadow_replacement' => $calculatedShadowReplacementValue,
                    'final_replacement' => $replacementValue,
                    'final_shadow_replacement' => $shadowReplacementValue
                ]);
            }

            $refundedAmount = $request->refunded_amount ?? 0;
            $shadowRefundedAmount = $request->shadow_refunded_amount ?? 0;

            // For money back returns, refund amount should equal total return amount
            if ($request->return_type === 'money_back') {
                $refundedAmount = $totalReturnAmount;
                $shadowRefundedAmount = $shadowTotalReturnAmount;
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
                'replacement_total' => $replacementValue,
                'shadow_replacement_total' => $shadowReplacementValue,
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

                $returnItemTotal = $quantity * $purchaseItem->unit_price;
                $shadowReturnItemTotal = $quantity * $purchaseItem->shadow_unit_price;

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
                    'total_price' => $returnItemTotal,
                    'shadow_total_price' => $shadowReturnItemTotal,
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

                    $quantity = $replacement['quantity'] ?? 1;
                    $unitPrice = $replacement['unit_price'] ?? 0;
                    $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;
                    $salePrice = $replacement['sale_price'] ?? 0;
                    $shadowSalePrice = $replacement['shadow_sale_price'] ?? 0;

                    $totalPrice = $quantity * $unitPrice;
                    $shadowTotalPrice = $quantity * $shadowUnitPrice;

                    $replacementData = [
                        'purchase_return_id' => $purchaseReturn->id,
                        'product_id' => $replacement['product_id'],
                        'variant_id' => $replacement['variant_id'],
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'shadow_unit_price' => $shadowUnitPrice,
                        'sale_price' => $salePrice,
                        'shadow_sale_price' => $shadowSalePrice,
                        'total_price' => $totalPrice,
                        'shadow_total_price' => $shadowTotalPrice,
                        'status' => 'pending',
                    ];

                    Log::info('Creating replacement product:', $replacementData);
                    ReplacementProduct::create($replacementData);
                }

                Log::info('Total replacement products created:', ['count' => count($request->replacement_products)]);
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
            'items.purchaseItem',
            'replacementProducts.product',
            'replacementProducts.variant',
            'creator'
        ])->findOrFail($id);

        // Calculate net difference for product replacement
        if ($purchaseReturn->return_type === 'product_replacement') {
            $netDifference = $purchaseReturn->total_return_amount - $purchaseReturn->replacement_total;
            $shadowNetDifference = $purchaseReturn->shadow_return_amount - $purchaseReturn->shadow_replacement_total;

            // Add to purchase return object for frontend
            $purchaseReturn->net_difference = $netDifference;
            $purchaseReturn->shadow_net_difference = $shadowNetDifference;
        }

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

            // Update stock for RETURNED items (reduce stock)
            foreach ($purchaseReturn->items as $item) {
                $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if (!$stock || $stock->quantity < $item->return_quantity) {
                    throw new \Exception('Insufficient stock for product: ' . $item->product->name);
                }

                // Reduce stock for returned items
                $stock->decrement('quantity', $item->return_quantity);

                // Update return item status
                $item->update(['status' => 'approved']);
            }

            // For product replacement, add replacement products to stock (with price updates)
            if ($purchaseReturn->return_type === 'product_replacement') {
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $replacement->product_id)
                        ->where('variant_id', $replacement->variant_id)
                        ->first();

                    if ($stock) {
                        // Store current values for weighted average calculation
                        $oldQuantity = $stock->quantity;
                        $oldPurchaseValue = $stock->purchase_price * $oldQuantity;
                        $oldShadowPurchaseValue = $stock->shadow_purchase_price * $oldQuantity;

                        // Add replacement products to stock
                        $newQuantity = $oldQuantity + $replacement->quantity;
                        $stock->quantity = $newQuantity;

                        // Calculate weighted average purchase prices
                        $newPurchaseValue = $oldPurchaseValue + ($replacement->unit_price * $replacement->quantity);
                        $newShadowPurchaseValue = $oldShadowPurchaseValue + ($replacement->shadow_unit_price * $replacement->quantity);

                        $stock->purchase_price = $newPurchaseValue / $newQuantity;
                        $stock->shadow_purchase_price = $newShadowPurchaseValue / $newQuantity;

                        // Update sale prices (take the lower price if new is lower)
                        if ($replacement->sale_price > 0) {
                            if ($stock->sale_price == 0 || $replacement->sale_price < $stock->sale_price) {
                                $stock->sale_price = $replacement->sale_price;
                            }
                        }

                        if ($replacement->shadow_sale_price > 0) {
                            if ($stock->shadow_sale_price == 0 || $replacement->shadow_sale_price < $stock->shadow_sale_price) {
                                $stock->shadow_sale_price = $replacement->shadow_sale_price;
                            }
                        }

                        $stock->save();
                    } else {
                        // Create new stock entry for replacement product
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

                    // Update replacement product status
                    $replacement->update(['status' => 'approved']);
                }
            }

            // Update purchase return status
            $purchaseReturn->update(['status' => 'approved']);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return approved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Approve purchase return error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error approving purchase return: ' . $e->getMessage());
        }
    }

    public function complete($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        DB::beginTransaction();
        try {
            $purchaseReturn = PurchaseReturn::with([
                'purchase',
                'replacementProducts',
                'items.purchaseItem'
            ])->findOrFail($id);

            if ($purchaseReturn->status !== 'approved') {
                throw new \Exception('This return cannot be completed.');
            }

            // Get the purchase with all items
            $purchase = Purchase::with('items')->findOrFail($purchaseReturn->purchase_id);

            // Calculate net difference for replacement returns
            // Net Difference = Replacement Value - Return Value
            $netDifference = 0;
            $shadowNetDifference = 0;

            if ($purchaseReturn->return_type === 'product_replacement') {
                $netDifference = $purchaseReturn->replacement_total - $purchaseReturn->total_return_amount;
                $shadowNetDifference = $purchaseReturn->shadow_replacement_total - $purchaseReturn->shadow_return_amount;
            }

            // For MONEY BACK returns
            if ($purchaseReturn->return_type === 'money_back') {
                // First, adjust stock (should already be adjusted in approve, but double-check)
                foreach ($purchaseReturn->items as $returnItem) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $returnItem->product_id)
                        ->where('variant_id', $returnItem->variant_id)
                        ->first();

                    if ($stock) {
                        // Ensure stock is reduced (in case approve didn't work properly)
                        if ($stock->quantity < $returnItem->return_quantity) {
                            throw new \Exception('Insufficient stock after approval for: ' . $returnItem->product->name);
                        }
                    }

                    // Also update the original purchase item quantity
                    if ($returnItem->purchaseItem) {
                        $newQuantity = $returnItem->purchaseItem->quantity - $returnItem->return_quantity;
                        if ($newQuantity < 0)
                            $newQuantity = 0;

                        // Calculate proportional price adjustment
                        $priceRatio = $returnItem->return_quantity / $returnItem->purchaseItem->quantity;
                        $priceAdjustment = $returnItem->purchaseItem->total_price * $priceRatio;
                        $shadowPriceAdjustment = $returnItem->purchaseItem->shadow_total_price * $priceRatio;

                        $returnItem->purchaseItem->update([
                            'quantity' => $newQuantity,
                        ]);
                    }
                }

                if ($purchaseReturn->refunded_amount > 0) {
                    // Update purchase amounts - REDUCE what we paid (increase due)
                    $newPaidAmount = $purchase->paid_amount - $purchaseReturn->refunded_amount;
                    $newDueAmount = $purchase->due_amount + $purchaseReturn->refunded_amount;

                    // Ensure amounts don't go negative
                    if ($newPaidAmount < 0) {
                        $newDueAmount += abs($newPaidAmount);
                        $newPaidAmount = 0;
                    }

                    $purchase->update([
                        'paid_amount' => $newPaidAmount,
                        'due_amount' => $newDueAmount,
                    ]);

                    // Update shadow amounts if applicable
                    if ($purchaseReturn->shadow_refunded_amount > 0) {
                        $newShadowPaidAmount = $purchase->shadow_paid_amount - $purchaseReturn->shadow_refunded_amount;
                        $newShadowDueAmount = $purchase->shadow_due_amount + $purchaseReturn->shadow_refunded_amount;

                        if ($newShadowPaidAmount < 0) {
                            $newShadowDueAmount += abs($newShadowPaidAmount);
                            $newShadowPaidAmount = 0;
                        }

                        $purchase->update([
                            'shadow_paid_amount' => $newShadowPaidAmount,
                            'shadow_due_amount' => $newShadowDueAmount,
                        ]);
                    }

                    // Recalculate payment status
                    $paymentStatus = $this->calculatePaymentStatus($purchase);
                    $shadowPaymentStatus = $this->calculateShadowPaymentStatus($purchase);

                    $purchase->update([
                        'payment_status' => $paymentStatus,
                        'shadow_payment_status' => $shadowPaymentStatus
                    ]);

                    // For adjust_to_advance, update supplier advance
                    if ($purchaseReturn->payment_type === 'adjust_to_advance') {
                        $supplier = Supplier::find($purchaseReturn->supplier_id);
                        if ($supplier) {
                            $supplier->increment('advance_amount', $purchaseReturn->refunded_amount);
                        }
                    }

                    // Create refund payment record (NEGATIVE for refund - money going OUT)
                    Payment::create([
                        'purchase_id' => $purchase->id,
                        'amount' => $purchaseReturn->refunded_amount, // Negative for refund
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

                // Recalculate purchase totals after adjustments
                $this->recalculatePurchaseTotals($purchase);

            }
            // For PRODUCT REPLACEMENT returns - SIMPLIFIED VERSION
            elseif ($purchaseReturn->return_type === 'product_replacement') {

                // 1. ADJUST ORIGINAL PURCHASE ITEMS (only reduce quantities, keep prices same)
                foreach ($purchaseReturn->items as $returnItem) {
                    $purchaseItem = $returnItem->purchaseItem;
                    if ($purchaseItem) {
                        // Calculate new quantity after return
                        $newQuantity = $purchaseItem->quantity - $returnItem->return_quantity;

                        // Don't let quantity go negative
                        if ($newQuantity < 0) {
                            $newQuantity = 0;
                        }

                        // Calculate proportional price adjustment
                        $priceRatio = $returnItem->return_quantity / $purchaseItem->quantity;
                        $priceAdjustment = $purchaseItem->total_price * $priceRatio;
                        $shadowPriceAdjustment = $purchaseItem->shadow_total_price * $priceRatio;

                        // Update the purchase item (only quantity, keep prices same)
                        $purchaseItem->update([
                            'quantity' => $newQuantity,
                            'total_price' => $purchaseItem->total_price - $priceAdjustment,
                            'shadow_total_price' => $purchaseItem->shadow_total_price - $shadowPriceAdjustment,
                        ]);

                        // If quantity becomes zero, mark as returned
                        if ($newQuantity <= 0) {
                            $purchaseItem->update([
                                'status' => 'returned',
                                'notes' => 'Fully returned via return #' . $purchaseReturn->return_no
                            ]);
                        }
                    }
                }

                // 2. ADD NEW PURCHASE ITEMS FOR REPLACEMENT PRODUCTS (as separate items)
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    // Create new purchase item for replacement (keep original prices)
                    \App\Models\PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $replacement->product_id,
                        'variant_id' => $replacement->variant_id,
                        'quantity' => $replacement->quantity,
                        'unit_price' => $replacement->unit_price, // Keep replacement price
                        'shadow_unit_price' => $replacement->shadow_unit_price,
                        'sale_price' => $replacement->sale_price,
                        'shadow_sale_price' => $replacement->shadow_sale_price,
                        'total_price' => $replacement->total_price,
                        'shadow_total_price' => $replacement->shadow_total_price,
                        'warehouse_id' => $purchase->warehouse_id,
                        'created_by' => $user->id,
                        'user_type' => $user->type,
                        'notes' => 'Replacement via return #' . $purchaseReturn->return_no,
                        'status' => 'active'
                    ]);
                }

                // 3. ADJUST PAYMENT FOR NET DIFFERENCE
                if ($netDifference != 0) {
                    $paymentMethod = 'adjustment';
                    $paymentNote = '';

                    // Positive netDifference means Replacement Value > Return Value
                    // We PAY to supplier (Pay)
                    if ($netDifference > 0) {
                        $additionalDue = $netDifference; // We need to pay this amount

                        // We owe supplier more money
                        $purchase->increment('due_amount', $additionalDue);

                        $paymentNote = 'Additional payment required for replacement return #' . $purchaseReturn->return_no .
                            '. Replacement value exceeds return value by ৳' . $additionalDue;

                        // Create payment record for ADDITIONAL DUE
                        Payment::create([
                            'purchase_id' => $purchase->id,
                            'amount' => $additionalDue, // Negative for payment due
                            'shadow_amount' => $shadowNetDifference > 0 ? -$shadowNetDifference : 0,
                            'payment_method' => $paymentMethod,
                            'txn_ref' => 'REPL-DUE-ADD-' . Str::random(8),
                            'note' => $paymentNote,
                            'supplier_id' => $purchaseReturn->supplier_id,
                            'paid_at' => null, // Not paid yet
                            'created_by' => $user->id,
                            'type' => 'additional_due',
                            'status' => 'pending'
                        ]);
                    }
                    // Negative netDifference means Return Value > Replacement Value
                    // We RECEIVE from supplier (Receive)
                    else {
                        $refundAmount = abs($netDifference); // We get this amount

                        if ($purchase->due_amount > 0) {
                            // First, reduce what we owe
                            $oldDue = $purchase->due_amount;
                            $purchase->decrement('due_amount', min($refundAmount, $purchase->due_amount));

                            // If we still have refund after reducing due, add to paid amount
                            $remainingRefund = $refundAmount - min($refundAmount, $oldDue);
                            if ($remainingRefund > 0) {
                                $purchase->increment('paid_amount', $remainingRefund);
                            }
                        } else {
                            // We don't owe anything, so we get cash refund (increase paid amount)
                            $purchase->increment('paid_amount', $refundAmount);
                        }

                        $paymentNote = 'Refund received for replacement return #' . $purchaseReturn->return_no .
                            '. Return value exceeds replacement value by ৳' . $refundAmount;

                        // Create payment record for REFUND RECEIVED
                        Payment::create([
                            'purchase_id' => $purchase->id,
                            'amount' => -$refundAmount, // Positive for refund received
                            'shadow_amount' => $shadowNetDifference < 0 ? abs($shadowNetDifference) : 0,
                            'payment_method' => $paymentMethod,
                            'txn_ref' => 'REPL-REF-RECV-' . Str::random(8),
                            'note' => $paymentNote,
                            'supplier_id' => $purchaseReturn->supplier_id,
                            'paid_at' => Carbon::now(),
                            'created_by' => $user->id,
                            'type' => 'refund_received'
                        ]);
                    }

                    // Handle shadow amounts
                    if ($shadowNetDifference != 0) {
                        if ($shadowNetDifference > 0) {
                            // We owe shadow money
                            $shadowAdditionalDue = $shadowNetDifference;
                            $purchase->increment('shadow_due_amount', $shadowAdditionalDue);
                        } else {
                            // We get shadow money
                            $shadowRefundAmount = abs($shadowNetDifference);

                            if ($purchase->shadow_due_amount > 0) {
                                $oldShadowDue = $purchase->shadow_due_amount;
                                $purchase->decrement('shadow_due_amount', min($shadowRefundAmount, $purchase->shadow_due_amount));

                                $remainingShadowRefund = $shadowRefundAmount - min($shadowRefundAmount, $oldShadowDue);
                                if ($remainingShadowRefund > 0) {
                                    $purchase->increment('shadow_paid_amount', $remainingShadowRefund);
                                }
                            } else {
                                $purchase->increment('shadow_paid_amount', $shadowRefundAmount);
                            }
                        }
                    }

                    // Recalculate payment status
                    $paymentStatus = $this->calculatePaymentStatus($purchase);
                    $shadowPaymentStatus = $this->calculateShadowPaymentStatus($purchase);

                    $purchase->update([
                        'payment_status' => $paymentStatus,
                        'shadow_payment_status' => $shadowPaymentStatus
                    ]);

                    // Update purchase return with actual refund amount
                    $actualRefund = $netDifference < 0 ? abs($netDifference) : 0;
                    $shadowActualRefund = $shadowNetDifference < 0 ? abs($shadowNetDifference) : 0;

                    $purchaseReturn->update([
                        'refunded_amount' => $actualRefund,
                        'shadow_refunded_amount' => $shadowActualRefund,
                    ]);
                }

                // 4. RECALCULATE PURCHASE TOTALS
                $this->recalculatePurchaseTotals($purchase);

                // 5. Add note about replacement
                $returnNote = "\n\nProduct replacement completed on: " . now()->format('Y-m-d H:i:s');
                $returnNote .= "\nOriginal purchase items adjusted and replacement items added as separate entries.";

                if ($netDifference != 0) {
                    if ($netDifference > 0) {
                        $returnNote .= "\nAdditional payment due to supplier: ৳" . $netDifference;
                    } else {
                        $returnNote .= "\nRefund received from supplier: ৳" . abs($netDifference);
                    }
                }

                $purchaseReturn->update([
                    'notes' => $purchaseReturn->notes . $returnNote
                ]);

                // Also update purchase notes
                $purchase->update([
                    'notes' => $purchase->notes . "\n\nModified via product replacement return: " . $purchaseReturn->return_no
                ]);
            }

            // Update return items status
            $purchaseReturn->items()->update(['status' => 'completed']);

            // Update purchase return status
            $purchaseReturn->update(['status' => 'completed']);

            DB::commit();

            return redirect()->back()->with('success', 'Purchase return completed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Complete purchase return error: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            return redirect()->back()->with('error', 'Error completing purchase return: ' . $e->getMessage());
        }
    }
    private function recalculatePurchaseTotals($purchase)
    {
        // Get all purchase items
        $purchaseItems = \App\Models\PurchaseItem::where('purchase_id', $purchase->id)->get();

        // Calculate new totals
        $newGrandTotal = $purchaseItems->sum('total_price');
        $newShadowGrandTotal = $purchaseItems->sum('shadow_total_price');

        // Calculate new due amounts
        $newDueAmount = max(0, $newGrandTotal - $purchase->paid_amount);
        $newShadowDueAmount = max(0, $newShadowGrandTotal - $purchase->shadow_paid_amount);

        // Ensure paid amounts don't exceed totals
        if ($purchase->paid_amount > $newGrandTotal) {
            $purchase->paid_amount = $newGrandTotal;
        }
        if ($purchase->shadow_paid_amount > $newShadowGrandTotal) {
            $purchase->shadow_paid_amount = $newShadowGrandTotal;
        }

        // Update the purchase with new totals
        $purchase->update([
            'grand_total' => $newGrandTotal,
            'shadow_total_amount' => $newShadowGrandTotal,
            'due_amount' => $newDueAmount,
            'shadow_due_amount' => $newShadowDueAmount,
            'payment_status' => $this->calculatePaymentStatus($purchase),
            'shadow_payment_status' => $this->calculateShadowPaymentStatus($purchase),
        ]);

        Log::info('Recalculated purchase totals:', [
            'purchase_id' => $purchase->id,
            'new_grand_total' => $newGrandTotal,
            'new_shadow_grand_total' => $newShadowGrandTotal,
            'new_due_amount' => $newDueAmount,
            'new_shadow_due_amount' => $newShadowDueAmount,
        ]);
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
        if (!$variant)
            return 'Default Variant';

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
        $purchaseReturn->replacement_total = $purchaseReturn->shadow_replacement_total;

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

    /**
     * Calculate totals for the return
     */
    public function calculateTotals(Request $request)
    {
        $data = $request->validate([
            'items' => 'required|array',
            'replacement_products' => 'nullable|array',
            'return_type' => 'required|in:money_back,product_replacement',
        ]);

        $totalReturn = 0;
        $shadowTotalReturn = 0;
        $replacementTotal = 0;
        $shadowReplacementTotal = 0;

        // Calculate return totals
        foreach ($data['items'] as $item) {
            if (isset($item['return_quantity']) && $item['return_quantity'] > 0) {
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                if ($purchaseItem) {
                    $totalReturn += $item['return_quantity'] * $purchaseItem->unit_price;
                    $shadowTotalReturn += $item['return_quantity'] * $purchaseItem->shadow_unit_price;
                }
            }
        }

        // Calculate replacement totals
        if ($data['return_type'] === 'product_replacement' && !empty($data['replacement_products'])) {
            foreach ($data['replacement_products'] as $replacement) {
                $quantity = $replacement['quantity'] ?? 1;
                $unitPrice = $replacement['unit_price'] ?? 0;
                $shadowUnitPrice = $replacement['shadow_unit_price'] ?? 0;

                $replacementTotal += $quantity * $unitPrice;
                $shadowReplacementTotal += $quantity * $shadowUnitPrice;
            }
        }

        return response()->json([
            'total_return' => $totalReturn,
            'shadow_total_return' => $shadowTotalReturn,
            'replacement_total' => $replacementTotal,
            'shadow_replacement_total' => $shadowReplacementTotal,
            'net_difference' => $replacementTotal - $totalReturn,
            'shadow_net_difference' => $shadowReplacementTotal - $shadowTotalReturn,
        ]);
    }
}