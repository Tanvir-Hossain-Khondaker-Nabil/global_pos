import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Plus, Printer, Trash2, Eye, Search, Edit, Check, X, Calendar, DollarSign, History } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";

export default function SalesIndex({ sales, filters, isShadowUser }) {
    const { auth } = usePage().props;

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
        status: filters.status || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
    });

    const [selectedSale, setSelectedSale] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paid_amount: 0,
        shadow_paid_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
    });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const handleFilter = () => {
        const queryParams = {};
        
        if (filterForm.data.search.trim()) queryParams.search = filterForm.data.search.trim();
        if (filterForm.data.status) queryParams.status = filterForm.data.status;
        if (filterForm.data.date_from) queryParams.date_from = filterForm.data.date_from;
        if (filterForm.data.date_to) queryParams.date_to = filterForm.data.date_to;

        router.get(route("sales.index"), queryParams, {
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
            router.get(route("sales.index"), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }, 0);
    };

    const openPaymentModal = (sale) => {
        console.log('Selected Sale:', sale); // Debug: Check what data we have
        console.log('Sale Payments:', sale.payments); // Debug: Check payments data
        
        setSelectedSale(sale);
        setPaymentData({
            paid_amount: sale.due_amount > 0 ? sale.due_amount : 0,
            shadow_paid_amount: sale.shadow_due_amount > 0 ? sale.shadow_due_amount : 0,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            notes: ''
        });
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedSale(null);
        setProcessingPayment(false);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedSale) return;

        setProcessingPayment(true);

        router.post(route('sales.payments.store', { sale: selectedSale.id }), {
            sale_id: selectedSale.id,
            amount: paymentData.paid_amount,
            shadow_paid_amount: paymentData.shadow_paid_amount,
            payment_date: paymentData.payment_date,
            payment_method: paymentData.payment_method,
            notes: paymentData.notes
        }, {
            onSuccess: () => {
                closePaymentModal();
                router.reload({ only: ['sales'] });
            },
            onError: (errors) => {
                console.error('Payment error:', errors);
                setProcessingPayment(false);
            }
        });
    };

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: name === 'paid_amount' || name === 'shadow_paid_amount' ? parseFloat(value) || 0 : value
        }));
    };

    // Calculate item counts for each sale
    const getTotalItems = (sale) => {
        return sale.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
    };

    // Format currency
    const formatCurrency = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const calculateTotals = () => {
        const salesData = sales?.data || [];
        
        const totalRevenue = salesData.reduce((sum, sale) => sum + (parseFloat(sale.grand_total) || 0), 0);
        const totalPaid = salesData.reduce((sum, sale) => sum + (parseFloat(sale.paid_amount) || 0), 0);
        const totalDue = salesData.reduce((sum, sale) => sum + (parseFloat(sale.due_amount) || 0), 0);

        return {
            totalRevenue,
            totalPaid,
            totalDue,
            totalSales: salesData.length
        };
    };

    // Get payments for selected sale - with multiple fallback options
    const getPayments = (sale) => {
        if (!sale) return [];
        
        // Try different possible property names
        return sale.payments || sale.payment_history || sale.payment_records || [];
    };

    const totals = calculateTotals();
    const hasActiveFilters = filterForm.data.search || filterForm.data.status || filterForm.data.date_from || filterForm.data.date_to;

    const isPaymentDisabled = (sale) => {
        return sale.due_amount <= 0 && sale.shadow_due_amount <= 0;
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={isShadowUser ? "Sales History (Inventory)" : "Sales History (Inventory)"}
                subtitle={isShadowUser ? "View sales data" : "Manage your product sales"}
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="join">
                        <input
                            type="search"
                            value={filterForm.data.search}
                            onChange={(e) => filterForm.setData("search", e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Search invoice or customer..."
                            className="input input-sm input-bordered join-item"
                        />
                    </div>
                    
                    <select
                        value={filterForm.data.status}
                        onChange={(e) => filterForm.setData("status", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="select select-sm select-bordered"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <input
                        type="date"
                        value={filterForm.data.date_from}
                        onChange={(e) => filterForm.setData("date_from", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="input input-sm input-bordered"
                    />
                    
                    <input
                        type="date"
                        value={filterForm.data.date_to}
                        onChange={(e) => filterForm.setData("date_to", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="input input-sm input-bordered"
                    />
                    
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-sm btn-ghost"
                        >
                            Clear Filters
                        </button>
                    )}

                    <button
                        onClick={handleFilter}
                        className="btn btn-sm btn-primary join-item"
                    >
                        <Search size={16} />
                        Search
                    </button>
                    
                    <Link
                        className="btn btn-primary btn-sm"
                        href={route("sales.create")}
                    >
                        <Plus size={16} />
                        New Sale
                    </Link>
                </div>
            </PageHeader>

            <div className="print:hidden">
                <div className="overflow-x-auto">
                    {sales?.data?.length > 0 ? (
                        <table className="table table-auto w-full">
                            <thead className={`${isShadowUser ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Sub Total</th>
                                    <th>Grand Total</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((sale, index) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="font-mono font-semibold">
                                            {sale.invoice_no}
                                        </td>
                                        <td>
                                            <div>
                                                <p className="font-medium">
                                                    {sale.customer?.customer_name || "Walk-in Customer"}
                                                </p>
                                                {sale.customer?.phone && (
                                                    <p className="text-sm text-gray-500">
                                                        {sale.customer.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline">
                                                {getTotalItems(sale)}
                                            </span>
                                        </td>
                                        <td className="font-semibold">
                                            {formatCurrency(sale.sub_total)} Tk
                                        </td>
                                        <td className="font-semibold text-primary">
                                            {formatCurrency(sale.grand_total)} Tk
                                        </td>
                                        <td className="text-success font-semibold">
                                            {formatCurrency(sale.paid_amount)} Tk
                                        </td>
                                        <td className={`font-semibold ${
                                            (sale.due_amount > 0 || sale.shadow_due_amount > 0) ? "text-error" : "text-success"
                                        }`}>
                                            {formatCurrency(sale.due_amount)} Tk
                                        </td>
                                        <td>
                                            <span className={`badge capitalize ${
                                                sale.status === 'paid' 
                                                    ? 'badge-success' 
                                                    : sale.status === 'cancelled'
                                                    ? 'badge-error'
                                                    : 'badge-warning'
                                            }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(sale.created_at).toLocaleString("en-GB", {
                                                timeZone: "Asia/Dhaka",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <Link
                                                    href={route("sales.show", { sale: sale.id })}
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Eye size={13} />
                                                    View
                                                </Link>

                                                <button
                                                    onClick={() => openPaymentModal(sale)}
                                                    className="btn btn-xs btn-warning btn-outline"
                                                    disabled={isPaymentDisabled(sale)}
                                                >
                                                    <Edit size={12} /> Payment
                                                </button>
                                             
                                                {sale.shadow_type == 'shadow' && !isShadowUser && (
                                                    <>
                                                        <Link
                                                            href={route("sales.edit", { sale: sale.id })}
                                                            className="btn btn-xs btn-success flex items-center gap-1"
                                                        >
                                                            <Check size={13} /> Accepted
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
                                                            className="btn btn-xs btn-error"
                                                        >
                                                            <X size={13} />
                                                            Rejected
                                                        </Link>
                                                    </>
                                                )}

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
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                            <Frown size={32} className="text-gray-400" />
                            <h1 className="text-gray-500 text-lg font-medium">
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
                                    className="btn btn-primary btn-sm mt-2"
                                    href={route("sales.create")}
                                >
                                    <Plus size={16} />
                                    Create First Sale
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {sales?.data?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-box">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Sales</p>
                            <p className="text-xl font-bold text-primary">
                                {totals.totalSales}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-xl font-bold text-success">
                                {formatCurrency(totals.totalRevenue)} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-xl font-bold text-info">
                                {formatCurrency(totals.totalPaid)} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Due</p>
                            <p className="text-xl font-bold text-error">
                                {formatCurrency(totals.totalDue)} Tk
                            </p>
                        </div>
                    </div>
                )}

                {sales?.data?.length > 0 && <Pagination data={sales} />}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedSale && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} />
                                Payment Management - {selectedSale.invoice_no}
                            </h3>
                            <button 
                                onClick={closePaymentModal}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Payment History */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <History size={16} />
                                    Payment History
                                </h4>
                                
                                <div className="bg-gray-50 rounded-box p-4 mb-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Grand Total:</span>
                                            <p className="font-semibold">{formatCurrency(selectedSale.grand_total)} Tk</p>
                                        </div>
                                        {/* <div>
                                            <span className="text-gray-600">Shadow Grand Total:</span>
                                            <p className="font-semibold">{formatCurrency(selectedSale.shadow_grand_total)} Tk</p>
                                        </div> */}

                                        <div>
                                            <span className="text-gray-600">Total Paid:</span>
                                            <p className="font-semibold text-success">{formatCurrency(selectedSale.paid_amount)} Tk</p>
                                        </div>
                                        {/* <div>
                                            <span className="text-gray-600">Shadow Total Paid:</span>
                                            <p className="font-semibold text-success">{formatCurrency(selectedSale.shadow_paid_amount)} Tk</p>
                                        </div> */}

                                        <div>
                                            <span className="text-gray-600">Due Amount:</span>
                                            <p className={`font-semibold ${selectedSale.due_amount > 0 ? 'text-error' : 'text-success'}`}>
                                                {formatCurrency(selectedSale.due_amount)} Tk
                                            </p>
                                        </div>
                                         {/* <div>
                                            <span className="text-gray-600">Shadow Due Amount:</span>
                                            <p className={`font-semibold ${selectedSale.shadow_due_amount > 0 ? 'text-error' : 'text-success'}`}>
                                                {formatCurrency(selectedSale.shadow_due_amount)} Tk
                                            </p>
                                        </div> */}
                                        <div>
                                            <span className="text-gray-600">Payment Status:</span>
                                            <p className="font-semibold capitalize">{selectedSale.payment_status || selectedSale.status}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History List */}
                                {/* <div className="max-h-60 overflow-y-auto">
                                    <h5 className="font-medium mb-2">Previous Payments:</h5>
                                    {(() => {
                                        const payments = getPayments(selectedSale);
                                        console.log('Payments data:', payments); 
                                        
                                        return payments.length > 0 ? (
                                            <div className="space-y-2">
                                                {payments.map((payment, index) => (
                                                    <div key={payment.id || index} className="bg-white border rounded-box p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold text-success">
                                                                    {formatCurrency(payment.amount)} Tk
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {formatDate(payment.payment_date || payment.created_at)}
                                                                </p>
                                                                <p className="text-sm capitalize">{payment.payment_method || 'cash'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="badge badge-sm badge-success">Paid</span>
                                                                {payment.notes && (
                                                                    <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500">
                                                <History size={24} className="mx-auto mb-2" />
                                                <p>No payment history found</p>
                                                <p className="text-xs mt-1">Payments array: {JSON.stringify(payments)}</p>
                                            </div>
                                        );
                                    })()}
                                </div> */}
                            </div>

                            {/* Right Column: Payment Form */}
                            <div>
                                <h4 className="font-semibold mb-3">Receive Payment</h4>
                                
                                <form onSubmit={handlePaymentSubmit}>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Amount to Pay</span>
                                                <span className="label-text-alt">Due: {formatCurrency(selectedSale.due_amount)} Tk</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="paid_amount"
                                                value={paymentData.paid_amount}
                                                onChange={handlePaymentInputChange}
                                                min="0"
                                                max={selectedSale.due_amount}
                                                step="0.01"
                                                className="input input-bordered"
                                                required
                                            />
                                        </div>

                                        {/* <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Shadow Amount to Pay</span>
                                                <span className="label-text-alt">Due: {formatCurrency(selectedSale.shadow_due_amount)} Tk</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="shadow_paid_amount"
                                                value={paymentData.shadow_paid_amount}
                                                onChange={handlePaymentInputChange}
                                                min="0"
                                                max={selectedSale.shadow_due_amount}
                                                step="0.01"
                                                className="input input-bordered"
                                            />
                                        </div> */}

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Payment Date</span>
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

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Payment Method</span>
                                            </label>
                                            <select
                                                name="payment_method"
                                                value={paymentData.payment_method}
                                                onChange={handlePaymentInputChange}
                                                className="select select-bordered"
                                                required
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="bank">Bank Transfer</option>
                                                <option value="mobile">Mobile Banking</option>
                                                <option value="check">Check</option>
                                            </select>
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Notes (Optional)</span>
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={paymentData.notes}
                                                onChange={handlePaymentInputChange}
                                                className="textarea textarea-bordered"
                                                rows="3"
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
                                                {/* <div className="flex justify-between">
                                                    <span>Shadow Current Due:</span>
                                                    <span>{formatCurrency(selectedSale.shadow_due_amount)} Tk</span>
                                                </div> */}
                                                <div className="flex justify-between">
                                                    <span>Paying Now:</span>
                                                    <span className="text-success">{formatCurrency(paymentData.paid_amount)} Tk</span>
                                                </div>
                                                {/* <div className="flex justify-between">
                                                    <span>Shadow Paying Now:</span>
                                                    <span className="text-success">{formatCurrency(paymentData.shadow_paid_amount)} Tk</span>
                                                </div> */}
                                                <div className="flex justify-between font-semibold border-t pt-1">
                                                    <span>Remaining Due:</span>
                                                    <span className={selectedSale.due_amount - paymentData.paid_amount > 0 ? 'text-error' : 'text-success'}>
                                                        {formatCurrency(selectedSale.due_amount - paymentData.paid_amount)} Tk
                                                    </span>
                                                </div>
                                                {/* <div className="flex justify-between font-semibold">
                                                    <span>Shadow Remaining Due:</span>
                                                    <span className={selectedSale.shadow_due_amount - paymentData.shadow_paid_amount > 0 ? 'text-error' : 'text-success'}>
                                                        {formatCurrency(selectedSale.shadow_due_amount - paymentData.shadow_paid_amount)} Tk
                                                    </span>
                                                </div> */}
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
                                                className="btn btn-primary"
                                                disabled={processingPayment || 
                                                    (paymentData.paid_amount <= 0 && paymentData.shadow_paid_amount <= 0) ||
                                                    paymentData.paid_amount > selectedSale.due_amount ||
                                                    paymentData.shadow_paid_amount > selectedSale.shadow_due_amount
                                                }
                                            >
                                                {processingPayment ? (
                                                    <span className="loading loading-spinner"></span>
                                                ) : (
                                                    <DollarSign size={16} />
                                                )}
                                                Process Payment
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