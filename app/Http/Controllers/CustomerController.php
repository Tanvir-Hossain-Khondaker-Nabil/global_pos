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
        $query = Customer::query()
            ->with(['sales' => function($query) {
                $query->select('id', 'customer_id', 'due_amount');
            }])
            ->latest();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        return Inertia::render("Customers", [
            'filters' => $request->only('search'),
            'customers' => $query->paginate(10)
                ->withQueryString()
                ->through(fn($customer) => [
                    'id' => $customer->id,
                    'customer_name' => $customer->customer_name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'address' => $customer->address,
                    'is_active' => (bool) $customer->is_active,
                    'advance_amount' => (float) $customer->advance_amount,
                    'due_amount' => (float) $customer->due_amount,
                    'sales' => $customer->sales,
                    'created_at' => $customer->created_at->format('D M, Y h:i A'),
                ]),
        ]);
    }

    // store
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        try {
            Customer::create([
                'customer_name' => $request->customer_name,
                'phone' => $request->phone,
                'address' => $request->address,
                'advance_amount' => $request->advance_amount ?? 0,
                'due_amount' => $request->due_amount ?? 0,
                'is_active' => $request->is_active ?? true,
            ]);

            return redirect()->back()->with('success', 'New customer added successfully');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error: ' . $th->getMessage());
        }
    }

 

    // delete customer
    public function del($id)
    {
        try {
            $customer = Customer::findOrFail($id);
            
            // Check if customer has any sales before deleting
            if ($customer->sales()->exists()) {
                return redirect()->back()->with('error', 'Cannot delete customer with existing sales records.');
            }
            
            $customer->delete();
            return redirect()->back()->with('success', "Customer deleted successfully");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error: ' . $th->getMessage());
        }
    }

    // edit
    public function edit($id)
    {
        try {
            $customer = Customer::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $customer->id,
                    'customer_name' => $customer->customer_name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'address' => $customer->address,
                    'advance_amount' => $customer->advance_amount,
                    'due_amount' => $customer->due_amount,
                    'is_active' => $customer->is_active,
                ]
            ]);
        } catch (\Exception $th) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }
    }


    // update
    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        try {
            $customer = Customer::findOrFail($id);
            
            $customer->update([
                'customer_name' => $request->customer_name,
                'phone' => $request->phone,
                'address' => $request->address,
                'advance_amount' => $request->advance_amount ?? $customer->advance_amount,
                'due_amount' => $request->due_amount ?? $customer->due_amount,
                'is_active' => $request->has('is_active') ? $request->is_active : $customer->is_active,
            ]);

            return redirect()->back()->with('success', 'Customer updated successfully');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error: ' . $th->getMessage());
        }
    }


    // show
    public function show($id)
    {
        // You can implement a detailed view if needed
        return redirect()->route('customer.index');
    }
}