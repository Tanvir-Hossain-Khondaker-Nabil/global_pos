<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserSubscriptionsController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $subscriptions = Subscription::with(['plan', 'user', 'payments'])
            ->when(request('status'), function ($query) {
                $query->status(request('status'));
            })
            ->when(request('search'), function ($query) {
                $query->search(request('search'));
            })
            ->when(request('date_from'), function ($query) {
                $query->where('created_at', '>=', Carbon::parse(request('date_from'))->startOfDay());
            })
            ->when(request('date_to'), function ($query) {
                $query->where('created_at', '<=', Carbon::parse(request('date_to'))->endOfDay());
            })
            ->orderBy('created_at', 'desc')
            ->where('user_id', Auth::id())
            ->paginate(10)
            ->withQueryString();

        return inertia('UserSubscriptions/Index', [
            'subscriptions' => $subscriptions
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $plans = Plan::with('modules')->active()->get();
        return inertia('UserSubscriptions/Create', [
            'plans' => $plans,
            'user' => User::where('id',Auth::id())->first()
        ]);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $validated = $request->validate([
            'plan_id'        => 'required|exists:plans,id',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            'payment_method' => 'required|string',
            'transaction_id' => 'nullable|string',
            'notes'          => 'nullable|string',
        ]);

        $amount = Plan::where('id', $request->plan_id)->value('price');
        $validity = Plan::where('id', $request->plan_id)->value('validity');
        $product_range = Plan::where('id', $request->plan_id)->value('product_range');
        $outlet_range = Plan::where('id', $request->plan_id)->value('outlet_range');
        $validated = $request->validated();
        $validated['user_id'] = Auth::id();


        $userDeposit = User::where('id', $validated['user_id'])->value('total_deposit');

        if ($validated['payment_method'] == 'adjust_deposit' && $userDeposit < $amount) {
            return back()->withErrors(['payment_method' => 'Insufficient deposit balance.Add User Deposit '])->withInput();
        }


        $checkUser = Subscription::where('user_id', $validated['user_id'])
            ->where('status', 1)->exists();

        if ($checkUser) {
            return back()->withErrors(['user_id' => 'This user already has an active subscription for the selected plan.'])->withInput();
        }


        $validated['validity'] = $validity;
        $validated['status'] = 1;
        $validated['product_range'] =  $product_range ?? 20;
        $validated['outlet_range'] =  $outlet_range ?? 1;

        if ($validated['payment_method'] == 'cash') $validated['transaction_id'] = 'Cash-' . uniqid();
        if ($validated['payment_method'] == 'adjust_deposit') $validated['transaction_id'] = 'Adjust_deposit-' . uniqid();

        $subscriptions = Subscription::create($validated);

        if ($subscriptions) {
            SubscriptionPayment::create([
                'subscription_id' => $subscriptions->id,
                'payment_method' => $request->payment_method ?? 'manual',
                'transaction_id' => $request->transaction_id ?? 'Wiki-' . uniqid(),
                'amount' => $amount ?? 0,
                'status' => 'completed',
                'payment_date' => now(),
            ]);
        }

        return to_route('user_subscriptions.index')->with('success', 'Subscription created successfully.');
    }


    /**
     * edit the specified resource.
     */
    public function renewEdit(string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);

        return Inertia::render('UserSubscriptions/Edit', [
            'subscription' => $subscription,
            'plans' => Plan::active()->get(),
        ]);
    }


    public function edit(string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);

        return Inertia::render('UserSubscriptions/EditPlan', [
            'subscription' => $subscription,
            'plans' => Plan::active()->get(),
        ]);
    }


    /**
     * Display the specified resource.
     */
    public function renew(Request $request, string $id)
    {
        $amount = Plan::where('id', $request->plan_id)->value('price');
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);
        $plan = Plan::findOrFail($request->plan_id);
        $plan_type = $plan->plan_type;

        if ($plan_type == Plan::PLAN_PAID) {
            $request->validate([
                'payment_method' => 'required|string',
                'transaction_id' => 'nullable|string',
            ]);
        }

        $userDeposit = User::where('id',  $subscription->user_id)->value('total_deposit');

        if ($request['payment_method'] == 'adjust_deposit' && $userDeposit < $amount) {
            return back()->withErrors(['payment_method' => 'Insufficient deposit balance.Add User Deposit '])->withInput();
        }

        if ($request['payment_method'] == 'cash') $transaction_id = 'Cash-' . uniqid();
        if ($request['payment_method'] == 'adjust_deposit')
        {
            $transaction_id = 'Adjust_deposit-' . uniqid();
            User::where('id', $subscription->user_id)->decrement('total_deposit', $amount);
        }


        $startDate = Carbon::parse($subscription->end_date);
        $endDate = $startDate->addDays($plan->validity);

        $subscription->update([
            'end_date' => $endDate,
            'validity' => $subscription->validity + $plan->validity,
            'status' => Subscription::STATUS_ACTIVE,
            'plan_id' => $plan->id
        ]);

        if ($plan_type !== Plan::PLAN_FREE) {
            \App\Models\SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'amount' => $plan->price ?? 0,
                'payment_method' => $request->payment_method,
                'transaction_id' => $request->transaction_id ??  $transaction_id,
                'status' => \App\Models\SubscriptionPayment::STATUS_COMPLETED,
                'payment_date' => now(),
            ]);
        }

        return to_route('user_subscriptions.index')->with('success', 'Subscription renewed and payment recorded successfully.');
    }

        /**
     * Show the form for editing the specified resource.
     */
    public function show(string $id)
    {
        $subscription = Subscription::with(['plan', 'user', 'payments'])
            ->withCount('payments')
            ->findOrFail($id);

        $paymentTotal = $subscription->payments()->sum('amount');

        return inertia('UserSubscriptions/Show', [
            'subscription' => $subscription,
            'paymentTotal' => $paymentTotal
        ]);
    }
}
