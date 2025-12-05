<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    // Display supplier list
    public function index(Request $request)
    {
        $filters = $request->only('search');

        $suppliers = Supplier::when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        })
        ->withCount('purchases')
        ->latest()
        ->paginate(10)
        ->withQueryString();

        return Inertia::render('Supplier/Index', [
            'suppliers' => $suppliers,
            'filters' => $filters,
        ]);
    }

    // Store new supplier
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Set default values for numeric fields
        $validated['advance_amount'] = $validated['advance_amount'] ?? 0;
        $validated['due_amount'] = $validated['due_amount'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['created_by'] = Auth::id(); 


        Supplier::create($validated);

        return redirect()->back()->with('success', 'Supplier contact added successfully!');
    }

    // Edit supplier - return data for form
    public function edit($id)
    {
        $supplier = Supplier::findOrFail($id);

        return response()->json([
            'data' => $supplier
        ]);
    }

    // Update supplier
    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'company' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url',
            'advance_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Set default values for numeric fields if not provided
        $validated['advance_amount'] = $validated['advance_amount'] ?? 0;
        $validated['due_amount'] = $validated['due_amount'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $supplier->update($validated);

        return redirect()->back()->with('success', 'Supplier contact updated successfully!');
    }

    // Delete supplier
    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        
        if ($supplier->purchases()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete supplier with existing purchases!');
        }

        $supplier->delete();

        return redirect()->back()->with('success', 'Supplier contact deleted successfully!');
    }
}