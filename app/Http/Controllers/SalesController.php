<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Customer;
use App\Models\Stock;
use App\Models\Variant;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SalesController extends Controller
{
    /**
     * Display a listing of all sales
     */
    public function index(Request $request)
    {
        // Get search and filter parameters
        $search = $request->input('search');
        $status = $request->input('status');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        
        // Build query with relationships
        $sales = Sale::with(['customer', 'items.product', 'items.variant'])
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
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('sales/Index', [
            'sales' => $sales,
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

    /**
     * Store sale
     */
    public function store(Request $request)
    {

        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'items'       => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        // dd($request->all());

        DB::beginTransaction();


        try {
            // 1. Create Sale
            $sale = Sale::create([
                'customer_id' => $request->customer_id,
                'invoice_no'  => $this->generateInvoiceNo(),
                'sub_total'   => $request->sub_amount ?? 0,
                'discount'    => $request->discount_rate,
                'vat_tax'     => $request->vat_rate,
                'grand_total' => $request->grand_amount,
                'paid_amount' => $request->paid_amount,
                'due_amount'  => $request->due_amount,
                'shadow_vat_tax' => $request->vat_rate,
                'shadow_discount' => $request->discount_rate,
                'shadow_sub_total' =>  0,
                'shadow_grand_total' => 0,
                'shadow_paid_amount' => $request->paid_amount,
                'shadow_due_amount'  => 0,
                'payment_type'=> 'cash',
                'status'      => 'pending',
            ]);


            $shadowSubTotal = 0;

            // 2. Loop items
            foreach($request->items as $item)
            {
                $product = Product::findOrFail($item['product_id']);
                $variant = Variant::findOrFail($item['variant_id']);
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
                $shadowUnitPrice = $item['shadow_sell_price'];
                $shadowtotalPrice = $quantity * $shadowUnitPrice;
                $totalPrice = $quantity * $unitPrice;


                // 3. Deduct FIFO stock
                self::fifoOut($product->id, $variant->id, $quantity, $sale->id);

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
            $shadowDueAmount = $shadowGrandTotal - $request->paid_amount;


            $sale->update([
                'shadow_sub_total'   => $shadowSubTotal,
                'shadow_grand_total' => $shadowGrandTotal,
                'shadow_due_amount'  => $shadowDueAmount,
            ]);

            DB::commit();

            return to_route('sales.index')->with('success', 'Sale created successfully! Invoice: '.$sale->invoice_no);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors($e->getMessage());
        }
    }



    /**
     * Display the specified sale
     */
    public function show(Sale $sale)
    {
            $sale->load(['customer', 'items.product', 'items.variant', 'items.warehouse']);


            return Inertia::render('sales/Show', [
                'sale' => $sale,
            ]);
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
}