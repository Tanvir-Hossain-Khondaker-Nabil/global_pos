<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalesList;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\Customer;
use App\Models\SaleItem;
use App\Models\Stock;


class DashboardController extends Controller
{
    // index
    public function index()
    {
        $user = Auth::user();
        $isShadowUser = $user->type === 'shadow';

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        // ================= SALES SUMMARY =================
        $totalSalesQuery = $isShadowUser ? 'SUM(shadow_grand_total)' : 'SUM(grand_total)';
        $totalPaidQuery  = $isShadowUser ? 'SUM(shadow_paid_amount)' : 'SUM(paid_amount)';
        $totalDueQuery   = $isShadowUser ? 'SUM(shadow_due_amount)' : 'SUM(due_amount)';

        $totalSales  = Sale::selectRaw("COALESCE($totalSalesQuery,0) as total")->value('total');
        $totalPaid   = Sale::selectRaw("COALESCE($totalPaidQuery,0) as total")->value('total');
        $totalDue    = Sale::selectRaw("COALESCE($totalDueQuery,0) as total")->value('total');
        $totalOrders = Sale::count();

        $todaySales = Sale::whereDate('created_at', $today)
            ->selectRaw("COALESCE($totalSalesQuery,0) as total")
            ->value('total');

        $yesterdaySales = Sale::whereDate('created_at', $yesterday)
            ->selectRaw("COALESCE($totalSalesQuery,0) as total")
            ->value('total');

        $salesGrowth = $yesterdaySales > 0
            ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100
            : 0;

        // ================= CUSTOMERS =================
        $totalCustomers  = Customer::count();
        $activeCustomers = Customer::where('is_active', true)->count();

        // ================= INVENTORY =================
        $inventoryValue = Stock::selectRaw('COALESCE(SUM(quantity * purchase_price),0) as value')
            ->value('value');

        $lowStockItems  = Stock::where('quantity', '<=', 10)->count();
        $outOfStockItems = Stock::where('quantity', '<=', 0)->count();

        // ================= ORDERS =================
        $pendingOrders   = Sale::where('status', 'pending')->count();
        $completedOrders = Sale::where('status', 'completed')->count();

        // ================= FINANCIAL =================
        $totalExpenses = Expense::sum('amount');

        $profitMargin = $totalSales > 0
            ? (($totalSales - $totalExpenses) / $totalSales) * 100
            : 0;

        // ================= MONTHLY SALES =================
        $monthlySales = Sale::selectRaw("
                MONTH(created_at) as month_num,
                DATE_FORMAT(created_at,'%b') as month,
                COALESCE($totalSalesQuery,0) as total
            ")
            ->whereYear('created_at', date('Y'))
            ->groupBy('month_num', 'month')
            ->orderBy('month_num')
            ->get()
            ->pluck('total', 'month')
            ->toArray();

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $monthlySalesData = [];

        foreach ($months as $m) {
            $monthlySalesData[$m] = $monthlySales[$m] ?? 0;
        }

        // ================= TOP ITEMS (NO product_id) =================
        $topProducts = SaleItem::select([
            'id',
            DB::raw('SUM(quantity) as total_quantity'),
            DB::raw('SUM(total_price) as total_sales')
        ])
            ->groupBy('id')
            ->orderByDesc('total_sales')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id'       => $item->id,
                    'name'     => 'Item #' . $item->id,
                    'sales'    => $item->total_sales,
                    'quantity' => $item->total_quantity,
                    'growth'   => rand(5, 20)
                ];
            });

        // ================= RECENT ACTIVITIES =================
        $recentActivities = [];

        Sale::latest()->limit(5)->get()->each(function ($sale) use (&$recentActivities) {
            $recentActivities[] = [
                'id' => $sale->id,
                'type' => 'sale',
                'user' => 'Customer',
                'action' => 'Completed sale ' . $sale->invoice_no,
                'time' => Carbon::parse($sale->created_at)->diffForHumans(),
                'amount' => $sale->grand_total
            ];
        });

        // ================= DASHBOARD DATA =================
        $dashboardData = [
            'todaySales' => $todaySales,
            'yesterdaySales' => $yesterdaySales,
            'salesGrowth' => round($salesGrowth, 1),

            'totalCustomers' => $totalCustomers,
            'activeCustomers' => $activeCustomers,

            'inventoryValue' => $inventoryValue,
            'lowStockItems' => $lowStockItems,
            'outOfStockItems' => $outOfStockItems,

            'pendingOrders' => $pendingOrders,
            'completedOrders' => $completedOrders,

            'profitMargin' => round($profitMargin, 1),

            'monthlySalesData' => $monthlySalesData,
            'monthLabels' => $months,

            'topProducts' => $topProducts,
            'recentActivities' => array_slice($recentActivities, 0, 5),

            'averageOrderValue' => $totalOrders > 0 ? round($totalSales / $totalOrders, 2) : 0
        ];

        return inertia('Dashboard', [
            'dashboardData' => $dashboardData,
            'totalSales' => $totalSales,
            'totalPaid' => $totalPaid,
            'totalDue' => $totalDue,
            'totalselas' => $totalOrders,
            'totalexpense' => $totalExpenses,
            'isShadowUser' => $isShadowUser
        ]);
    }
}
