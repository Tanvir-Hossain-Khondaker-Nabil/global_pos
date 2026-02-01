<?php

namespace App\Http\Controllers;

use App\Models\InvestmentReturn;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvestmentReturnController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->get('status', 'all'); // all|pending|paid

        $returns = InvestmentReturn::query()
            ->with(['investment.investor'])
            ->when($status !== 'all', fn($q) => $q->where('status', $status))
            ->latest('period_end')
            ->paginate(10)
            ->withQueryString()
            ->through(function ($r) {
                return [
                    'id' => $r->id,
                    'period_end' => $r->period_end?->format('Y-m-d'),
                    'principal_snapshot' => (float) $r->principal_snapshot,
                    'profit_amount' => (float) $r->profit_amount,
                    'status' => $r->status,
                    'paid_date' => $r->paid_date?->format('Y-m-d'),
                    'investment' => [
                        'id' => $r->investment?->id,
                        'code' => $r->investment?->code,
                        'investor_name' => $r->investment?->investor?->name,
                    ],
                ];
            });

        return Inertia::render('InvestmentReturns/Index', [
            'filters' => ['status' => $status],
            'returns' => $returns,
        ]);
    }

    public function markPaid(InvestmentReturn $investmentReturn)
    {
        if ($investmentReturn->status === 'paid') {
            return back()->with('error', 'Already paid.');
        }

        $investmentReturn->update([
            'status' => 'paid',
            'paid_date' => now()->toDateString(),
        ]);

        return back()->with('success', 'Return marked as paid!');
    }
}
