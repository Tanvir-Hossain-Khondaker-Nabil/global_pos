<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OutletController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    // OutletController.php - index method
    public function index(Request $request)
    {
        $outlets = Outlet::with('user')
            ->orderByDesc('is_main')
            ->orderBy('name')
            ->when($request->filled('status') && in_array($request->status, ['active', 'inactive']), function ($query) use ($request) {
                $query->where('is_active', $request->status === 'active');
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhereHas(
                            'user',
                            fn($userQuery) =>
                            $userQuery->where('name', 'like', "%{$search}%")
                        );
                });
            })
            ->paginate(20)
            ->withQueryString();

        // FIX: Change 'filter' to 'filters' to match React component
        $filters = [
            'search' => $request->search,
            'status' => $request->status,
        ];

        return Inertia::render('Outlet/Index', [
            'outlets' => $outlets,
            'filters' => $filters, // Changed from 'filter'
        ]);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'nullable|exists:users,id',
                'name' => 'required|string|max:255',
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('outlets')->whereNull('deleted_at')
                ],
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'currency' => 'required|string|max:10',
                'timezone' => 'required|string|max:50',
                'is_active' => 'boolean',
                'is_main' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if there's already a main outlet
            if ($request->is_main) {
                Outlet::where('is_main', true)->update(['is_main' => false]);
            }

            $outlet = Outlet::create($validator->validated());

            if (Outlet::count() == 1 && !$outlet->is_main) {
                $outlet->update(['is_main' => true]);
            }

            DB::commit();

            return to_route('outlets.index')->with('success', 'Outlet created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create outlet.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $outlet = Outlet::with('user:id,name,email')->find($id);

            if (!$outlet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Outlet not found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $outlet,
                'message' => 'Outlet retrieved successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve outlet.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $outlet = Outlet::find($id);

            if (!$outlet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Outlet not found.'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'user_id' => 'nullable|exists:users,id',
                'name' => 'sometimes|required|string|max:255',
                'code' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('outlets')->ignore($outlet->id)->whereNull('deleted_at')
                ],
                'phone' => 'sometimes|nullable|string|max:20',
                'email' => 'sometimes|nullable|email|max:255',
                'address' => 'sometimes|nullable|string|max:500',
                'currency' => 'sometimes|required|string|max:10',
                'timezone' => 'sometimes|required|string|max:50',
                'is_active' => 'sometimes|boolean',
                'is_main' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle main outlet change
            if ($request->has('is_main') && $request->is_main && !$outlet->is_main) {
                Outlet::where('is_main', true)->update(['is_main' => false]);
            }

            $outlet->update($validator->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $outlet->load('user:id,name,email'),
                'message' => 'Outlet updated successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update outlet.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $outlet = Outlet::find($id);

            if (!$outlet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Outlet not found.'
                ], 404);
            }

            // Prevent deletion of main outlet
            if ($outlet->is_main) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the main outlet. Please set another outlet as main first.'
                ], 422);
            }

            $outlet->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Outlet deleted successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete outlet.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle outlet status (active/inactive).
     */
    public function toggleStatus($id)
    {
        try {
            $outlet = Outlet::find($id);

            if (!$outlet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Outlet not found.'
                ], 404);
            }

            // Prevent deactivating main outlet
            if ($outlet->is_main && $outlet->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot deactivate the main outlet.'
                ], 422);
            }

            $outlet->update(['is_active' => !$outlet->is_active]);

            return response()->json([
                'success' => true,
                'data' => $outlet,
                'message' => 'Outlet status updated successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle outlet status.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set outlet as main.
     */
    public function setAsMain($id)
    {
        DB::beginTransaction();
        try {
            $outlet = Outlet::find($id);

            if (!$outlet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Outlet not found.'
                ], 404);
            }

            // Check if outlet is active
            if (!$outlet->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot set an inactive outlet as main.'
                ], 422);
            }

            // Set all outlets as non-main
            Outlet::where('is_main', true)->update(['is_main' => false]);

            // Set selected outlet as main
            $outlet->update(['is_main' => true]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $outlet,
                'message' => 'Outlet set as main successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to set outlet as main.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all active outlets.
     */
    public function activeOutlets()
    {
        try {
            $outlets = Outlet::with('user:id,name,email')
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $outlets,
                'message' => 'Active outlets retrieved successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active outlets.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get main outlet.
     */
    public function getMainOutlet()
    {
        try {
            $mainOutlet = Outlet::with('user:id,name,email')
                ->where('is_main', true)
                ->where('is_active', true)
                ->first();

            if (!$mainOutlet) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active main outlet found.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $mainOutlet,
                'message' => 'Main outlet retrieved successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve main outlet.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique outlet code.
     */
    public function generateCode(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $name = $request->name;

            // Generate code from name (first 3 letters uppercase)
            $baseCode = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 3));

            // If less than 3 letters, pad with X
            if (strlen($baseCode) < 3) {
                $baseCode = str_pad($baseCode, 3, 'X');
            }

            $code = $baseCode;
            $counter = 1;

            // Check if code exists and append number if needed
            while (Outlet::where('code', $code)->exists()) {
                $code = $baseCode . str_pad($counter, 2, '0', STR_PAD_LEFT);
                $counter++;
            }

            return response()->json([
                'success' => true,
                'data' => ['code' => $code],
                'message' => 'Outlet code generated successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate outlet code.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update outlet status.
     */
    public function bulkUpdateStatus(Request $request)
    {
        DB::beginTransaction();
        try {
            $validator = Validator::make($request->all(), [
                'outlet_ids' => 'required|array',
                'outlet_ids.*' => 'exists:outlets,id',
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $outletIds = $request->outlet_ids;
            $isActive = $request->is_active;

            // Check if trying to deactivate main outlet
            if (!$isActive) {
                $mainOutlet = Outlet::where('is_main', true)
                    ->whereIn('id', $outletIds)
                    ->first();

                if ($mainOutlet) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot deactivate main outlet.'
                    ], 422);
                }
            }

            Outlet::whereIn('id', $outletIds)->update(['is_active' => $isActive]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Outlet status updated successfully.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update outlet status.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
