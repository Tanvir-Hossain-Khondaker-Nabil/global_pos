<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // index
    public function index(Request $request)
    {
        return Inertia::render("UserList", [
            'filters' => $request->only('search'),
            'users' => User::orderBy('role')
                ->with('business')
                ->filter($request->only('search'))
                ->paginate(10)
                ->withQueryString()
                ->through(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->profile,
                    'role' => $user->role,
                    'address' => $user->address,
                    'join_at' => $user->created_at,
                ]),
        ]);
    }

    // add/update new user
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email,' . $request->id,
            'phone' => 'nullable|min:11',
            'password' => $request->id ? 'nullable' : 'required' . '|min:6',
            'address' => 'nullable|min:2',
            'role' => 'required|in:admin,saller'
        ]);

        try {

            if ($request->id && $request->role !== 'admin') {
                // prevent deleting the only admin
                if (User::where('role', 'admin')->count() <= 1) {
                    return redirect()->back()->with('error', 'Action blocked: You cannot change role the last remaining administrator.');
                }
            }

            $q = $request->id ? User::find($request->id) : new User();

            $q->name = $request->name;
            $q->email = $request->email;
            $q->phone = $request->phone;
            $q->role = $request->role;
            $q->address = $request->address;

            // Only update password if provided
            if ($request->filled('password')) {
                $q->password = Hash::make($request->password);
            }

            $q->save();

            return redirect()->back()->with('success', $request->id ? 'User profile updated success' : 'New user addedd success.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Something went wrong while processing your request. Please try again.');
        }
    }

    // edit model handle
    public function edit($id)
    {
        try {
            if (!$id) {
                return redirect()->back()->with('error', 'Invalid request, please try again.');
            }

            $user = User::find($id);
            if (!$user) {
                return redirect()->back()->with('error', 'Invalid request, please try again.');
            }

            return response()->json(['data' => $user]);
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Something went wrong while processing your request. Please try again.');
        }
    }

    // delete user
    public function delete($id)
    {
        try {
            $user = User::findOrFail($id);

            if (!$user) {
                return redirect()->back()->with('error', 'The requested user could not be found.');
            }

            // prevent deleting the only admin
            if (User::where('role', 'admin')->count() <= 1 && $user->role == 'admin') {
                return redirect()->back()->with('error', 'Action blocked: You cannot delete the last remaining administrator.');
            }

            // prevent self-delete
            if (Auth::id() == $user->id) {
                return redirect()->back()->with('error', 'Action blocked: You cannot delete your own account.');
            }

            if ($user->profile) {
                if ($user->profile && file_exists(public_path('media/uploads/' . $user->profile))) {
                    unlink(public_path('media/uploads/' . $user->profile));
                }
            }

            $user->delete();

            return redirect()->back()->with('success', 'One user deleted success');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "somthing was wrong try again!");
        }
    }

    public function toggleUserType(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->back()->with('error', 'User not authenticated');
        }

        \Log::info('Toggle user type - Before update', [
            'user_id' => $user->id,
            'current_type' => $user->type,
            'user_email' => $user->email
        ]);

        // Toggle between shadow and general
        $newType = $user->type === 'shadow' ? 'general' : 'shadow';

        \Log::info('Attempting to update', [
            'user_id' => $user->id,
            'new_type' => $newType
        ]);

        try {
            // Method 1: Direct update
            $user->type = $newType;
            $saved = $user->save();

            \Log::info('Save result', [
                'success' => $saved,
                'saved_type' => $user->type
            ]);

            if ($saved) {
                // Refresh the user in the session
                Auth::setUser($user->fresh());

                \Log::info('User type updated successfully', [
                    'user_id' => $user->id,
                    'final_type' => $user->fresh()->type
                ]);

                return redirect()->back()->with('success', "Switched to {$newType} mode");
            } else {
                \Log::error('Failed to save user type');
                return redirect()->back()->with('error', 'Failed to save user type');
            }

        } catch (\Exception $e) {
            \Log::error("Error updating user type: " . $e->getMessage(), [
                'user_id' => $user->id,
                'new_type' => $newType
            ]);

            return redirect()->back()->with('error', 'Failed to switch mode: ' . $e->getMessage());
        }
    }
}
