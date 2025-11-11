<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalesList;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // index
    public function index($s = null)
    {

        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $totalDue = Sale::sum('due_amount');
        $totalPaid = Sale::sum('paid_amount');
        $totalsales = Sale::sum('grand_total');

        if ($isShadowUser) {
            $totalDue = Sale::sum('shadow_due_amount');
            $totalPaid = Sale::sum('shadow_paid_amount');
            $totalsales = Sale::sum('shadow_grand_total');
        }


        $mobileBankSystems = ['bkash', 'nagod', 'upay', 'rocket'];
        $bankSystems = ['city_bank', 'ucb', 'DBBL'];
        $cashSystems = ['cash'];

        $paymentData = SalesList::pluck('pay')
            ->map(fn($json) => collect(json_decode($json, true)))
            ->flatten(1)
            ->groupBy('system')
            ->map(fn($group) => $group->sum(fn($item) => (float) $item['amount']));

        
       

        // ---- এখন তিনটা আলাদা গ্রুপ তৈরি করছি ----
        $mobilebanking = collect($mobileBankSystems)->mapWithKeys(function ($system) use ($paymentData) {
            return [$system => $paymentData[$system] ?? 0];
        });
        $bank = collect($bankSystems)->mapWithKeys(function ($system) use ($paymentData) {
            return [$system => $paymentData[$system] ?? 0];
        });
        $cash = collect($cashSystems)->mapWithKeys(function ($system) use ($paymentData) {
            return [$system => $paymentData[$system] ?? 0];
        });

        // ---- সবগুলো একত্র করে final result ----
        $final = [
            'mobilebanking' => $mobilebanking,
            'bank' => $bank,
            'cash' => $cash,
        ];
        $totals = collect($final)->map(fn($group) => $group->sum());
        // grand total
        $grandTotal = $totals->sum();

        return Inertia::render("Dashboard", [
            'totalSales' => $totalsales,
            'totalDue' => $totalDue,
            'totalPaid' => $totalPaid,
            'totalselas' => Sale::count(),
            'totalSalespyament' => $grandTotal,
            'totalexpense' => Expense::sum('amount')
        ]);
    }




}
