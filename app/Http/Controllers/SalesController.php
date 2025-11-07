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

        DB::beginTransaction();


        try {
            // 1. Create Sale
            $sale = Sale::create([
                'customer_id' => $request->customer_id,
                'invoice_no'  => $this->generateInvoiceNo(),
                'sub_total'   => 0,
                'discount'    => 0,
                'vat_tax'     => 0,
                'grand_total' => 0,
                'paid_amount' => 0,
                'due_amount'  => 0,
                'payment_type'=> 'cash',
                'status'      => 'pending',
            ]);


            $subTotal = 0;

            // 2. Loop items
            foreach($request->items as $item)
            {
                $product = Product::findOrFail($item['product_id']);
                $variant = Variant::findOrFail($item['variant_id']);
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
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
                ]);

                $subTotal += $totalPrice;
            }

            // 5. Update totals
            $grandTotal = $subTotal; // add discount or tax if needed
            $sale->update([
                'sub_total'   => $subTotal,
                'grand_total' => $grandTotal,
                'due_amount'  => $grandTotal,
            ]);

            DB::commit();

            return to_route('sales.create')->with('success', 'Sale created successfully! Invoice: '.$sale->invoice_no);

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
