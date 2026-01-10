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

        $purchaseId = $request->query('purchase_id');
        $purchase = null;
        $purchaseItems = [];

        if ($purchaseId) {
            $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
                ->where('status', 'completed')
                ->find($purchaseId);

            if ($purchase) {
                foreach ($purchase->items as $item) {
                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    // Start with 0 - only show items with available stock
                    $maxQuantity = 0;

                    // If stock exists and has quantity > 0, calculate maximum returnable
                    if ($stock && $stock->quantity > 0) {
                        // Calculate already returned quantity
                        $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                            ->where('status', 'completed')
                            ->sum('return_quantity');
                        
                        // Maximum returnable is min(stock quantity, purchase quantity - already returned)
                        $availableFromStock = $stock->quantity;
                        $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
                        $maxQuantity = min($availableFromStock, $availableFromPurchase);
                    }

                    // Only add item if we can return something
                    if ($maxQuantity > 0) {
                        $purchaseItems[] = [
                            'id' => $item->id,
                            'purchase_item_id' => $item->id,
                            'product_id' => $item->product_id,
                            'product_name' => $item->product->name ?? 'Unknown Product',
                            'variant_id' => $item->variant_id,
                            'variant_name' => $this->getVariantDisplayName($item->variant),
                            'max_quantity' => $maxQuantity,
                            'available_quantity' => $maxQuantity,
                            'unit_price' => $item->unit_price,
                            'shadow_unit_price' => $item->shadow_unit_price,
                            'sale_price' => $item->sale_price,
                            'shadow_sale_price' => $item->shadow_sale_price,
                            'purchase_quantity' => $item->quantity,
                            'total_price' => $item->total_price,
                            'shadow_total_price' => $item->shadow_total_price,
                            'stock_quantity' => $stock ? $stock->quantity : 0,
                            'already_returned' => $alreadyReturned ?? 0
                        ];
                    }
                }
            }
        }

        // Get recent purchases for the dropdown
        $recentPurchases = Purchase::where('status', 'completed')
            ->with(['supplier', 'warehouse'])
            ->orderBy('purchase_date', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($purchase) {
                // Count items available for return
                $availableItems = 0;
                foreach ($purchase->items as $item) {
                    $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->where('variant_id', $item->variant_id)
                        ->first();

                    if ($stock && $stock->quantity > 0) {
                        $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                            ->where('status', 'completed')
                            ->sum('return_quantity');
                        
                        $availableFromStock = $stock->quantity;
                        $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
                        
                        if (min($availableFromStock, $availableFromPurchase) > 0) {
                            $availableItems++;
                        }
                    }
                }

                return [
                    'id' => $purchase->id,
                    'purchase_no' => $purchase->purchase_no,
                    'purchase_date' => $purchase->purchase_date,
                    'grand_total' => $purchase->grand_total,
                    'available_items' => $availableItems,
                    'supplier' => $purchase->supplier ? [
                        'id' => $purchase->supplier->id,
                        'name' => $purchase->supplier->name,
                        'company' => $purchase->supplier->company,
                    ] : null,
                    'warehouse' => $purchase->warehouse ? [
                        'id' => $purchase->warehouse->id,
                        'name' => $purchase->warehouse->name,
                    ] : null,
                ];
            });

        return Inertia::render('PurchaseReturn/AddPurchaseReturn', [
            'purchase' => $purchase ? [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'purchase_date' => $purchase->purchase_date,
                'grand_total' => $purchase->grand_total,
                'paid_amount' => $purchase->paid_amount,
                'due_amount' => $purchase->due_amount,
                'status' => $purchase->status,
                'supplier' => $purchase->supplier ? [
                    'id' => $purchase->supplier->id,
                    'name' => $purchase->supplier->name,
                    'company' => $purchase->supplier->company,
                    'email' => $purchase->supplier->email,
                    'phone' => $purchase->supplier->phone,
                    'address' => $purchase->supplier->address,
                ] : null,
                'warehouse' => $purchase->warehouse ? [
                    'id' => $purchase->warehouse->id,
                    'name' => $purchase->warehouse->name,
                    'code' => $purchase->warehouse->code,
                ] : null,
                'items_count' => $purchase->items->count(),
                'items' => $purchase->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name ?? 'Unknown',
                        'variant_id' => $item->variant_id,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                    ];
                })
            ] : null,
            'purchaseItems' => $purchaseItems,
            'purchases' => $recentPurchases,
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get(),
            'isShadowUser' => $isShadowUser
        ]);
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
            $purchaseReturn = PurchaseReturn::with(['items.product', 'replacementProducts', 'purchase'])
                ->findOrFail($id);

            if ($purchaseReturn->status !== 'pending') {
                throw new \Exception('This return cannot be approved.');
            }

            // For ALL returns: DECREASE stock for returned items
            // Items are leaving our warehouse to go back to supplier
            foreach ($purchaseReturn->items as $item) {
                $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->where('variant_id', $item->variant_id)
                    ->first();

                if (!$stock) {
                    throw new \Exception('Stock not found for product: ' . ($item->product->name ?? 'Unknown'));
                }

                if ($stock->quantity < $item->return_quantity) {
                    throw new \Exception('Insufficient stock for product: ' . ($item->product->name ?? 'Unknown') .
                        '. Available: ' . $stock->quantity . ', Requested: ' . $item->return_quantity);
                }

                // DECREASE stock (items leaving warehouse)
                $stock->decrement('quantity', $item->return_quantity);

                // Update return item status
                $item->update(['status' => 'approved']);

                Log::info('Stock decreased for return', [
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->return_quantity,
                    'remaining_stock' => $stock->quantity - $item->return_quantity
                ]);
            }

            // For product replacement, just update status
            if ($purchaseReturn->return_type === 'product_replacement') {
                foreach ($purchaseReturn->replacementProducts as $replacement) {
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
            Log::error('Error trace: ' . $e->getTraceAsString());
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

            $purchase = Purchase::with('items')->findOrFail($purchaseReturn->purchase_id);

            // Calculate net difference for replacement returns
            $netDifference = 0;
            $shadowNetDifference = 0;

            if ($purchaseReturn->return_type === 'product_replacement') {
                $netDifference = $purchaseReturn->replacement_total - $purchaseReturn->total_return_amount;
                $shadowNetDifference = $purchaseReturn->shadow_replacement_total - $purchaseReturn->shadow_return_amount;
            }

            // For MONEY BACK returns
            if ($purchaseReturn->return_type === 'money_back') {
                // Stock was already decreased during approval
                // Now handle financial adjustments

                if ($purchaseReturn->refunded_amount > 0) {
                    // We GET money from supplier (refund) - money COMING IN
                    $newPaidAmount = $purchase->paid_amount + $purchaseReturn->refunded_amount;
                    $newDueAmount = max(0, $purchase->due_amount - $purchaseReturn->refunded_amount);

                    // If refund is more than due, adjust paid amount
                    if ($purchaseReturn->refunded_amount > $purchase->due_amount) {
                        $excessRefund = $purchaseReturn->refunded_amount - $purchase->due_amount;
                        $newPaidAmount = $purchase->paid_amount + $excessRefund;
                        $newDueAmount = 0;
                    }

                    $purchase->update([
                        'paid_amount' => $newPaidAmount,
                        'due_amount' => $newDueAmount,
                    ]);

                    // Update shadow amounts if applicable
                    if ($purchaseReturn->shadow_refunded_amount > 0) {
                        $newShadowPaidAmount = $purchase->shadow_paid_amount + $purchaseReturn->shadow_refunded_amount;
                        $newShadowDueAmount = max(0, $purchase->shadow_due_amount - $purchaseReturn->shadow_refunded_amount);

                        if ($purchaseReturn->shadow_refunded_amount > $purchase->shadow_due_amount) {
                            $excessShadowRefund = $purchaseReturn->shadow_refunded_amount - $purchase->shadow_due_amount;
                            $newShadowPaidAmount = $purchase->shadow_paid_amount + $excessShadowRefund;
                            $newShadowDueAmount = 0;
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

                    // Create refund payment record - POSITIVE amount (money coming in)
                    Payment::create([
                        'purchase_id' => $purchase->id,
                        'amount' => $purchaseReturn->refunded_amount, // POSITIVE for refund received
                        'shadow_amount' => $purchaseReturn->shadow_refunded_amount,
                        'payment_method' => $purchaseReturn->payment_type,
                        'txn_ref' => 'REFUND-' . Str::random(10),
                        'note' => 'Refund received for return: ' . $purchaseReturn->return_no,
                        'supplier_id' => $purchaseReturn->supplier_id,
                        'paid_at' => Carbon::now(),
                        'created_by' => $user->id,
                        'type' => 'refund_received'
                    ]);
                }
            }
            // For PRODUCT REPLACEMENT returns
            elseif ($purchaseReturn->return_type === 'product_replacement') {
                // IMPORTANT: First validate replacement products can be added to purchase
                // This ensures purchase items exist or can be created

                // Validate replacement products can be added to purchase
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    // Check if this product+variant exists in the original purchase
                    $existingPurchaseItem = \App\Models\PurchaseItem::where('purchase_id', $purchase->id)
                        ->where('product_id', $replacement->product_id)
                        ->where('variant_id', $replacement->variant_id)
                        ->first();

                    if (!$existingPurchaseItem) {
                        // Create a new purchase item for this replacement product
                        $existingPurchaseItem = \App\Models\PurchaseItem::create([
                            'purchase_id' => $purchase->id,
                            'product_id' => $replacement->product_id,
                            'variant_id' => $replacement->variant_id,
                            'quantity' => 0, // Will be updated below
                            'unit_price' => $replacement->unit_price,
                            'shadow_unit_price' => $replacement->shadow_unit_price,
                            'sale_price' => $replacement->sale_price,
                            'shadow_sale_price' => $replacement->shadow_sale_price,
                            'total_price' => 0,
                            'shadow_total_price' => 0,
                            'status' => 'active'
                        ]);
                    }

                    // Update the purchase item quantity and totals
                    $newQuantity = $existingPurchaseItem->quantity + $replacement->quantity;
                    $newTotalPrice = $newQuantity * $existingPurchaseItem->unit_price;
                    $newShadowTotalPrice = $newQuantity * $existingPurchaseItem->shadow_unit_price;

                    $existingPurchaseItem->update([
                        'quantity' => $newQuantity,
                        'total_price' => $newTotalPrice,
                        'shadow_total_price' => $newShadowTotalPrice
                    ]);

                    Log::info('Purchase item updated for replacement', [
                        'purchase_item_id' => $existingPurchaseItem->id,
                        'product_id' => $replacement->product_id,
                        'variant_id' => $replacement->variant_id,
                        'added_quantity' => $replacement->quantity,
                        'new_quantity' => $newQuantity,
                        'new_total' => $newTotalPrice
                    ]);
                }

                // Update original purchase items (reduce quantities for returned items)
                foreach ($purchaseReturn->items as $returnItem) {
                    $purchaseItem = $returnItem->purchaseItem;
                    if ($purchaseItem) {
                        $newQuantity = $purchaseItem->quantity - $returnItem->return_quantity;
                        if ($newQuantity < 0) {
                            throw new \Exception('Cannot return more than purchased quantity for product: ' .
                                ($returnItem->product->name ?? 'Unknown'));
                        }

                        $purchaseItem->update(['quantity' => $newQuantity]);

                        if ($newQuantity <= 0) {
                            $purchaseItem->update([
                                'status' => 'returned',
                                'notes' => 'Fully returned via return #' . $purchaseReturn->return_no
                            ]);
                        }

                        // Update purchase item totals
                        $purchaseItem->update([
                            'total_price' => $newQuantity * $purchaseItem->unit_price,
                            'shadow_total_price' => $newQuantity * $purchaseItem->shadow_unit_price
                        ]);
                    }
                }

                // INCREASE stock for REPLACEMENT items (new items coming in from supplier)
                foreach ($purchaseReturn->replacementProducts as $replacement) {
                    $stock = Stock::where('warehouse_id', $purchaseReturn->warehouse_id)
                        ->where('product_id', $replacement->product_id)
                        ->where('variant_id', $replacement->variant_id)
                        ->first();

                    if ($stock) {
                        // INCREASE stock (replacement items coming in)
                        $stock->increment('quantity', $replacement->quantity);

                        // Optional: Update purchase price using weighted average
                        $oldQuantity = $stock->quantity - $replacement->quantity;
                        $oldValue = $stock->purchase_price * $oldQuantity;
                        $newValue = $oldValue + ($replacement->unit_price * $replacement->quantity);
                        $stock->purchase_price = $newValue / $stock->quantity;

                        $stock->save();

                        Log::info('Stock increased for replacement', [
                            'product_id' => $replacement->product_id,
                            'variant_id' => $replacement->variant_id,
                            'quantity' => $replacement->quantity,
                            'new_stock' => $stock->quantity
                        ]);
                    } else {
                        // Create new stock entry
                        Stock::create([
                            'warehouse_id' => $purchaseReturn->warehouse_id,
                            'product_id' => $replacement->product_id,
                            'variant_id' => $replacement->variant_id,
                            'quantity' => $replacement->quantity,
                            'purchase_price' => $replacement->unit_price,
                            'sale_price' => $replacement->sale_price,
                            'batch_no' => 'REPL-' . $purchaseReturn->return_no . '-' . Str::random(4),
                        ]);
                    }

                    // Update replacement product status
                    $replacement->update(['status' => 'completed']);
                }

                // Handle financial adjustments for net difference
                if ($netDifference != 0) {
                    $paymentMethod = 'adjustment';

                    // Positive netDifference: Replacement Value > Return Value
                    // We PAY extra to supplier
                    if ($netDifference > 0) {
                        $additionalDue = $netDifference;

                        // We owe supplier more money
                        $purchase->increment('due_amount', $additionalDue);

                        // Create payment record for ADDITIONAL DUE - NEGATIVE (money going out)
                        Payment::create([
                            'purchase_id' => $purchase->id,
                            'amount' => -$additionalDue, // NEGATIVE for payment due
                            'shadow_amount' => -$shadowNetDifference,
                            'payment_method' => $paymentMethod,
                            'txn_ref' => 'REPL-DUE-' . Str::random(8),
                            'note' => 'Additional payment for replacement return #' . $purchaseReturn->return_no .
                                '. Replacement exceeds return by ৳' . $additionalDue,
                            'supplier_id' => $purchaseReturn->supplier_id,
                            'paid_at' => null, // Not paid yet
                            'created_by' => $user->id,
                            'type' => 'additional_due',
                            'status' => 'pending'
                        ]);
                    }
                    // Negative netDifference: Return Value > Replacement Value  
                    // We GET refund from supplier
                    else {
                        $refundAmount = abs($netDifference);

                        // We receive money from supplier
                        if ($purchase->due_amount > 0) {
                            // First reduce what we owe
                            $reduceDue = min($refundAmount, $purchase->due_amount);
                            $purchase->decrement('due_amount', $reduceDue);

                            // Any remaining is added to paid amount
                            $remaining = $refundAmount - $reduceDue;
                            if ($remaining > 0) {
                                $purchase->increment('paid_amount', $remaining);
                            }
                        } else {
                            $purchase->increment('paid_amount', $refundAmount);
                        }

                        // Create payment record for REFUND - POSITIVE (money coming in)
                        Payment::create([
                            'purchase_id' => $purchase->id,
                            'amount' => $refundAmount, // POSITIVE for refund
                            'shadow_amount' => abs($shadowNetDifference),
                            'payment_method' => $paymentMethod,
                            'txn_ref' => 'REPL-REF-' . Str::random(8),
                            'note' => 'Refund for replacement return #' . $purchaseReturn->return_no .
                                '. Return exceeds replacement by ৳' . $refundAmount,
                            'supplier_id' => $purchaseReturn->supplier_id,
                            'paid_at' => Carbon::now(),
                            'created_by' => $user->id,
                            'type' => 'refund_received'
                        ]);
                    }
                }
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

        // Update the purchase with new totals
        $purchase->update([
            'grand_total' => $newGrandTotal,
            'shadow_total_amount' => $newShadowGrandTotal,
            'payment_status' => $this->calculatePaymentStatus($purchase),
            'shadow_payment_status' => $this->calculateShadowPaymentStatus($purchase),
        ]);

        Log::info('Recalculated purchase totals:', [
            'purchase_id' => $purchase->id,
            'new_grand_total' => $newGrandTotal,
            'new_shadow_grand_total' => $newShadowGrandTotal,
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

    public function getPurchaseData(Request $request)
    {
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id'
        ]);

        $purchase = Purchase::with(['items.product', 'items.variant', 'supplier', 'warehouse'])
            ->where('status', 'completed')
            ->findOrFail($request->purchase_id);

        $purchaseItems = [];
        foreach ($purchase->items as $item) {
            $stock = Stock::where('warehouse_id', $purchase->warehouse_id)
                ->where('product_id', $item->product_id)
                ->where('variant_id', $item->variant_id)
                ->first();

            // Start with 0 - only show items with available stock
            $maxQuantity = 0;

            // If stock exists and has quantity > 0, calculate maximum returnable
            if ($stock && $stock->quantity > 0) {
                // Calculate already returned quantity
                $alreadyReturned = PurchaseReturnItem::where('purchase_item_id', $item->id)
                    ->where('status', 'completed')
                    ->sum('return_quantity');
                
                // Maximum returnable is min(stock quantity, purchase quantity - already returned)
                $availableFromStock = $stock->quantity;
                $availableFromPurchase = max(0, $item->quantity - $alreadyReturned);
                $maxQuantity = min($availableFromStock, $availableFromPurchase);
            }

            // Only add item if we can return something
            if ($maxQuantity > 0) {
                $purchaseItems[] = [
                    'id' => $item->id,
                    'purchase_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'Unknown Product',
                    'variant_id' => $item->variant_id,
                    'variant_name' => $this->getVariantDisplayName($item->variant),
                    'max_quantity' => $maxQuantity,
                    'available_quantity' => $maxQuantity,
                    'unit_price' => $item->unit_price,
                    'shadow_unit_price' => $item->shadow_unit_price,
                    'sale_price' => $item->sale_price,
                    'shadow_sale_price' => $item->shadow_sale_price,
                    'purchase_quantity' => $item->quantity,
                    'total_price' => $item->total_price,
                    'shadow_total_price' => $item->shadow_total_price,
                    'stock_quantity' => $stock ? $stock->quantity : 0,
                    'already_returned' => $alreadyReturned ?? 0
                ];
            }
        }

        return response()->json([
            'purchase' => [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'purchase_date' => $purchase->purchase_date,
                'grand_total' => $purchase->grand_total,
                'paid_amount' => $purchase->paid_amount,
                'due_amount' => $purchase->due_amount,
                'status' => $purchase->status,
                'supplier' => $purchase->supplier ? [
                    'id' => $purchase->supplier->id,
                    'name' => $purchase->supplier->name,
                    'company' => $purchase->supplier->company,
                    'email' => $purchase->supplier->email,
                    'phone' => $purchase->supplier->phone,
                    'address' => $purchase->supplier->address,
                ] : null,
                'warehouse' => $purchase->warehouse ? [
                    'id' => $purchase->warehouse->id,
                    'name' => $purchase->warehouse->name,
                    'code' => $purchase->warehouse->code,
                ] : null,
                'items_count' => $purchase->items->count(),
            ],
            'purchaseItems' => $purchaseItems
        ]);
    }
}