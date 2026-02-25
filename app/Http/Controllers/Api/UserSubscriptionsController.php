<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        return response()->json([
            'subscriptions' => $subscriptions,
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ],
            'message' => 'User subscriptions retrieved successfully.'
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $plans = Plan::with('modules')->active()->get();

        return response()->json([
            'plans' => $plans,
            'user' => User::where('id',Auth::id())->first(),
            'message' => 'Data for creating subscription retrieved successfully.'
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
        $validated['outlet_range'] =  $outlet_range ?? 2;

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

       return response()->json([
           'message' => 'Subscription created successfully.',
           'subscription' => $subscriptions
       ]);
    }
}
