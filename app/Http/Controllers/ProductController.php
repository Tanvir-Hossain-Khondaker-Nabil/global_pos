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
            'brand', // Add brand
            'variants.stock'
        ])->findOrFail($id);

        return Inertia::render('product/ViewProduct', [
            'product' => $product
        ]);
    }

    public function index(Request $request)
    {
        // Debug: Check what's in the database
        \Log::info('Fetching products from database');
        \Log::info('Total products in DB:', ['count' => Product::count()]);
        
        $products = Product::latest()
            ->with(['category', 'brand', 'variants.stock']) // Add brand here
            ->filter($request->only('search'))
            ->paginate(10);

        // Debug: Check what's being sent to frontend
        \Log::info('Products sent to frontend:', [
            'total' => $products->total(),
            'count' => $products->count(),
            'first_product' => $products->first() ? $products->first()->toArray() : null
        ]);

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
        
        // Check if product was found
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
        'update' => $update ? $update->toArray() : null, // Convert to array
        'attributes' => $attributes
    ]);
}

    public function update(Request $request)
    {
        // Use the request data directly (no data wrapper)
        $validator = Validator::make($request->all(), [
            'product_name' => 'required',
            'category_id' => 'required',
            'product_no' => 'required',
            'description' => 'nullable|string',
            'product_type' => 'required',
            'variants' => 'required|array|min:1',
        ]);

        // Add conditional validation for in_house fields
        $validator->sometimes('in_house_cost', 'required|numeric|min:0', function ($input) {
            return $input->product_type === 'in_house';
        });

        $validator->sometimes('in_house_shadow_cost', 'required|numeric|min:0', function ($input) {
            return $input->product_type === 'in_house';
        });

        $validator->sometimes('in_house_sale_price', 'required|numeric|min:0', function ($input) {
            return $input->product_type === 'in_house';
        });

        $validator->sometimes('in_house_shadow_sale_price', 'required|numeric|min:0', function ($input) {
            return $input->product_type === 'in_house';
        });

        $validator->sometimes('in_house_initial_stock', 'required|integer|min:0', function ($input) {
            return $input->product_type === 'in_house';
        });

        // Validate each variant
        $validator->after(function ($validator) use ($request) {
            if (empty($request->variants) || !is_array($request->variants)) {
                $validator->errors()->add('variants', 'At least one variant is required.');
                return;
            }

            foreach ($request->variants as $index => $variant) {
                if (empty($variant['attribute_values']) || !is_array($variant['attribute_values'])) {
                    $validator->errors()->add("variants.$index", "Variant #" . ($index + 1) . " must have attribute values.");
                }
            }
        });

        // Validate
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

                // Generate SKU if not provided
                $sku = $variantData['sku'] ?? $this->generateSku($product, $variantData['attribute_values']);

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
                    \Log::info('Variant created:', ['id' => $variant->id, 'sku' => $sku]);

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
                // Also delete associated stock
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
            // Create if doesn't exist
            $inHouseWarehouse = Warehouse::create([
                'name' => 'In-House Production',
                'code' => 'IN-HOUSE',
                'address' => 'Internal Production Department',
                'is_active' => true,
            ]);
        }

        // Check if stock already exists for this variant
        $existingStock = Stock::where('warehouse_id', $inHouseWarehouse->id)
            ->where('product_id', $product->id)
            ->where('variant_id', $variant->id)
            ->first();

        if ($existingStock) {
            // Update existing stock
            $existingStock->update([
                'quantity' => $product->in_house_initial_stock,
                'purchase_price' => $product->in_house_cost,
                'sale_price' => $product->in_house_sale_price,
                'shadow_purchase_price' => $product->in_house_shadow_cost,
                'shadow_sale_price' => $product->in_house_shadow_sale_price,
            ]);
            \Log::info('Stock updated for variant:', ['variant_id' => $variant->id]);
        } else {
            // Create new stock
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
            \Log::info('Stock created for variant:', ['variant_id' => $variant->id]);
        }
    }

    private function generateSku(Product $product, array $attributeValues): string
    {
        $attributeCodes = collect($attributeValues)
            ->map(fn($value, $attribute) => substr($attribute, 0, 3) . '_' . substr($value, 0, 3))
            ->sort()
            ->implode('_');

        return $product->product_no . '_' . $attributeCodes;
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