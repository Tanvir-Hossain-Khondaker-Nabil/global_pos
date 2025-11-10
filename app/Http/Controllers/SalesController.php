<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Stock;
use App\Models\Variant;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;


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


        $sales = Sale::with(['customer', 'items.product', 'items.variant'])->where('type', $type)
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


        if($type == 'pos'){
            $render = 'sales/IndexPos';
        } else {
            $render = 'sales/Index';
        }


        return Inertia::render($render, [
            'sales' => $sales,
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
     * Show form
     */
    public function create()
    {
        $customers = Customer::all();
        $stock = Stock::with(['warehouse','product','variant'])->get();

        return  Inertia::render('sales/Create', [
            'customers' => $customers,
            'productstocks'  => $stock,
        ]);
        //
    }


    public function createPos()
    {
        $customers = Customer::all();
        $stock = Stock::with(['warehouse','product','variant'])->get();

        return  Inertia::render('sales/CreatePos', [
            'customers' => $customers,
            'productstocks'  => $stock,
        ]);
        //
    }

    /**
     * Store sale
     */
    public function store(Request $request)
    {

        $type = $request->input('type', 'pos');

        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'items'       => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        $type == 'inventory' ? $paidAmount = $request->paid_amount : $paidAmount = $request->grand_amount;

    
        try {
            // 1. Create Sale
            $sale = Sale::create([
                'customer_id' => $request->customer_id,
                'invoice_no'  => $this->generateInvoiceNo(),
                'sub_total'   => $request->sub_amount ?? 0,
                'discount'    => $request->discount_rate ?? 0,
                'vat_tax'     => $request->vat_rate ?? 0,
                'grand_total' => $request->grand_amount ?? 0,
                'paid_amount' =>  $paidAmount ?? 0,
                'due_amount'  => $request->due_amount ?? 0,
                'shadow_vat_tax' => $request->vat_rate ?? 0,
                'shadow_discount' => $request->discount_rate ?? 0,
                'shadow_sub_total' =>  0,
                'shadow_grand_total' => 0,
                'shadow_paid_amount' =>  $paidAmount ?? 0,
                'shadow_due_amount'  => 0,
                'payment_type'=> 'cash',
                'status'      => 'pending',
                'type'        => $type ?? 'pos',
            ]);


            $shadowSubTotal = 0;

            foreach($request->items as $item)
            {
                $product = Product::findOrFail($item['product_id']);
                $variant = Variant::findOrFail($item['variant_id']);
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
                $shadowUnitPrice = $item['shadow_sell_price'];
                $shadowtotalPrice = $quantity * $shadowUnitPrice;
                $totalPrice = $quantity * $unitPrice;

                // if ($type === 'inventory') {
                    self::fifoOut($product->id, $variant->id, $quantity, $sale->id);
                // }

                $warehouse_id = Stock::where('product_id', $product->id)
                    ->where('variant_id', $variant->id)
                    ->where('quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->value('warehouse_id');

                // 4. Create sale item
                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'warehouse_id' => $warehouse_id ?? null,
                    'quantity'   => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price'=> $totalPrice,
                    'shadow_unit_price' => $shadowUnitPrice,
                    'shadow_total_price'=> $shadowtotalPrice,
                ]);

                $shadowSubTotal += $shadowtotalPrice;
            }

            $shadowGrandTotal =  $shadowSubTotal;
            $shadowGrandTotal += $shadowSubTotal * $request->vat_rate / 100; 
            $shadowGrandTotal -= $shadowSubTotal * $request->discount_rate / 100;

            if ($paidAmount >= $shadowGrandTotal) {
                $shadowDueAmount = 0;
                $shadowPaidAmount = $shadowGrandTotal ?? 0;
            } else {
                $shadowDueAmount = $shadowGrandTotal - $paidAmount;
                $shadowPaidAmount = $paidAmount ?? 0;
            } 

            $sale->update([
                'shadow_sub_total'   => $shadowSubTotal,
                'shadow_grand_total' => $shadowGrandTotal,
                'shadow_due_amount'  => $shadowDueAmount ?? 0,
                'shadow_paid_amount' => $shadowPaidAmount ?? 0,
            ]);

            // create payment record if paid_amount > 0
            if ($paidAmount > 0) {
                $payment = new Payment();
                $payment->sale_id = $sale->id;
                $payment->amount = $paidAmount;
                $payment->shadow_amount = $shadowPaidAmount;
                $payment->payment_method = $request->payment_method ?? 'cash';
                $payment->txn_ref = $request->txn_ref ?? ('nexoryn-' . Str::random(10));
                $payment->note = $request->notes ?? null;
                $payment->customer_id = $request->customer_id ?? null;
                $payment->paid_at = Carbon::now();
                $payment->save();
            }

            DB::commit();

            if ($type === 'inventory') {
                return to_route('sales.index')->with('success', 'Sale created successfully! Invoice: '.$sale->invoice_no);
            } else {
                return to_route('salesPos.index',$type)->with('success', 'Sale created successfully! Invoice: '.$sale->invoice_no);
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

        $sale = Sale::with(['customer', 'items.product', 'items.variant', 'items.warehouse'])->findOrFail($sale->id);

        if ($isShadowUser) {
            $sale = $this->transformToShadowData($sale);
        }

        $render = $print ? 'sales/ShowPos' : 'sales/Show';

        return Inertia::render($render, [
            'sale' => $sale,
        ]);
    }


    public function print(Sale $sale)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.variant', 'items.warehouse'])
            ->findOrFail($sale->id);

        return Inertia::render('Sales/Print', [
            'sale' => $sale,
        ]);
    }


    public function downloadPdf(Sale $sale)
    {
        $sale = Sale::with(['customer', 'items.product', 'items.variant', 'items.warehouse'])
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

        $salesItems = SaleItem::with(['sale.customer', 'product', 'variant', 'warehouse'])
            ->orderBy('created_at', 'desc')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('product', function ($q1) use ($search) {
                        $q1->where('name', 'like', "%{$search}%")
                        ->orWhere('product_no', 'like', "%{$search}%");
                    })->orWhereHas('sale', function ($q1) use ($search) {
                        $q1->where('invoice_no', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($q2) use ($search) {
                            $q2->where('customer_name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                    })->orWhereHas('variant', function ($q1) use ($search) {
                        $q1->where('size', 'like', "%{$search}%")
                        ->orWhere('color', 'like', "%{$search}%");
                    })->orWhereHas('warehouse', function ($q1) use ($search) {
                        $q1->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->when(request('customer_id'), function ($query, $customerId) {
                $query->whereHas('sale.customer', function ($q) use ($customerId) {
                    $q->where('customer_name', 'like', "%{$customerId}%")
                    ->orWhere('phone', 'like', "%{$customerId}%");
                });
            })
            ->when(request('product_id'), function ($query, $productId) {
                $query->whereHas('product', function ($q) use ($productId) {
                    $q->where('name', 'like', "%{$productId}%")
                    ->orWhere('product_no', 'like', "%{$productId}%");
                });
            })
            ->when(request('warehouse_id'), function ($query, $warehouseId) {
                $query->whereHas('warehouse', function ($q) use ($warehouseId) {
                    $q->where('name', 'like', "%{$warehouseId}%");
                });
            })
            ->when(request('date_from'), function ($query, $dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            })
            ->when(request('date_to'), function ($query, $dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            })
            ->paginate(15);


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


        $saleItem = SaleItem::with(['sale.customer','product','variant', 'warehouse',])->findOrFail($id);

         if ($isShadowUser) {
             $saleItem = self::transformToShadowItemData($saleItem);
        }


        return Inertia::render('sales/ShowItem', [
            'saleItem' => $saleItem,
        ]);
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
    private static function fifoOut($productId, $variantId, $qtyNeeded, $saleId)
    {
        $stocks = Stock::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('quantity', '>', 0)
            ->orderBy('created_at', 'asc')
            ->get();


        foreach($stocks as $stock)
        {
            if ($qtyNeeded <= 0) break;

            $take = min($stock->quantity, $qtyNeeded);

            // reduce stock
            $stock->decrement('quantity', $take);

            // log movement
            StockMovement::create([
                'warehouse_id'   => $stock->warehouse_id ?? null,
                'product_id'     => $productId,
                'variant_id'     => $variantId,
                'type'           => 'out',
                'qty'            => $take,
                'reference_type' => Sale::class,
                'reference_id'   => $saleId,
            ]);

            $qtyNeeded -= $take;
        }

        if($qtyNeeded > 0){
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
        return 'INV-'.date('Y-m').'-'.str_pad($num, 4, '0', STR_PAD_LEFT);
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
}