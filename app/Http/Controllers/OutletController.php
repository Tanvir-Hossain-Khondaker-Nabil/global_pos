<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth ;

class OutletController extends Controller
{

    // index function will be here
    public function index(Request $request)
    {
        $outlets = Outlet::where('user_id',Auth::id())
        ->when($request->search, fn($query) =>
            $query->search($request->search)
        )
        ->when($request->status, fn($query) =>
            $query->where('is_active', $request->status == 'active' ? true : false)
        )
        ->get();


        return inertia('Outlet/Index', [
            'outlets' => $outlets
        ]);
    }


    // store function will be here

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'address' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        // Merge the authenticated user ID
        $outlet = Outlet::create(array_merge($validated, [
            'user_id' => Auth::id(),
            'code' => strtoupper(uniqid('OUT-')),
            'is_main' => false,
            'currency' => 'BDT',
            'timezone' => 'Asia/Dhaka',
        ]));

        return to_route('outlets.show', $outlet)
                        ->with('success', 'Outlet created successfully!');
    }



    // update function will be here

    public function update(Request $request, $id)
    {
        $outlet = Outlet::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'address' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $outlet->update($validated);

        return to_route('outlets.show', $outlet)
                        ->with('success', 'Outlet updated successfully!');
    }


    // show function will be here
    public function show($id)
    {
        $outlet = Outlet::findOrFail($id);
        return inertia('Outlet/Show', [
            'outlet' => $outlet
        ]);
    }


    // destroy function will be here

    public function destroy($id)
    {
        $outlet = Outlet::findOrFail($id);

        // Check if the outlet can be deleted
        // if (!$outlet->canBeDeleted()) {
        //     return to_route('outlets.index')
        //                 ->with('error', 'Main outlet cannot be deleted.');
        // }

        $outlet->delete();

        return to_route('outlets.index')
                        ->with('success', 'Outlet deleted successfully!');
    }

}
