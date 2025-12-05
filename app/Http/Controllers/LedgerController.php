<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->type;

        if($type == 'customer'){
            $customer = Customer::active()->get();
            return view('ledgers.customer_ledger', compact('customer'));
        } elseif($type == 'supplier'){
            //show supplier ledger view
            $supplier = Supplier::active()->get(); 
            return view('ledgers.supplier_ledger', compact('supplier'));
        } else {
            $customer = Customer::active()->get();
            $supplier = Supplier::active()->get(); 

            $ledgerData = array_merge($customer, $supplier);
            dd( $ledgerData);
            return view('ledgers.index', compact('ledgerData'));
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
