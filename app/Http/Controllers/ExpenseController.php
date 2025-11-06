<?php

namespace App\Http\Controllers;

use App\Models\Exchange;
use App\Models\Expense;
use App\Models\ExtraCas;
use App\Models\SalesList;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    // index
    public function index(Request $request)
    {
        $startdate = $request->query('startdate') ?? null;
        $date = $request->query('date') ?? now('Asia/Dhaka')->toDateString();

        $mobileBankSystems = ['bkash', 'nagod', 'upay', 'rocket'];
        $bankSystems = ['city_bank', 'ucb', 'DBBL'];
        $cashSystems = ['cash'];

        $paymentData = SalesList::when($startdate && $date, function ($query) use ($startdate, $date) {
            $query->where(function ($q) use ($startdate, $date) {
                $q->whereBetween('created_at', [
                    Carbon::parse($startdate)->startOfDay(),
                    Carbon::parse($date)->endOfDay(),
                ])
                    ->orWhereBetween('updated_at', [
                        Carbon::parse($startdate)->startOfDay(),
                        Carbon::parse($date)->endOfDay(),
                    ]);
            });
        })
            ->when(!$startdate && $date, function ($query) use ($date) {
                $query->where(function ($q) use ($date) {
                    $q->whereDate('created_at', $date)
                        ->orWhereDate('updated_at', $date);
                });
            })
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->pluck('pay')
            // Decode JSON
            ->map(fn($json) => collect(json_decode($json, true)))
            ->flatten(1)

            // 🔹 Step 2: তারিখ অনুযায়ী filter
            ->filter(function ($item) use ($startdate, $date) {
                if (!isset($item['date'])) {
                    return false; // যদি JSON-এ date না থাকে
                }

                $itemDate = Carbon::parse($item['date']);

                if ($startdate && $date) {
                    return $itemDate->between(
                        Carbon::parse($startdate)->startOfDay(),
                        Carbon::parse($date)->endOfDay()
                    );
                }

                // শুধু $date থাকলে
                return $itemDate->isSameDay(Carbon::parse($date));
            })

            // 🔹 Step 3: system অনুযায়ী group করে amount sum করো
            ->groupBy('system')
            ->map(fn($group) => $group->sum(fn($item) => (float) $item['amount']));

        // 🔹 Step 4: category অনুযায়ী আলাদা করো
        $mobilebanking = collect($mobileBankSystems)->mapWithKeys(
            fn($system) => [$system => $paymentData[$system] ?? 0]
        );
        $bank = collect($bankSystems)->mapWithKeys(
            fn($system) => [$system => $paymentData[$system] ?? 0]
        );
        $cash = collect($cashSystems)->mapWithKeys(
            fn($system) => [$system => $paymentData[$system] ?? 0]
        );

        // ---- সবগুলো একত্র করে final result ----
        $final = [
            'mobilebanking' => $mobilebanking,
            'bank' => $bank,
            'cash' => $cash,
        ];

        // প্রতিটি category এর sum
        $totals = collect($final)->map(fn($group) => $group->sum());
        // grand total
        $grandTotal = $totals->sum();
        $totalAmount = [
            'totals' => $totals,
            'grandTotal' => $grandTotal
        ];

        $todaysExpense = Expense::with(['createdby'])
            ->when($startdate && $date, function ($query) use ($startdate, $date) {
                $query->whereBetween('date', [
                    Carbon::parse($startdate)->startOfDay(),
                    Carbon::parse($date)->endOfDay(),
                ]);
            })
            ->when(empty($startdate) && $date, function ($query) use ($date) {
                $query->whereDate('date', $date);
            })
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->paginate(10);
        $todaysExpenseTotal = Expense::when($startdate && $date, function ($query) use ($startdate, $date) {
            $query->whereBetween('date', [
                Carbon::parse($startdate)->startOfDay(),
                Carbon::parse($date)->endOfDay(),
            ]);
        })
            ->when(!$startdate && $date, function ($query) use ($date) {
                $query->whereDate('date', $date);
            })
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->sum('amount');

        // // Extra cash
        $extracashTotal = ExtraCas::when($startdate && $date, function ($query) use ($startdate, $date) {
            $query->whereBetween('date', [
                Carbon::parse($startdate)->startOfDay(),
                Carbon::parse($date)->endOfDay(),
            ]);
        })
            ->when(!$startdate && $date, function ($query) use ($date) {
                $query->whereDate('date', $date);
            })
            ->when(Auth::user()->role !== 'admin', function ($query) {
                $query->where('created_by', Auth::id());
            })
            ->sum('amount');

        return Inertia::render('expenses/Index', [
            'todaysExpenseTotal' => $todaysExpenseTotal,
            'todaysExpense' => $todaysExpense,
            'extracashTotal' => $extracashTotal,
            'amount' => $totalAmount,
            'query' => $request->only('date', 'startdate')
        ]);
    }

    // store
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'details' => 'nullable|min:2',
            'amount' => 'required|numeric'
        ]);

        try {
            Expense::create([
                'date' => $request->date,
                'details' => $request->details,
                'amount' => $request->amount,
                'created_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Expense added success.");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }

    // delete
    public function distroy($id)
    {
        try {
            Expense::find($id)->delete();

            return redirect()->back()->with('success', "Expense deleted success.");
        } catch (\Exception $th) {
            return redirect()->back()->with('error', "server error try again.");
        }
    }
}
