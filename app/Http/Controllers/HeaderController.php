<?php
// app/Http/Controllers/HeaderController.php

namespace App\Http\Controllers;

use App\Models\Header;
use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class HeaderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $query = Header::with('outlet');
        
        // Check which column to use for ownership
        if (Schema::hasColumn('headers', 'owner_id') && Auth::user()->ownerId()) {
            $query->where('owner_id', Auth::user()->ownerId());
        } else if (Schema::hasColumn('headers', 'user_id')) {
            $query->where('user_id', Auth::id());
        } else if (Schema::hasColumn('headers', 'created_by')) {
            $query->where('created_by', Auth::id());
        }
        
        $headers = $query->latest()->paginate(10);

        return inertia('Headers/Index', [
            'headers' => $headers,
            'outlets' => Outlet::where('user_id', Auth::id())->get()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Check if user has any outlets
        $outlets = Outlet::where('user_id', Auth::id())->get();
        
        // Get outlets that don't have headers yet
        $query = Header::query();
        
        if (Schema::hasColumn('headers', 'owner_id') && Auth::user()->ownerId()) {
            $query->where('owner_id', Auth::user()->ownerId());
        } else if (Schema::hasColumn('headers', 'user_id')) {
            $query->where('user_id', Auth::id());
        } else if (Schema::hasColumn('headers', 'created_by')) {
            $query->where('created_by', Auth::id());
        }
        
        $outletsWithHeaders = $query->pluck('outlet_id')->toArray();
        
        $availableOutlets = $outlets->reject(function ($outlet) use ($outletsWithHeaders) {
            return in_array($outlet->id, $outletsWithHeaders);
        });

        return inertia('Headers/Create', [
            'availableOutlets' => $availableOutlets,
            'hasOutlets' => $outlets->count() > 0
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Check if owner_id column exists
        $hasOwnerId = Schema::hasColumn('headers', 'owner_id');
        
        $validated = $request->validate([
            'fav_icon' => ['nullable', 'image', 'max:2048', 'mimes:png,ico,jpg,jpeg'],
            'title' => ['required', 'string', 'max:255'],
            'sitebar_name' => ['required', 'string', 'max:255'],
            'outlet_id' => [
                'required',
                'exists:outlets,id',
                function ($attribute, $value, $fail) use ($request, $hasOwnerId) {
                    $query = Header::where('outlet_id', $value);
                    
                    if ($hasOwnerId && Auth::user()->ownerId()) {
                        $query->where('owner_id', Auth::user()->ownerId());
                        if ($query->exists()) {
                            $fail('This outlet already has a header configuration.');
                        }
                    } else if (Schema::hasColumn('headers', 'user_id')) {
                        $query->where('user_id', Auth::id());
                        if ($query->exists()) {
                            $fail('This outlet already has a header configuration.');
                        }
                    } else if (Schema::hasColumn('headers', 'created_by')) {
                        $query->where('created_by', Auth::id());
                        if ($query->exists()) {
                            $fail('This outlet already has a header configuration.');
                        }
                    }
                }
            ]
        ]);

        // Handle fav_icon upload
        if ($request->hasFile('fav_icon')) {
            $path = $request->file('fav_icon')->store('headers/fav-icons', 'public');
            $validated['fav_icon'] = $path;
        }

        // Add ownership columns based on what exists
        if ($hasOwnerId && Auth::user()->ownerId()) {
            $validated['owner_id'] = Auth::user()->ownerId();
        }
        
        if (Schema::hasColumn('headers', 'user_id')) {
            $validated['user_id'] = Auth::id();
        }
        
        if (Schema::hasColumn('headers', 'created_by')) {
            $validated['created_by'] = Auth::id();
        }

        Header::create($validated);

        return redirect()->route('headers.index')
            ->with('success', 'Header created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Header $header)
    {
        $header->load(['outlet', 'creator']);
        
        return inertia('Headers/Show', [
            'header' => $header
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Header $header)
    {
        $outlets = Outlet::where('owner_id', Auth::user()->ownerId())->get();

        return inertia('Headers/Edit', [
            'header' => $header,
            'outlets' => $outlets
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Header $header)
    {
        $validated = $request->validate([
            'fav_icon' => ['nullable', 'image', 'max:2048', 'mimes:png,ico,jpg,jpeg'],
            'title' => ['required', 'string', 'max:255'],
            'sitebar_name' => ['required', 'string', 'max:255'],
            'outlet_id' => [
                'required',
                'exists:outlets,id',
                Rule::unique('headers', 'outlet_id')
                    ->where(function ($query) use ($request) {
                        return $query->where('owner_id', Auth::user()->ownerId());
                    })
                    ->ignore($header->id)
            ]
        ]);

        // Handle fav_icon upload
        if ($request->hasFile('fav_icon')) {
            // Delete old fav_icon if exists
            if ($header->fav_icon) {
                Storage::disk('public')->delete($header->fav_icon);
            }
            
            $path = $request->file('fav_icon')->store('headers/fav-icons', 'public');
            $validated['fav_icon'] = $path;
        } elseif ($request->has('remove_fav_icon')) {
            // Remove fav_icon
            if ($header->fav_icon) {
                Storage::disk('public')->delete($header->fav_icon);
            }
            $validated['fav_icon'] = null;
        } else {
            // Keep existing fav_icon
            $validated['fav_icon'] = $header->fav_icon;
        }

        $header->update($validated);

        return redirect()->route('headers.index')
            ->with('success', 'Header updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Header $header)
    {
        // Delete fav_icon file if exists
        if ($header->fav_icon) {
            Storage::disk('public')->delete($header->fav_icon);
        }

        $header->delete();

        return redirect()->route('headers.index')
            ->with('success', 'Header deleted successfully.');
    }
}