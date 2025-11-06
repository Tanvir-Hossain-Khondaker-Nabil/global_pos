<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    // index
    public function index(Request $request)
    {
        return Inertia::render("product/Product", [
            'filters' => $request->only('search'),
            'product' => Product::latest()
                ->with(['category', 'variants'])
                ->filter($request->only('search'))
                ->paginate(10)
                ->withQueryString()
        ]);
    }

    // add view
    public function add_index(Request $request)
    {
        $querystring = $request->only('id');
        $update = null;
        if ($querystring) {
            $update = Product::with(['variants'])->find($querystring['id']);
        }


        return Inertia::render('product/AddProduct', [
            'category' => Category::pluck('name', 'id'),
            'update' => $update
        ]);
    }

    // view product details
    public function view($id)
    {
        $product = Product::with(['category', 'variants'])->findOrFail($id);
        
        return Inertia::render('product/ViewProduct', [
            'product' => $product
        ]);
    }

    // update or create product
    public function update(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category' => 'required|exists:categories,id',
            'product_code' => 'required|string|max:100|unique:products,product_no,' . $request->id,
            'description' => 'nullable|string',
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.size' => ['nullable', 'string', 'max:50'],
            'variants.*.color' => ['nullable', 'string', 'max:50'],
        ]);

        DB::beginTransaction();
        try {
            // Create or update product
            $product = $request->id ? Product::find($request->id) : new Product();
            $product->name = $request->product_name;
            $product->product_no = $request->product_code;
            $product->category_id = $request->category;
            $product->description = $request->description;
            $product->save();

            // Handle variants
            $existingVariantIds = $product->variants()->pluck('id')->toArray();
            $newVariantIds = [];

            foreach ($request->variants as $variantData) {
                // Skip if both size and color are empty
                if (empty($variantData['size']) && empty($variantData['color'])) {
                    continue;
                }

                // Check if variant exists
                if (!empty($variantData['id'])) {
                    $variant = Variant::where('id', $variantData['id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if ($variant) {
                        $variant->update([
                            'size' => $variantData['size'] ?: null,
                            'color' => $variantData['color'] ?: null,
                        ]);
                    } else {
                        $variant = Variant::create([
                            'product_id' => $product->id,
                            'size' => $variantData['size'] ?: null,
                            'color' => $variantData['color'] ?: null,
                        ]);
                    }
                } else {
                    $variant = Variant::create([
                        'product_id' => $product->id,
                        'size' => $variantData['size'] ?: null,
                        'color' => $variantData['color'] ?: null,
                    ]);
                }

                $newVariantIds[] = $variant->id;
            }

            // Delete removed variants
            $variantsToDelete = array_diff($existingVariantIds, $newVariantIds);
            if (!empty($variantsToDelete)) {
                Variant::whereIn('id', $variantsToDelete)->delete();
            }

            DB::commit();

            return redirect()->route('product.list')->with('success', "Product saved successfully");
        } catch (\Exception $th) {
            DB::rollBack();
            return redirect()->back()->with('error', "Server error: " . $th->getMessage());
        }
    }

    // destroy
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