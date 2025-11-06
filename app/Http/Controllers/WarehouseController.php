<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Warehouse;
use App\Models\Product; // Add this import
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Warehouse/WarehouseList', [
            'filters' => $request->only('search'),
            'warehouses' => Warehouse::latest()
                ->withCount([
                    'stocks as total_products' => function ($query) {
                        $query->select(DB::raw('count(distinct product_id)'));
                    }
                ])
                ->withSum('stocks as total_stock_value', DB::raw('quantity * purchase_price'))
                ->filter($request->only('search'))
                ->paginate(10)
                ->withQueryString()
        ]);
    }

    public function create()
    {
        return Inertia::render('Warehouse/AddWarehouse');
    }

    public function edit($id)
    {
        $warehouse = Warehouse::findOrFail($id);
        return Inertia::render('Warehouse/AddWarehouse', [
            'warehouse' => $warehouse
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouses',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);

        try {
            Warehouse::create($request->all());
            return redirect()->route('warehouse.list')->with('success', 'Warehouse created successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error creating warehouse: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $warehouse = Warehouse::with(['stocks.product', 'stocks.variant'])->findOrFail($id);

        // Get all products with their stock in this warehouse
        $products = Product::with([
            'variants.stocks',  // ✅ Load stocks for each variant
            'category',
            'stocks' => function ($query) use ($id) {
                $query->where('warehouse_id', $id);
            }
        ])->get()
            ->map(function ($product) use ($id) {
                $totalStock = $product->stocks->sum('quantity');

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'product_no' => $product->product_no,
                    'description' => $product->description,
                    'category' => $product->category,
                    'total_stock' => $totalStock,
                    'variants' => $product->variants->map(function ($variant) use ($id) {
                        // ✅ Now $variant->stocks is a collection
                        $stock = $variant->stocks->where('warehouse_id', $id)->first();

                        return [
                            'id' => $variant->id,
                            'size' => $variant->size,
                            'color' => $variant->color,
                            'variant_name' => $variant->variant_name,
                            'stock_quantity' => $stock ? $stock->quantity : 0,
                            'purchase_price' => $stock ? $stock->purchase_price : 0,
                            'stock_value' => $stock ? $stock->quantity * $stock->purchase_price : 0,
                        ];
                    })
                ];
            });


        return Inertia::render('Warehouse/WarehouseProducts', [
            'warehouse' => $warehouse,
            'products' => $products
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouses,code,' . $id,
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);

        try {
            $warehouse = Warehouse::findOrFail($id);
            $warehouse->update($request->all());
            return redirect()->route('warehouse.list')->with('success', 'Warehouse updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error updating warehouse: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $warehouse = Warehouse::findOrFail($id);

            // Check if warehouse has purchases
            if ($warehouse->purchases()->exists()) {
                return redirect()->back()->with('error', 'Cannot delete warehouse with associated purchases');
            }

            $warehouse->delete();
            return redirect()->route('warehouse.list')->with('success', 'Warehouse deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error deleting warehouse: ' . $e->getMessage());
        }
    }
}