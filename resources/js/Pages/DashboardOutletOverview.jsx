import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    Filter,
    BarChart3,
    PieChart,
    Activity,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Clock,
    RefreshCw,
    Store,
    LogIn,
    Eye,
    ArrowRight
} from 'lucide-react';

export default function Dashboard() {
    const { 
        dashboardData, 
        totalSales, 
        totalPaid, 
        totalDue, 
        totalOrders,
        totalExpenses,
        isShadowUser,
        isLoggedIntoOutlet,
        currentOutlet 
    } = usePage().props;

    const [timeRange, setTimeRange] = useState('today');
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(dashboardData);

    const fetchDashboardData = async (range) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/dashboard/data/${range}`);
            const result = await response.json();
            if (result.success) {
                setData(result.dashboardData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(timeRange);
    }, [timeRange]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('BDT', '৳');
    };

    // Calculate growth percentage
    const calculateGrowth = (current, previous) => {
        if (previous === 0) return 100;
        return ((current - previous) / previous) * 100;
    };

    // Time range options
    const timeRangeOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'year', label: 'This Year' },
    ];

    // If not logged into outlet, show outlet overview
    if (!isLoggedIntoOutlet) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Head title="Outlet Overview" />
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center py-12">
                            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Outlet Overview Dashboard</h1>
                            <p className="text-gray-600 mb-6">
                                You are currently viewing the outlet overview. Please select an outlet to access detailed analytics.
                            </p>
                            <Link
                                href={route('outlets.index')}
                                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                <Store className="w-5 h-5 mr-2" />
                                Select Outlet
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Dashboard" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                                <div className="flex items-center mt-2">
                                    <Store className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600">
                                        {currentOutlet?.name || 'Outlet Dashboard'}
                                    </span>
                                    {isShadowUser && (
                                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            Shadow Mode
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    {timeRangeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setTimeRange(option.value)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                timeRange === option.value
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => fetchDashboardData(timeRange)}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(data.periodSales || 0)}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        {data.salesGrowth >= 0 ? (
                                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                        )}
                                        <span className={`text-sm font-medium ${data.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {data.salesGrowth?.toFixed(1) || 0}%
                                        </span>
                                        <span className="text-sm text-gray-500 ml-2">vs previous</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {(data.orderAnalytics?.totalOrders || 0).toLocaleString()}
                                    </p>
                                    <div className="mt-2">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                            <span>{data.orderAnalytics?.completedOrders || 0} completed</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Customers</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {(data.activeCustomers || 0).toLocaleString()}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {data.conversionRate?.toFixed(1) || 0}%
                                        </span>
                                        <span className="text-sm text-gray-500 ml-2">conversion rate</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(data.inventoryValue || 0)}
                                    </p>
                                    <div className="mt-2">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
                                            <span>{data.lowStockItems || 0} low stock</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl">
                                    <Package className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts and Detailed Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sales Chart */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Sales Overview</h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Sales performance for {timeRange}
                                        </p>
                                    </div>
                                    <BarChart3 className="w-6 h-6 text-gray-400" />
                                </div>
                                
                                {/* Chart will be implemented with a chart library */}
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                                    <div className="text-center">
                                        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">Sales chart will be displayed here</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Total: {formatCurrency(data.periodSales || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Status */}
                        <div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Completed</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {data.orderAnalytics?.completedOrders || 0}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Processing</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {data.orderAnalytics?.processingOrders || 0}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Pending</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {data.orderAnalytics?.pendingOrders || 0}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Cancelled</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {data.orderAnalytics?.cancelledOrders || 0}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Returned</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {data.orderAnalytics?.returnedOrders || 0}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {data.orderAnalytics?.totalOrders || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Profit Margin</h3>
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {data.profitMargin?.toFixed(1) || 0}%
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Based on current period</p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Average Order Value</h3>
                                <CreditCard className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(data.averageOrderValue || 0)}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Per order</p>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Return Rate</h3>
                                <AlertCircle className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {data.returnRate?.toFixed(1) || 0}%
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Of total orders</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Quick Actions</h3>
                                    <p className="text-gray-600 mt-1">Frequently used actions</p>
                                </div>
                                <Activity className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <Link
                                    href={route('sales.create')}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <ShoppingCart className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="font-medium text-gray-900">New Sale</p>
                                    <p className="text-sm text-gray-500 mt-1">Create invoice</p>
                                </Link>
                                
                                <Link
                                    href={route('product.add')}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="font-medium text-gray-900">Add Product</p>
                                    <p className="text-sm text-gray-500 mt-1">Add new item</p>
                                </Link>
                                
                                <Link
                                    href={route('customer.index')}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
                                >
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <p className="font-medium text-gray-900">Add Customer</p>
                                    <p className="text-sm text-gray-500 mt-1">New customer</p>
                                </Link>
                                
                                <Link
                                    href={route('outlets.index')}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
                                >
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <Store className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <p className="font-medium text-gray-900">Switch Outlet</p>
                                    <p className="text-sm text-gray-500 mt-1">Change outlet</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}