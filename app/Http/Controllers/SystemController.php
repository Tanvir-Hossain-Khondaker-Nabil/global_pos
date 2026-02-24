<?php

namespace App\Http\Controllers;

use App\Models\System;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\In;
use Inertia\Inertia;

class SystemController extends Controller
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
        $system = System::findOrFail($id);

        return Inertia::render('Systems/Show', [
            'system' => $system
        ]);
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
        $system = System::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
            'hold_reason' => 'required_if:status,inactive|nullable|string|max:255'
        ]);

        $system->update($validated);

        return back()->with('success', 'System status updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
