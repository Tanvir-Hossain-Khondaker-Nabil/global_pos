<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\DillerShip;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DealershipController extends Controller
{
        /**
         * Display a listing of the resource.
         */
        public function index()
        {
            //
        }

        /**
         * Show the form for creating a new resource.
         */
        public function create()
        {
            return Inertia::render('Dealerships/Create', [
                'companies' => Company::select('id', 'name')->get(),
            ]);
        }

        /**
         * Store a newly created resource in storage.
         */
        public function store(Request $request)
        {
            // Validate the request
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'name' => 'required|string|max:255',
                'owner_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'trade_license_no' => 'nullable|string|max:100',
                'tin_no' => 'nullable|string|max:100',
                'nid_no' => 'nullable|string|max:100',
                'advance_amount' => 'nullable|numeric|min:0',
                'due_amount' => 'nullable|numeric|min:0',
                'credit_limit' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:255',
                'contract_start' => 'nullable|date',
                'contract_end' => 'nullable|date|after_or_equal:contract_start',
                'status' => 'required|in:pending,approved,rejected,suspended',
                'remarks' => 'nullable|string',
                'total_sales' => 'nullable|numeric|min:0',
                'total_orders' => 'nullable|integer|min:0',
                'rating' => 'nullable|numeric|min:0|max:5',
                'last_order_date' => 'nullable|date',
                
                // File validations
                'agreement_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'bank_guarantee_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'trade_license_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'nid_doc' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'tax_clearance_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'contract_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            ]);

            DB::beginTransaction();

            try {
                // Handle file uploads
                $fileFields = [
                    'agreement_doc',
                    'bank_guarantee_doc', 
                    'trade_license_doc',
                    'nid_doc',
                    'tax_clearance_doc',
                    'contract_file'
                ];

                foreach ($fileFields as $field) {
                    if ($request->hasFile($field)) {
                        $file = $request->file($field);
                        $fileName = time() . '_' . $field . '.' . $file->getClientOriginalExtension();
                        $filePath = $file->storeAs('dealerships/documents', $fileName, 'public');
                        $validated[$field] = $filePath;
                    } else {
                        $validated[$field] = null;
                    }
                }

                // Set approved_by and approved_at if status is approved
                if ($validated['status'] === 'approved') {
                    $validated['approved_by'] = Auth::id();
                    $validated['approved_at'] = now();
                }

                // Set default values for performance metrics if not provided
                $validated['total_sales'] = $validated['total_sales'] ?? 0;
                $validated['total_orders'] = $validated['total_orders'] ?? 0;
                $validated['rating'] = $validated['rating'] ?? 0;
                $validated['advance_amount'] = $validated['advance_amount'] ?? 0;
                $validated['due_amount'] = $validated['due_amount'] ?? 0;
                $validated['credit_limit'] = $validated['credit_limit'] ?? 0;

                // Create the dealership
                $dealership = DillerShip::create($validated);

                DB::commit();

                return redirect()->route('dealerships.index')
                    ->with('success', 'Dealership created successfully!');

            } catch (\Exception $e) {
                DB::rollBack();
                
                // Clean up uploaded files if creation fails
                foreach ($fileFields as $field) {
                    if (isset($validated[$field]) && Storage::disk('public')->exists($validated[$field])) {
                        Storage::disk('public')->delete($validated[$field]);
                    }
                }

                return redirect()->back()
                    ->with('error', 'Failed to create dealership: ' . $e->getMessage())
                    ->withInput();
            }
        }



        // Alternative store method using FormData (for Inertia.js)
        public function storeInertia(Request $request)
        {
            // For Inertia.js, we need to handle the data differently
            $validated = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'name' => 'required|string|max:255',
                'owner_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'trade_license_no' => 'nullable|string|max:100',
                'tin_no' => 'nullable|string|max:100',
                'nid_no' => 'nullable|string|max:100',
                'advance_amount' => 'nullable|numeric|min:0',
                'due_amount' => 'nullable|numeric|min:0',
                'credit_limit' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|string|max:255',
                'contract_start' => 'nullable|date',
                'contract_end' => 'nullable|date|after_or_equal:contract_start',
                'status' => 'required|in:pending,approved,rejected,suspended',
                'remarks' => 'nullable|string',
                'total_sales' => 'nullable|numeric|min:0',
                'total_orders' => 'nullable|integer|min:0',
                'rating' => 'nullable|numeric|min:0|max:5',
                'last_order_date' => 'nullable|date',
                
                // File validations for Inertia
                'agreement_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'bank_guarantee_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'trade_license_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'nid_doc' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'tax_clearance_doc' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'contract_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            ]);

            DB::beginTransaction();

            try {
                $fileFields = [
                    'agreement_doc',
                    'bank_guarantee_doc', 
                    'trade_license_doc',
                    'nid_doc',
                    'tax_clearance_doc',
                    'contract_file'
                ];

                $dealershipData = $validated;

                foreach ($fileFields as $field) {
                    if ($request->hasFile($field)) {
                        $file = $request->file($field);
                        $fileName = time() . '_' . $field . '.' . $file->getClientOriginalExtension();
                        $filePath = $file->storeAs('dealerships/documents', $fileName, 'public');
                        $dealershipData[$field] = $filePath;
                    } else {
                        unset($dealershipData[$field]);
                    }
                }

                // Set approved data if status is approved
                if ($dealershipData['status'] === 'approved') {
                    $dealershipData['approved_by'] = Auth::id();
                    $dealershipData['approved_at'] = now();
                }

                // Set default values
                $defaults = [
                    'total_sales' => 0,
                    'total_orders' => 0,
                    'rating' => 0,
                    'advance_amount' => 0,
                    'due_amount' => 0,
                    'credit_limit' => 0,
                ];

                foreach ($defaults as $key => $value) {
                    $dealershipData[$key] = $dealershipData[$key] ?? $value;
                }

                $dealership = DillerShip::create($dealershipData);

                DB::commit();
 
                return redirect()->route('dealerships.index')
                    ->with('success', 'Dealership created successfully!');

            } catch (\Exception $e) {
                DB::rollBack();
                
                // Clean up uploaded files
                foreach ($fileFields as $field) {
                    if (isset($dealershipData[$field]) && Storage::disk('public')->exists($dealershipData[$field])) {
                        Storage::disk('public')->delete($dealershipData[$field]);
                    }
                }

                return redirect()->back()
                    ->with('error', 'Failed to create dealership: ' . $e->getMessage())
                    ->withInput();
            }
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
