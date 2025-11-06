<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::latest()
            ->with(['supplier', 'warehouse', 'items.product', 'items.variant']);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('purchase_no', 'like', '%' . $request->search . '%')
                    ->orWhereHas('supplier', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%');
                    })
                    ->orWhereHas('warehouse', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && $request->date) {
            $query->whereDate('purchase_date', $request->date);
        }

        return Inertia::render('Purchase/PurchaseList', [
            'filters' => $request->only(['search', 'status', 'date']),
            'purchases' => $query->paginate(10)->withQueryString()
        ]);
    }

    public function create()
    {
        return Inertia::render('Purchase/AddPurchase', [
            'suppliers' => Supplier::all(),
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::with('variants')->get()
        ]);
    }

   public function store(Request $request)
{
    $request->validate([
        'supplier_id' => 'required|exists:suppliers,id',
        'warehouse_id' => 'required|exists:warehouses,id',
        'purchase_date' => 'required|date',
        'notes' => 'nullable|string',
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.variant_id' => 'required|exists:variants,id',
        'items.*.quantity' => 'required|integer|min:1',
        'items.*.unit_price' => 'required|numeric|min:0'
    ]);

    DB::beginTransaction();
    try {
        // Generate purchase number
        $purchaseCount = Purchase::whereDate('created_at', today())->count();
        $purchaseNo = 'PUR-' . date('Ymd') . '-' . str_pad($purchaseCount + 1, 4, '0', STR_PAD_LEFT);

        // Calculate total amount
        $totalAmount = collect($request->items)->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        // Create purchase
        $purchase = Purchase::create([
            'purchase_no' => $purchaseNo,
            'supplier_id' => $request->supplier_id,
            'warehouse_id' => $request->warehouse_id,
            'purchase_date' => $request->purchase_date,
            'total_amount' => $totalAmount,
            'notes' => $request->notes,
            'status' => 'completed'
        ]);

        // Create purchase items and update stock
        foreach ($request->items as $item) {
            $totalPrice = $item['quantity'] * $item['unit_price'];

            // Create purchase item
            $purchase->items()->create([
                'product_id' => $item['product_id'],
                'variant_id' => $item['variant_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $totalPrice
            ]);

            // Update or create stock
            $stock = Stock::where('warehouse_id', $request->warehouse_id)
                ->where('product_id', $item['product_id'])
                ->where('variant_id', $item['variant_id'])
                ->first();

            if ($stock) {
                $stock->increment('quantity', $item['quantity']);
                // Update purchase price to the latest price
                $stock->purchase_price = $item['unit_price'];
                $stock->save();
            } else {
                Stock::create([
                    'warehouse_id' => $request->warehouse_id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $item['unit_price']
                ]);
            }
        }

        DB::commit();

        return redirect()->route('purchase.list')->with('success', 'Purchase created successfully');
    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()->back()->with('error', 'Error creating purchase: ' . $e->getMessage());
    }
}

    public function show($id)
    {
        $purchase = Purchase::with(['supplier', 'warehouse', 'items.product', 'items.variant'])
            ->findOrFail($id);

        return Inertia::render('Purchase/ViewPurchase', [
            'purchase' => $purchase
        ]);
    }

    public function destroy($id)
    {
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
}