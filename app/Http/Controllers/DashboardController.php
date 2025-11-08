<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Product;
use App\Models\SalesList;
use Inertia\Inertia;

class DashboardController extends Controller
{
    // index
    public function index($s = null)
    {

        if ($s) {
            return "Dashboard for: " . $s;
        } else {


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
            'totalSales' => SalesList::sum('grandtotal'),
            'totalselas' => SalesList::count(),
            'totalSalespyament' => $grandTotal,
            'totalexpense' => Expense::sum('amount')
        ]);
        }
    }
}
