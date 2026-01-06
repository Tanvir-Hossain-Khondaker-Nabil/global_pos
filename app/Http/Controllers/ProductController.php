<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Stock;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function view($id)
    {
        $product = Product::with([
            'category',
            'brand',
            'variants.stock'
        ])->findOrFail($id);

        return Inertia::render('product/ViewProduct', [
            'product' => $product
        ]);
    }

    public function index(Request $request)
    {
        $products = Product::latest()
            ->with(['category', 'brand', 'variants.stock'])
            ->filter($request->only('search'))
            ->paginate(10);

        return Inertia::render("product/Product", [
            'filters' => $request->only('search'),
            'product' => $products
        ]);
    }

    public function add_index(Request $request)
    {
        $querystring = $request->only('id');
        $update = null;

        if ($querystring && isset($querystring['id'])) {
            $update = Product::with(['variants', 'category', 'brand'])->find($querystring['id']);

            if (!$update) {
                return redirect()->route('product.list')->with('error', 'Product not found');
            }
        }

        $attributes = Attribute::with(['activeValues'])->get()->map(function ($attribute) {
            return [
                'id' => $attribute->id,
                'name' => $attribute->name,
                'code' => $attribute->code,
                'active_values' => $attribute->activeValues->map(function ($value) {
                    return [
                        'id' => $value->id,
                        'value' => $value->value,
                        'code' => $value->code,
                    ];
                })
            ];
        });

        return Inertia::render('product/AddProduct', [
            'category' => Category::pluck('name', 'id'),
            'brand' => \App\Models\Brand::pluck('name', 'id'),
            'update' => $update ? $update->toArray() : null,
            'attributes' => $attributes
        ]);
    }

    public function update(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'product_no' => 'required|string|max:100|unique:products,product_no,' . $request->id,
            'description' => 'nullable|string',
            'product_type' => 'required|in:regular,in_house',
            'variants' => 'required|array|min:1',
            'variants.*.attribute_values' => 'required|array',
            'brand_id' => 'nullable|exists:brands,id',
        ]);

        // Add conditional validation for in_house fields
        if ($request->product_type === 'in_house') {
            $validator->addRules([
                'in_house_cost' => 'required|numeric|min:0',
                'in_house_shadow_cost' => 'required|numeric|min:0',
                'in_house_sale_price' => 'required|numeric|min:0',
                'in_house_shadow_sale_price' => 'required|numeric|min:0',
                'in_house_initial_stock' => 'required|integer|min:0',
            ]);
        }

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Please fix the validation errors');
        }

        \Log::info('Product save/update request:', $request->all());

        DB::beginTransaction();
        try {
            // Create or update product
            $product = $request->id ? Product::find($request->id) : new Product();

            if ($request->id && !$product) {
                throw new \Exception("Product not found with ID: " . $request->id);
            }

            $product->name = $request->product_name;
            $product->brand_id = $request->brand_id ?: null;
            $product->product_no = $request->product_no;
            $product->category_id = $request->category_id;
            $product->description = $request->description;
            $product->product_type = $request->product_type;
            $product->created_by = auth()->id();

            // In-house settings
            if ($request->product_type === 'in_house') {
                $product->in_house_cost = $request->in_house_cost;
                $product->in_house_shadow_cost = $request->in_house_shadow_cost;
                $product->in_house_sale_price = $request->in_house_sale_price;
                $product->in_house_shadow_sale_price = $request->in_house_shadow_sale_price;
                $product->in_house_initial_stock = $request->in_house_initial_stock;
            } else {
                $product->in_house_cost = null;
                $product->in_house_shadow_cost = null;
                $product->in_house_sale_price = null;
                $product->in_house_shadow_sale_price = null;
                $product->in_house_initial_stock = 0;
            }

            $product->save();
            \Log::info('Product saved:', ['id' => $product->id, 'name' => $product->name]);

            // Handle variants
            $existingVariantIds = $product->variants()->pluck('id')->toArray();
            $newVariantIds = [];

            foreach ($request->variants as $variantData) {
                if (empty($variantData['attribute_values']) || !is_array($variantData['attribute_values'])) {
                    continue;
                }

                // Generate SKU with short codes
                $sku = $this->generateSku($product, $variantData['attribute_values']);

                if (!empty($variantData['id'])) {
                    // Update existing variant
                    $variant = Variant::where('id', $variantData['id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if ($variant) {
                        $variant->update([
                            'attribute_values' => $variantData['attribute_values'],
                            'sku' => $sku,
                        ]);
                        $newVariantIds[] = $variant->id;
                    }
                } else {
                    // Create new variant
                    $variant = Variant::create([
                        'product_id' => $product->id,
                        'attribute_values' => $variantData['attribute_values'],
                        'sku' => $sku,
                    ]);
                    $newVariantIds[] = $variant->id;
                    \Log::info('Variant created:', [
                        'id' => $variant->id, 
                        'sku' => $sku,
                        'attributes' => $variantData['attribute_values']
                    ]);

                    // Create stock for in-house products
                    if ($product->product_type === 'in_house') {
                        $this->createInHouseStock($product, $variant);
                    }
                }
            }

            // Delete removed variants
            $variantsToDelete = array_diff($existingVariantIds, $newVariantIds);
            if (!empty($variantsToDelete)) {
                Variant::whereIn('id', $variantsToDelete)->delete();
                Stock::whereIn('variant_id', $variantsToDelete)->delete();
                \Log::info('Variants deleted:', $variantsToDelete);
            }

            DB::commit();
            \Log::info('Product transaction committed successfully');

            return redirect()->route('product.list')->with('success', "Product " . ($request->id ? 'updated' : 'created') . " successfully");

        } catch (\Exception $th) {
            DB::rollBack();
            \Log::error('Product update error: ' . $th->getMessage());
            \Log::error('Stack trace:', $th->getTrace());
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
        }
    }

    private function createInHouseStock(Product $product, Variant $variant)
    {
        // Find or create In-House warehouse
        $inHouseWarehouse = Warehouse::where('code', 'IN-HOUSE')->first();

        if (!$inHouseWarehouse) {
            $inHouseWarehouse = Warehouse::create([
                'name' => 'In-House Production',
                'code' => 'IN-HOUSE',
                'address' => 'Internal Production Department',
                'is_active' => true,
            ]);
        }

        // Check if stock already exists
        $existingStock = Stock::where('warehouse_id', $inHouseWarehouse->id)
            ->where('product_id', $product->id)
            ->where('variant_id', $variant->id)
            ->first();

        if ($existingStock) {
            $existingStock->update([
                'quantity' => $product->in_house_initial_stock,
                'purchase_price' => $product->in_house_cost,
                'sale_price' => $product->in_house_sale_price,
                'shadow_purchase_price' => $product->in_house_shadow_cost,
                'shadow_sale_price' => $product->in_house_shadow_sale_price,
            ]);
        } else {
            Stock::create([
                'warehouse_id' => $inHouseWarehouse->id,
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'quantity' => $product->in_house_initial_stock,
                'purchase_price' => $product->in_house_cost,
                'sale_price' => $product->in_house_sale_price,
                'shadow_purchase_price' => $product->in_house_shadow_cost,
                'shadow_sale_price' => $product->in_house_shadow_sale_price,
            ]);
        }
    }

    private function generateSku(Product $product, array $attributeValues): string
    {
        // Create short codes for attributes and values
        $shortCodes = [];
        
        foreach ($attributeValues as $attribute => $value) {
            // Get first 3 letters of attribute and value
            $attrShort = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $attribute), 0, 3));
            $valShort = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $value), 0, 3));
            
            $shortCodes[] = $attrShort . $valShort;
        }
        
        // Sort to maintain consistency
        sort($shortCodes);
        
        // Combine with product number
        return $product->product_no . '_' . implode('_', $shortCodes);
    }

    public function del($id)
    {
        try {
            Product::find($id)->delete();
            return redirect()->back()->with('success', "Product deleted successfully");
        } catch (\Exception $th) {
            \Log::error('Product delete error: ' . $th->getMessage());
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
        }
    }
}