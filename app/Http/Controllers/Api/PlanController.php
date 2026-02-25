<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
    */
    public function index()
    {
        $plans = Plan::active()
            ->where('id', '!=', 5)
            ->with('modules')
            ->orderBy('created_at', 'desc')
            ->get();

       return response()->json([
            'plans' => $plans,
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => count($plans),
                'total' => count($plans),
            ],
            'message' => 'Plans retrieved successfully.'
        ]);
    }
}
