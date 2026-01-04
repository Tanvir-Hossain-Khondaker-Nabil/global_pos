import { Head, usePage, router } from "@inertiajs/react";
import { 
    TrendingUp, 
    DollarSign, 
    ShoppingCart, 
    Package, 
    Users, 
    BarChart3, 
    Download, 
    RefreshCw, 
    ArrowUpRight,
    ArrowDownRight,
    BarChart2,
    Percent,
    Target,
    CheckCircle,
    AlertCircle,
    Truck,
    Activity
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function Dashboard({
    totalSales,
    totalSalespyament,
    totalselas,
    totalexpense,
    totalDue,
    totalPaid,
    dashboardData = {}
}) {
    const { auth, appName } = usePage().props;
    const { t, locale } = useTranslation();
    
    const [timeRange, setTimeRange] = useState('today');
    const [loading, setLoading] = useState(false);

    // Safety destructuring with defaults
    const {
        todaySales = 0,
        yesterdaySales = 0,
        salesGrowth = 0,
        totalCustomers = 0,
        activeCustomers = 0,
        conversionRate = 0,
        inventoryValue = 0,
        lowStockItems = 0,
        outOfStockItems = 0,
        pendingOrders = 0,
        completedOrders = 0,
        returnRate = 0,
        profitMargin = 0,
        monthlySalesData = {},
        monthLabels = [],
        topProducts = [],
        recentActivities = [],
        averageOrderValue = 0,
        customerRetentionRate = 85.5,
        stockTurnoverRatio = 0
    } = dashboardData;

    // Quick stats cards with Industrial Red/Graphite theme
    const quickStats = [
        {
            id: 1,
            title: t('dashboard.total_sales', 'Total Sales'),
            value: `৳${Number(totalSales || 0).toLocaleString()}`,
            change: salesGrowth || 0,
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        },
        {
            id: 2,
            title: t('dashboard.total_payment', 'Total Payment'),
            value: `৳${Number(totalPaid || 0).toLocaleString()}`,
            change: totalPaid > 0 ? Math.min((totalPaid / totalSales * 100) || 0, 100) : 0,
            icon: <DollarSign className="h-5 w-5" />,
            color: 'text-gray-700',
            bgColor: 'bg-gray-100'
        },
        {
            id: 3,
            title: t('dashboard.total_due', 'Total Due'),
            value: `৳${Number(totalDue || 0).toLocaleString()}`,
            change: totalDue > 0 ? -Math.min((totalDue / totalSales * 100) || 0, 100) : 0,
            icon: <AlertCircle className="h-5 w-5" />,
            color: 'text-gray-900',
            bgColor: 'bg-slate-100'
        },
        {
            id: 4,
            title: t('dashboard.total_orders', 'Total Orders'),
            value: `${Number(totalselas || 0).toLocaleString()}`,
            change: 0,
            icon: <ShoppingCart className="h-5 w-5" />,
            color: 'text-red-700',
            bgColor: 'bg-orange-50'
        }
    ];

    const performanceIndicators = [
        {
            id: 1,
            title: t('dashboard.profit_margin', 'Profit Margin'),
            value: `${profitMargin?.toFixed(1) || 0}%`,
            target: '25%',
            status: profitMargin >= 25 ? 'excellent' : profitMargin >= 15 ? 'good' : 'warning',
            icon: <Percent className="h-4 w-4" />
        },
        {
            id: 2,
            title: t('dashboard.conversion_rate', 'Conversion Rate'),
            value: `${conversionRate?.toFixed(1) || 0}%`,
            target: '25%',
            status: conversionRate >= 25 ? 'excellent' : conversionRate >= 15 ? 'good' : 'warning',
            icon: <Target className="h-4 w-4" />
        },
        {
            id: 3,
            title: t('dashboard.order_fulfillment', 'Order Fulfillment'),
            value: `${Math.round((completedOrders / (completedOrders + pendingOrders || 1) * 100) || 0)}%`,
            target: '95%',
            status: (completedOrders / (completedOrders + pendingOrders || 1) * 100) >= 95 ? 'excellent' : 'good',
            icon: <CheckCircle className="h-4 w-4" />
        },
        {
            id: 4,
            title: t('dashboard.stock_availability', 'Stock Availability'),
            value: `${100 - Math.round((outOfStockItems / (lowStockItems + outOfStockItems || 1) * 100) || 0)}%`,
            target: '98%',
            status: (100 - Math.round((outOfStockItems / (lowStockItems + outOfStockItems || 1) * 100) || 0)) >= 98 ? 'excellent' : 'good',
            icon: <Package className="h-4 w-4" />
        }
    ];

    const timeRanges = [
        { id: 'today', label: t('dashboard.today', 'Today') },
        { id: 'week', label: t('dashboard.this_week', 'Week') },
        { id: 'month', label: t('dashboard.this_month', 'Month') },
        { id: 'year', label: t('dashboard.this_year', 'Year') }
    ];

    const handleTimeRangeChange = async (range) => {
        setTimeRange(range);
        setLoading(true);
        try {
            const response = await fetch(`/dashboard/data/${range}`);
            const data = await response.json();
            if (data.success) {
                router.reload({
                    only: ['dashboardData'],
                    data: { timeRange: range },
                    preserveScroll: true,
                    onFinish: () => setLoading(false)
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const refreshDashboard = () => {
        setLoading(true);
        router.reload({
            only: ['dashboardData', 'totalSales', 'totalPaid', 'totalDue', 'totalselas', 'totalexpense'],
            preserveScroll: true,
            onSuccess: () => setLoading(false),
            onError: () => setLoading(false)
        });
    };

    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-BD', {
            style: 'currency', currency: 'BDT', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(numAmount);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'excellent': return 'text-red-600 bg-red-50';
            case 'good': return 'text-gray-700 bg-gray-100';
            case 'warning': return 'text-amber-600 bg-amber-100';
            case 'critical': return 'text-red-900 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getChartMaxValue = () => {
        const values = Object.values(monthlySalesData || {});
        return values.length > 0 ? Math.max(...values) : 1;
    };

    return (
        <div className={`space-y-6 pb-8 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <Head title={t('dashboard.title', 'Dashboard')} />
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-lg text-gray-900 font-semibold">
                        {t('dashboard.title', 'Dashboard')}
                    </h1>
                    <p className="text-xs text-gray-500">
                        {t('dashboard.welcome_message', 'Hi, :name. Welcome back to :app :role!', {
                            name: auth.name,
                            app: appName,
                            role: auth.role
                        })}
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        {timeRanges.map((range) => (
                            <button
                                key={range.id}
                                onClick={() => handleTimeRangeChange(range.id)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-md ${
                                    timeRange === range.id ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={refreshDashboard} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
                {quickStats.map((stat) => (
                    <div key={stat.id} className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
                                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                <div className="mt-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* FIXED GRAPH SECTION */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="text-red-600" size={18} />
                                {t('dashboard.sales_distribution', 'Sales Distribution')}
                            </h3>
                        </div>
                        
                        {/* Bars Container: Flex items-end is key for visibility */}
                        <div className="h-64 flex items-end justify-between gap-2 px-2 border-b border-gray-100">
                            {monthLabels.length > 0 ? monthLabels.map((month) => {
                                const val = monthlySalesData[month] || 0;
                                const max = getChartMaxValue();
                                const height = (val / max) * 100;
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center group h-full justify-end">
                                        <div 
                                            className="w-full max-w-[28px] bg-gray-100 group-hover:bg-red-600 rounded-t-md transition-all duration-500 relative"
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                {formatCurrency(val)}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-2 mb-[-24px]">{month.substring(0,3)}</span>
                                    </div>
                                );
                            }) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs italic">No data found</div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {performanceIndicators.map((indicator) => (
                            <div key={indicator.id} className={`p-4 rounded-2xl border ${getStatusColor(indicator.status)} flex flex-col items-center text-center shadow-sm`}>
                                <div className="mb-2 opacity-80">{indicator.icon}</div>
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 mb-1">{indicator.title}</span>
                                <span className="text-lg font-black">{indicator.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-gray-900 text-white rounded-2xl shadow-xl p-6 border-t-4 border-red-600">
                        <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-6">{t('dashboard.top_performers', 'Top Performers')}</h3>
                        <div className="space-y-4">
                            {topProducts.slice(0, 5).map((product, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-[10px] font-black">0{idx+1}</div>
                                        <p className="text-xs font-bold uppercase truncate max-w-[100px]">{product.name}</p>
                                    </div>
                                    <p className="text-xs font-black">{formatCurrency(product.sales)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button onClick={() => router.visit(route('sales.create'))} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-red-600 transition-all group">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-700">{t('dashboard.new_order', 'New Order')}</span>
                            <ShoppingCart size={16} className="text-gray-300 group-hover:text-red-600"/>
                        </button>
                        <button onClick={() => router.visit(route('warehouse.list'))} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all group">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-700">{t('dashboard.inventory', 'Inventory')}</span>
                            <Package size={16} className="text-gray-300 group-hover:text-gray-900"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">{t('dashboard.profit_analysis', 'Profit Analysis')}</span>
                    <span className="text-3xl font-black text-gray-900">{formatCurrency((totalSales || 0) - (totalexpense || 0))}</span>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('dashboard.received', 'Received')}</p>
                        <p className="text-sm font-black text-green-600">{formatCurrency(totalPaid || 0)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{t('dashboard.outstanding', 'Outstanding')}</p>
                        <p className="text-sm font-black text-red-600">{formatCurrency(totalDue || 0)}</p>
                    </div>
                </div>
                <button onClick={() => router.reload()} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all">
                    {t('dashboard.sync_data', 'Sync Data')}
                </button>
            </div>
        </div>
    );
}