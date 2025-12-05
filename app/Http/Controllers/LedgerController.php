<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LedgerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $type = $request->type ?? 'all';
        $search = $request->search ?? '';
        $entityId = $request->entity_id ?? '';
        $startDate = $request->start_date ?? '';
        $endDate = $request->end_date ?? '';

        // Base queries
        $customerQuery = Customer::query();
        $supplierQuery = Supplier::query();

        // Apply search filter
        if ($search) {
            $customerQuery->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('sales', function ($query) use ($search) {
                        $query->where('invoice_number', 'like', "%{$search}%");
                    });
            });

            $supplierQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('purchases', function ($query) use ($search) {
                        $query->where('invoice_number', 'like', "%{$search}%");
                    });
            });
        }

        // Apply date filter for related transactions
        $dateFilter = function ($query) use ($startDate, $endDate) {
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
        };

        // Eager load relations with constraints
        if ($type == 'customer' || $type == 'all') {
            $customerQuery->with(['sales' => $dateFilter]);
        }

        if ($type == 'supplier' || $type == 'all') {
            $supplierQuery->with(['purchases' => $dateFilter]);
        }

        // Apply active status
        $customerQuery->active();
        $supplierQuery->active();

        if ($type == 'customer') {
            $customers = $customerQuery->get();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'type' => $type,
                    'customers' => $customers,
                    'filters' => [
                        'type' => $type,
                        'search' => $search,
                        'entity_id' => $entityId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'stats' => $this->calculateLedgerStats($customers, collect(), $type),
                ]);
            }

            return Inertia::render('Ledger/Customer', [
                'type' => $type,
                'customers' => $customers,
                'filters' => [
                    'type' => $type,
                    'search' => $search,
                    'entity_id' => $entityId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'stats' => $this->calculateLedgerStats($customers, collect(), $type),
            ]);
        } elseif ($type == 'supplier') {
            $suppliers = $supplierQuery->get();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'type' => $type,
                    'suppliers' => $suppliers,
                    'filters' => [
                        'type' => $type,
                        'search' => $search,
                        'entity_id' => $entityId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'stats' => $this->calculateLedgerStats(collect(), $suppliers, $type),
                ]);
            }

            return Inertia::render('Ledger/Supplier', [
                'type' => $type,
                'suppliers' => $suppliers,
                'filters' => [
                    'type' => $type,
                    'search' => $search,
                    'entity_id' => $entityId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'stats' => $this->calculateLedgerStats(collect(), $suppliers, $type),
            ]);
        } else {
            // For 'all' type
            $customers = $customerQuery->get();
            $suppliers = $supplierQuery->get();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'type' => $type,
                    'customers' => $customers,
                    'suppliers' => $suppliers,
                    'filters' => [
                        'type' => $type,
                        'search' => $search,
                        'entity_id' => $entityId,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'stats' => $this->calculateLedgerStats($customers, $suppliers, $type),
                ]);
            }

            return Inertia::render('Ledger/Index', [
                'type' => $type,
                'customers' => $customers,
                'suppliers' => $suppliers,
                'filters' => [
                    'type' => $type,
                    'search' => $search,
                    'entity_id' => $entityId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'stats' => $this->calculateLedgerStats($customers, $suppliers, $type),
            ]);
        }
    }

    private function calculateLedgerStats($customers, $suppliers, $type)
    {
        // Convert to collection if not already
        $customers = $customers instanceof \Illuminate\Database\Eloquent\Collection
            ? $customers
            : collect($customers);

        $suppliers = $suppliers instanceof \Illuminate\Database\Eloquent\Collection
            ? $suppliers
            : collect($suppliers);

        $totalCustomers = $type === 'supplier' ? 0 : $customers->count();
        $totalSuppliers = $type === 'customer' ? 0 : $suppliers->count();

        // Calculate totals from sales and purchases
        $totalSalesAmount = 0;
        $totalPurchasesAmount = 0;
        $totalTransactions = 0;

        if ($type !== 'supplier') {
            foreach ($customers as $customer) {
                $totalSalesAmount += $customer->sales->sum('grand_total');
                $totalTransactions += $customer->sales->count();
            }
        }

        if ($type !== 'customer') {
            foreach ($suppliers as $supplier) {
                $totalPurchasesAmount += $supplier->purchases->sum('grand_total');
                $totalTransactions += $supplier->purchases->count();
            }
        }

        // Calculate average transaction
        $averageTransaction = $totalTransactions > 0
            ? ($totalSalesAmount + $totalPurchasesAmount) / $totalTransactions
            : 0;

        // Calculate percentages
        $totalAmount = $totalSalesAmount + $totalPurchasesAmount;
        $salesPercentage = $totalAmount > 0 ? round(($totalSalesAmount / $totalAmount) * 100) : 0;
        $purchasesPercentage = $totalAmount > 0 ? round(($totalPurchasesAmount / $totalAmount) * 100) : 0;

        return [
            'total_customers' => $totalCustomers,
            'total_suppliers' => $totalSuppliers,
            'total_sales_amount' => $totalSalesAmount,
            'total_purchases_amount' => $totalPurchasesAmount,
            'total_transactions' => $totalTransactions,
            'average_transaction' => round($averageTransaction, 2),
            'sales_percentage' => $salesPercentage,
            'purchases_percentage' => $purchasesPercentage,
            'total_amount' => $totalAmount,
        ];
    }

    // New method for individual customer ledger
    public function customerLedger($id, Request $request)
    {
        $startDate = $request->start_date ?? '';
        $endDate = $request->end_date ?? '';
        $search = $request->search ?? '';

        $customer = Customer::findOrFail($id);

        // Load sales with optional filtering
        $salesQuery = $customer->sales();

        if ($startDate) {
            $salesQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $salesQuery->whereDate('created_at', '<=', $endDate);
        }
        if ($search) {
            $salesQuery->where('invoice_number', 'like', "%{$search}%");
        }

        $sales = $salesQuery->get();

        // Calculate customer-specific stats
        $totalSales = $sales->sum('grand_total');
        $totalTransactions = $sales->count();
        $averageSale = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;

        // Prepare data for charts
        $monthlySales = $sales->groupBy(function ($sale) {
            return $sale->created_at->format('M Y');
        })->map(function ($monthSales) {
            return $monthSales->sum('grand_total');
        });

        // Calculate payment methods distribution
        $paymentMethods = $sales->groupBy('payment_method')->map->sum('grand_total');

        $balance = $customer->balance ?? 0; 

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'customer' => $customer,
                'sales' => $sales,
                'stats' => [
                    'total_sales' => $totalSales,
                    'total_transactions' => $totalTransactions,
                    'average_sale' => round($averageSale, 2),
                    'balance' => $balance,
                ],
                'chart_data' => [
                    'monthly_sales' => $monthlySales,
                    'payment_methods' => $paymentMethods,
                ],
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'search' => $search,
                ],
            ]);
        }

        return Inertia::render('Ledger/Customer', [
            'customer' => $customer,
            'sales' => $sales,
            'stats' => [
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'average_sale' => round($averageSale, 2),
                'balance' => $balance,
            ],
            'chart_data' => [
                'monthly_sales' => $monthlySales,
                'payment_methods' => $paymentMethods,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ],
        ]);
    }

    // New method for individual supplier ledger
    public function supplierLedger($id, Request $request)
    {
        $startDate = $request->start_date ?? '';
        $endDate = $request->end_date ?? '';
        $search = $request->search ?? '';

        $supplier = Supplier::findOrFail($id);

        // Load purchases with optional filtering
        $purchasesQuery = $supplier->purchases();

        if ($startDate) {
            $purchasesQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $purchasesQuery->whereDate('created_at', '<=', $endDate);
        }
        if ($search) {
            $purchasesQuery->where('invoice_number', 'like', "%{$search}%");
        }

        $purchases = $purchasesQuery->get();

        // Calculate supplier-specific stats
        $totalPurchases = $purchases->sum('grand_total');
        $totalTransactions = $purchases->count();
        $averagePurchase = $totalTransactions > 0 ? $totalPurchases / $totalTransactions : 0;

        // Prepare data for charts
        $monthlyPurchases = $purchases->groupBy(function ($purchase) {
            return $purchase->created_at->format('M Y');
        })->map(function ($monthPurchases) {
            return $monthPurchases->sum('grand_total');
        });

        // Calculate payment methods distribution
        $paymentMethods = $purchases->groupBy('payment_method')->map->sum('grand_total');

        $balance = $supplier->balance ?? 0; 

        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'supplier' => $supplier,
                'purchases' => $purchases,
                'stats' => [
                    'total_purchases' => $totalPurchases,
                    'total_transactions' => $totalTransactions,
                    'average_purchase' => round($averagePurchase, 2),
                    'balance' => $balance,
                ],
                'chart_data' => [
                    'monthly_purchases' => $monthlyPurchases,
                    'payment_methods' => $paymentMethods,
                ],
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'search' => $search,
                ],
            ]);
        }

        return Inertia::render('Ledger/Supplier', [
            'supplier' => $supplier,
            'purchases' => $purchases,
            'stats' => [
                'total_purchases' => $totalPurchases,
                'total_transactions' => $totalTransactions,
                'average_purchase' => round($averagePurchase, 2),
                'balance' => $balance,
            ],
            'chart_data' => [
                'monthly_purchases' => $monthlyPurchases,
                'payment_methods' => $paymentMethods,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ],
        ]);
    }

   
}
