<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    // index
    public function index(Request $request)
    {
        return Inertia::render("Customers", [
            'filters' => $request->only('search'),
            'customers' => Customer::latest()
                ->filter($request->only('search'))
                ->paginate(10)
                ->withQueryString()
                ->through(fn($user) => [
                    'id' => $user->id,
                    'customer_name' => $user->customer_name,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'join_at' => $user->created_at->format('D M, Y'),
                ]),
        ]);
    }

    // store
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required',
            'phone' => 'required|min:11',
            'address' => 'nullable|min:2'
        ]);

        try {
            $q = $request->id ? Customer::find($request->id) : new Customer();
            $q->customer_name = $request->customer_name;
            $q->phone = $request->phone;
            $q->address = $request->address;
            $q->save();

            return redirect()->back()->with('success', $request->id ? 'Customer info updated success' : 'New customer added success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }

    // delete custoemr
    public function del($id)
    {
        try {
            Customer::find($id)->delete();
            return redirect()->back()->with('success', "One customer deleted success");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again.');
        }
    }

    // edit
    public function edit($id)
    {
        try {
            $customer = Customer::find($id);
            if (!$customer) {
                return redirect()->back()->with('error', 'Invalid request');
            }
            return response()->json(['data' => $customer]);
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }
}
