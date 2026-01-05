<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesReturnStore;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;


class SalesReturnController extends Controller
{


    //  index function
    public function index()
    {
        $salesReturns = SalesReturn::with([
            'sale.customer',
            'customer',
            'sale.items.product',
            'sale.items.variant',
        ])
            ->search(request('search'))
            ->status(request('status'))
            ->dateBetween(request('from_date'), request('to_date'))
            ->type(request('type'))
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('SalesReturn/Index', [
            'salesReturns' => $salesReturns,
        ]);
    }



    // create a function salesReturnCreate to show sales return create page
    public function create(Request $request)
    {
        $saleId = $request->sale_id;
        $sale = null;
        $saleItems = [];

        if ($saleId) {

            $sale = Sale::with(['items.product', 'items.variant', 'customer', 'items.warehouse'])
                    ->whereHas('items', function ($query) {
                        $query->whereNotNull('product_id');
                    })
                    ->findOrFail($saleId);


            foreach ($sale->items as $item) {

                if (is_null($item->product_id)) {
                    continue;
                }

                $saleItems[] = [
                    'id' => $item->id,
                    'product_id' => $item->product_id ?? null,
                    'product_name' => $item->product->name ?? $item->product_name,
                    'product_code' => $item->product->product_no ?? $item->product_name,
                    'variant_id' => $item->variant_id ?? null,
                    'brand_name' => $this->getBrandName($item->variant) ?? $item->brand,
                    'variant_name' => $this->getVariantDisplayName($item->variant) ?? $item->variant_name,
                    'stock_quantity' => $item->stock->quantity ?? 0,
                    'max_quantity' =>  max($item->quantity, $item->stock->quantity ?? 0),
                    'unit_price' => $item->unit_price,
                    'shadow_unit_price' => $item->shadow_unit_price,
                    'sale_price' =>  $item->unit_price,
                    'batch_no' => $item->stock->batch_no,
                    'shadow_sale_price' => $item->shadow_sale_price,
                    'sale_quantity' => $item->quantity ?? 0,
                    'total_price' => $item->total_price,
                    'shadow_total_price' => $item->shadow_total_price,
                    'discount' => $item->discount_amount ?? 0
                ];
            }
        }


        $recentSales = Sale::with(['customer'])
            ->whereHas('items', function ($query) {
                $query->where('type', 'inventory')
                    ->whereNotNull('product_id');
            })
            ->whereDate('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            // ->take(20)
            ->get();


        return Inertia::render('SalesReturn/Create', [
            'sale' => $sale,
            'saleItems' => $saleItems,
            'sales' => $recentSales,
            'accounts' => Account::where('is_active', true)->get(),
            'customers' => Customer::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get()
        ]);
    }




    private function getVariantDisplayName($variant)
    {
        if (is_null($variant)) {
            return 'Default Variant';
        }

        $parts = [];

        if (!empty($variant->attribute_values)) {
            if (is_array($variant->attribute_values)) {
                $attrs = collect($variant->attribute_values)
                    ->map(fn($value) => " {$value}")
                    ->implode(', ');
                $parts[] = " {$attrs}";
            } else {
                $parts[] = "Attribute: {$variant->attribute_values}";
            }
        }

        // sku
        if (!empty($variant->sku)) {
            $parts[] = "Sku: {$variant->sku}";
        }

        return !empty($parts) ? implode(', ', $parts) : 'Default Variant';
    }



    //brand name function
    private function getBrandName($variant)
    {
        if (is_null($variant)) {
            return 'Default Variant';
        }

        $parts = [];

        if (!empty($variant->attribute_values)) {
            if (is_array($variant->attribute_values)) {
                $attrs = collect($variant->attribute_values)
                    ->keys()
                    ->map(fn($key) => "{$key}")
                    ->implode(', ');
                $parts[] = " {$attrs}";
            }
        }

        return !empty($parts) ? implode(', ', $parts) : 'Default Variant';
    }





    // create a function salesReturnIndex to show sales return index page

    public function store(SalesReturnStore $request)
    {
        $validated = $request->validated();

        if (SalesReturn::where('sale_id', $validated['sale_id'])->exists()) {
            return back()->withErrors(['error' => 'Sales return for this sale already exists.']);
        }

        $request->is_damaged ? $type = 'damaged' : $type = 'sale_return';
        $account = Account::find($request->account_id);



        try {
            DB::beginTransaction();

            // Create sales return record
            $stock = SaleItem::where('sale_id', $validated['sale_id'])->first();
            $customer_id = Sale::where('id', $validated['sale_id'])->value('customer_id');


            $salesReturn = SalesReturn::create([
                'sale_id' => $validated['sale_id'],
                'customer_id' => $customer_id,
                'return_type' => $validated['return_type'],
                'return_date' => Carbon::parse($validated['return_date'])->format('Y-m-d'),
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'refunded_amount' => $validated['refunded_amount'] ?? 0,
                'shadow_refunded_amount' => $validated['shadow_refunded_amount'] ?? 0,
                'shadow_replacement_total' => 0,
                'replacement_total' => 0,
                'status' => 'completed',
                'type' => $type,
                'created_by' => Auth::id(),
            ]);



            // money refund process
            if (count($request->replacement_products) == 0) {

                if ($type == 'sale_return') {
                    foreach ($validated['items'] as $itemData) {

                        $saleItem = SaleItem::where('id', $itemData['sale_item_id'])->firstOrFail();

                        $stock = Stock::where('warehouse_id', $saleItem->warehouse_id)
                            ->where('product_id', $saleItem->product_id)
                            ->where('variant_id', $saleItem->variant_id)
                            ->first();

                        if ($stock) {
                            $stock->quantity += $itemData['return_quantity'];
                            $stock->save();
                        }
                    }

                    $details = 'Refund issued to customer for sales return.';
                }

                $expense = Expense::create([
                    'amount' => $validated['refunded_amount'] ?? 0,
                    'sh_amount' => $validated['shadow_refunded_amount'] ?? 0,
                    'date' => Carbon::parse($validated['return_date'])->format('Y-m-d') ?? Carbon::now()->format('Y-m-d'),
                    'details' =>  $details ?? 'Refund issued to customer for sales product damage.',
                    'created_by' => Auth::id(),
                    'payment_id' => null
                ]);

                if ($account) {

                    $account->updateBalance($validated['refunded_amount'] ?? 0, 'withdraw');

                    $payment = Payment::create([
                        'account_id' => $account->id,
                        'amount' => $validated['refunded_amount'] ?? 0,
                        'note' =>  $request->notes ?? 'Refund issued to customer for sales product damage.',
                        'created_by' => Auth::id(),
                        'txn_ref' => 'EXP-' . Str::random(10),
                        'payment_method' => $account->type,
                        'paid_at' => Carbon::now(),
                        'status' => 'completed',
                    ]);

                    $expense->update([
                        'payment_id' => $payment->id
                    ]);
                }
            }




            $totalReturn = 0;
            $shadowTotalReturn = 0;

            // Process returned items
            foreach ($validated['items'] as $itemData) {
                $saleItem = SaleItem::where('id', $itemData['sale_item_id'])
                    ->where('sale_id', $validated['sale_id'])
                    ->firstOrFail();

                $totalReturn += $saleItem['unit_price'] * $itemData['return_quantity'];
                $shadowTotalReturn += $saleItem['unit_price'] * $itemData['return_quantity'];
            }



            if ($validated['return_type'] === 'product_replacement' && !empty($validated['replacement_products'])) {

                // Process replacement products if applicable
                $replacementTotal = 0;
                $shadowReplacementTotal = 0;

                foreach ($validated['replacement_products'] as $productData) {

                    if ($type == 'damaged') {
                        $stock = Stock::where('warehouse_id',  $stock->warehouse_id)
                            ->where('product_id', $productData['product_id'])
                            ->where('variant_id', $productData['variant_id'])
                            ->firstOrFail();


                        $stock->quantity -= $productData['quantity'];
                        $stock->save();

                        Expense::create([
                            'amount' => $productData['sale_price'] * $productData['quantity'] ?? 0,
                            'sh_amount' => $productData['sale_price'] * $productData['quantity'] ?? 0,
                            'date' => Carbon::parse($validated['return_date'])->format('Y-m-d'),
                            'details' =>  $details ?? 'Replacement product issued to customer for sales product damage.',
                            'created_by' => Auth::id(),
                        ]);
                    }


                    $replacementItem = SalesReturnItem::create([
                        'sales_return_id' => $salesReturn->id,
                        'sale_item_id' => $validated['sale_id'],
                        'product_id' => $productData['product_id'],
                        'variant_id' => $productData['variant_id'],
                        'warehouse_id' => $stock->warehouse_id,
                        'return_quantity' => $productData['quantity'],
                        'unit_price' => $productData['sale_price'],
                        'shadow_unit_price' => $productData['shadow_unit_price'] ?? $productData['sale_price'],
                        'sale_price' => $productData['sale_price'],
                        'shadow_sale_price' => $productData['shadow_sale_price'] ?? $productData['sale_price'],
                        'total_price' => $productData['quantity'] * $productData['sale_price'],
                        'shadow_total_price' => $productData['quantity'] * ($productData['shadow_unit_price'] ?? $productData['unit_price']),
                        'status' => 'processed',
                        'type' => $type,
                        'reason' => $productData['reason'] ?? 'Product replacement',
                        'created_by' => Auth::id(),
                    ]);


                    StockMovement::create([
                        'warehouse_id' =>   $stock->warehouse_id,
                        'product_id' =>  $stock->product_id,
                        'variant_id' =>  $stock->variant_id ?? null,
                        'type' => $type,
                        'qty' => $productData['quantity'],
                        'reason' => 'Product replacement for sales return ID: ' . $salesReturn->id,
                        'created_by' => Auth::id(),
                        'reference_type' => SalesReturn::class ?? null,
                        'reference_id' => $salesReturn->id ?? null,
                    ]);


                    $replacementTotal += $replacementItem->sale_price * $replacementItem->return_quantity;
                    $shadowReplacementTotal += $replacementItem->sale_price * $replacementItem->return_quantity;
                }


                if ($replacementTotal >  $totalReturn) {

                    $amount =  $replacementTotal -  $totalReturn;

                    if ($account) {

                        $account->updateBalance($amount ?? 0, 'credit');

                        Payment::create([
                            'customer_id' => $customer_id,
                            'sale_id' => $validated['sale_id'],
                            'amount' => $amount,
                            'shadow_amount' => 0,
                            'txn_ref' => 'adjustment-' . Str::random(8),
                            'date' => Carbon::parse($validated['return_date']),
                            'payment_method' => $validated['payment_type'] ?? 'cash',
                            'created_by' => Auth::id(),
                            'paid_at' => Carbon::parse($validated['return_date']),
                            'status' => 'completed',
                            'note' => 'Payment for product replacement or damage exceeding return amount in sales return ID: ' . $salesReturn->id,
                        ]);
                    }
                }
            }



            $salesReturn->update([
                'replacement_total' => $replacementTotal ?? 0,
                'shadow_replacement_total' => $shadowReplacementTotal ?? 0,
                'return_quantity' => $itemData['return_quantity'] ?? 0,
                'refunded_amount' => $totalReturn,
                'shadow_refunded_amount' => $shadowTotalReturn,
            ]);



            $sale = Sale::where('id', $request->input('sale_id'))->first();

            $totalReturnedItems = SalesReturn::whereIn('sale_id', $sale->items->pluck('id'))->sum('return_quantity');
            $totalSoldItems = $sale->items->sum('quantity');

            if ($totalReturnedItems >= $totalSoldItems) {
                $sale->update(['status' => 'fully_returned']);
            } elseif ($totalReturnedItems > 0) {
                $sale->update(['status' => 'partially_returned']);
            }


            DB::commit();

            return to_route('salesReturn.list')->with('success', 'Sales return created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create sales return: ' . $e->getMessage());
        }
    }
}
