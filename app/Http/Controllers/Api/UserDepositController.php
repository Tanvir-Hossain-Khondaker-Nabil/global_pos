<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserDepositStore;
use App\Models\UserDeposit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserDepositController extends Controller
{
       /**
     * Store a newly created resource in storage.
     */
    public function store(UserDepositStore $request)
    {
        $validated = $request->validated();

        $validated['created_by'] = Auth::id();
        $validated['outlet_id'] = Auth::user()->outlet_id;
        $validated['status'] = UserDeposit::STATUS_PENDING;

        UserDeposit::create($validated);

        return response()->json(['message' => 'User deposit created successfully.'], 201);
    }
}
