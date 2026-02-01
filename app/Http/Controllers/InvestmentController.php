<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\Investor;
use App\Models\Outlet;
use App\Models\InvestmentWithdrawal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InvestmentController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('search', ''));
        $status = $request->get('status', 'all'); // all|active|completed|closed
        $investorId = $request->get('investor_id');
        $outletId = $request->get('outlet_id');

        $investments = Investment::query()
            ->with(['investor']) // outlet info optional
            ->when($q, function ($query) use ($q) {
                $query->where(function ($qq) use ($q) {
                    $qq->where('code', 'like', "%{$q}%")
                       ->orWhereHas('investor', fn($i) => $i->where('name', 'like', "%{$q}%"));
                });
            })
            ->when($status !== 'all', fn($query) => $query->where('status', $status))
            ->when($investorId, fn($query) => $query->where('investor_id', $investorId))
            ->when($outletId, fn($query) => $query->where('outlet_id', $outletId))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function ($inv) {
                return [
                    'id' => $inv->id,
                    'code' => $inv->code,
                    'investor' => [
                        'id' => $inv->investor?->id,
                        'name' => $inv->investor?->name,
                    ],
                    'outlet_id' => $inv->outlet_id,
                    'start_date' => $inv->start_date?->format('Y-m-d'),
                    'end_date' => $inv->end_date?->format('Y-m-d'),
                    'duration_months' => (int) $inv->duration_months,
                    'profit_rate' => (float) $inv->profit_rate,
                    'initial_principal' => (float) $inv->initial_principal,
                    'current_principal' => (float) $inv->current_principal,
                    'status' => $inv->status,
                    'last_profit_date' => $inv->last_profit_date?->format('Y-m-d'),
                ];
            });

        return Inertia::render('Investments/Index', [
            'filters' => [
                'search' => $q,
                'status' => $status,
                'investor_id' => $investorId,
                'outlet_id' => $outletId,
            ],
            'investments' => $investments,
            // dropdowns
            'investors' => Investor::select('id','name')->orderBy('name')->get(),
            'outlets' => Outlet::select('id','name','code')->latest()->get(), // আপনার Outlet model আছে
        ]);
    }

    public function create()
    {
        return Inertia::render('Investments/Create', [
            'investors' => Investor::select('id','name')->orderBy('name')->get(),
            'outlets' => Outlet::select('id','name','code')->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'outlet_id' => 'nullable|exists:outlets,id',
            'investor_id' => 'required|exists:investors,id',
            'start_date' => 'required|date',
            'duration_months' => 'required|integer|min:1|max:600',
            'profit_rate' => 'required|numeric|min:0|max:100',
            'initial_principal' => 'required|numeric|min:1',
            'note' => 'nullable|string|max:2000',
        ]);

        return DB::transaction(function () use ($data) {

            $start = Carbon::parse($data['start_date'])->startOfDay();
            $end = $start->copy()->addMonthsNoOverflow((int)$data['duration_months'])->subDay(); 
            // উদাহরণ: 1 month duration => end = start+1month-1day

            $investment = Investment::create([
                'outlet_id' => $data['outlet_id'] ?? null,
                'investor_id' => $data['investor_id'],
                'code' => $this->generateInvestmentCode(),
                'start_date' => $start->toDateString(),
                'duration_months' => (int) $data['duration_months'],
                'end_date' => $end->toDateString(),
                'profit_rate' => (float) $data['profit_rate'],
                'initial_principal' => (float) $data['initial_principal'],
                'current_principal' => (float) $data['initial_principal'], // ✅ শুরুতে same
                'status' => 'active',
                'last_profit_date' => null,
                'note' => $data['note'] ?? null,
            ]);

            return to_route('investments.show', $investment->id)
                ->with('success', 'Investment created successfully!');
        });
    }

    public function show(Investment $investment)
    {
        $investment->load(['investor', 'withdrawals' => fn($q) => $q->latest(), 'returns' => fn($q) => $q->latest()]);

        return Inertia::render('Investments/Show', [
            'investment' => [
                'id' => $investment->id,
                'code' => $investment->code,
                'outlet_id' => $investment->outlet_id,
                'investor' => [
                    'id' => $investment->investor?->id,
                    'name' => $investment->investor?->name,
                    'phone' => $investment->investor?->phone,
                ],
                'start_date' => $investment->start_date?->format('Y-m-d'),
                'end_date' => $investment->end_date?->format('Y-m-d'),
                'duration_months' => (int) $investment->duration_months,
                'profit_rate' => (float) $investment->profit_rate,
                'initial_principal' => (float) $investment->initial_principal,
                'current_principal' => (float) $investment->current_principal,
                'status' => $investment->status,
                'last_profit_date' => $investment->last_profit_date?->format('Y-m-d'),
                'note' => $investment->note,
            ],
            'withdrawals' => $investment->withdrawals->map(fn($w) => [
                'id' => $w->id,
                'withdraw_date' => $w->withdraw_date?->format('Y-m-d'),
                'amount' => (float) $w->amount,
                'reason' => $w->reason,
                'created_at' => $w->created_at?->format('d M Y'),
            ])->values(),
            'returns' => $investment->returns->map(fn($r) => [
                'id' => $r->id,
                'period_end' => $r->period_end?->format('Y-m-d'),
                'principal_snapshot' => (float) $r->principal_snapshot,
                'profit_amount' => (float) $r->profit_amount,
                'status' => $r->status,
                'paid_date' => $r->paid_date?->format('Y-m-d'),
            ])->values(),
        ]);
    }

    public function edit(Investment $investment)
    {
        return Inertia::render('Investments/Edit', [
            'investment' => [
                'id' => $investment->id,
                'outlet_id' => $investment->outlet_id,
                'investor_id' => $investment->investor_id,
                'start_date' => $investment->start_date?->format('Y-m-d'),
                'duration_months' => (int) $investment->duration_months,
                'profit_rate' => (float) $investment->profit_rate,
                'initial_principal' => (float) $investment->initial_principal,
                'current_principal' => (float) $investment->current_principal,
                'status' => $investment->status,
                'note' => $investment->note,
            ],
            'investors' => Investor::select('id','name')->orderBy('name')->get(),
            'outlets' => Outlet::select('id','name','code')->latest()->get(),
        ]);
    }

    public function update(Request $request, Investment $investment)
    {
        $data = $request->validate([
            'outlet_id' => 'nullable|exists:outlets,id',
            'investor_id' => 'required|exists:investors,id',
            'start_date' => 'required|date',
            'duration_months' => 'required|integer|min:1|max:600',
            'profit_rate' => 'required|numeric|min:0|max:100',
            'note' => 'nullable|string|max:2000',
            'status' => 'required|in:active,completed,closed',
        ]);

        return DB::transaction(function () use ($data, $investment) {

            $start = Carbon::parse($data['start_date'])->startOfDay();
            $end = $start->copy()->addMonthsNoOverflow((int)$data['duration_months'])->subDay();

            // ✅ principal edit এখানে allow করছি না (withdraw endpoint দিয়ে হবে)
            $investment->update([
                'outlet_id' => $data['outlet_id'] ?? null,
                'investor_id' => $data['investor_id'],
                'start_date' => $start->toDateString(),
                'duration_months' => (int) $data['duration_months'],
                'end_date' => $end->toDateString(),
                'profit_rate' => (float) $data['profit_rate'],
                'status' => $data['status'],
                'note' => $data['note'] ?? null,
            ]);

            return to_route('investments.show', $investment->id)
                ->with('success', 'Investment updated successfully!');
        });
    }

    public function destroy(Investment $investment)
    {
        // status check করতে পারেন
        $investment->delete();

        return to_route('investments.index')->with('success', 'Investment deleted successfully!');
    }

    public function withdraw(Request $request, Investment $investment)
    {
        $data = $request->validate([
            'withdraw_date' => 'required|date',
            'amount' => 'required|numeric|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($investment, $data) {

            // ✅ basic rules
            if ($investment->status !== 'active') {
                return back()->with('error', 'Only active investments can be withdrawn.');
            }

            $amount = (float) $data['amount'];

            if ($amount > (float) $investment->current_principal) {
                return back()->with('error', 'Withdraw amount cannot be greater than current principal.');
            }

            // record withdrawal
            InvestmentWithdrawal::create([
                'investment_id' => $investment->id,
                'withdraw_date' => Carbon::parse($data['withdraw_date'])->toDateString(),
                'amount' => $amount,
                'reason' => $data['reason'] ?? null,
            ]);

            // ✅ আপনার requirement: withdraw করলে initial কমবে + current কমবে
            $investment->update([
                'current_principal' => max(0, (float)$investment->current_principal - $amount),
                'initial_principal' => max(0, (float)$investment->initial_principal - $amount),
            ]);

            // যদি principal 0 হয়ে যায়, closed করতে পারেন (optional)
            if ((float)$investment->current_principal <= 0.00001) {
                $investment->update(['status' => 'closed']);
            }

            return back()->with('success', 'Withdrawal completed successfully!');
        });
    }

    private function generateInvestmentCode(): string
    {
        // Format: INV-YYYYMMDD-0001
        $date = now()->format('Ymd');

        $last = Investment::withoutGlobalScopes() // code unique globally রাখতে চাইলে
            ->whereDate('created_at', now()->toDateString())
            ->where('code', 'like', "INV-{$date}-%")
            ->orderByDesc('id')
            ->value('code');

        $next = 1;
        if ($last) {
            $parts = explode('-', $last);
            $seq = (int) ($parts[2] ?? 0);
            $next = $seq + 1;
        }

        return "INV-{$date}-" . str_pad((string)$next, 4, '0', STR_PAD_LEFT);
    }
}
