<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlanStore;
use App\Http\Requests\PlanUpdate;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = Plan::active()
        ->when(request('plan_type'), function ($query) {$query->ofType(request('plan_type')); })
        ->when(request('search'), function ($query) {$query->search(request('search')); })
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        return Inertia::render('Plans/Index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Plans/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PlanStore $request)
    {
        $validated = $request->validated();
        Plan::create($validated);
        return to_route('plans.index')->with('success', 'Plan created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $plans = Plan::findOrFail($id);
        return Inertia::render('Plans/Show', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $plans = Plan::findOrFail($id);
        return Inertia::render('Plans/Edit', [
            'plans' => $plans,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PlanUpdate $request, string $id)
    {
        $plan = Plan::findOrFail($id);
        $plan->update($request->validated());
        return to_route('plans.index')->with('success', 'Plan updated successfully!');
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $plan = Plan::findOrFail($id);
        $plan->delete();
        return to_route('plans.index')->with('success', 'Plan deleted successfully.');
    }
}
