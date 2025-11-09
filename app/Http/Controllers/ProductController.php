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
                ->with(['category', 'variants.stock'])
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
        // Debug: Check what data is coming
        \Log::info('Update request data:', $request->all());

        // FIXED: Use correct field names that match the request data
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id', // Changed from 'category' to 'category_id'
            'product_no' => 'required|string|max:100|unique:products,product_no,' . $request->id, // Changed from 'product_code' to 'product_no'
            'description' => 'nullable|string',
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.size' => ['nullable', 'string', 'max:50'],
            'variants.*.color' => ['nullable', 'string', 'max:50'],
        ]);

        DB::beginTransaction();
        try {
            // Find or create product
            $product = $request->id ? Product::find($request->id) : new Product();

            if (!$product && $request->id) {
                throw new \Exception("Product not found with ID: " . $request->id);
            }

            // Update product details with correct field names
            $product->name = $request->product_name; // This matches the request
            $product->product_no = $request->product_no; // Changed from product_code
            $product->category_id = $request->category_id; // Changed from category
            $product->description = $request->description;
            $product->save();

            \Log::info('Product saved:', ['id' => $product->id, 'name' => $product->name]);

            // Handle variants
            $existingVariantIds = $product->variants()->pluck('id')->toArray();
            $newVariantIds = [];

            foreach ($request->variants as $variantData) {
                // Skip if both size and color are empty
                if (empty($variantData['size']) && empty($variantData['color'])) {
                    continue;
                }

                // Check if variant exists (for update)
                if (!empty($variantData['id'])) {
                    $variant = Variant::where('id', $variantData['id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if ($variant) {
                        // Update existing variant
                        $variant->update([
                            'size' => $variantData['size'] ?: null,
                            'color' => $variantData['color'] ?: null,
                        ]);
                        $newVariantIds[] = $variant->id;
                        \Log::info('Updated variant:', ['id' => $variant->id]);
                    } else {
                        // Create new variant if ID doesn't match
                        $variant = Variant::create([
                            'product_id' => $product->id,
                            'size' => $variantData['size'] ?: null,
                            'color' => $variantData['color'] ?: null,
                        ]);
                        $newVariantIds[] = $variant->id;
                        \Log::info('Created new variant with provided ID:', ['id' => $variant->id]);
                    }
                } else {
                    // Create new variant
                    $variant = Variant::create([
                        'product_id' => $product->id,
                        'size' => $variantData['size'] ?: null,
                        'color' => $variantData['color'] ?: null,
                    ]);
                    $newVariantIds[] = $variant->id;
                    \Log::info('Created new variant:', ['id' => $variant->id]);
                }
            }

            \Log::info('Variant IDs after processing:', [
                'existing' => $existingVariantIds,
                'new' => $newVariantIds
            ]);

            // Delete removed variants
            $variantsToDelete = array_diff($existingVariantIds, $newVariantIds);
            if (!empty($variantsToDelete)) {
                Variant::whereIn('id', $variantsToDelete)->delete();
                \Log::info('Deleted variants:', $variantsToDelete);
            }

            DB::commit();

            \Log::info('Product update completed successfully');

            return redirect()->route('product.list')->with('success', "Product " . ($request->id ? 'updated' : 'created') . " successfully");

        } catch (\Exception $th) {
            DB::rollBack();
            \Log::error('Product update error: ' . $th->getMessage());
            \Log::error('Stack trace: ' . $th->getTraceAsString());
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