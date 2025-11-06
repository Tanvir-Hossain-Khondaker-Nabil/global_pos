<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SectorController extends Controller
{
    // category views ===============
    public function category_view(Request $request)
    {
        return Inertia::render("product/Category", [
            'filters' => $request->only('search'),
            'category' => Category::latest()
                ->with('products.sizes.colors')
                ->filter($request->only('search'))
                ->paginate(10)
                ->withQueryString()
                ->through(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'total_stock' => $user->products
                        ->flatMap(fn($product) => $product->sizes)
                        ->flatMap(fn($size) => $size->colors)
                        ->sum('stock'),
                    'join_at' => $user->created_at->format('D M, Y'),
                ]),
        ]);
    }

    public function category_store(Request $request)
    {
        $request->validate([
            'name' => 'required'
        ]);

        try {
            $q = $request->id ? Category::find($request->id) : new Category();
            $q->name = $request->name;
            $q->save();

            return redirect()->back()->with('success', $request->id ? 'Category updated success' : 'New category added success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "Server error, try again!");
        }
    }

    public function category_edit($id)
    {
        try {
            $q = Category::find($id);

            if (!$q) {
                return redirect()->back()->with('error', "invalid request");
            }

            return response()->json(['data' => $q]);
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }

    public function category_del($id)
    {
        try {
            Category::find($id)->delete();
            return redirect()->back()->with("success", "One category deleted success.");
        } catch (\Exception $th) {
            return redirect()->back()->with("error", "Server error try again.");
        }
    }
}
