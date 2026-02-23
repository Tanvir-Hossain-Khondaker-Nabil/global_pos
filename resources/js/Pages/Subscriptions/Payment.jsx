import { Link, router, useForm } from "@inertiajs/react";
import { 
    Plus, 
    Trash2, 
    X, 
    Frown,
    Search,
    Filter,
    Edit,
    Eye,
    User,
    CreditCard,
    Calendar,
    DollarSign,
    Clock,
    BadgeCheck,
    Ban,
    Download,
    FileText,
    ChevronDown,
    ChevronUp,
    CalendarDays,
    RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "react-toastify";

export default function Payments({ subscription }) {
    const { t, locale } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Search and filter states
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Apply filters manually
    const applyFilters = () => {
        const params = {};

        if (search) params.search = search;
        if (status) params.status = status;
        if (paymentMethod) params.payment_method = paymentMethod;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (currentPage > 1) params.page = currentPage;

        router.get(route("subscriptions.payments"), params, {
            preserveState: true,
            replace: true
        });
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setPaymentMethod("");
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
        router.get(route("subscriptions.payments"));
    };

    // Format date for input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    // Format date for filename
    const formatDateForFilename = () => {
        const now = new Date();
        return now.toISOString().split('T')[0] + '_' + 
               now.getHours() + '-' + 
               now.getMinutes() + '-' + 
               now.getSeconds();
    };

    // Toggle filter section
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Check if any filter is active
    const hasActiveFilters = () => {
        return search || status || paymentMethod || dateFrom || dateTo;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format date with time
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Prepare data for export
    const prepareExportData = () => {
        return subscription.data.map(payment => ({
            'Transaction ID': payment.transaction_id || `PAY-${payment.id}`,
            'Subscription ID': payment.subscription?.id || 'N/A',
            'Plan Name': payment.subscription?.plan?.name || 'N/A',
            'User Name': payment.subscription?.user?.name || 'N/A',
            'User Email': payment.subscription?.user?.email || 'N/A',
            'Payment Method': payment.payment_method || 'N/A',
            'Amount (Tk)': parseFloat(payment.amount || 0).toFixed(2),
            'Status': payment.status || 'N/A',
            'Payment Date': payment.payment_date ? formatDateTime(payment.payment_date) : 'N/A',
            'Created At': formatDateTime(payment.created_at)
        }));
    };

    // Download as CSV
    const downloadCSV = () => {
        try {
            setIsDownloading(true);
            const exportData = prepareExportData();
            
            if (exportData.length === 0) {
                toast.warning('No data to export');
                return;
            }

            const headers = Object.keys(exportData[0]);
            const csvRows = [];
            
            csvRows.push(headers.join(','));
            
            for (const row of exportData) {
                const values = headers.map(header => {
                    const value = row[header]?.toString() || '';
                    return `"${value.replace(/"/g, '""')}"`;
                });
                csvRows.push(values.join(','));
            }

            csvRows.push('');
            csvRows.push('FILTER INFORMATION');
            csvRows.push(`Search,${search || 'None'}`);
            csvRows.push(`Status,${status || 'All'}`);
            csvRows.push(`Payment Method,${paymentMethod || 'All'}`);
            csvRows.push(`Date From,${dateFrom || 'None'}`);
            csvRows.push(`Date To,${dateTo || 'None'}`);

            csvRows.push('');
            csvRows.push('SUMMARY STATISTICS');
            const completedPayments = subscription.data.filter(p => p.status === 'completed');
            const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            
            csvRows.push(`Total Payments,${subscription.total || 0}`);
            csvRows.push(`Completed Payments,${completedPayments.length}`);
            csvRows.push(`Pending Payments,${subscription.data.filter(p => p.status === 'pending').length}`);
            csvRows.push(`Total Revenue (Tk),${totalRevenue.toFixed(2)}`);

            const csvString = csvRows.join('\n');
            
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `subscription_payments_${formatDateForFilename()}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            
            toast.success('CSV downloaded successfully');
        } catch (error) {
            console.error('Error downloading CSV:', error);
            toast.error('Failed to download CSV');
        } finally {
            setIsDownloading(false);
        }
    };

    // Download as Excel
    const downloadExcel = () => {
        try {
            setIsDownloading(true);
            const exportData = prepareExportData();
            
            if (exportData.length === 0) {
                toast.warning('No data to export');
                return;
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Filter info sheet
            const filterData = [
                { 'Filter': 'Search', 'Value': search || 'None' },
                { 'Filter': 'Status', 'Value': status || 'All' },
                { 'Filter': 'Payment Method', 'Value': paymentMethod || 'All' },
                { 'Filter': 'Date From', 'Value': dateFrom || 'None' },
                { 'Filter': 'Date To', 'Value': dateTo || 'None' }
            ];
            const wsFilters = XLSX.utils.json_to_sheet(filterData);

            // Summary sheet
            const completedPayments = subscription.data.filter(p => p.status === 'completed');
            const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            
            const summaryData = [
                { 'Metric': 'Total Payments', 'Value': subscription.total || 0 },
                { 'Metric': 'Completed Payments', 'Value': completedPayments.length },
                { 'Metric': 'Pending Payments', 'Value': subscription.data.filter(p => p.status === 'pending').length },
                { 'Metric': 'Total Revenue (Tk)', 'Value': totalRevenue.toFixed(2) }
            ];
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);

            XLSX.utils.book_append_sheet(wb, ws, 'Payments');
            XLSX.utils.book_append_sheet(wb, wsFilters, 'Filters Applied');
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

            XLSX.writeFile(wb, `subscription_payments_${formatDateForFilename()}.xlsx`);
            
            toast.success('Excel file downloaded successfully');
        } catch (error) {
            console.error('Error downloading Excel:', error);
            toast.error('Failed to download Excel file');
        } finally {
            setIsDownloading(false);
        }
    };

    // Download as PDF
    const downloadPDF = () => {
        try {
            setIsDownloading(true);
            
            if (subscription.data.length === 0) {
                toast.warning('No data to export');
                return;
            }

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Add title
            doc.setFontSize(16);
            doc.setTextColor(30, 77, 43); // #1e4d2b color
            doc.text('Subscription Payments Report', 14, 15);
            
            // Add date
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            // Add filter information
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Search: ${search || 'None'} | Status: ${status || 'All'}`, 14, 29);
            doc.text(`Payment Method: ${paymentMethod || 'All'} | Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, 14, 35);

            // Prepare table columns and rows
            const tableColumns = [
                'Transaction',
                'Plan',
                'User',
                'Method',
                'Amount',
                'Status',
                'Date'
            ];

            const tableRows = subscription.data.map(payment => [
                (payment.transaction_id || `PAY-${payment.id}`).substring(0, 10),
                payment.subscription?.plan?.name?.substring(0, 15) || 'N/A',
                payment.subscription?.user?.name?.substring(0, 15) || 'N/A',
                payment.payment_method || 'N/A',
                formatCurrency(payment.amount),
                payment.status || 'N/A',
                payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)
            ]);

            // Add table
            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [30, 77, 43], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });

            // Add summary statistics
            const completedPayments = subscription.data.filter(p => p.status === 'completed');
            const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const finalY = doc.lastAutoTable.finalY + 10;
            
            doc.setFontSize(12);
            doc.setTextColor(30, 77, 43);
            doc.text('Summary Statistics', 14, finalY);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Payments: ${subscription.total || 0}`, 14, finalY + 7);
            doc.text(`Completed Payments: ${completedPayments.length}`, 14, finalY + 14);
            doc.text(`Pending Payments: ${subscription.data.filter(p => p.status === 'pending').length}`, 14, finalY + 21);
            doc.text(`Total Revenue: ${totalRevenue.toFixed(2)} Tk`, 14, finalY + 28);

            // Save PDF
            doc.save(`subscription_payments_${formatDateForFilename()}.pdf`);
            
            toast.success('PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    // Pagination handlers
    const goToPage = (page) => {
        setCurrentPage(page);
        applyFilters(); // Apply filters when changing page
    };

    const nextPage = () => {
        if (subscription.links && subscription.links.next) {
            setCurrentPage(currentPage + 1);
            applyFilters();
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            applyFilters();
        }
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            completed: { label: t('payments.completed', 'Completed'), class: 'badge-success', icon: BadgeCheck },
            pending: { label: t('payments.pending', 'Pending'), class: 'badge-warning', icon: Clock },
            failed: { label: t('payments.failed', 'Failed'), class: 'badge-error', icon: Ban },
            refunded: { label: t('payments.refunded', 'Refunded'), class: 'badge-info', icon: DollarSign },
        };
        
        const statusInfo = statusMap[status] || { label: status, class: 'badge-warning', icon: Clock };
        const StatusIcon = statusInfo.icon;
        
        return {
            ...statusInfo,
            icon: <StatusIcon size={12} />
        };
    };

    // Get payment method details
    const getPaymentMethodDetails = (method) => {
        const methodMap = {
            cash: { label: t('payments.cash', 'Cash'), class: 'text-green-600 bg-green-50 border-green-200' },
            card: { label: t('payments.card', 'Credit Card'), class: 'text-blue-600 bg-blue-50 border-blue-200' },
            bank: { label: t('payments.bank', 'Bank Transfer'), class: 'text-purple-600 bg-purple-50 border-purple-200' },
            mobile: { label: t('payments.mobile', 'Mobile Banking'), class: 'text-orange-600 bg-orange-50 border-orange-200' },
            online: { label: t('payments.online', 'Online Payment'), class: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
        };
        
        return methodMap[method] || { label: method, class: 'text-gray-600 bg-gray-50 border-gray-200' };
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('payments.subscription_payments', 'Subscription Payments')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {t('payments.manage_track_payments', 'Manage and track subscription payment records')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("subscriptions.index")}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <CreditCard size={15} /> {t('payments.view_subscriptions', 'View Subscriptions')}
                    </Link>
                </div>
            </div>

            {/* Collapsible Filter Section */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
                <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={toggleFilters}
                >
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-[#1e4d2b]" />
                        <h3 className="text-lg font-semibold text-neutral">Filters</h3>
                        {hasActiveFilters() && (
                            <span className="badge badge-sm bg-[#1e4d2b] text-white ml-2">Active</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearFilters();
                            }}
                            className="btn btn-ghost btn-sm"
                        >
                            <RefreshCw size={14} /> Clear
                        </button>
                        <button className="btn btn-ghost btn-sm">
                            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {/* Search Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('payments.search_payments', 'Search Payments')}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={t('payments.search_placeholder', 'Search by transaction ID, user name, plan name...')}
                                        className="input input-bordered w-full pl-10"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('payments.payment_status', 'Payment Status')}
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="select select-bordered w-full"
                                >
                                    <option value="">{t('payments.all_status', 'All Status')}</option>
                                    <option value="completed">{t('payments.completed', 'Completed')}</option>
                                    <option value="pending">{t('payments.pending', 'Pending')}</option>
                                    <option value="failed">{t('payments.failed', 'Failed')}</option>
                                    <option value="refunded">{t('payments.refunded', 'Refunded')}</option>
                                </select>
                            </div>

                            {/* Payment Method Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('payments.payment_method', 'Payment Method')}
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="select select-bordered w-full"
                                >
                                    <option value="">{t('payments.all_methods', 'All Methods')}</option>
                                    <option value="cash">{t('payments.cash', 'Cash')}</option>
                                    <option value="card">{t('payments.card', 'Credit Card')}</option>
                                    <option value="bank">{t('payments.bank', 'Bank Transfer')}</option>
                                    <option value="mobile">{t('payments.mobile', 'Mobile Banking')}</option>
                                    <option value="online">{t('payments.online', 'Online Payment')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Range Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('payments.date_from', 'Date From')}
                                </label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        value={formatDateForInput(dateFrom)}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="input input-bordered w-full pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('payments.date_to', 'Date To')}
                                </label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        value={formatDateForInput(dateTo)}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        min={dateFrom}
                                        className="input input-bordered w-full pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={applyFilters}
                                className="btn bg-[#1e4d2b] text-white px-6"
                            >
                                <Search size={16} className="mr-2" />
                                Apply Filters
                            </button>
                        </div>

                        {/* Active Filters Display */}
                        {hasActiveFilters() && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">Active Filters:</span>
                                {search && (
                                    <span className="badge badge-outline badge-sm">
                                        Search: {search}
                                    </span>
                                )}
                                {status && (
                                    <span className="badge badge-outline badge-sm">
                                        Status: {status}
                                    </span>
                                )}
                                {paymentMethod && (
                                    <span className="badge badge-outline badge-sm">
                                        Method: {paymentMethod}
                                    </span>
                                )}
                                {dateFrom && (
                                    <span className="badge badge-outline badge-sm">
                                        From: {new Date(dateFrom).toLocaleDateString()}
                                    </span>
                                )}
                                {dateTo && (
                                    <span className="badge badge-outline badge-sm">
                                        To: {new Date(dateTo).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Download Button */}
            <div className="flex justify-end mb-4">
                <div className="dropdown dropdown-end">
                    <button 
                        className="btn bg-green-600 text-white btn-sm"
                        disabled={isDownloading || subscription.data.length === 0}
                        tabIndex={0}
                    >
                        <Download size={14} />
                        {isDownloading ? 'Downloading...' : 'Download Report'}
                    </button>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                        <li><button onClick={downloadCSV} className="btn btn-ghost btn-sm w-full text-left">CSV Format</button></li>
                        <li><button onClick={downloadExcel} className="btn btn-ghost btn-sm w-full text-left">Excel Format</button></li>
                        <li><button onClick={downloadPDF} className="btn btn-ghost btn-sm w-full text-left">PDF Format</button></li>
                    </ul>
                </div>
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto">
                {subscription.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white">
                            <tr>
                                <th className="text-center">{t('payments.sl', 'SL')}</th>
                                <th>{t('payments.transaction_details', 'Transaction Details')}</th>
                                <th>{t('payments.subscription_info', 'Subscription Info')}</th>
                                <th>{t('payments.user', 'User')}</th>
                                <th>{t('payments.payment_method', 'Payment Method')}</th>
                                <th>{t('payments.amount', 'Amount')}</th>
                                <th>{t('payments.payment_date', 'Payment Date')}</th>
                                <th>{t('payments.status', 'Status')}</th>
                                <th className="text-center">{t('payments.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscription.data.map((payment, index) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="text-center">
                                        {subscription.from + index}
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={14} className="text-blue-600" />
                                                <span className="font-mono text-sm font-semibold">
                                                    #{payment.transaction_id || `PAY-${payment.id}`}
                                                </span>
                                            </div>
                                            {payment.payment_date && (
                                                <div className="text-xs text-gray-500">
                                                    {t('payments.paid_on', 'Paid on')} {formatDate(payment.payment_date)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {payment.subscription ? (
                                            <div className="flex flex-col gap-1">
                                                <Link
                                                    href={route("subscriptions.show", payment.subscription.id)}
                                                    className="font-semibold text-blue-600 hover:underline text-sm"
                                                >
                                                    {payment.subscription.plan?.name || 'N/A'}
                                                </Link>
                                                <div className="text-xs text-gray-500">
                                                    {t('payments.subscription_id', 'Sub ID')}: #{payment.subscription.id}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">{t('payments.no_subscription', 'No subscription')}</span>
                                        )}
                                    </td>
                                    <td>
                                        {payment.subscription?.user ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-green-600" />
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-800">
                                                        {payment.subscription.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {payment.subscription.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">{t('payments.no_user', 'No user')}</span>
                                        )}
                                    </td>
                                    <td>
                                        {payment.payment_method && (
                                            <span className={`badge badge-outline capitalize ${getPaymentMethodDetails(payment.payment_method).class}`}>
                                                {getPaymentMethodDetails(payment.payment_method).label}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-green-700">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar size={12} className="text-purple-600" />
                                            <span>
                                                {payment.payment_date ? formatDateTime(payment.payment_date) : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(payment.status).class} badge-sm flex items-center gap-1`}>
                                            {getStatusBadge(payment.status).icon}
                                            {getStatusBadge(payment.status).label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Link
                                                href={`/subscriptions_payments/view/${payment.id}`}
                                                className="btn bg-[#1e4d2b] text-white btn-xs"
                                                title={t('payments.view', 'View')}
                                            >
                                                <Eye size={12} /> 
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {t('payments.no_payment_records', 'No payment records found!')}
                        </h1>
                        <p className="text-gray-400 text-sm mb-4">
                            {hasActiveFilters() 
                                ? t('payments.adjust_search_filters', 'Try adjusting your search or filters') 
                                : t('payments.no_payment_records_available', 'No payment records available')
                            }
                        </p>
                        <Link
                            href={route("subscriptions.index")}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <CreditCard size={15} /> {t('payments.view_subscriptions', 'View Subscriptions')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {subscription.data.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {t('payments.showing_records', 'Showing')} {subscription.from} {t('payments.to', 'to')} {subscription.to} {t('payments.of', 'of')} {subscription.total} {t('payments.payment_records', 'payment records')}
                        </div>
                        
                        {/* Pagination Controls */}
                        <div className="join">
                            {/* Previous Button */}
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="join-item btn btn-sm"
                            >
                                «
                            </button>
                            
                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, subscription.last_page) }, (_, i) => {
                                let pageNum;
                                if (subscription.last_page <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= subscription.last_page - 2) {
                                    pageNum = subscription.last_page - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => goToPage(pageNum)}
                                        className={`join-item btn btn-sm ${currentPage === pageNum ? 'bg-[#1e4d2b] text-white' : ''}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            {/* Next Button */}
                            <button
                                onClick={nextPage}
                                disabled={currentPage === subscription.last_page}
                                className="join-item btn btn-sm"
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {subscription.data.length > 0 && (
                <div className="border-t border-gray-200 p-5 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('payments.payments_summary', 'Payments Summary')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        {t('payments.total_payments', 'Total Payments')}
                                    </p>
                                    <p className="text-xl font-bold text-blue-900">{subscription.total}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {t('payments.completed_payments', 'Completed Payments')}
                                    </p>
                                    <p className="text-xl font-bold text-green-900">
                                        {subscription.data.filter(payment => payment.status === 'completed').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-purple-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-purple-800">
                                        {t('payments.total_revenue', 'Total Revenue')}
                                    </p>
                                    <p className="text-xl font-bold text-purple-900">
                                        {formatCurrency(
                                            subscription.data
                                                .filter(payment => payment.status === 'completed')
                                                .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        {t('payments.pending_payments', 'Pending Payments')}
                                    </p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {subscription.data.filter(payment => payment.status === 'pending').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Breakdown */}
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">
                            {t('payments.payment_methods_breakdown', 'Payment Methods Breakdown')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {['cash', 'card', 'bank', 'mobile', 'online'].map(method => {
                                const methodPayments = subscription.data.filter(payment => payment.payment_method === method);
                                const methodDetails = getPaymentMethodDetails(method);
                                
                                return (
                                    <div key={method} className={`border rounded-lg p-3 ${methodDetails.class}`}>
                                        <p className="text-sm font-medium capitalize">{methodDetails.label}</p>
                                        <p className="text-lg font-bold">{methodPayments.length}</p>
                                        <p className="text-xs text-gray-600">
                                            {formatCurrency(
                                                methodPayments
                                                    .filter(p => p.status === 'completed')
                                                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                                            )}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}