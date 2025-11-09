<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $warehousesQuery = Warehouse::latest()
            ->withCount([
                'stocks as total_products' => function ($query) {
                    $query->select(DB::raw('count(distinct product_id)'));
                }
            ]);

        // Calculate stock value based on user type
        if ($isShadowUser) {
            $warehousesQuery->withSum('stocks as total_stock_value', DB::raw('quantity * shadow_purchase_price'));
        } else {
            $warehousesQuery->withSum('stocks as total_stock_value', DB::raw('quantity * purchase_price'));
        }

        $warehouses = $warehousesQuery->filter($request->only('search'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Warehouse/WarehouseList', [
            'filters' => $request->only('search'),
            'warehouses' => $warehouses,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        return Inertia::render('Warehouse/AddWarehouse', [
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function edit($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $warehouse = Warehouse::findOrFail($id);
        return Inertia::render('Warehouse/AddWarehouse', [
            'warehouse' => $warehouse,
            'isShadowUser' => $isShadowUser
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouses',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'is_active' => 'boolean'
        ]);

        try {
            $warehouseData = $request->all();
            $warehouseData['created_by'] = $user->id;
            $warehouseData['user_type'] = $user->type;
            
            Warehouse::create($warehouseData);
            
            return redirect()->route('warehouse.list')->with('success', 
                $isShadowUser ? 'Shadow warehouse created successfully' : 'Warehouse created successfully'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error creating warehouse: ' . $e->getMessage());
        }
    }

    public function show($id)
{
    $user = Auth::user();
    $isShadowUser = $user->type === 'shadow';

    $warehouse = Warehouse::with(['stocks.product', 'stocks.variant'])->findOrFail($id);

    // Get only products that have stock in this warehouse
    $products = Product::with([
        'variants.stocks' => function ($query) use ($id) {
            $query->where('warehouse_id', $id);
        },
        'category',
        'stocks' => function ($query) use ($id) {
            $query->where('warehouse_id', $id);
        }
    ])
    ->whereHas('stocks', function ($query) use ($id) {
        $query->where('warehouse_id', $id)
              ->where('quantity', '>', 0);
    })
    ->orWhereHas('variants.stocks', function ($query) use ($id) {
        $query->where('warehouse_id', $id)
              ->where('quantity', '>', 0);
    })
    ->get()
    ->map(function ($product) use ($id, $isShadowUser) {
        // Calculate total stock for this product in this warehouse
        $totalStock = $product->stocks->sum('quantity');
        
        // Also include variant stocks
        $variantStocks = $product->variants->flatMap(function ($variant) use ($id) {
            return $variant->stocks->where('warehouse_id', $id);
        });
        
        $totalStock += $variantStocks->sum('quantity');

        return [
            'id' => $product->id,
            'name' => $product->name,
            'product_no' => $product->product_no,
            'description' => $product->description,
            'category' => $product->category,
            'total_stock' => $totalStock,
            'variants' => $product->variants->map(function ($variant) use ($id, $isShadowUser) {
                $stock = $variant->stocks->where('warehouse_id', $id)->first();

                // Use shadow prices for shadow users
                $purchasePrice = $isShadowUser ? 
                    ($stock ? $stock->shadow_purchase_price : 0) : 
                    ($stock ? $stock->purchase_price : 0);
                
                $stockQuantity = $stock ? $stock->quantity : 0;
                $stockValue = $stockQuantity * $purchasePrice;

                return [
                    'id' => $variant->id,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'variant_name' => $variant->variant_name,
                    'stock_quantity' => $stockQuantity,
                    'purchase_price' => $purchasePrice,
                    'stock_value' => $stockValue,
                ];
            })->filter(function ($variant) {
                // Only show variants that have stock or relevant data
                return $variant['stock_quantity'] > 0 || $variant['purchase_price'] > 0;
            })
        ];
    })
    ->filter(function ($product) {
        // Only show products that have stock or variants with stock
        return $product['total_stock'] > 0 || count($product['variants']) > 0;
    });

    return Inertia::render('Warehouse/WarehouseProducts', [
        'warehouse' => $warehouse,
        'products' => $products,
        'isShadowUser' => $isShadowUser
    ]);
}
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

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
            
            return redirect()->route('warehouse.list')->with('success', 
                $isShadowUser ? 'Shadow warehouse updated successfully' : 'Warehouse updated successfully'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error updating warehouse: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        try {
            $warehouse = Warehouse::findOrFail($id);

            // Check if warehouse has purchases
            if ($warehouse->purchases()->exists()) {
                return redirect()->back()->with('error', 'Cannot delete warehouse with associated purchases');
            }

            $warehouse->delete();
            
            return redirect()->route('warehouse.list')->with('success', 
                $isShadowUser ? 'Shadow warehouse deleted successfully' : 'Warehouse deleted successfully'
            );
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error deleting warehouse: ' . $e->getMessage());
        }
    }
}