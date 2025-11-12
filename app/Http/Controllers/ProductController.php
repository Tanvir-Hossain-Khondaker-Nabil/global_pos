<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Category;
use App\Models\Attribute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function view($id)
    {
        $product = Product::with([
            'category',
            'variants.stock' // Load stock with variants
        ])->findOrFail($id);

        return Inertia::render('product/ViewProduct', [
            'product' => $product
        ]);
    }

    public function index(Request $request)
    {
        $products = Product::latest()
            ->with(['category', 'variants.stock'])
            ->filter($request->only('search'))
            ->paginate(10);


        return Inertia::render("product/Product", [
            'filters' => $request->only('search'),
            'product' => $products->withQueryString()
        ]);
    }

    public function add_index(Request $request)
    {
        $querystring = $request->only('id');
        $update = null;

        if ($querystring && isset($querystring['id'])) {
            $update = Product::with(['variants'])->find($querystring['id']);
        }

        // Get attributes with their active values
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
            'update' => $update,
            'attributes' => $attributes
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'product_no' => 'required|string|max:100|unique:products,product_no,' . $request->id,
            'description' => 'nullable|string',
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.attribute_values' => ['required', 'array', 'min:1'],
            'variants.*.sku' => ['nullable', 'string', 'max:100', 'unique:variants,sku,' . ($request->variants[0]['id'] ?? 'NULL')],
        ]);

        DB::beginTransaction();
        try {
            $product = $request->id ? Product::find($request->id) : new Product();

            if ($request->id && !$product) {
                throw new \Exception("Product not found with ID: " . $request->id);
            }

            $product->name = $request->product_name;
            $product->product_no = $request->product_no;
            $product->category_id = $request->category_id;
            $product->description = $request->description;
            $product->save();

            \Log::info('Product saved:', ['id' => $product->id, 'name' => $product->name]);

            // Handle variants
            $existingVariantIds = $product->variants()->pluck('id')->toArray();
            $newVariantIds = [];

            foreach ($request->variants as $variantData) {
                if (empty($variantData['attribute_values'])) {
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
                }
            }

            // Delete removed variants
            $variantsToDelete = array_diff($existingVariantIds, $newVariantIds);
            if (!empty($variantsToDelete)) {
                Variant::whereIn('id', $variantsToDelete)->delete();
            }

            DB::commit();

            return redirect()->route('product.list')->with('success', "Product " . ($request->id ? 'updated' : 'created') . " successfully");

        } catch (\Exception $th) {
            DB::rollBack();
            \Log::error('Product update error: ' . $th->getMessage());
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
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
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
        }
    }
}