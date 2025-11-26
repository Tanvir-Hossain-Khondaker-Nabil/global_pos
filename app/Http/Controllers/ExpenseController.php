<?php

namespace App\Http\Controllers;

use App\Models\Exchange;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\ExtraCas;
use App\Models\SalesList;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpenseController extends Controller
{

    /**
     * Display a listing of the resource.
    */

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
            ->map(fn($json) => collect(json_decode($json, true)))
            ->flatten(1)

            ->filter(function ($item) use ($startdate, $date) {
                if (!isset($item['date'])) {
                    return false; 
                }

                $itemDate = Carbon::parse($item['date']);

                if ($startdate && $date) {
                    return $itemDate->between(
                        Carbon::parse($startdate)->startOfDay(),
                        Carbon::parse($date)->endOfDay()
                    );
                }

                return $itemDate->isSameDay(Carbon::parse($date));
            })

            ->groupBy('system')
            ->map(fn($group) => $group->sum(fn($item) => (float) $item['amount']));

        $mobilebanking = collect($mobileBankSystems)->mapWithKeys(
            fn($system) => [$system => $paymentData[$system] ?? 0]
        );
        $bank = collect($bankSystems)->mapWithKeys(
            fn($system) => [$system => $paymentData[$system] ?? 0]
        );
        $cash = collect($cashSystems)->mapWithKeys(
            fn($system) => [$system => $paymentData[$system] ?? 0]
        );

        $final = [
            'mobilebanking' => $mobilebanking,
            'bank' => $bank,
            'cash' => $cash,
        ];

        $totals = collect($final)->map(fn($group) => $group->sum());
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

    /**
     * Create a expense category
     */
    public function category(Request $request)
    {
        $query = $request->only(['startdate', 'date', 'search']);
        
        $today = now()->format('Y-m-d');

        $categories = ExpenseCategory::with('expenses')
            ->when($request->has('startdate') && $request->startdate, function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->startdate);
            })
            ->when($request->has('search') && $request->search, function ($query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%');
            })
            ->withCount('expenses')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $todaysCategoriesCount = ExpenseCategory::count();


        return Inertia::render('expenses/category/index', [
            'categories' => $categories,
            'todaysCategoriesCount' => $todaysCategoriesCount,
            'query' => $query,
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
