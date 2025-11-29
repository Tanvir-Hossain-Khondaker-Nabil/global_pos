<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $subscriptions = Subscription::with(['plan','user','payments'])
        ->when(request('status'), function ($query) { $query->status(request('status' )); })
        ->when(request('search'), function ($query) { $query->search(request('search')); })
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

        return inertia('Subscriptions/Index', [
            'subscriptions' => $subscriptions
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $plans = Plan::active()->get();
        $users = User::where('role', User::COMPANY_ROLE)->get();
        return inertia('Subscriptions/Create', [
            'plans' => $plans,
            'users' => $users
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $plan_type = Plan::where('id', $request->plan_id)->value('plan_type');

        dd($plan_type,$request->all());
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'email' => 'nullable|email|exists:users,email',
            'plan_id' => 'required|exists:plans,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'payment_method' => 'required|string',
            'transaction_id' => 'required|string',
        ]);

       $subscriptions = Subscription::create($validated);

       if($subscriptions) {
          SubscriptionPayment::create([
              'subscription_id' => $subscriptions->id,
              'payment_method' => $request->payment_method ?? 'manual',
              'transaction_id' => $request->transaction_id ?? 'N/A',
              'amount' => $subscriptions->plan->price,
              'status' => 'completed',
              'payment_date' => now(),
          ]);
       }

        return redirect()->route('subscriptions.index')->with('success', 'Subscription created successfully.');
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
