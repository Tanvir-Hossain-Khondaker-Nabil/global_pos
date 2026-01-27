import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Plus, Printer, Trash2, Eye, Search, Check, X, DollarSign, AlertCircle, Wallet, Landmark, Smartphone, CreditCard, History, Filter, Calendar } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";

export default function SalesIndex({ sales, filters, isShadowUser, accounts }) {
    const { auth } = usePage().props;

    // Payment modal states
    const [selectedSale, setSelectedSale] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentErrors, setPaymentErrors] = useState({});
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paid_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: '',
        account_id: ''
    });

    // Responsive filter state
    const [showFilters, setShowFilters] = useState(false);

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
        status: filters.status || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
    });

    // Update selected account when account_id changes
    useEffect(() => {
        if (paymentData.account_id && accounts && accounts.length > 0) {
            const account = accounts.find(acc => acc.id == paymentData.account_id);
            setSelectedAccount(account || null);
        } else {
            setSelectedAccount(null);
        }
    }, [paymentData.account_id, accounts]);

    const handleFilter = () => {
        const queryParams = {};

        // Only add non-empty values to query params
        if (filterForm.data.search.trim()) queryParams.search = filterForm.data.search.trim();
        if (filterForm.data.status) queryParams.status = filterForm.data.status;
        if (filterForm.data.date_from) queryParams.date_from = filterForm.data.date_from;
        if (filterForm.data.date_to) queryParams.date_to = filterForm.data.date_to;

        router.get(route("salesPos.index", 'pos'), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const clearFilters = () => {
        filterForm.setData({
            search: "",
            status: "",
            date_from: "",
            date_to: "",
        });
        setTimeout(() => {
            router.get(route("salesPos.index", 'pos'), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }, 0);
    };

    // Open payment modal
    const openPaymentModal = (sale) => {
        console.log('Opening payment modal for sale:', sale);

        let defaultAccountId = '';
        if (accounts && accounts.length > 0) {
            // Find default account
            const defaultAccount = accounts.find(acc => acc.is_default);
            if (defaultAccount) {
                defaultAccountId = defaultAccount.id;
            } else {
                defaultAccountId = accounts[0]?.id || '';
            }
        }

        setSelectedSale(sale);
        setPaymentData({
            paid_amount: sale.due_amount > 0 ? sale.due_amount : 0,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            notes: '',
            account_id: defaultAccountId
        });
        setShowPaymentModal(true);
        setPaymentErrors({});
    };

    // Close payment modal
    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedSale(null);
        setSelectedAccount(null);
        setProcessingPayment(false);
        setPaymentErrors({});
    };

    // Handle payment input change
    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: name === 'paid_amount' ? parseFloat(value) || 0 : value
        }));
    };

    // Handle payment submission
    const handlePaymentSubmit = (e) => {
        e.preventDefault();

        if (!selectedSale) return;

        setProcessingPayment(true);
        setPaymentErrors({});

        // Validate before submitting
        const errors = {};

        if (paymentData.paid_amount <= 0) {
            errors.amount = "Please enter a payment amount";
        }

        if (paymentData.paid_amount > selectedSale.due_amount) {
            errors.paid_amount = "Payment cannot exceed due amount";
        }

        if (!paymentData.account_id) {
            errors.account_id = "Please select an account";
        }

        if (Object.keys(errors).length > 0) {
            setPaymentErrors(errors);
            setProcessingPayment(false);
            return;
        }

        router.post(route('sales.payments.store', { sale: selectedSale.id }), {
            sale_id: selectedSale.id,
            amount: paymentData.paid_amount,
            payment_date: paymentData.payment_date,
            payment_method: paymentData.payment_method,
            notes: paymentData.notes,
            account_id: paymentData.account_id
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                closePaymentModal();
                router.reload({ only: ['sales'] });
            },
            onError: (errors) => {
                console.error('Payment error:', errors);
                setPaymentErrors(errors);
                setProcessingPayment(false);
            }
        });
    };

    // Calculate item counts for each sale
    const getTotalItems = (sale) => {
        return sale.items?.reduce((total, item) => total + item.quantity, 0) || 0;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format number
    const formatNumber = (amount) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    // Get account icon
    const getAccountIcon = (type) => {
        switch (type) {
            case 'cash': return <Wallet size={14} className="text-green-600" />;
            case 'bank': return <Landmark size={14} className="text-blue-600" />;
            case 'mobile_banking': return <Smartphone size={14} className="text-purple-600" />;
            default: return <CreditCard size={14} />;
        }
    };

    const calculateTotals = () => {
        const salesData = sales.data || [];

        const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.grand_total || 0), 0);
        const totalPaid = salesData.reduce((sum, sale) => sum + parseFloat(sale.paid_amount || 0), 0);
        const totalDue = salesData.reduce((sum, sale) => sum + parseFloat(sale.due_amount || 0), 0);

        return {
            totalRevenue,
            totalPaid,
            totalDue,
            totalSales: salesData.length
        };
    };

    const totals = calculateTotals();
    const hasActiveFilters = filterForm.data.search || filterForm.data.status || filterForm.data.date_from || filterForm.data.date_to;

    // Check if payment button should be disabled
    const isPaymentDisabled = (sale) => {
        return sale.due_amount <= 0;
    };

    return (
        <div className="bg-white rounded-box p-3 md:p-4">
            <PageHeader
                title={isShadowUser ? "Sales History (POS)" : "Sales History (POS)"}
                subtitle={isShadowUser ? "View sales data" : "Manage your product sales"}
            >
                {/* Responsive Filter Section */}
                <div className="mb-4">
                    {/* Desktop/Tablet View (md and up) */}
                    <div className="hidden md:flex flex-col lg:flex-row items-start lg:items-center gap-3">
                        {/* Main filter row */}
                        <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center gap-2">
                            {/* Search Input */}
                            <div className="flex-1 min-w-[200px] max-w-[300px]">
                                <div className="join w-full">
                                    <input
                                        type="search"
                                        value={filterForm.data.search}
                                        onChange={(e) => filterForm.setData("search", e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search invoice or customer..."
                                        className="input input-sm input-bordered join-item w-full"
                                    />
                                    <button
                                        onClick={handleFilter}
                                        className="btn btn-sm bg-[#1e4d2b] text-white join-item"
                                        title="Search"
                                    >
                                        <Search size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="w-32">
                                <select
                                    value={filterForm.data.status}
                                    onChange={(e) => filterForm.setData("status", e.target.value)}
                                    className="select select-sm select-bordered w-full"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                    <option value="partially_returned">Partial Return</option>
                                </select>
                            </div>

                            {/* Date Range - For tablet and desktop */}
                            <div className="flex items-center gap-1">
                                <div className="relative">
                                    <Calendar size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={filterForm.data.date_from}
                                        onChange={(e) => filterForm.setData("date_from", e.target.value)}
                                        className="input input-sm input-bordered pl-8 w-32"
                                        title="From Date"
                                    />
                                </div>
                                <span className="text-gray-400">-</span>
                                <div className="relative">
                                    <Calendar size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={filterForm.data.date_to}
                                        onChange={(e) => filterForm.setData("date_to", e.target.value)}
                                        className="input input-sm input-bordered pl-8 w-32"
                                        title="To Date"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="btn btn-sm btn-ghost text-xs"
                                        title="Clear Filters"
                                    >
                                        Clear
                                    </button>
                                )}

                                <button
                                    onClick={handleFilter}
                                    className="btn btn-sm btn-primary"
                                    title="Apply Filters"
                                >
                                    <Filter size={14} />
                                </button>
                            </div>
                        </div>

                        {/* New Sale Button - Right side on desktop */}
                        <div className="lg:ml-auto">
                            <Link
                                className="btn bg-[#1e4d2b] hover:bg-[#1a4326] text-white btn-sm flex items-center gap-2"
                                href={route("sales.add")}
                            >
                                <Plus size={16} />
                                <span>New Sale</span>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile View (below md) */}
                    <div className="md:hidden space-y-2">
                        {/* Top Row: Search and New Sale */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <div className="join w-full">
                                    <input
                                        type="search"
                                        value={filterForm.data.search}
                                        onChange={(e) => filterForm.setData("search", e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search..."
                                        className="input input-sm input-bordered join-item w-full"
                                    />
                                    <button
                                        onClick={handleFilter}
                                        className="btn btn-sm bg-[#1e4d2b] text-white join-item"
                                    >
                                        <Search size={14} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn btn-sm btn-ghost"
                                title="Toggle Filters"
                            >
                                <Filter size={16} />
                            </button>

                            <Link
                                className="btn bg-[#1e4d2b] text-white btn-sm p-2"
                                href={route("sales.add")}
                                title="New Sale"
                            >
                                <Plus size={16} />
                            </Link>
                        </div>

                        {/* Collapsible Mobile Filters */}
                        {showFilters && (
                            <div className="bg-gray-50 p-3 rounded-box space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="w-32">
                                        <select
                                            value={filterForm.data.status}
                                            onChange={(e) => filterForm.setData("status", e.target.value)}
                                            className="select select-sm select-bordered w-full"
                                        >
                                            <option value="">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                            <option value="partially_returned">Partial Return</option>

                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">From Date</label>
                                        <input
                                            type="date"
                                            value={filterForm.data.date_from}
                                            onChange={(e) => filterForm.setData("date_from", e.target.value)}
                                            className="input input-sm input-bordered w-full"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium mb-1 block">To Date</label>
                                        <input
                                            type="date"
                                            value={filterForm.data.date_to}
                                            onChange={(e) => filterForm.setData("date_to", e.target.value)}
                                            className="input input-sm input-bordered w-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleFilter}
                                        className="btn btn-sm bg-[#1e4d2b] text-white flex-1"
                                    >
                                        Apply Filters
                                    </button>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PageHeader>

            <div className="print:hidden">
                <div className="overflow-x-auto -mx-2">
                    {sales.data.length > 0 ? (
                        <>
                            {/* Desktop/Tablet Table */}
                            <div className="hidden md:block">
                                <table className="table table-auto w-full text-sm">
                                    <thead className={`${isShadowUser ? 'bg-warning' : 'bg-[#1e4d2b] text-white'} text-white`}>
                                        <tr>
                                            <th className="py-2 px-3">Invoice No</th>
                                            <th className="py-2 px-3">Customer</th>
                                            <th className="py-2 px-3 text-center">Items</th>
                                            <th className="py-2 px-3 text-right">Sub Total</th>
                                            <th className="py-2 px-3 text-right">Grand Total</th>
                                            <th className="py-2 px-3 text-right">Paid</th>
                                            <th className="py-2 px-3 text-right">Due</th>
                                            <th className="py-2 px-3">Status</th>
                                            <th className="py-2 px-3">Date</th>
                                            <th className="py-2 px-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.data.map((sale, index) => (
                                            <tr key={sale.id} className="hover:bg-gray-50 border-b">
                                                <td className="py-2 px-3 font-mono font-semibold text-xs">
                                                    {sale.invoice_no}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="max-w-[120px]">
                                                        <p className="font-medium truncate text-xs">
                                                            {sale.customer?.customer_name || "Walk-in Customer"}
                                                        </p>
                                                        {sale.customer?.phone && (
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {sale.customer.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className="badge badge-outline badge-xs">
                                                        {getTotalItems(sale)}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-xs">
                                                    {formatCurrency(sale.sub_total)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-primary text-xs">
                                                    {formatCurrency(sale.grand_total)}
                                                </td>
                                                <td className="py-2 px-3 text-right text-success font-semibold text-xs">
                                                    {formatCurrency(sale.paid_amount)}
                                                </td>
                                                <td className={`py-2 px-3 text-right font-semibold text-xs ${sale.due_amount > 0 ? "text-error" : "text-success"
                                                    }`}>
                                                    {formatCurrency(sale.due_amount)}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={`badge badge-xs capitalize ${sale.status === 'paid'
                                                            ? 'badge-success'
                                                            : sale.status === 'cancelled'
                                                                ? 'badge-error'
                                                                : 'badge-warning'
                                                        }`}>
                                                        {sale.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className="text-xs whitespace-nowrap">
                                                        {new Date(sale.created_at).toLocaleString("en-GB", {
                                                            timeZone: "Asia/Dhaka",
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        <Link
                                                            href={route("salesPrint.show", { sale: sale.id, print: 'print' })}
                                                            className="btn btn-xs btn-info p-1"
                                                            title="View"
                                                        >
                                                            <Eye size={10} />
                                                        </Link>

                                                        {/* Payment Button - Only show for sales with due amount */}
                                                        {sale.due_amount > 0 && (
                                                            <button
                                                                onClick={() => openPaymentModal(sale)}
                                                                className="btn btn-xs btn-warning btn-outline p-1"
                                                                disabled={isPaymentDisabled(sale)}
                                                                title="Payment"
                                                            >
                                                                <DollarSign size={10} />
                                                            </button>
                                                        )}

                                                        {sale.shadow_type == 'shadow' && !isShadowUser && (
                                                            <>
                                                                <Link
                                                                    href={route("sales.edit", { sale: sale.id })}
                                                                    className="btn btn-xs btn-success p-1"
                                                                    title="Accept"
                                                                >
                                                                    <Check size={10} />
                                                                </Link>

                                                                <Link
                                                                    href={route("sales.rejected", { sale: sale.id })}
                                                                    method="delete"
                                                                    as="button"
                                                                    onClick={(e) => {
                                                                        if (!confirm("Are you sure you want to reject this order?")) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    className="btn btn-xs btn-error p-1"
                                                                    title="Reject"
                                                                >
                                                                    <X size={10} />
                                                                </Link>
                                                            </>
                                                        )}

                                                        <Link
                                                            href={route('print.request', { id: sale.id })}
                                                            method="post"
                                                            className="btn btn-ghost btn-square btn-xs p-1 hover:bg-blue-600 hover:text-white text-blue-600"
                                                            title="Print"
                                                        >
                                                            <Printer size={12} />
                                                        </Link>

                                                        {sale.shadow_type == 'general' && (
                                                            <Link
                                                                href={route("sales.destroy", { sale: sale.id })}
                                                                method="delete"
                                                                as="button"
                                                                onClick={(e) => {
                                                                    if (!confirm("Are you sure you want to delete this sale?")) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                className="btn btn-xs btn-error p-1"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={10} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {sales.data.map((sale, index) => (
                                    <div key={sale.id} className="bg-white border rounded-lg p-3 shadow-sm">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-sm">{sale.invoice_no}</h3>
                                                <p className="text-xs text-gray-600">
                                                    {sale.customer?.customer_name || "Walk-in Customer"}
                                                </p>
                                                {sale.customer?.phone && (
                                                    <p className="text-xs text-gray-500">{sale.customer.phone}</p>
                                                )}
                                            </div>
                                            <span className={`badge badge-xs capitalize ${sale.status === 'paid'
                                                    ? 'badge-success'
                                                    : sale.status === 'cancelled'
                                                        ? 'badge-error'
                                                        : 'badge-warning'
                                                }`}>
                                                {sale.status}
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                            <div>
                                                <span className="text-gray-500">Items:</span>
                                                <p className="font-medium">{getTotalItems(sale)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500">Sub Total:</span>
                                                <p className="font-medium">{formatCurrency(sale.sub_total)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Grand Total:</span>
                                                <p className="font-bold text-primary">{formatCurrency(sale.grand_total)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500">Paid:</span>
                                                <p className="font-medium text-success">{formatCurrency(sale.paid_amount)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Due:</span>
                                                <p className={`font-bold ${sale.due_amount > 0 ? 'text-error' : 'text-success'
                                                    }`}>
                                                    {formatCurrency(sale.due_amount)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500">Date:</span>
                                                <p className="font-medium">
                                                    {new Date(sale.created_at).toLocaleDateString("en-GB", {
                                                        timeZone: "Asia/Dhaka",
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Card Footer - Actions */}
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={route("salesPrint.show", { sale: sale.id, print: 'print' })}
                                                    className="btn btn-xs btn-info p-1"
                                                    title="View"
                                                >
                                                    <Eye size={12} />
                                                </Link>

                                                {sale.due_amount > 0 && (
                                                    <button
                                                        onClick={() => openPaymentModal(sale)}
                                                        className="btn btn-xs btn-warning btn-outline p-1"
                                                        disabled={isPaymentDisabled(sale)}
                                                        title="Payment"
                                                    >
                                                        <DollarSign size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {sale.shadow_type == 'shadow' && !isShadowUser && (
                                                    <>
                                                        <Link
                                                            href={route("sales.edit", { sale: sale.id })}
                                                            className="btn btn-xs btn-success p-1"
                                                            title="Accept"
                                                        >
                                                            <Check size={12} />
                                                        </Link>

                                                        <Link
                                                            href={route("sales.rejected", { sale: sale.id })}
                                                            method="delete"
                                                            as="button"
                                                            onClick={(e) => {
                                                                if (!confirm("Are you sure you want to reject this order?")) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className="btn btn-xs btn-error p-1"
                                                            title="Reject"
                                                        >
                                                            <X size={12} />
                                                        </Link>
                                                    </>
                                                )}

                                                <Link
                                                    href={route('print.request', { id: sale.id })}
                                                    method="post"
                                                    className="btn btn-ghost btn-square btn-xs p-1 hover:bg-blue-600 hover:text-white text-blue-600"
                                                    title="Print"
                                                >
                                                    <Printer size={12} />
                                                </Link>

                                                {sale.shadow_type == 'general' && (
                                                    <Link
                                                        href={route("sales.destroy", { sale: sale.id })}
                                                        method="delete"
                                                        as="button"
                                                        onClick={(e) => {
                                                            if (!confirm("Are you sure you want to delete this sale?")) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-4 py-12 flex flex-col justify-center items-center gap-3">
                            <Frown size={28} className="text-gray-400" />
                            <h1 className="text-gray-500 text-base font-medium text-center">
                                No sales found!
                            </h1>
                            <p className="text-gray-400 text-sm text-center max-w-md">
                                {hasActiveFilters
                                    ? "Try adjusting your search filters to find what you're looking for."
                                    : "Get started by creating your first sale record."
                                }
                            </p>
                            {!hasActiveFilters && (
                                <Link
                                    className="btn bg-[#1e4d2b] text-white btn-sm mt-2"
                                    href={route("sales.add")}
                                >
                                    <Plus size={14} />
                                    Create First Sale
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Compact Summary Stats - Responsive */}
                {sales.data.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-4 p-3 bg-gray-50 rounded-box">
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                            <p className="text-base md:text-lg font-bold text-primary">
                                {totals.totalSales}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-base md:text-lg font-bold text-success">
                                {formatCurrency(totals.totalRevenue)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                            <p className="text-base md:text-lg font-bold text-info">
                                {formatCurrency(totals.totalPaid)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Due</p>
                            <p className="text-base md:text-lg font-bold text-error">
                                {formatCurrency(totals.totalDue)}
                            </p>
                        </div>
                    </div>
                )}

                {sales.data.length > 0 && <Pagination data={sales} className="mt-4" />}
            </div>

            {/* Payment Modal - Updated with responsive design */}
            {showPaymentModal && selectedSale && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} />
                                Payment Clearance - {selectedSale.invoice_no}
                            </h3>
                            <button
                                onClick={closePaymentModal}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Payment Summary */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <History size={16} />
                                    Sale Summary
                                </h4>

                                <div className="bg-gray-50 rounded-box p-4 mb-4">
                                    <div className="space-y-3 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-gray-600">Grand Total:</span>
                                                <p className="font-semibold">{formatCurrency(selectedSale.grand_total)} Tk</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Paid:</span>
                                                <p className="font-semibold text-success">{formatCurrency(selectedSale.paid_amount)} Tk</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Due Amount:</span>
                                                <p className={`font-semibold ${selectedSale.due_amount > 0 ? 'text-error' : 'text-success'}`}>
                                                    {formatCurrency(selectedSale.due_amount)} Tk
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Status:</span>
                                                <p className="font-semibold capitalize">{selectedSale.status}</p>
                                            </div>
                                        </div>
                                        <div className="border-t pt-2">
                                            <p className="text-gray-600 mb-1">Customer:</p>
                                            <p className="font-semibold">{selectedSale.customer?.customer_name || "Walk-in Customer"}</p>
                                            {selectedSale.customer?.phone && (
                                                <p className="text-sm text-gray-500">{selectedSale.customer.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History if available */}
                                {selectedSale.payments && selectedSale.payments.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold mb-2">Previous Payments</h5>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedSale.payments.map((payment, idx) => (
                                                <div key={idx} className="bg-gray-100 p-2 rounded text-sm">
                                                    <div className="flex justify-between">
                                                        <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                                                        <span className="font-semibold text-success">{formatCurrency(payment.amount)} Tk</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Method: {payment.payment_method} |
                                                        {payment.notes && ` Notes: ${payment.notes}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Payment Form */}
                            <div>
                                <h4 className="font-semibold mb-3">Receive Payment</h4>

                                <form onSubmit={handlePaymentSubmit}>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Amount to Pay *</span>
                                                <span className="label-text-alt">Due: {formatCurrency(selectedSale.due_amount)} Tk</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="paid_amount"
                                                value={paymentData.paid_amount}
                                                onChange={handlePaymentInputChange}
                                                min="0.01"
                                                max={selectedSale.due_amount}
                                                step="0.01"
                                                className="input input-bordered"
                                                required
                                            />
                                            {paymentErrors.paid_amount && (
                                                <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    {paymentErrors.paid_amount}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Payment Date *</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="payment_date"
                                                value={paymentData.payment_date}
                                                onChange={handlePaymentInputChange}
                                                className="input input-bordered"
                                                required
                                            />
                                        </div>

                                        {/* Account Selection */}
                                        {accounts && accounts.length > 0 && (
                                            <div className="form-control">
                                                <label className="label py-0">
                                                    <span className="label-text font-bold text-gray-700">Payment Account *</span>
                                                </label>
                                                <select
                                                    name="account_id"
                                                    value={paymentData.account_id || ''}
                                                    onChange={handlePaymentInputChange}
                                                    className="select select-bordered w-full"
                                                    disabled={processingPayment}
                                                    required
                                                >
                                                    <option value="">Select Account</option>
                                                    {accounts.filter(acc => acc.is_active).map(account => (
                                                        <option key={account.id} value={account.id}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {getAccountIcon(account.type)}
                                                                    <span>{account.name}</span>
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    ৳{formatNumber(account.current_balance)}
                                                                </span>
                                                            </div>
                                                        </option>
                                                    ))}
                                                </select>
                                                {paymentErrors.account_id && (
                                                    <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                                        <AlertCircle size={12} />
                                                        {paymentErrors.account_id}
                                                    </div>
                                                )}

                                                {/* Selected Account Info */}
                                                {selectedAccount && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {getAccountIcon(selectedAccount.type)}
                                                                <span className="text-sm font-bold">{selectedAccount.name}</span>
                                                                <span className="text-xs text-gray-500 capitalize">
                                                                    ({selectedAccount.type})
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-gray-500">Current Balance</div>
                                                                <div className="text-sm font-mono font-bold">
                                                                    ৳{formatNumber(selectedAccount.current_balance)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Notes (Optional)</span>
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={paymentData.notes}
                                                onChange={handlePaymentInputChange}
                                                className="textarea textarea-bordered"
                                                rows="2"
                                                placeholder="Add any payment notes..."
                                            />
                                        </div>

                                        {/* Payment Summary */}
                                        <div className="bg-warning/10 border border-warning/20 rounded-box p-4">
                                            <h5 className="font-semibold mb-2">Payment Summary</h5>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Current Due:</span>
                                                    <span>{formatCurrency(selectedSale.due_amount)} Tk</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Paying Now:</span>
                                                    <span className="text-success">{formatCurrency(paymentData.paid_amount)} Tk</span>
                                                </div>
                                                <div className="flex justify-between font-semibold border-t pt-1">
                                                    <span>Remaining Due:</span>
                                                    <span className={selectedSale.due_amount - paymentData.paid_amount > 0 ? 'text-error' : 'text-success'}>
                                                        {formatCurrency(selectedSale.due_amount - paymentData.paid_amount)} Tk
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="modal-action">
                                            <button
                                                type="button"
                                                onClick={closePaymentModal}
                                                className="btn btn-ghost"
                                                disabled={processingPayment}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn bg-[#1e4d2b] text-white"
                                                disabled={processingPayment ||
                                                    paymentData.paid_amount <= 0 ||
                                                    paymentData.paid_amount > selectedSale.due_amount ||
                                                    !paymentData.account_id
                                                }
                                            >
                                                {processingPayment ? (
                                                    <span className="loading loading-spinner"></span>
                                                ) : (
                                                    <>
                                                        <DollarSign size={16} className="mr-1" />
                                                        Process Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}