<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierStore;
use App\Models\Payment;
use App\Models\Supplier;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Account;

class SupplierController extends Controller
{
    // Display supplier list
    public function index(Request $request)
    {
        $filters = $request->only('search');

        $suppliers = Supplier::with('purchases')->when($filters['search'] ?? null, function ($query, $search) {
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
            'accounts' => Account::where('is_active',true)->get(),
        ]);
    }



    // Store new supplier
    public function store(SupplierStore $request)
    {

        $validated = $request->validated();

        // Set default values for numeric fields
        $validated['advance_amount'] = $validated['advance_amount'] ?? 0;
        $validated['due_amount'] = $validated['due_amount'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['created_by'] = Auth::id();
        $account = Account::find($request->input('account_id'));


        if($request->advance_amount > $account->current_balance) {
            return redirect()->back()->with(['error' => 'Insufficient account balance for advance payment.']);
        }

        $supplier =  Supplier::create($validated);

        if ($account) {
            $account->updateBalance($request->advance_amount,'withdraw');
            if ($request->advance_amount && $request->advance_amount > 0) {
                Payment::create([
                    'supplier_id'    => $supplier->id ?? null,
                    'amount'         => -$request->advance_amount ?? 0,
                    'shadow_amount'  => 0,
                    'payment_method' => $account->type ?? 'Cash',
                    'txn_ref'        => $request->input('transaction_id') ?? ('nexoryn-' . Str::random(10)),
                    'note'           =>'Initial advance amount payment of supplier',
                    'status'         => 'completed',
                    'paid_at'        => Carbon::now(),
                    'created_by'     => Auth::id()
                ]);
            } 
        }


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


    public function show($id)
    {
        $supplier = Supplier::with([
            'purchases' => function ($query) {
                $query->with([
                    'items.product',
                    'creator' => function ($q) {
                        $q->select('id', 'name', 'email');
                    }
                ])->latest();
            },
            'creator' => function ($query) {
                $query->select('id', 'name');
            }
        ])->findOrFail($id);

        $totalPurchases = $supplier->purchases->count();
        $totalAmount = $supplier->purchases->sum('grand_total');
        $totalPaid = $supplier->purchases->sum('paid_amount');
        $totalDue = $supplier->purchases->sum('due_amount');

        return Inertia::render('Supplier/Show', [
            'supplier' => $supplier,
            'stats' => [
                'total_purchases' => $totalPurchases,
                'total_amount' => $totalAmount,
                'total_paid' => $totalPaid,
                'total_due' => $totalDue,
                'advance_amount' => $supplier->advance_amount,
                'current_due' => $supplier->due_amount,
                'payment_ratio' => $totalAmount > 0 ? ($totalPaid / $totalAmount) * 100 : 0,
            ],
            'breadcrumbs' => [
                ['name' => 'Suppliers', 'link' => route('supplier.view')],
                ['name' => $supplier->name, 'link' => '#'],
            ]
        ]);
    }
}
