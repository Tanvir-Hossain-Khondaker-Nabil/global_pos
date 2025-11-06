<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Variant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    // index
    public function index(Request $request)
    {
        return Inertia::render("product/Product", [
            'filters' => $request->only('search'),
            'product' => Product::latest()
                ->with(['category', 'sizes.colors'])
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
            $update = Product::with(['sizes.colors'])->find($querystring);
        }

        return Inertia::render('product/AddProduct', [
            'category' => Category::pluck('id', 'name')->toArray(),
            'update' => $update
        ]);
    }

    // update or create product
    public function update(Request $request)
    {
        // dd($request->sizes);
        $request->validate([
            'product_name' => 'required',
            'category' => 'required',
            'product_code' => 'required',
            'gross_price' => 'required',
            'discount' => 'nullable|between:0,100',
            'sizes' => ['required', 'array', 'min:1'],
            'sizes.*.size' => ['required', 'string'],
            'sizes.*.colors' => ['required', 'array', 'min:1'],
            'sizes.*.colors.*' => ['required'],
        ]);

        try {
            $product = $request->id ? Product::find($request->id) : new Product();
            $product->name = $request->product_name;
            $product->product_no = $request->product_code;
            $product->category_id = $request->category;
            $product->gross_price = $request->gross_price;
            $product->discount = $request->discount;
            $productStatus = $product->save();

            if ($productStatus) {
                // === Collect all existing variant IDs for this product ===
                $existingSizeIds = Variant::where('product_id', $product->id)
                    ->whereNull('parent_id')
                    ->pluck('id')
                    ->toArray();

                $newSizeIds = [];

                foreach ($request->sizes as $item) {
                    // === Check if size exists or not ===
                    if (!empty($item['id'])) {
                        $size = Variant::find($item['id']);
                        if ($size) {
                            $size->name = $item['size'];
                            $size->save();
                        }
                    } else {
                        $size = new Variant();
                        $size->product_id = $product->id;
                        $size->name = $item['size'];
                        $size->save();
                    }

                    $newSizeIds[] = $size->id;

                    // === Handle Colors for this Size ===
                    $existingColorIds = Variant::where('parent_id', $size->id)->pluck('id')->toArray();
                    $newColorIds = [];

                    foreach ($item['colors'] as $citem) {
                        if (!empty($citem['id'])) {
                            $color = Variant::find($citem['id']);
                            if ($color) {
                                $color->name = $citem['name'];
                                $color->stock = $citem['stock'];
                                $color->save();
                            }
                        } else {
                            $color = new Variant();
                            $color->product_id = $product->id;
                            $color->name = $citem['name'];
                            $color->stock = $citem['stock'];
                            $color->parent_id = $size->id;
                            $color->save();
                        }
                        $newColorIds[] = $color->id;
                    }

                    // === Delete removed colors ===
                    $colorsToDelete = array_diff($existingColorIds, $newColorIds);
                    if (!empty($colorsToDelete)) {
                        Variant::whereIn('id', $colorsToDelete)->delete();
                    }
                }

                // === Delete removed sizes ===
                $sizesToDelete = array_diff($existingSizeIds, $newSizeIds);
                if (!empty($sizesToDelete)) {
                    // Delete child colors first
                    Variant::whereIn('parent_id', $sizesToDelete)->delete();
                    // Then delete sizes
                    Variant::whereIn('id', $sizesToDelete)->delete();
                }
            }

            return redirect()->route('product.list')->with('success', "Product Store success");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }

    // destroy
    public function del($id)
    {
        try {
            Product::find($id)->delete();

            return redirect()->back()->with('success', "One product deleted success");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }
}
