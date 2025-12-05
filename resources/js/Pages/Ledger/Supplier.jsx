import React, { useState, useEffect } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { 
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  User,
  TrendingUp,
  DollarSign,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart,
  RefreshCw,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Receipt,
  Wallet,
  Truck,
  Package,
  MoreVertical,
  Printer,
  Shield,
  Clock,
  Check,
  X,
  TrendingDown,
  ShoppingBag
} from "lucide-react";
import Pagination from "../../components/Pagination";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function SupplierLedger({ 
  supplier = null, 
  purchases = {}, 
  stats = {}, 
  chart_data = {}, 
  filters = {} 
}) {
  const { auth } = usePage().props;
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [paymentStats, setPaymentStats] = useState({});
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [paymentChartData, setPaymentChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize filter form with query string values
  const filterForm = useForm({
    search: filters.search || "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
    page: filters.page || 1,
  });

  // Check if data is loaded
  useEffect(() => {
    if (supplier) {
      setIsLoading(false);
    }
  }, [supplier]);

  // Prepare chart data when component mounts or data changes
  useEffect(() => {
    if (!supplier) return;

    // Prepare monthly purchases chart
    if (chart_data.monthly_purchases) {
      const monthlyLabels = Object.keys(chart_data.monthly_purchases);
      const monthlyValues = Object.values(chart_data.monthly_purchases);
      
      setMonthlyChartData({
        labels: monthlyLabels,
        datasets: [
          {
            label: 'Monthly Purchases',
            data: monthlyValues,
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ]
      });
    }

    // Prepare payment methods chart
    if (chart_data.payment_methods) {
      const paymentLabels = Object.keys(chart_data.payment_methods);
      const paymentValues = Object.values(chart_data.payment_methods);
      
      // Generate colors based on number of payment methods
      const backgroundColors = [
        'rgba(249, 115, 22, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(234, 179, 8, 0.8)',
      ];
      
      setPaymentChartData({
        labels: paymentLabels,
        datasets: [
          {
            data: paymentValues,
            backgroundColor: backgroundColors.slice(0, paymentLabels.length),
            borderWidth: 1,
            borderColor: '#ffffff',
          }
        ]
      });

      // Calculate payment method percentages
      const total = paymentValues.reduce((sum, val) => sum + val, 0);
      const paymentPercentages = {};
      paymentLabels.forEach((method, index) => {
        paymentPercentages[method] = total > 0 ? ((paymentValues[index] / total) * 100).toFixed(1) : 0;
      });
      setPaymentStats(paymentPercentages);
    }
  }, [chart_data, supplier]);

  const handleFilter = () => {
    if (!supplier) return;
    
    const queryParams = {
      page: 1, // Reset to first page when filtering
    };
    
    if (filterForm.data.search.trim()) {
      queryParams.search = filterForm.data.search.trim();
    }
    
    if (filterForm.data.start_date) {
      queryParams.start_date = filterForm.data.start_date;
    }
    
    if (filterForm.data.end_date) {
      queryParams.end_date = filterForm.data.end_date;
    }

    router.get(route("ledgers.index", { id: supplier.id }), queryParams, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    if (!supplier) return;
    
    filterForm.setData({
      search: "",
      start_date: "",
      end_date: "",
      page: 1,
    });
    
    router.get(route("ledgers.index", { id: supplier.id }), {}, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handlePageChange = (page) => {
    if (!supplier) return;
    
    filterForm.setData('page', page);
    
    const queryParams = {
      page,
      ...(filterForm.data.search && { search: filterForm.data.search }),
      ...(filterForm.data.start_date && { start_date: filterForm.data.start_date }),
      ...(filterForm.data.end_date && { end_date: filterForm.data.end_date }),
    };

    router.get(route("ledgers.index", { id: supplier.id }), queryParams, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': {
        label: 'Paid',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle
      },
      'pending': {
        label: 'Pending',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Clock
      },
      'overdue': {
        label: 'Overdue',
        color: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: AlertCircle
      },
      'cancelled': {
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle
      },
      'received': {
        label: 'Received',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle
      },
      'partial': {
        label: 'Partial',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle
      }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      'cash': {
        label: 'Cash',
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      'card': {
        label: 'Card',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'bank_transfer': {
        label: 'Bank Transfer',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'check': {
        label: 'Check',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'credit': {
        label: 'Credit',
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      'online': {
        label: 'Online',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      }
    };

    const config = methodConfig[method?.toLowerCase()] || {
      label: method || 'Unknown',
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  const exportData = () => {
    if (!supplier) return;
    
    if (exportFormat === 'pdf') {
      window.print();
    } else if (exportFormat === 'csv') {
      // Generate CSV export
      const purchasesData = purchases.data || purchases || [];
      const headers = ['Invoice No', 'Date', 'Amount', 'Payment Method', 'Status', 'Items Count'];
      const csvData = [
        headers,
        ...purchasesData.map(purchase => [
          purchase.invoice_number,
          formatDate(purchase.created_at),
          purchase.grand_total,
          purchase.payment_method,
          purchase.status || 'received',
          purchase.items?.length || 0
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${supplier?.name || 'supplier'}_purchases_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const hasActiveFilters = filterForm.data.search || filterForm.data.start_date || filterForm.data.end_date;
  const purchasesData = purchases?.data || purchases || [];
  const totalItems = purchases?.total || purchasesData.length;

  // Show loading state
  if (isLoading || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={`${supplier?.name || 'Supplier'} Ledger`} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href={route("ledgers.index")} // FIXED: Changed from "ledgers.supplier" to "ledgers.index"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Supplier Ledger</h1>
                <p className="text-gray-600 mt-1">
                  Detailed purchase history and analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
              <button
                onClick={exportData}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => window.print()}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-300"
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Supplier Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {supplier?.name || 'Unknown Supplier'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {supplier?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {supplier.email}
                      </div>
                    )}
                    {supplier?.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="max-w-xs truncate">{supplier.address}</span>
                      </div>
                    )}
                    {supplier?.company_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        {supplier.company_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${(supplier?.advance_amount || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ৳{formatCurrency(supplier?.advance_amount || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-1">Current Balance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Purchases
            </h3>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  value={filterForm.data.search}
                  onChange={(e) => filterForm.setData("search", e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                  placeholder="Search invoice number..."
                  className="w-full h-11 pl-9 pr-4 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            bg-gray-50 text-gray-700 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filterForm.data.start_date}
                  onChange={(e) => filterForm.setData("start_date", e.target.value)}
                  className="w-full h-11 pl-9 pr-4 border border-gray-300 rounded-lg bg-gray-50
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filterForm.data.end_date}
                  onChange={(e) => filterForm.setData("end_date", e.target.value)}
                  className="w-full h-11 pl-9 pr-4 border border-gray-300 rounded-lg bg-gray-50
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleFilter}
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-orange-700 text-white 
                          font-medium rounded-lg hover:from-orange-700 hover:to-orange-800 
                          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                          transition-all duration-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Purchases"
            value={`৳${formatCurrency(stats?.total_purchases || 0)}`}
            subtitle={`${totalItems} purchase${totalItems !== 1 ? 's' : ''}`}
            icon={ShoppingBag}
            color="bg-gradient-to-br from-orange-500/10 to-orange-600/10 text-orange-600"
          />
          
          <StatCard
            title="Total Transactions"
            value={stats?.total_transactions || 0}
            subtitle="All time purchases"
            icon={Receipt}
            color="bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600"
          />
          
          <StatCard
            title="Average Purchase"
            value={`৳${formatCurrency(stats?.average_purchase || 0)}`}
            subtitle="Per transaction average"
            icon={TrendingUp}
            color="bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-600"
          />
          
          <StatCard
            title="Current Balance"
            value={`৳${formatCurrency(supplier?.advance_amount || 0)}`}
            subtitle={(supplier?.advance_amount || 0) >= 0 ? "Supplier credit" : "Supplier debit"}
            icon={Wallet}
            color={(supplier?.advance_amount || 0) >= 0 ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600" : "bg-gradient-to-br from-rose-500/10 to-rose-600/10 text-rose-600"}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Purchases Chart */}
          {monthlyChartData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Monthly Purchases Trend
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Purchase performance over time
                  </p>
                </div>
              </div>
              <div className="h-64">
                <Line 
                  data={monthlyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '৳' + formatCurrency(value);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Payment Methods Chart */}
          {paymentChartData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Payment Methods
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Distribution by payment type
                  </p>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full max-w-xs">
                  <Pie 
                    data={paymentChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            boxWidth: 12,
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              {Object.keys(paymentStats).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(paymentStats).map(([method, percentage]) => (
                      <div key={method} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{method}</span>
                        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Purchases Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Purchases ({totalItems})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Supplier Details
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'transactions' ? (
              purchasesData.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Invoice No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {purchasesData.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {purchase.invoice_number || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(purchase.created_at)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(purchase.created_at)}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {purchase.items?.length || 0} items
                              </div>
                              {purchase.items?.[0] && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {purchase.items[0].product_name}
                                  {purchase.items?.length > 1 && ` +${purchase.items.length - 1} more`}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getPaymentMethodBadge(purchase.payment_method)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getStatusBadge(purchase.status)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                ৳{formatCurrency(purchase.grand_total)}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {/* <Link
                                  href={route("purchases.show", { purchase: purchase.id })}
                                  className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link> */}
                                <button
                                  onClick={() => setSelectedPurchase(purchase)}
                                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                  title="More Options"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {purchases?.meta && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <Pagination 
                        data={purchases} 
                        onPageChange={handlePageChange}
                        currentPage={filterForm.data.page}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No purchases found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {hasActiveFilters
                      ? "Try adjusting your search filters to find purchases."
                      : "This supplier doesn't have any purchases yet."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-medium rounded-lg hover:from-orange-700 hover:to-orange-800"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )
            ) : (
              /* Supplier Details Tab */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Phone</span>
                        <span className="text-sm text-gray-900">
                          {supplier?.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Email</span>
                        <span className="text-sm text-gray-900">
                          {supplier?.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Address</span>
                        <span className="text-sm text-gray-900 text-right max-w-xs">
                          {supplier?.address || 'Not provided'}
                        </span>
                      </div>
                      {supplier?.company_name && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Company</span>
                          <span className="text-sm text-gray-900">{supplier.company_name}</span>
                        </div>
                      )}
                      {supplier?.contact_person && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Contact Person</span>
                          <span className="text-sm text-gray-900">{supplier.contact_person}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Purchase Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">First Purchase</span>
                        <span className="text-sm font-medium text-gray-900">
                          {purchasesData.length > 0 ? formatDate(purchasesData[0]?.created_at) : 'No purchases yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Purchase</span>
                        <span className="text-sm font-medium text-gray-900">
                          {purchasesData.length > 0 ? formatDate(purchasesData[purchasesData.length - 1]?.created_at) : 'No purchases yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Purchase Frequency</span>
                        <span className="text-sm font-medium text-gray-900">
                          {totalItems} purchase{totalItems !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Supplier Since</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(supplier?.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Notes</h4>
                    <button className="text-sm font-medium text-orange-600 hover:text-orange-700">
                      Add Note
                    </button>
                  </div>
                  <div className="mt-3">
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Add notes about this supplier..."
                      defaultValue={supplier?.notes || ''}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}