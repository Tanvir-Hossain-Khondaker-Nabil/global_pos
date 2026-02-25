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
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CalendarDays
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "react-toastify";

export default function Index({ subscriptions }) {
    const { t, locale } = useTranslation();
    const [showFilters, setShowFilters] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Search and filter states
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Apply filters manually
    const applyFilters = () => {
        const params = {};

        if (search) params.search = search;
        if (status) params.status = status;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (currentPage > 1) params.page = currentPage;

        router.get(route("subscriptions.index"), params, {
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
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
        router.get(route("subscriptions.index"));
    };

    // Toggle filter section
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Check if any filter is active
    const hasActiveFilters = () => {
        return search || status || dateFrom || dateTo;
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
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-BD', {
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

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            1: { label: t('subscription.active', 'Active'), class: 'badge-success', icon: BadgeCheck },
            2: { label: t('subscription.expired', 'Expired'), class: 'badge-neutral', icon: Calendar },
            3: { label: t('subscription.cancelled', 'Cancelled'), class: 'badge-error', icon: Ban },
            4: { label: t('subscription.pending', 'Pending'), class: 'badge-warning', icon: Clock },
        };
        
        const statusInfo = statusMap[status] || { label: status, class: 'badge-warning', icon: Clock };
        const StatusIcon = statusInfo.icon;
        
        return {
            ...statusInfo,
            icon: <StatusIcon size={12} />
        };
    };

    // Calculate days remaining
    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Get total payments amount
    const getTotalPayments = (payments) => {
        return payments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
    };

    // Prepare data for export
    const prepareExportData = () => {
        return subscriptions.data.map(subscription => ({
            'User Name': subscription.user?.name || 'N/A',
            'User Email': subscription.user?.email || 'N/A',
            'Plan Name': subscription.plan?.name || 'N/A',
            'Plan Price': formatCurrency(subscription.plan?.price || 0),
            'Start Date': formatDate(subscription.start_date),
            'End Date': formatDate(subscription.end_date),
            'Days Remaining': subscription.status == 1 ? getDaysRemaining(subscription.end_date) : 0,
            'Total Payments': subscription.payments?.length || 0,
            'Total Amount Paid': formatCurrency(getTotalPayments(subscription.payments || [])),
            'Status': getStatusBadge(subscription.status).label,
            'Created At': formatDateTime(subscription.created_at)
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
            csvRows.push(`Date From,${dateFrom || 'None'}`);
            csvRows.push(`Date To,${dateTo || 'None'}`);

            csvRows.push('');
            csvRows.push('SUMMARY STATISTICS');
            const activeCount = subscriptions.data.filter(s => s.status == 1).length;
            const totalRevenue = subscriptions.data.reduce((sum, sub) => sum + getTotalPayments(sub.payments || []), 0);
            
            csvRows.push(`Total Subscriptions,${subscriptions.total || 0}`);
            csvRows.push(`Active Subscriptions,${activeCount}`);
            csvRows.push(`Total Revenue (Tk),${totalRevenue.toFixed(2)}`);

            const csvString = csvRows.join('\n');
            
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `subscriptions_${formatDateForFilename()}.csv`;
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
                { 'Filter': 'Date From', 'Value': dateFrom || 'None' },
                { 'Filter': 'Date To', 'Value': dateTo || 'None' }
            ];
            const wsFilters = XLSX.utils.json_to_sheet(filterData);

            // Summary sheet
            const activeCount = subscriptions.data.filter(s => s.status == 1).length;
            const totalRevenue = subscriptions.data.reduce((sum, sub) => sum + getTotalPayments(sub.payments || []), 0);
            
            const summaryData = [
                { 'Metric': 'Total Subscriptions', 'Value': subscriptions.total || 0 },
                { 'Metric': 'Active Subscriptions', 'Value': activeCount },
                { 'Metric': 'Total Revenue (Tk)', 'Value': totalRevenue.toFixed(2) }
            ];
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);

            XLSX.utils.book_append_sheet(wb, ws, 'Subscriptions');
            XLSX.utils.book_append_sheet(wb, wsFilters, 'Filters Applied');
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

            XLSX.writeFile(wb, `subscriptions_${formatDateForFilename()}.xlsx`);
            
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
            
            if (subscriptions.data.length === 0) {
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
            doc.text('Subscriptions Report', 14, 15);
            
            // Add date
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            // Add filter information
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Search: ${search || 'None'} | Status: ${status || 'All'}`, 14, 29);
            doc.text(`Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, 14, 35);

            // Prepare table columns and rows
            const tableColumns = [
                'User',
                'Plan',
                'Start Date',
                'End Date',
                'Status',
                'Total Paid'
            ];

            const tableRows = subscriptions.data.map(subscription => [
                subscription.user?.name?.substring(0, 15) || 'N/A',
                subscription.plan?.name?.substring(0, 15) || 'N/A',
                formatDate(subscription.start_date),
                formatDate(subscription.end_date),
                getStatusBadge(subscription.status).label,
                formatCurrency(getTotalPayments(subscription.payments || []))
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
            const activeCount = subscriptions.data.filter(s => s.status == 1).length;
            const totalRevenue = subscriptions.data.reduce((sum, sub) => sum + getTotalPayments(sub.payments || []), 0);
            const finalY = doc.lastAutoTable.finalY + 10;
            
            doc.setFontSize(12);
            doc.setTextColor(30, 77, 43);
            doc.text('Summary Statistics', 14, finalY);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Subscriptions: ${subscriptions.total || 0}`, 14, finalY + 7);
            doc.text(`Active Subscriptions: ${activeCount}`, 14, finalY + 14);
            doc.text(`Total Revenue: ${totalRevenue.toFixed(2)} Tk`, 14, finalY + 21);

            // Save PDF
            doc.save(`subscriptions_${formatDateForFilename()}.pdf`);
            
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
        const params = {};
        if (search) params.search = search;
        if (status) params.status = status;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        params.page = page;
        
        router.get(route("subscriptions.index"), params, {
            preserveState: true,
            replace: true
        });
    };

    const nextPage = () => {
        if (subscriptions.next_page_url) {
            const url = new URL(subscriptions.next_page_url);
            const page = url.searchParams.get('page');
            if (page) goToPage(parseInt(page));
        }
    };

    const prevPage = () => {
        if (subscriptions.prev_page_url) {
            const url = new URL(subscriptions.prev_page_url);
            const page = url.searchParams.get('page');
            if (page) goToPage(parseInt(page));
        }
    };

    const firstPage = () => {
        if (subscriptions.first_page_url) {
            goToPage(1);
        }
    };

    const lastPage = () => {
        if (subscriptions.last_page_url) {
            goToPage(subscriptions.last_page);
        }
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('subscription.subscription_management', 'Subscriptions Management')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {t('subscription.manage_user_subscriptions', 'Manage user subscriptions and billing')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("subscriptions.create")}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Plus size={15} /> {t('subscription.create_subscription', 'Create New Subscription')}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('subscription.search_subscriptions', 'Search Subscriptions')}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={t('subscription.search_placeholder', 'Search by user name, email, plan name...')}
                                        className="input input-bordered w-full pl-10"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('subscription.status', 'Status')}
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="select select-bordered w-full"
                                >
                                    <option value="">{t('subscription.all_status', 'All Status')}</option>
                                    <option value="active">{t('subscription.active', 'Active')}</option>
                                    <option value="pending">{t('subscription.pending', 'Pending')}</option>
                                    <option value="expired">{t('subscription.expired', 'Expired')}</option>
                                    <option value="cancelled">{t('subscription.cancelled', 'Cancelled')}</option>
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('subscription.date_from', 'Date From')}
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

                            {/* Date To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('subscription.date_to', 'Date To')}
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
                        <div className="mt-4 flex justify-end">
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
                        disabled={isDownloading || subscriptions.data.length === 0}
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

            {/* Subscriptions Table */}
            <div className="overflow-x-auto">
                {subscriptions.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white">
                            <tr>
                                <th className="text-center">{t('subscription.sl', 'SL')}</th>
                                <th>{t('subscription.user', 'User')}</th>
                                <th>{t('subscription.plan', 'Plan')}</th>
                                <th>{t('subscription.price', 'Price')}</th>
                                <th>{t('subscription.period', 'Period')}</th>
                                <th>{t('subscription.payments', 'Payments')}</th>
                                <th>{t('subscription.status', 'Status')}</th>
                                <th className="text-center">{t('subscription.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.data.map((subscription, index) => (
                                <tr key={subscription.id} className="hover:bg-gray-50">
                                    <td className="text-center">
                                        {subscriptions.from + index}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {subscription.user?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {subscription.user?.email || 'No email'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={16} className="text-green-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {subscription.plan?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {subscription.plan?.description ? 
                                                        subscription.plan.description.substring(0, 30) + '...' : 
                                                        'No description'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">
                                                {formatCurrency(subscription.plan?.price || 0)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="w-50">
                                        <div className="flex flex-col gap-1 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-purple-600" />
                                                <span>{t('subscription.start', 'Start')}: {formatDate(subscription.start_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-orange-600" />
                                                <span>{t('subscription.end', 'End')}: {formatDate(subscription.end_date)}</span>
                                            </div>
                                            {subscription.status == 1 && (
                                                <div className="text-xs text-primary font-medium">
                                                    {getDaysRemaining(subscription.end_date)} {t('subscription.days_remaining', 'days remaining')}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold">
                                                    {formatCurrency(getTotalPayments(subscription.payments || []))}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {subscription.payments?.length || 0} {t('subscription.payment_count', 'payment(s)')}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(subscription.status).class} badge-sm flex items-center gap-1`}>
                                            {getStatusBadge(subscription.status).icon}
                                            {getStatusBadge(subscription.status).label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Link
                                                href={route("user_subscriptions.show", subscription.id)}
                                                className="btn bg-[#1e4d2b] text-white btn-xs"
                                            >
                                                <Eye size={12} /> 
                                            </Link>

                                            <Link
                                                href={route("user_subscriptions.renew_edit", subscription.id)}
                                                className="btn btn-primary btn-xs"
                                                title={t('subscription.renew', 'Renew')}
                                            >
                                                <DollarSign size={12} /> 
                                            </Link>

                                            <Link
                                                href={route("user_subscriptions.edit", subscription.id)}
                                                className="btn btn-warning btn-xs"
                                                title={t('subscription.edit', 'Edit')}
                                            >
                                                <Edit size={12} /> 
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
                            {t('subscription.no_subscriptions_found', 'No subscriptions found!')}
                        </h1>
                        <p className="text-gray-400 text-sm mb-4">
                            {hasActiveFilters() 
                                ? t('subscription.adjust_search_filters', 'Try adjusting your search or filters')
                                : t('subscription.get_started_create', 'Get started by creating your first subscription')
                            }
                        </p>
                        <Link
                            href={route("subscriptions.create")}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('subscription.create_subscription', 'Create New Subscription')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {subscriptions.data.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {t('subscription.showing_entries', 'Showing')} {subscriptions.from} {t('subscription.to', 'to')} {subscriptions.to} {t('subscription.of', 'of')} {subscriptions.total} {t('subscription.entries', 'entries')}
                        </div>
                        
                        {/* Enhanced Pagination Controls */}
                        <div className="join">
                            {/* First Page Button */}
                            <button
                                onClick={firstPage}
                                disabled={subscriptions.current_page === 1}
                                className="join-item btn btn-sm"
                                title="First page"
                            >
                                <ChevronsLeft size={16} />
                            </button>

                            {/* Previous Button */}
                            <button
                                onClick={prevPage}
                                disabled={!subscriptions.prev_page_url}
                                className="join-item btn btn-sm"
                                title="Previous page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            
                            {/* Page Numbers */}
                            {subscriptions.links && subscriptions.links.slice(1, -1).map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        const url = new URL(link.url);
                                        const page = url.searchParams.get('page');
                                        if (page) goToPage(parseInt(page));
                                    }}
                                    className={`join-item btn btn-sm ${link.active ? 'bg-[#1e4d2b] text-white' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                            
                            {/* Next Button */}
                            <button
                                onClick={nextPage}
                                disabled={!subscriptions.next_page_url}
                                className="join-item btn btn-sm"
                                title="Next page"
                            >
                                <ChevronRight size={16} />
                            </button>

                            {/* Last Page Button */}
                            <button
                                onClick={lastPage}
                                disabled={subscriptions.current_page === subscriptions.last_page}
                                className="join-item btn btn-sm"
                                title="Last page"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {subscriptions.data.length > 0 && (
                <div className="border-t border-gray-200 p-5 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {t('subscription.subscriptions_summary', 'Subscriptions Summary')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        {t('subscription.total_subscriptions', 'Total Subscriptions')}
                                    </p>
                                    <p className="text-xl font-bold text-blue-900">{subscriptions.total}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-green-800">
                                        {t('subscription.active_subscriptions', 'Active Subscriptions')}
                                    </p>
                                    <p className="text-xl font-bold text-green-900">
                                        {subscriptions.data.filter(sub => sub.status == 1).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-purple-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-purple-800">
                                        {t('subscription.total_revenue', 'Total Revenue')}
                                    </p>
                                    <p className="text-xl font-bold text-purple-900">
                                        {formatCurrency(
                                            subscriptions.data.reduce((sum, sub) => 
                                                sum + getTotalPayments(sub.payments || []), 0
                                            )
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <User className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        {t('subscription.active_users', 'Active Users')}
                                    </p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {new Set(
                                            subscriptions.data
                                                .filter(sub => sub.status == 1)
                                                .map(sub => sub.user?.id)
                                                .filter(Boolean)
                                        ).size}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}