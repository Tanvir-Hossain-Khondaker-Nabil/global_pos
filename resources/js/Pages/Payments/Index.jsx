import React from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Plus, Search, Eye, FileText, User, Receipt } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PaymentIndex({ payments, filters, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
    });

    const handleFilter = () => {
        const queryParams = {};
        
        if (filterForm.data.search.trim()) {
            queryParams.search = filterForm.data.search.trim();
        }

        router.get(route("payments.index"), queryParams, {
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
        });
        setTimeout(() => {
            router.get(route("payments.index"), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }, 0);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get payment method badge color and label
    const getPaymentMethodBadge = (method) => {
        const colors = {
            cash: "badge-success",
            card: "badge-primary",
            bank: "badge-info",
            mobile: "badge-warning",
            online: "badge-secondary",
        };
        
        const labels = {
            cash: t('payment.cash', 'Cash'),
            card: t('payment.card', 'Card'),
            bank: t('payment.bank', 'Bank Transfer'),
            mobile: t('payment.mobile', 'Mobile Banking'),
            online: t('payment.online', 'Online Payment'),
        };
        
        return {
            color: colors[method] || "badge-outline",
            label: labels[method] || method
        };
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            completed: t('payment.completed', 'Completed'),
            pending: t('payment.pending', 'Pending'),
            failed: t('payment.failed', 'Failed'),
        };
        return labels[status] || status;
    };

    // Calculate totals
    const calculateTotals = () => {
        const paymentsData = payments.data || [];
        
        const totalAmount = paymentsData.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        const totalCash = paymentsData.reduce((sum, payment) => 
            payment.payment_method === 'cash' ? sum + parseFloat(payment.amount || 0) : sum, 0);
        const totalCard = paymentsData.reduce((sum, payment) => 
            payment.payment_method === 'card' ? sum + parseFloat(payment.amount || 0) : sum, 0);
        const totalBank = paymentsData.reduce((sum, payment) => 
            payment.payment_method === 'bank' ? sum + parseFloat(payment.amount || 0) : sum, 0);

        return {
            totalAmount,
            totalCash,
            totalCard,
            totalBank,
            totalPayments: paymentsData.length
        };
    };

    const totals = calculateTotals();
    const hasActiveFilters = filterForm.data.search;

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('payment.title', 'Payment History')}
                subtitle={t('payment.subtitle', 'View and manage all payment transactions')}
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="join">
                        <input
                            type="search"
                            value={filterForm.data.search}
                            onChange={(e) => filterForm.setData("search", e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('payment.search_placeholder', 'Search by customer, invoice, method, reference...')}
                            className="input input-sm input-bordered join-item w-64"
                        />
                        <button
                            onClick={handleFilter}
                            className="btn btn-sm btn-primary join-item"
                        >
                            <Search size={16} />
                            {t('payment.search', 'Search')}
                        </button>
                    </div>
                    
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-sm btn-ghost"
                        >
                            {t('payment.clear_filters', 'Clear Filters')}
                        </button>
                    )}
                </div>
            </PageHeader>

            <div className="print:hidden">
                <div className="overflow-x-auto">
                    {payments.data.length > 0 ? (
                        <table className="table table-auto w-full">
                            <thead className={`${isShadowUser ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <tr>
                                    <th>{t('payment.transaction_ref', 'Transaction Ref')}</th>
                                    <th>{t('payment.customer', 'Customer')}</th>
                                    <th>{t('payment.supplier', 'Supplier')}</th>
                                    {/* <th>{t('payment.invoice_no', 'Invoice No')}</th> */}
                                    <th>{t('payment.amount', 'Amount')}</th>
                                    <th>{t('payment.payment_method', 'Payment Method')}</th>
                                    <th>{t('payment.status', 'Status')}</th>
                                    <th>{t('payment.note', 'Note')}</th>
                                    <th>{t('payment.date', 'Date')}</th>
                                    <th>{t('payment.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.data.map((payment) => {
                                    const methodBadge = getPaymentMethodBadge(payment.payment_method);
                                    return (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="font-mono font-semibold">
                                                {payment.txn_ref || (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-gray-400" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {payment.customer?.customer_name || t('payment.walk_in_customer', 'Walk-in Customer')}
                                                        </p>
                                                        {payment.customer?.phone && (
                                                            <p className="text-sm text-gray-500">
                                                                {payment.customer.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-gray-400" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {payment.supplier?.name || t('payment.walk_in_supplier', 'Walk-in Supplier')}
                                                        </p>
                                                        {payment.supplier?.phone && (
                                                            <p className="text-sm text-gray-500">
                                                                {payment.supplier.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* <td>
                                                <div className="flex items-center gap-2">
                                                    <Receipt size={16} className="text-gray-400" />
                                                    <span className="font-mono font-semibold">
                                                        {payment.sale?.invoice_no  || payment.purchase?.invoice_no}
                                                    </span>
                                                </div>
                                            </td> */}
                                            <td className="font-semibold text-success">
                                                {formatCurrency(payment.amount)} {t('payment.currency', 'Tk')}
                                            </td>
                                            <td>
                                                <span className={`badge capitalize ${methodBadge.color}`}>
                                                    {methodBadge.label}
                                                </span>
                                            </td>
                                            <td>
                                                {payment.status === 'completed' ? (
                                                    <span className="badge badge-success">
                                                        {getStatusLabel(payment.status)}
                                                    </span>
                                                ) : payment.status === 'pending' ? (    
                                                    <span className="badge badge-warning">
                                                        {getStatusLabel(payment.status)}
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-secondary">
                                                        {getStatusLabel(payment.status)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="max-w-xs">
                                                {payment.note ? (
                                                    <div className="tooltip" data-tip={payment.note}>
                                                        <p className="truncate text-sm text-gray-600">
                                                            {payment.note}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">
                                                        {t('payment.no_note', 'No note')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-sm text-gray-600">
                                                {formatDate(payment.created_at)}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <Link
                                                        href={route("payments.show", { payment: payment.id })}
                                                        className="btn btn-xs btn-info"
                                                    >
                                                        <Eye size={13} />
                                                        {t('payment.view', 'View')}
                                                    </Link>
                                                    {payment.sale && (
                                                        <Link
                                                            href={route("sales.show", { sale: payment.sale.id })}
                                                            className="btn btn-xs btn-primary"
                                                        >
                                                            <FileText size={13} />
                                                            {t('payment.sale', 'Sale')}
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                            <Frown size={32} className="text-gray-400" />
                            <h1 className="text-gray-500 text-lg font-medium">
                                {t('payment.no_payments_found', 'No payments found!')}
                            </h1>
                            <p className="text-gray-400 text-sm text-center max-w-md">
                                {hasActiveFilters
                                    ? t('payment.adjust_filters', 'Try adjusting your search filters to find what you\'re looking for.')
                                    : t('payment.get_started', 'Get started by recording your first payment transaction.')
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {payments.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 p-4 bg-gray-50 rounded-box">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                {t('payment.total_payments', 'Total Payments')}
                            </p>
                            <p className="text-xl font-bold text-primary">
                                {totals.totalPayments}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                {t('payment.total_amount', 'Total Amount')}
                            </p>
                            <p className="text-xl font-bold text-success">
                                {formatCurrency(totals.totalAmount)} {t('payment.currency', 'Tk')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                {t('payment.cash_payments', 'Cash Payments')}
                            </p>
                            <p className="text-xl font-bold text-success">
                                {formatCurrency(totals.totalCash)} {t('payment.currency', 'Tk')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                {t('payment.card_payments', 'Card Payments')}
                            </p>
                            <p className="text-xl font-bold text-primary">
                                {formatCurrency(totals.totalCard)} {t('payment.currency', 'Tk')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                {t('payment.bank_payments', 'Bank Payments')}
                            </p>
                            <p className="text-xl font-bold text-info">
                                {formatCurrency(totals.totalBank)} {t('payment.currency', 'Tk')}
                            </p>
                        </div>
                    </div>
                )}

                {payments.data.length > 0 && <Pagination data={payments} />}
            </div>
        </div>
    );
}