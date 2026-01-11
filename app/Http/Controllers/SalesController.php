<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Sale;
use Inertia\Inertia;
use App\Models\Stock;
use App\Models\Account;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Customer;
use App\Models\SaleItem;
use App\Models\Supplier;
use Illuminate\Support\Str;
use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\ReceiptService;
use Barryvdh\DomPDF\Facade\Pdf;



class SalesController extends Controller
{



    /**
     * Display a listing of all sales
     */
    public function index(Request $request, $pos = null)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $search = $request->input('search');
        $status = $request->input('status');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $pos === 'pos' ? $type = 'pos' : $type = 'inventory';


        $sales = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'payments'])->where('type', $type)
            ->where('status', '!=', 'cancelled')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_no', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q) use ($search) {
                            $q->where('customer_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($dateFrom, function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when($dateTo, function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();


        if ($isShadowUser) {
            $sales->getCollection()->transform(function ($sale) {
                return $this->transformToShadowData($sale);
            });
        }


        if ($type == 'pos') {
            $render = 'sales/IndexPos';
        } else {
            $render = 'sales/Index';
        }


        return Inertia::render($render, [
            'sales' => $sales,
            'accounts' => Account::where('is_active', true)->get(),
            'isShadowUser' => $isShadowUser,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ]
        ]);
    }


    /**
     * Show form for the sale(inventory) creation
     */
    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $customers = Customer::active()->get();

        $stock = Stock::with(['warehouse', 'product.category', 'product.brand', 'variant'])
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        $accounts = Account::where('is_active', true)->get();
        $supplier = Supplier::get();

        $isShadowUser ? $render = 'sales/CreateShadow' : $render = 'sales/Create';

        return Inertia::render($render, [
            'customers' => $customers,
            'productstocks' => $stock,
            'accounts' => $accounts,
            'isShadowUser' => $isShadowUser,
            'suppliers' => $supplier,
        ]);
    }

    public function createPos()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $customers = Customer::all();

        $stock = Stock::with(['warehouse', 'product.category', 'product.brand', 'variant'])
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();

        $accounts = Account::where('is_active', true)->get();
        $supplier = Supplier::get();

        $isShadowUser ? $render = 'sales/CreateShadowPos' : $render = 'sales/CreatePos';

        return Inertia::render($render, [
            'customers' => $customers,
            'productstocks' => $stock,
            'accounts' => $accounts,
            'isShadowUser' => $isShadowUser,
            'suppliers' => $supplier,
        ]);
    }




    /**
     * Store sale
     */
    public function store(Request $request)
    {
        $type = $request->input('type', 'pos');

        // ✅ Validation
        if ($type === 'inventory') {
            $rules = [
                'customer_id' => 'required|exists:customers,id',
            ];
        } else {
            // ✅ POS: Walk-in allowed with no customer
            $rules = [
                'customer_id' => 'nullable|exists:customers,id',
                'customer_name' => 'nullable|string|max:255|required_with:phone',
                'phone' => 'nullable|string|max:20|required_with:customer_name',
            ];
        }

        $rules = array_merge($rules, [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'required|exists:variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'account_id' => 'required|exists:accounts,id',
        ]);

        if ($request->has('pickup_items') && is_array($request->pickup_items) && count($request->pickup_items) > 0) {
            $rules['supplier_id'] = 'required|exists:suppliers,id';
        }

        $request->validate($rules);

        DB::beginTransaction();

        try {
            $adjust_amount = (bool) $request->adjust_from_advance;
            $paid_amount = (float) ($request->paid_amount ?? 0);
            $account_id = $request->account_id;

            $supplier_id = $request->supplier_id ?? null;
            $pickup_items = $request->pickup_items ?? [];
            $regular_items = $request->items ?? [];

            // Validate account
            $account = Account::find($account_id);
            if (!$account || !$account->is_active) {
                throw new \Exception('Selected account is not active or not found.');
            }

            // Validate supplier for pickup items
            if (count($pickup_items) > 0) {
                if (!$supplier_id)
                    throw new \Exception('Supplier is required for pickup items.');
                $supplier = Supplier::find($supplier_id);
                if (!$supplier)
                    throw new \Exception('Selected supplier not found.');
            }

            // ✅ Determine customerId (walk-in = null)
            $customerId = null;

            if ($type === 'inventory') {
                $customerId = $request->customer_id;
            } else {
                // POS
                if (!empty($request->customer_id)) {
                    $customerId = $request->customer_id;
                } else {
                    $name = trim((string) $request->customer_name);
                    $phone = trim((string) $request->phone);

                    // ✅ Only create/find customer if user actually typed name+phone
                    if ($name !== '' && $phone !== '') {
                        $existingCustomer = Customer::where('phone', $phone)
                            ->orWhere('customer_name', $name)
                            ->first();

                        if ($existingCustomer) {
                            $customerId = $existingCustomer->id;
                        } else {
                            $customerId = Customer::create([
                                'customer_name' => $name,
                                'phone' => $phone,
                                'advance_amount' => 0,
                                'due_amount' => 0,
                                'is_active' => 1,
                                'created_by' => Auth::id(),
                            ])->id;
                        }
                    }
                }
            }

            // Handle advance adjustment (only if customer exists)
            $payment_type = $account->type;

            if ($adjust_amount === true && $customerId) {
                $customer = Customer::find($customerId);
                if (!$customer)
                    throw new \Exception('Customer not found for advance adjustment.');

                if ($paid_amount > $customer->advance_amount) {
                    throw new \Exception('Adjustment amount cannot be greater than available advance amount.');
                }

                $payment_type = 'advance_adjustment';
                $customer->update([
                    'advance_amount' => $customer->advance_amount - $paid_amount,
                ]);
            }

            // paid amount logic
            $paidAmount = ($type === 'inventory') ? (float) ($request->paid_amount ?? 0) : (float) ($request->grand_amount ?? 0);

            // status
            if ($type === 'inventory') {
                $status = ((float) $request->paid_amount === (float) $request->grand_amount) ? 'paid' : 'pending';
            } else {
                $status = 'paid';
            }

            $sale = Sale::create([
                'customer_id' => $customerId, // ✅ can be null for walk-in
                'invoice_no' => $this->generateInvoiceNo(),
                'sub_total' => $request->sub_amount ?? 0,
                'discount' => $request->discount_rate ?? 0,
                'vat_tax' => $request->vat_rate ?? 0,
                'grand_total' => $request->grand_amount ?? 0,
                'paid_amount' => $paidAmount ?? 0,
                'due_amount' => $request->due_amount ?? 0,

                'shadow_vat_tax' => $request->vat_rate ?? 0,
                'shadow_discount' => $request->discount_rate ?? 0,
                'shadow_sub_total' => 0,
                'shadow_grand_total' => 0,
                'shadow_paid_amount' => 0,
                'shadow_due_amount' => 0,

                'account_id' => $account->id,
                'payment_type' => $payment_type ?? 'cash',
                'status' => $status ?? 'pending',
                'type' => $type ?? 'pos',
                'sale_type' => count($pickup_items) > 0 ? 'both' : 'real',
                'created_by' => Auth::id(),
            ]);

            $shadowSubTotal = 0;
            $regularSubTotal = 0;
            $regularCostTotal = 0;

            // Regular items
            if (count($regular_items) > 0) {
                foreach ($regular_items as $item) {
                    if (!isset($item['product_id']) || !isset($item['variant_id'])) {
                        throw new \Exception('Product ID and Variant ID are required for inventory items.');
                    }

                    $product = Product::find($item['product_id']);
                    $variant = Variant::find($item['variant_id']);
                    if (!$product || !$variant)
                        throw new \Exception('Product or Variant not found for inventory item.');

                    $quantity = (int) ($item['quantity'] ?? 1);
                    $unitPrice = (float) ($item['unit_price'] ?? 0);
                    $shadowUnitPrice = (float) ($item['shadow_sell_price'] ?? $unitPrice);

                    $shadowTotalPrice = $quantity * $shadowUnitPrice;
                    $totalPrice = $quantity * $unitPrice;

                    $this->fifoOut($product->id, $variant->id, $quantity, $sale->id, $item['stock_id'] ?? null);

                    $warehouse_id = Stock::where('product_id', $product->id)
                        ->where('variant_id', $variant->id)
                        ->where('quantity', '>', 0)
                        ->orderBy('created_at', 'asc')
                        ->value('warehouse_id');

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'warehouse_id' => $warehouse_id ?? null,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                        'stock_id' => $item['stock_id'] ?? null,
                        'shadow_unit_price' => $shadowUnitPrice,
                        'shadow_total_price' => $shadowTotalPrice,
                        'status' => 'completed',
                        'created_by' => Auth::id(),
                        'item_type' => 'real',
                    ]);

                    $shadowSubTotal += $shadowTotalPrice;
                    $regularSubTotal += $totalPrice;
                }
            }

            // Pickup items (unchanged from your logic)
            if (count($pickup_items) > 0) {
                foreach ($pickup_items as $pickupItem) {
                    $pickupQuantity = (int) ($pickupItem['quantity'] ?? 1);
                    $pickupUnitPrice = (float) ($pickupItem['unit_price'] ?? 0);
                    $pickupSalePrice = (float) ($pickupItem['sale_price'] ?? $pickupUnitPrice);
                    $pickupTotalPrice = (float) ($pickupItem['total_price'] ?? ($pickupQuantity * $pickupSalePrice));

                    $purchaseItem = PurchaseItem::create([
                        'purchase_id' => null,
                        'product_id' => null,
                        'variant_id' => null,
                        'warehouse_id' => null,
                        'supplier_id' => $supplier_id,
                        'quantity' => $pickupQuantity,
                        'unit_price' => $pickupUnitPrice,
                        'total_price' => $pickupUnitPrice * $pickupQuantity,
                        'shadow_unit_price' => $pickupUnitPrice,
                        'shadow_total_price' => $pickupUnitPrice * $pickupQuantity,
                        'shadow_sale_price' => $pickupSalePrice,
                        'sale_price' => $pickupSalePrice,
                        'created_by' => Auth::id(),
                        'item_type' => 'pickup',
                        'product_name' => $pickupItem['product_name'] ?? null,
                        'brand' => $pickupItem['brand'] ?? null,
                        'variant_name' => $pickupItem['variant'] ?? null,
                    ]);

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => null,
                        'variant_id' => null,
                        'warehouse_id' => null,
                        'stock_id' => null,
                        'quantity' => $pickupQuantity,
                        'unit_price' => $pickupSalePrice,
                        'total_price' => $pickupTotalPrice,
                        'shadow_unit_price' => $pickupSalePrice,
                        'shadow_total_price' => $pickupTotalPrice,
                        'status' => 'completed',
                        'created_by' => Auth::id(),
                        'item_type' => 'pickup',
                        'product_name' => $pickupItem['product_name'] ?? null,
                        'brand' => $pickupItem['brand'] ?? null,
                        'variant_name' => $pickupItem['variant'] ?? null,
                        'purchase_item_id' => $purchaseItem->id,
                    ]);

                    $shadowSubTotal += $pickupTotalPrice;
                    $regularSubTotal += $pickupTotalPrice;
                    $regularCostTotal += $pickupUnitPrice * $pickupQuantity;
                }
            }

            if (count($regular_items) == 0 && count($pickup_items) == 0) {
                throw new \Exception('At least one item is required for a sale.');
            }

            $shadowGrandTotal = $shadowSubTotal;
            if ($shadowSubTotal > 0) {
                $shadowGrandTotal += $shadowSubTotal * ($request->vat_rate ?? 0) / 100;
                $shadowGrandTotal -= $shadowSubTotal * ($request->discount_rate ?? 0) / 100;
            }

            $sale->update([
                'sub_total' => $regularSubTotal,
                'grand_total' => $request->grand_amount,
                'shadow_sub_total' => $shadowSubTotal,
                'shadow_grand_total' => $shadowGrandTotal,
                'shadow_due_amount' => 0,
                'shadow_paid_amount' => $shadowGrandTotal,
            ]);

            if ($paidAmount > 0) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'account_id' => $account_id,
                    'amount' => $paidAmount,
                    'shadow_amount' => $shadowGrandTotal,
                    'payment_method' => $request->payment_method ?? ($payment_type ?? 'cash'),
                    'txn_ref' => $request->txn_ref ?? ('SIOP-' . Str::random(10)),
                    'note' => $request->notes ?? null,
                    'customer_id' => $customerId, // ✅ can be null
                    'paid_at' => Carbon::now(),
                    'status' => 'completed',
                    'created_by' => Auth::id(),
                ]);

                if ($adjust_amount == false) {
                    $account->updateBalance($paidAmount - $regularCostTotal, 'credit');
                }
            }

            DB::commit();

            return to_route('sales.show', $sale->id)->with('success', 'Sale created successfully! Invoice: ' . $sale->invoice_no);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors($e->getMessage());
        }
    }



    // payment Clearance - UPDATED WITH ACCOUNT SUPPORT
    public function storePayment(Request $request, Sale $sale)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $customerId = $sale->customer_id;
        $account = Account::find($request->account_id);

        if (!$account || !$account->is_active) {
            return back()->withErrors(['error' => 'Selected account is not active or not found.']);
        }

        DB::beginTransaction();

        try {
            // Create payment record
            Payment::create([
                'sale_id' => $sale->id,
                'account_id' => $request->account_id,
                'customer_id' => $customerId,
                'amount' => $request->amount,
                'shadow_amount' => $request->shadow_paid_amount ?? 0,
                'payment_method' => $request->payment_method ?? $account->type,
                'txn_ref' => $request->txn_ref ?? ('nexoryn-' . Str::random(10)),
                'note' => $request->notes ?? 'sales due payment clearance',
                'paid_at' => $request->payment_date ?? Carbon::now(),
                'created_by' => Auth::id(),
                'status' => 'completed',
            ]);

            // Update sale amounts
            $newPaidAmount = $sale->paid_amount + $request->amount;
            $newDueAmount = max(0, $sale->due_amount - $request->amount);

            $sale->update([
                'paid_amount' => $newPaidAmount ?? 0,
                'shadow_paid_amount' => $sale->shadow_paid_amount + ($request->shadow_paid_amount ?? 0),
                'due_amount' => $newDueAmount ?? 0,
                'shadow_due_amount' => max(0, $sale->shadow_due_amount - ($request->shadow_paid_amount ?? 0)),
                'status' => $newDueAmount <= 0.01 ? 'paid' : 'partial',
            ]);

            // Update account balance (credit for income from sale)
            $account->updateBalance($request->amount, 'credit');

            DB::commit();

            return redirect()->back()->with('success', 'Payment recorded successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Payment failed: ' . $e->getMessage()]);
        }
    }


    public function shadowStore(Request $request)
    {

        $type = $request->input('type', 'pos');

        if ($type == 'inventory') {
            $rules = [
                'customer_id' => 'required|exists:customers,id',
            ];
        } else {
            $rules = [
                'customer_name' => 'nullable|string|max:255',
                'customer_phone' => 'nullable|string|max:20',
            ];
        }

        $rules = array_merge($rules, [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $request->validate($rules);


        DB::beginTransaction();
        $type == 'inventory' ? $paidAmount = $request->paid_amount : $paidAmount = $request->grand_amount;


        if ($type == 'inventory') {
            $customerId = $request->customer_id;
        } else {
            $existingCustomer = Customer::where('phone', $request->customer_phone)
                ->orWhere('customer_name', $request->customer_name)
                ->first();
            if ($existingCustomer) {
                $customerId = $existingCustomer->id;
            } else {
                $customerId = Customer::CreateOrUpdate([
                    'customer_name' => $request->customer_name ?? 'Walk-in Customer',
                    'phone' => $request->customer_phone ?? null,
                ])->id;
            }
        }


        try {
            // 1. Create Sale
            $sale = Sale::create([
                'customer_id' => $customerId,
                'invoice_no' => $this->generateInvoiceNo(),
                'sub_total' => 0,
                'discount' => $request->discount_rate ?? 0,
                'vat_tax' => $request->vat_rate ?? 0,
                'grand_total' => 0,
                'paid_amount' => 0,
                'due_amount' => 0,
                'shadow_vat_tax' => $request->vat_rate ?? 0,
                'shadow_discount' => $request->discount_rate ?? 0,
                'shadow_sub_total' => $request->sub_amount ?? 0,
                'shadow_grand_total' => $request->grand_amount ?? 0,
                'shadow_paid_amount' => $paidAmount ?? 0,
                'shadow_due_amount' => $request->due_amount ?? 0,
                'payment_type' => 'cash',
                'status' => 'pending',
                'shadow_type' => $request->shadow_type ?? 'shadow',
                'type' => $type ?? 'pos',
            ]);


            $subTotal = 0;

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $variant = Variant::findOrFail($item['variant_id']);
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
                $shadowUnitPrice = $item['shadow_sell_price'];
                $shadowtotalPrice = $quantity * $shadowUnitPrice;
                $totalPrice = $quantity * $unitPrice;

                $warehouse_id = Stock::where('product_id', $product->id)
                    ->where('variant_id', $variant->id)
                    ->where('quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->value('warehouse_id');

                // 4. Create sale item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'warehouse_id' => $warehouse_id ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'status' => 'pending',
                    'total_price' => $totalPrice,
                    'shadow_unit_price' => $shadowUnitPrice,
                    'shadow_total_price' => $shadowtotalPrice,
                ]);

                $subTotal += $totalPrice;
            }

            // 5. Update sale totals
            $sale->update([
                'sub_total' => $subTotal,
                'grand_total' => $subTotal + ($subTotal * $request->vat_rate / 100) - ($subTotal * $request->discount_rate / 100),
            ]);


            // create payment record if paid_amount > 0
            if ($paidAmount > 0) {
                $payment = new Payment();
                $payment->sale_id = $sale->id;
                $payment->amount = 0;
                $payment->shadow_amount = $paidAmount;
                $payment->payment_method = $request->payment_method ?? 'cash';
                $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                $payment->note = $request->notes ?? null;
                $payment->customer_id = $customerId ?? null;
                $payment->paid_at = Carbon::now();
                $payment->status = 'pending';
                $payment->save();
            }

            DB::commit();

            if ($type === 'inventory') {
                return to_route('sales.index')->with('success', 'Sale created successfully! Invoice: ' . $sale->invoice_no);
            } else {
                return to_route('salesPos.index', $type)->with('success', 'Sale created successfully! Invoice: ' . $sale->invoice_no);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors($e->getMessage());
        }
    }



    /**
     * Display the specified sale
     */
    public function show(Sale $sale, $print = null)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $sale = Sale::with([
            'customer',
            'items',
            'items.product',
            'items.product.brand',
            'items.variant',
            'items.warehouse',
            'creator'
        ])->findOrFail($sale->id);

        if ($isShadowUser) {
            $sale = $this->transformToShadowData($sale);
        }


        $render = $print ? 'sales/ShowPos' : 'sales/Show';

        return Inertia::render($render, [
            'sale' => $sale,
            'business_name' => @$sale->creator->business->name,
        ]);
    }

    public function printRequest(ReceiptService $posPrinter, $id)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'items.warehouse'])
            ->findOrFail($id);

        $posPrinter->printRequest((float) $sale->paid_amount, $sale);

        return response()->json(['ok' => true]);
    }

    public function print(Sale $sale)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'items.warehouse'])
            ->findOrFail($sale->id);

        return Inertia::render('Sales/Print', [
            'sale' => $sale,
        ]);
    }


    public function downloadPdf(Sale $sale)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.product.brand', 'items.variant', 'items.warehouse'])
            ->findOrFail($sale->id);

        return response()->json(['message' => 'PDF download would be implemented here']);
    }




    /**
     * Remove the specified sale
     */
    public function destroy(Sale $sale)
    {
        DB::beginTransaction();

        try {
            // Restore stock for each item
            foreach ($sale->items as $item) {
                // Add stock back using FIFO logic
                Stock::create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $item->warehouse_id,
                    'quantity' => $item->quantity,
                ]);

                // Log stock movement
                StockMovement::create([
                    'warehouse_id' => $item->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'type' => 'in',
                    'qty' => $item->quantity,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'notes' => 'Stock restored from deleted sale',
                    'created_by' => Auth::id(),
                ]);
            }

            $sale->delete();

            DB::commit();

            return redirect()->route('sales.index')->with('success', 'Sale deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors($e->getMessage());
        }
    }


    /**
     * Display all sales items
     */

    public function allSalesItems()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $salesItems = SaleItem::with(['sale.customer', 'product', 'variant', 'stock', 'warehouse'])
            ->where('status', '!=', 'cancelled')
            ->orderBy('created_at', 'desc')
            ->filter(request()->all())
            ->paginate(15)
            ->withQueryString();

        if ($isShadowUser) {
            $salesItems->getCollection()->transform(function ($item) {
                return self::transformToShadowItemData($item);
            });
        }

        return Inertia::render('sales/SalesItem', [
            'salesItems' => $salesItems,
            'isShadowUser' => $isShadowUser,
        ]);
    }




    public function showItem($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';
        $saleItem = SaleItem::with(['sale.customer', 'product', 'variant', 'warehouse',])->findOrFail($id);

        if ($isShadowUser) {
            $saleItem = self::transformToShadowItemData($saleItem);
        }


        return Inertia::render('sales/ShowItem', [
            'saleItem' => $saleItem,
            'isShadowUser' => $isShadowUser,
        ]);
    }


    public function edit(Sale $sale)
    {

        $sale->load(['customer', 'items.product', 'items.variant']);

        return inertia('sales/Edit', [
            'sale' => $sale,
        ]);
    }


    /**
     * update the specified sale 
     */

    public function update(Sale $sale, Request $request)
    {

        $sale = Sale::with(['customer', 'items.product', 'items.variant'])->findOrFail($sale->id);

        if ($request->paid_amount > $sale->grand_total) {
            return back()->withErrors(['Paid amount cannot be greater than grand total.']);
        }

        if ($request->due_amount < 0) {
            return back()->withErrors(['Due amount cannot be negative.']);
        }

        if ($request->due_amount == 0 && $request->paid_amount == $sale->grand_total) {
            $status = 'paid';
        } else {
            $status = 'pending';
        }


        $sale->update([
            'paid_amount' => $request->paid_amount,
            'due_amount' => $request->due_amount,
            'shadow_type' => 'general',
            'status' => $status,
        ]);

        $sale->items()->update([
            'status' => 'completed',
        ]);

        Payment::where('sale_id', $sale->id)->update([
            'status' => 'completed',
            'amount' => $request->paid_amount,
        ]);

        return redirect()->route('sales.index')->with('success', 'Sale updated successfully.');
    }


    //rejected 

    public function rejected(Sale $sale)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.variant'])->findOrFail($sale->id);

        $sale->update([
            'shadow_type' => 'shadow',
            'status' => 'cancelled',
        ]);

        $sale->items()->update([
            'status' => 'cancelled',
        ]);

        Payment::where('sale_id', $sale->id)->update([
            'status' => 'cancelled',
            'amount' => 0,
        ]);

        return back()->with('success', 'Sale cancelled successfully.');
    }


    /**
     * Recalculate sale totals after item deletion
     */
    private function recalculateSaleTotals(Sale $sale)
    {
        $subtotal = $sale->saleItems->sum(function ($item) {
            return ($item->unit_price * $item->quantity) * (1 - $item->discount / 100);
        });

        $totalQuantity = $sale->saleItems->sum('quantity');

        $sale->update([
            'subtotal' => $subtotal,
            'grandtotal' => $subtotal,
            'total_quantity' => $totalQuantity,
        ]);
    }

    /**
     * Get sales items statistics
     */
    public function getStatistics(Request $request)
    {
        $query = SaleItem::with('sale', 'product');

        // Apply date filters if provided
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $stats = [
            'total_items' => $query->count(),
            'total_quantity' => $query->sum('quantity'),
            'total_revenue' => $query->get()->sum(function ($item) {
                return ($item->unit_price * $item->quantity) * (1 - $item->discount / 100);
            }),
            'avg_item_value' => $query->avg('unit_price'),
        ];

        return response()->json($stats);
    }


    /**
     * FIFO stock deduction
     */
    private static function fifoOut($productId, $variantId, $qtyNeeded, $saleId, $stockId = null)
    {
        $stocks = Stock::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('quantity', '>', 0)
            ->where(function ($query) use ($stockId) {
                if ($stockId) {
                    $query->where('id', $stockId);
                }
            })
            ->orderBy('created_at', 'asc')
            ->get();


        foreach ($stocks as $stock) {
            if ($qtyNeeded <= 0)
                break;

            $take = min($stock->quantity, $qtyNeeded);
            $stock->decrement('quantity', $take);

            // log movement
            StockMovement::create([
                'warehouse_id' => $stock->warehouse_id ?? null,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'type' => 'out',
                'qty' => $take,
                'reference_type' => Sale::class,
                'reference_id' => $saleId,
                'created_by' => Auth::id(),
            ]);

            $qtyNeeded -= $take;
        }

        if ($qtyNeeded > 0) {
            return back()->withErrors(["Not enough stock for product ID $productId."]);
        }
    }

    /**
     * Generate invoice number
     */
    private function generateInvoiceNo()
    {
        $last = Sale::latest()->first();
        $num = $last ? intval(substr($last->invoice_no, -4)) + 1 : 1;
        return 'INV-' . date('Y-m') . '-' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }


    /**
     * Transform sale data to shadow data
     */

    private function transformToShadowData($sale)
    {
        $sale->sub_total = $sale->shadow_sub_total;
        $sale->discount = $sale->shadow_discount;
        $sale->vat_tax = $sale->shadow_vat_tax;
        $sale->grand_total = $sale->shadow_grand_total;
        $sale->paid_amount = $sale->shadow_paid_amount;
        $sale->due_amount = $sale->shadow_due_amount;

        if ($sale->items) {
            $sale->items->transform(function ($item) {
                $item->unit_price = $item->shadow_unit_price;
                $item->sale_price = $item->shadow_sale_price;
                $item->total_price = $item->shadow_total_price;
                return $item;
            });
        }

        return $sale;
    }


    /**
     * Update the specified sale item
     */

    private static function transformToShadowItemData($salesItems)
    {
        $salesItems->unit_price = $salesItems->shadow_unit_price;
        $salesItems->total_price = $salesItems->shadow_total_price;

        return $salesItems;
    }

    public function scanBarcode(Request $request)
    {
        $code = trim($request->code);          // ✅ trim
        $code = preg_replace('/\s+/', '', $code); // ✅ remove spaces/newlines

        $stock = Stock::with(['product', 'variant'])
            ->where('quantity', '>', 0)
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                    ->orWhere('batch_no', $code);
            })
            ->first();

        if (!$stock) {
            return response()->json([
                'message' => 'Stock not found',
                'code_received' => $code, // ✅ debug
            ], 404);
        }

        return response()->json([
            'stock' => [
                'id' => $stock->id,
                'barcode' => $stock->barcode,
                'batch_no' => $stock->batch_no,
                'quantity' => $stock->quantity,
                'sale_price' => $stock->sale_price,
                'shadow_sale_price' => $stock->shadow_sale_price,
                'product' => [
                    'id' => $stock->product->id,
                    'name' => $stock->product->name,
                    'product_no' => $stock->product->product_no,
                ],
                'variant' => [
                    'id' => $stock->variant->id,
                    'sku' => $stock->variant->sku,
                    'attribute_values' => $stock->variant->attribute_values,
                ],
            ]
        ]);
    }


}