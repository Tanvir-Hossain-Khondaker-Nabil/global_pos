<?php

namespace App\Http\Controllers;

use App\Http\Requests\DelerShipStore;
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
        public function store(DelerShipStore $request)
        {
            $validated = $request->validated();

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
                if ($validated['status'] == 'approved') {
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

                return to_route('dealerships.index')
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
