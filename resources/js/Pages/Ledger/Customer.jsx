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
  Users,
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
  TrendingDown,
  MoreVertical,
  Printer,
  Shield,
  Clock,
  Check,
  X,
  BanknoteIcon
} from "lucide-react";
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

export default function CustomerLedger({ 
  customer = null, 
  sales = [], 
  stats = {}, 
  chart_data = {}, 
  filters = {} 
}) {
  const { auth } = usePage().props;
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedSale, setSelectedSale] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [paymentStats, setPaymentStats] = useState({});
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [paymentChartData, setPaymentChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Due Clearance Modal States
  const [showDueClearance, setShowDueClearance] = useState(false);
  const [dueAmount, setDueAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentForm, setPaymentForm] = useState({
    paid_amount: "",
    payment_type: "cash",
    notes: "",
  });

  // Initialize filter form
  const filterForm = useForm({
    search: filters.search || "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  // Check if data is loaded
  useEffect(() => {
    if (customer) {
      setIsLoading(false);
    }
  }, [customer]);

  // Prepare chart data when component mounts or data changes
  useEffect(() => {
    if (!customer) return;

    // Prepare monthly sales chart
    if (chart_data.monthly_sales) {
      const monthlyLabels = Object.keys(chart_data.monthly_sales);
      const monthlyValues = Object.values(chart_data.monthly_sales);
      
      setMonthlyChartData({
        labels: monthlyLabels,
        datasets: [
          {
            label: 'Monthly Sales',
            data: monthlyValues,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgb(59, 130, 246)',
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
        'rgba(34, 197, 94, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(59, 130, 246, 0.8)',
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
  }, [chart_data, customer]);

  const handleFilter = () => {
    if (!customer) return;
    
    const queryParams = {};
    
    if (filterForm.data.search.trim()) {
      queryParams.search = filterForm.data.search.trim();
    }
    
    if (filterForm.data.start_date) {
      queryParams.start_date = filterForm.data.start_date;
    }
    
    if (filterForm.data.end_date) {
      queryParams.end_date = filterForm.data.end_date;
    }

    router.get(route("ledgers.index", { id: customer.id }), queryParams, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    if (!customer) return;
    
    filterForm.setData({
      search: "",
      start_date: "",
      end_date: "",
    });
    setTimeout(() => {
      router.get(route("ledgers.index", { id: customer.id }), {}, {
        preserveScroll: true,
        preserveState: true,
      });
    }, 0);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0';
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    if (!customer) return;
    
    if (exportFormat === 'pdf') {
      window.print();
    } else if (exportFormat === 'csv') {
      const headers = ['Invoice No', 'Date', 'Amount', 'Payment Method', 'Status'];
      const csvData = [
        headers,
        ...sales.map(sale => [
          sale.invoice_number,
          formatDate(sale.created_at),
          sale.grand_total,
          sale.payment_method,
          sale.status || 'paid'
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customer?.customer_name || 'customer'}_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

    // Due Clearance Functions
    const handleDueClearanceOpen = () => {
      const totalDue = sales.reduce((sum, sale) => {
        const saleDue = sale.grand_total - (sale.paid_amount || 0);
        return sum + Math.max(0, saleDue);
      }, 0);
      
      setDueAmount(totalDue);
      setAdvanceAmount(customer?.advance_amount || 0);
      setPaymentForm({
        paid_amount: Math.min(totalDue, customer?.advance_amount > 0 ? customer.advance_amount : totalDue).toString(),
        payment_type: "cash",
        notes: "",
      });
      setShowDueClearance(true);
    };


    const handlePaymentSubmit = (e) => {
      e.preventDefault();
      
      const paidAmount = parseFloat(paymentForm.paid_amount) || 0;
      if (paidAmount <= 0) {
        alert("Please enter a valid payment amount");
        return;
      }
      
      const maxPayable = Math.min(dueAmount, Math.max(0, advanceAmount + dueAmount));
      if (paidAmount > maxPayable) {
        alert(`Maximum payable amount is ৳${formatCurrency(maxPayable)}`);
        return;
      }

      router.post(route('clearDue.store', customer.id), {
        paid_amount: paidAmount,
        type: 'customer',
        payment_type: paymentForm.payment_type,
      }, {
        onSuccess: () => {
          afterPaymentSuccess(paidAmount);
          alert(`Payment of ৳${formatCurrency(paidAmount)} processed successfully!`);

        },
        onError: (errors) => {
          alert(errors.paid_amount || 'An error occurred while processing the payment.');
        }
      });
  
      
      // Reset form and close modal
      setPaymentForm({
        paid_amount: "",
        payment_type: "cash",
        notes: "",
      });
      setShowDueClearance(false);
      
      router.reload();
    };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateRemainingBalance = () => {
    const paid = parseFloat(paymentForm.paid_amount) || 0;
    const remainingDue = dueAmount - paid;
    const newAdvance = advanceAmount - paid;
    
    return {
      remainingDue: Math.max(0, remainingDue),
      newAdvance: newAdvance
    };
  };

  // Due Clearance Modal Component
  const DueClearanceModal = () => {
    const { remainingDue, newAdvance } = calculateRemainingBalance();
    const paidAmount = parseFloat(paymentForm.paid_amount) || 0;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Clear Due Amount</h3>
                  <p className="text-sm text-gray-600">Process customer payment</p>
                </div>
              </div>
              <button
                onClick={() => setShowDueClearance(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Customer Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{customer?.customer_name}</h4>
                  <p className="text-sm text-gray-600">{customer?.phone || 'No phone'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Due</p>
                  <p className="text-xl font-bold text-rose-600">৳{formatCurrency(dueAmount)}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Current Advance</p>
                  <p className={`text-xl font-bold ${advanceAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ৳{formatCurrency(advanceAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePaymentSubmit}>
              {/* Paid Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Amount (৳)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="paid_amount"
                    value={paymentForm.paid_amount}
                    onChange={handlePaymentInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    max={Math.max(0, dueAmount)}
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ৳{formatCurrency(Math.min(dueAmount, Math.max(0, advanceAmount + dueAmount)))}
                </p>
              </div>

              {/* Payment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  name="payment_type"
                  value={paymentForm.payment_type}
                  onChange={handlePaymentInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="advance_adjustment">Advance Adjustment</option>
                </select>
              </div>


              {/* Balance Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3">Balance Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Amount</span>
                    <span className="font-medium text-gray-900">৳{formatCurrency(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Remaining Due</span>
                    <span className={`font-medium ${remainingDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ৳{formatCurrency(remainingDue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Advance Balance</span>
                    <span className={`font-medium ${newAdvance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ৳{formatCurrency(newAdvance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDueClearance(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 
                           font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 
                           text-white font-medium rounded-lg hover:from-emerald-700 
                           hover:to-emerald-800 transition-all"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const hasActiveFilters = filterForm.data.search || filterForm.data.start_date || filterForm.data.end_date;

  // Show loading state
  if (isLoading || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={`${customer?.customer_name || 'Customer'} Ledger`} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href={route("ledgers.index")}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Ledger</h1>
                <p className="text-gray-600 mt-1">
                  Detailed transaction history and analytics
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
              {/* Due Clearance Button */}
              <a
                onClick={handleDueClearanceOpen}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Clear Due
              </a>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {customer?.customer_name || 'Unknown Customer'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {customer?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {customer.phone}
                      </div>
                    )}
                    {customer?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {customer.email}
                      </div>
                    )}
                    {customer?.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="max-w-xs truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${(customer?.advance_amount || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ৳{formatCurrency(customer?.advance_amount || 0)}
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
              Filter Transactions
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
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                          font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
            title="Total Sales"
            value={`৳${formatCurrency(stats?.total_sales || 0)}`}
            subtitle={`${sales?.length || 0} transactions`}
            icon={DollarSign}
            color="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600"
          />
          
          <StatCard
            title="Total Transactions"
            value={stats?.total_transactions || 0}
            subtitle="All time transactions"
            icon={Receipt}
            color="bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600"
          />
          
          <StatCard
            title="Total Due Amount"
            value={`৳${formatCurrency(stats?.total_due || 0)}`}
            subtitle="due amount of sales"
            icon={TrendingUp}
            color="bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-600"
          />
          
          <StatCard
            title="Current Balance"
            value={`৳${formatCurrency(customer?.advance_amount || 0)}`}
            subtitle={(customer?.advance_amount || 0) >= 0 ? "Customer credit" : "Customer debit"}
            icon={Wallet}
            color={(customer?.advance_amount || 0) >= 0 ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-600" : "bg-gradient-to-br from-rose-500/10 to-rose-600/10 text-rose-600"}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          {monthlyChartData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Monthly Sales Trend
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Sales performance over time
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

        {/* Transactions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Transactions ({sales?.length || 0})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'transactions' ? (
              sales?.length > 0 ? (
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
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                         Paid Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {sale.invoice_no || sale.id}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(sale.created_at)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(sale.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {sale.items?.length || 0} items
                            </div>
                            {sale.items?.[0] && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {sale.items[0].product?.name } ({sale.items[0].variant?.sku})
                                {sale.items?.length > 1 && ` +${sale.items.length - 1} more`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getPaymentMethodBadge(sale.payment_type)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getStatusBadge(sale.status)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              ৳{formatCurrency(sale.grand_total)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              ৳{formatCurrency(sale.paid_amount)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link
                                href={route("sales.show", { sale: sale.id })}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No transactions found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {hasActiveFilters
                      ? "Try adjusting your search filters to find transactions."
                      : "This customer doesn't have any transactions yet."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )
            ) : (
              /* Customer Details Tab */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Phone</span>
                        <span className="text-sm text-gray-900">
                          {customer?.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Email</span>
                        <span className="text-sm text-gray-900">
                          {customer?.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Address</span>
                        <span className="text-sm text-gray-900 text-right max-w-xs">
                          {customer?.address || 'Not provided'}
                        </span>
                      </div>
                      {customer?.company_name && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Company</span>
                          <span className="text-sm text-gray-900">{customer.company_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Transaction Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">First Purchase</span>
                        <span className="text-sm font-medium text-gray-900">
                          {sales?.length > 0 ? formatDate(sales[0]?.created_at) : 'No purchases yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Purchase</span>
                        <span className="text-sm font-medium text-gray-900">
                          {sales?.length > 0 ? formatDate(sales[sales.length - 1]?.created_at) : 'No purchases yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Purchase Frequency</span>
                        <span className="text-sm font-medium text-gray-900">
                          {sales?.length || 0} transaction{sales?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Customer Since</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(customer?.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Notes</h4>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Add Note
                    </button>
                  </div>
                  <div className="mt-3">
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add notes about this customer..."
                      defaultValue={customer?.notes || ''}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Due Clearance Modal */}
      {showDueClearance && <DueClearanceModal />}
    </div>
  );
}