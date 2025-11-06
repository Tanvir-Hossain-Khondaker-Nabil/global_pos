<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Auth as FacadesAuth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    // login view
    public function loginView()
    {
        return Inertia::render('auth/Login');
    }

    // login post
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|lowercase',
            'password' => 'required|string|min:6',
        ]);


        try {
            $credentials = $request->only('email', 'password');

            if (Auth::attempt($credentials, $request->filled('remember'))) {
                return redirect()->route('home')->with('success', 'Login successfull');
            }

            return back()->with('error', 'The provided credentials do not match our records.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'An error occurred while logging in.');
        }
    }

    // logout
    public function logout()
    {
        try {
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
            return redirect()->route('login');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'An error occurred while logging out.');
        }
    }

    // profile ===========
    public function profileView()
    {
        return Inertia::render('auth/Profile');
    }

    // update profile
    public function profileUpdate(Request $request)
    {
        $request->validate([
            'profile' => 'nullable|image|mimes:png,jpg,jpeg',
            'name' => 'required',
            'phone_no' => 'nullable|min:11|max:14',
            'address' => 'nullable|min:3'
        ]);

        try {
            $q = User::find(Auth::id());
            $q->name = $request->name;
            if ($request->phone) {
                $q->phone = $request->phone_no;
            }
            if ($request->address) {
                $q->address = $request->address;
            }
            if ($request->hasFile('profile')) {
                // Delete old image if exists
                if ($q->profile && file_exists(public_path('media/uploads/' . $q->profile))) {
                    unlink(public_path('media/uploads/' . $q->profile));
                }

                // Get new file
                $file = $request->file('profile');

                // Generate unique filename
                $filename = time() . '_profile_' . uniqid() . '.' . $file->getClientOriginalExtension();

                // Move to public/media/uploads
                $file->move(public_path('media/uploads'), $filename);

                // Save new image path in DB
                $q->profile = $filename;
            }
            $q->save();
            return redirect()->back()->with('success', 'Profile updated success.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }

    // security =================
    public function securityView()
    {
        return Inertia::render('auth/Security');
    }

    public function securityUpdate(Request $request)
    {
        $request->validate([
            'new_password' => 'required|min:6|confirmed',
        ]);

        try {
            $q = User::find(AUth::id());
            $q->password = Hash::make($request->new_password);
            $q->save();
            return redirect()->back()->with('success', 'New password updated success.');
        } catch (\Exception $th) {
            return redirect()->back()->with('error', 'Server error try again!');
        }
    }
}
