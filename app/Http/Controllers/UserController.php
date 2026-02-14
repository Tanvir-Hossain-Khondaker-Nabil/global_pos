<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Resolve "owner" user for subscription checking.
     * If staff logged in (parent_id exists), owner = parent. else owner = self.
     */
    private function ownerUser(): ?User
    {
        $auth = Auth::user();
        if (!$auth)
            return null;

        return $auth->parent_id ? User::find($auth->parent_id) : $auth;
    }

    /**
     * Does current owner's subscription valid?
     */
    private function hasOwnerSubscription(): bool
    {
        $owner = $this->ownerUser();
        return $owner?->hasValidSubscription() ?? false;
    }

    /**
     * Display a listing of the resource.
     * - If no subscription: show only users created by current user (created_by = auth id)
     * - If subscription: show all users except Super Admin and current user
     */
    public function index(Request $request)
    {
        $auth = Auth::user();
        $hasSubscription = $this->hasOwnerSubscription();

        $query = User::query()
            ->with(['roles', 'business'])
            ->where('created_by', Auth::id())
            ->latest();

        // Always exclude Super Admin from list (safe)
        $query->whereDoesntHave('roles', fn($q) => $q->where('name', 'Super Admin'));

        // Condition: subscription
        if (!$hasSubscription) {
            $query->where('created_by', $auth->id);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $role = $request->role;
            $query->whereHas('roles', fn($q) => $q->where('name', $role));
        }

        // Roles for dropdown
        $allRoles = Role::where('name', '!=', 'Super Admin')->pluck('name');

        // Statistics (same condition applied)
        $statsQuery = User::query()->whereDoesntHave('roles', fn($q) => $q->where('name', 'Super Admin'));
        if (!$hasSubscription) {
            $statsQuery->where('created_by', $auth->id);
        }

        $totalUsers = (clone $statsQuery)->count();
        $adminsCount = (clone $statsQuery)->whereHas('roles', fn($q) => $q->where('name', 'admin'))->count();
        $sellersCount = Role::where('name', 'seller')->exists()
            ? (clone $statsQuery)->whereHas('roles', fn($q) => $q->where('name', 'seller'))->count()
            : 0;

        return Inertia::render('Users/Index', [
            'filters' => $request->only(['search', 'role']),
            'users' => $query->paginate(10)->withQueryString()
                ->through(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->profile,
                    'roles' => $user->roles->pluck('name'),
                    'address' => $user->address,
                    'type' => $user->type,
                    'join_at' => $user->created_at->format('d M Y'),
                    'last_login' => $user->last_login_at?->format('d M Y H:i'),
                ]),
            'roles' => $allRoles,
            'statistics' => [
                'total_users' => $totalUsers,
                'admins_count' => $adminsCount,
                'sellers_count' => $sellersCount,
                'active_users' => $totalUsers,
            ],
            'hasSubscription' => $hasSubscription,
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        $user = User::findOrFail(Auth::id());

        $activeSubsQuery = $user->subscriptions()
            ->where('status', 1)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());

        $activeSub = (clone $activeSubsQuery)->latest('end_date')->first();
        $outlet_exist = !is_null($activeSub);

        // dd($activeSub, $outlet_exist);

        return Inertia::render('Users/Create', [
            'outlets' => Outlet::where('created_by', Auth::id())
                ->select('id', 'name', 'code')
                ->latest()
                ->get(),
            'user' => null,
            'roles' => Role::where('name', '!=', 'Super Admin')->pluck('name'),
            'isEdit' => false,
            'outlet_exist' => $outlet_exist,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     * - If subscription: create staff bound to owner + current outlet + type general
     * - If no subscription: create simple user with created_by = auth id
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
        ]);

        $auth = Auth::user();
        $hasSubscription = $this->hasOwnerSubscription();

        DB::beginTransaction();
        try {
            if ($hasSubscription) {
                // For subscription users, outlet is required when creating new staff
                $request->validate([
                    'outlet_id' => 'required|exists:outlets,id'
                ]);

                $requestedOutlet = $request->outlet_id;

                // Check if user has permission to this outlet
                $outlet = Outlet::where('user_id', $auth->id)
                    ->where('id', $requestedOutlet)
                    ->first();

                if (!$outlet) {
                    DB::rollBack();
                    return back()->with('error', 'Outlet not found or you do not have permission to use this outlet.')->withInput();
                }

                // If creator is not logged into this outlet, log them in
                if ($auth->current_outlet_id != $requestedOutlet) {
                    $auth->update([
                        'current_outlet_id' => $outlet->id,
                        'outlet_logged_in_at' => now(),
                    ]);

                    // Refresh auth user
                    Auth::setUser($auth->fresh());
                }

                $ownerId = method_exists($auth, 'ownerId')
                    ? $auth->ownerId()
                    : ($auth->parent_id ?? $auth->id);

                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'address' => $request->address,
                    'password' => Hash::make($request->password),
                    'created_by' => $auth->id,

                    // ✅ staff binds to owner + outlet
                    'parent_id' => $ownerId,
                    'current_outlet_id' => $requestedOutlet,
                    'type' => 'general',
                ]);
            } else {
                // No subscription - simple user creation (outlet is optional)
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'address' => $request->address,
                    'created_by' => $auth->id,
                    'password' => Hash::make($request->password),
                    'current_outlet_id' => $request->outlet_id, // Optional for non-subscription
                ]);
            }

            $user->syncRoles($request->roles);

            DB::commit();
            return redirect()->route('userlist.view')->with('success', 'User created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User creation failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to create user: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $user = User::with('roles')->findOrFail($id);

            // Prevent editing super admin users
            if ($user->hasRole('Super Admin') && !Auth::user()->hasRole('Super Admin')) {
                return redirect()->route('userlist.view')
                    ->with('error', 'Cannot edit Super Admin user.');
            }

            return Inertia::render('Users/Create', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'roles' => $user->roles->pluck('name'),
                ],
                'roles' => Role::where('name', '!=', 'Super Admin')->pluck('name'),
                'isEdit' => true,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('userlist.view')
                ->with('error', 'User not found.');
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent updating super admin users
        if ($user->hasRole('Super Admin') && !Auth::user()->hasRole('Super Admin')) {
            return redirect()->route('userlist.view')
                ->with('error', 'Cannot update Super Admin user.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
        ]);

        DB::beginTransaction();
        try {
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);
            $user->syncRoles($request->roles);

            DB::commit();
            return redirect()->route('userlist.view')->with('success', 'User updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update user: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function delete($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deleting self
            if ($user->id === Auth::id()) {
                return redirect()->route('userlist.view')
                    ->with('error', 'You cannot delete your own account.');
            }

            // Prevent deleting super admin users
            if ($user->hasRole('Super Admin')) {
                return redirect()->route('userlist.view')
                    ->with('error', 'Cannot delete Super Admin user.');
            }

            $user->delete();

            return redirect()->route('userlist.view')
                ->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->route('userlist.view')
                ->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Toggle user active status (placeholder - implement your own column/logic).
     */
    public function toggleStatus($id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent toggling self
            if ($user->id === Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot deactivate your own account.'
                ], 403);
            }

            // যদি আপনার users টেবিলে status/is_active ফিল্ড থাকে,
            // তাহলে এখানে toggle করে save করবেন।

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status.'
            ], 500);
        }
    }

    /**
     * Toggle user type between shadow and general
     */
    public function toggleUserType(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->back()->with('error', 'User not authenticated');
        }

        $newType = $user->type === 'shadow' ? 'general' : 'shadow';

        try {
            $user->type = $newType;
            $user->save();

            Auth::setUser($user->fresh());

            return redirect()->back()->with('success', "Switched to {$newType} mode");
        } catch (\Exception $e) {
            Log::error("Error updating user type: " . $e->getMessage(), [
                'user_id' => $user->id,
                'new_type' => $newType
            ]);

            return redirect()->back()->with('error', 'Failed to switch mode: ' . $e->getMessage());
        }
    }
}
