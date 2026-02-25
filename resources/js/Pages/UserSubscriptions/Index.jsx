import { Link, router } from "@inertiajs/react";
import {
    Plus,
    Trash2,
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
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CalendarDays,
    MoreVertical,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    Shield,
    FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "react-toastify";

export default function Index({ subscriptions, filters, statistics }) {
    const { t, locale } = useTranslation();
    const [showFilters, setShowFilters] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const [showActionDropdown, setShowActionDropdown] = useState(null);

    // Search and filter states
    const [search, setSearch] = useState(filters?.search || "");
    const [status, setStatus] = useState(filters?.status || "");
    const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
    const [dateTo, setDateTo] = useState(filters?.date_to || "");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(parseInt(filters?.page) || 1);

    const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

    // Apply filters manually
    const applyFilters = () => {
        const params = {};

        if (search) params.search = search;
        if (status) params.status = status;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (currentPage > 1) params.page = currentPage;

        router.get(route("user_subscriptions.view"), params, {
            preserveState: true,
            preserveScroll: true,
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
        router.get(route("user_subscriptions.view"), {
            preserveState: true,
            preserveScroll: true,
        });
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
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format date with time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            1: { label: 'Active', class: 'bg-emerald-100 text-emerald-800 ring-emerald-200', icon: CheckCircle },
            2: { label: 'Expired', class: 'bg-gray-100 text-gray-800 ring-gray-200', icon: XCircle },
            3: { label: 'Cancelled', class: 'bg-rose-100 text-rose-800 ring-rose-200', icon: Ban },
            4: { label: 'Pending', class: 'bg-amber-100 text-amber-800 ring-amber-200', icon: AlertCircle },
        };

        const statusInfo = statusMap[status] || { label: 'Unknown', class: 'bg-gray-100 text-gray-800 ring-gray-200', icon: AlertCircle };
        const StatusIcon = statusInfo.icon;

        return {
            ...statusInfo,
            icon: <StatusIcon size={12} />
        };
    };

    // Calculate days remaining
    const getDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    // Get total payments amount
    const getTotalPayments = (payments) => {
        return payments?.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0) || 0;
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
            setShowDownloadDropdown(false);
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
            setShowDownloadDropdown(false);
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
            doc.setTextColor(30, 77, 43);
            doc.text('Subscriptions Management Report', 14, 15);

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
            setShowDownloadDropdown(false);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    // Handle subscription cancellation
    const handleCancelSubscription = (subscriptionId) => {
        if (confirm('Are you sure you want to cancel this subscription?')) {
            router.post(route("user_subscriptions.cancel", subscriptionId), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Subscription cancelled successfully');
                },
                onError: () => {
                    toast.error('Failed to cancel subscription');
                }
            });
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

        router.get(route("user_subscriptions.view"), params, {
            preserveState: true,
            preserveScroll: true,
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
        goToPage(1);
    };

    const lastPage = () => {
        goToPage(subscriptions.last_page);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.download-dropdown-container')) {
                setShowDownloadDropdown(false);
            }
            if (!event.target.closest('.action-dropdown')) {
                setShowActionDropdown(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-gray-900">
            {/* Header Section */}
            <div
                className="mb-8 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-900/10"
                style={{ background: gradient }}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold">
                                Subscriptions Management
                            </h1>
                            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/20">
                                {subscriptions?.total || 0} Subscriptions
                            </span>
                        </div>
                        <p className="mt-2 text-white/80">
                            Manage user subscriptions and billing information
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={route("subscriptions.create")}
                            className="group flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Subscription
                        </Link>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div
                                className="p-3 rounded-xl text-white shadow-sm"
                                style={{ background: gradient }}
                            >
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">
                                    Total Subscriptions
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">
                                    {statistics.total_subscriptions || subscriptions?.total || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <BadgeCheck className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">
                                    Active Subscriptions
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">
                                    {statistics.active_subscriptions || 
                                        subscriptions?.data?.filter(s => s.status == 1).length || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">
                                    Total Revenue
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(statistics.total_revenue || 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">
                                    Active Users
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">
                                    {statistics.active_users || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-emerald-700" />
                        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        {hasActiveFilters() && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                                Active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Clear
                        </button>
                        <button
                            onClick={toggleFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Search Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Subscriptions
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Search by user name, email, plan..."
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                                >
                                    <option value="">All Status</option>
                                    <option value="1">Active</option>
                                    <option value="2">Expired</option>
                                    <option value="3">Cancelled</option>
                                    <option value="4">Pending</option>
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date From
                                </label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formatDateForInput(dateFrom)}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date To
                                </label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formatDateForInput(dateTo)}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        min={dateFrom}
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={applyFilters}
                                className="flex items-center gap-2 h-12 px-6 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition-all"
                                style={{ background: gradient }}
                            >
                                <Search className="h-4 w-4" />
                                Apply Filters
                            </button>
                        </div>
                    </>
                )}

                {/* Active Filters Display */}
                {hasActiveFilters() && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Active Filters:</span>
                        {search && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                                Search: {search}
                            </span>
                        )}
                        {status && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                                Status: {status === '1' ? 'Active' : status === '2' ? 'Expired' : status === '3' ? 'Cancelled' : 'Pending'}
                            </span>
                        )}
                        {dateFrom && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                                From: {new Date(dateFrom).toLocaleDateString()}
                            </span>
                        )}
                        {dateTo && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                                To: {new Date(dateTo).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Download Button */}
            {subscriptions.data?.length > 0 && (
                <div className="flex justify-end mb-4 download-dropdown-container">
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold shadow-sm hover:shadow-md transition-all"
                            style={{ background: gradient }}
                            disabled={isDownloading}
                            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                        >
                            <Download size={16} />
                            {isDownloading ? 'Downloading...' : 'Download Report'}
                        </button>
                        {showDownloadDropdown && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
                                <button
                                    onClick={downloadCSV}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 first:rounded-t-xl transition-colors"
                                >
                                    CSV Format
                                </button>
                                <button
                                    onClick={downloadExcel}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                                >
                                    Excel Format
                                </button>
                                <button
                                    onClick={downloadPDF}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 last:rounded-b-xl transition-colors"
                                >
                                    PDF Format
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payments</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                            {subscriptions.data?.map((subscription, index) => (
                                <tr key={subscription.id} className="hover:bg-emerald-50/40 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {(subscriptions.from || 0) + index}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {subscription.user?.avatar ? (
                                                    <img
                                                        src={`/media/uploads/${subscription.user.avatar}`}
                                                        alt={subscription.user.name}
                                                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div
                                                        className="h-10 w-10 rounded-full flex items-center justify-center border border-emerald-900/10 text-white text-sm font-semibold shadow-sm"
                                                        style={{ background: gradient }}
                                                    >
                                                        {subscription.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {subscription.user?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {subscription.user?.email || 'No email'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {subscription.plan?.name || 'N/A'}
                                            </div>
                                            {subscription.plan?.description && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {subscription.plan.description.substring(0, 30)}
                                                    {subscription.plan.description.length > 30 ? '...' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-gray-900">
                                            {formatCurrency(subscription.plan?.price || 0)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar size={12} className="text-emerald-600" />
                                                <span className="text-gray-600">Start:</span>
                                                <span className="text-gray-900">{formatDate(subscription.start_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar size={12} className="text-amber-600" />
                                                <span className="text-gray-600">End:</span>
                                                <span className="text-gray-900">{formatDate(subscription.end_date)}</span>
                                            </div>
                                            {subscription.status == 1 && (
                                                <div className="text-xs text-emerald-600 font-medium">
                                                    {getDaysRemaining(subscription.end_date)} days remaining
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(getTotalPayments(subscription.payments || []))}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {subscription.payments?.length || 0} payment(s)
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(subscription.status).class}`}>
                                            {getStatusBadge(subscription.status).icon}
                                            {getStatusBadge(subscription.status).label}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="relative action-dropdown">
                                            <button
                                                onClick={() => setShowActionDropdown(showActionDropdown === subscription.id ? null : subscription.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-sm font-medium"
                                            >
                                                <MoreVertical size={14} />
                                                Actions
                                            </button>

                                            {showActionDropdown === subscription.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20">
                                                    <Link
                                                        href={route("user_subscriptions.show", subscription.id)}
                                                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 first:rounded-t-xl transition-colors"
                                                    >
                                                        <Eye size={14} className="text-blue-600" />
                                                        View Details
                                                    </Link>

                                                    <Link
                                                        href={route("user_subscriptions.edit", subscription.id)}
                                                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                                                    >
                                                        <Edit size={14} className="text-amber-600" />
                                                        Edit
                                                    </Link>

                                                    {subscription.status == 1 && (
                                                        <Link
                                                            href={route("user_subscriptions.renew_edit", subscription.id)}
                                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <DollarSign size={14} className="text-emerald-600" />
                                                            Renew
                                                        </Link>
                                                    )}

                                                    {subscription.status != 3 && (
                                                        <button
                                                            onClick={() => handleCancelSubscription(subscription.id)}
                                                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 last:rounded-b-xl transition-colors"
                                                        >
                                                            <Ban size={14} />
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {(!subscriptions.data || subscriptions.data.length === 0) && (
                    <div className="text-center py-16">
                        <div className="mx-auto h-16 w-16 text-gray-400">
                            <CreditCard className="h-16 w-16" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                            No subscriptions found
                        </h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                            {hasActiveFilters()
                                ? "No subscriptions match your search criteria. Try changing your filters."
                                : "Get started by creating your first subscription."
                            }
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route("subscriptions.create")}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                                style={{ background: gradient }}
                            >
                                <Plus className="h-4 w-4" />
                                New Subscription
                            </Link>
                        </div>
                    </div>
                )}

                {/* Enhanced Pagination with First/Last buttons */}
                {subscriptions.data?.length > 0 && subscriptions.links && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 px-6 py-4">
                        <div className="text-sm text-gray-700">
                            Showing{" "}
                            <span className="font-semibold">{subscriptions.from}</span>{" "}
                            to{" "}
                            <span className="font-semibold">{subscriptions.to}</span>{" "}
                            of <span className="font-semibold">{subscriptions.total}</span>{" "}
                            subscriptions
                        </div>

                        <div className="flex items-center gap-2">
                            {/* First Page Button */}
                            <button
                                onClick={firstPage}
                                disabled={subscriptions.current_page === 1}
                                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="First page"
                            >
                                <ChevronsLeft size={18} />
                            </button>

                            {/* Previous Button */}
                            <button
                                onClick={prevPage}
                                disabled={!subscriptions.prev_page_url}
                                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Previous page"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {subscriptions.links.slice(1, -1).map((link) => (
                                    <button
                                        key={link.label}
                                        onClick={() => {
                                            if (link.url) {
                                                const url = new URL(link.url);
                                                const page = url.searchParams.get('page');
                                                if (page) goToPage(parseInt(page));
                                            }
                                        }}
                                        disabled={!link.url || link.active}
                                        className={`min-w-[40px] h-10 rounded-xl text-sm font-medium transition-colors ${
                                            link.active
                                                ? "text-white shadow-sm"
                                                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        style={link.active ? { background: gradient } : undefined}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={nextPage}
                                disabled={!subscriptions.next_page_url}
                                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Next page"
                            >
                                <ChevronRight size={18} />
                            </button>

                            {/* Last Page Button */}
                            <button
                                onClick={lastPage}
                                disabled={subscriptions.current_page === subscriptions.last_page}
                                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Last page"
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Statistics */}
            {subscriptions.data?.length > 0 && (
                <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Subscription Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                            <p className="text-sm font-medium text-blue-800 mb-1">Total Subscriptions</p>
                            <p className="text-2xl font-bold text-gray-900">{subscriptions.total || 0}</p>
                            <p className="text-xs text-blue-600 mt-1">All time subscriptions</p>
                        </div>

                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                            <p className="text-sm font-medium text-emerald-800 mb-1">Active</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {subscriptions.data?.filter(s => s.status == 1).length || 0}
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">Currently active</p>
                        </div>

                        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
                            <p className="text-sm font-medium text-purple-800 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(
                                    subscriptions.data?.reduce((sum, sub) => 
                                        sum + getTotalPayments(sub.payments || []), 0
                                    ) || 0
                                )}
                            </p>
                            <p className="text-xs text-purple-600 mt-1">Total payments received</p>
                        </div>

                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                            <p className="text-sm font-medium text-amber-800 mb-1">Expiring Soon</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {subscriptions.data?.filter(s => 
                                    s.status == 1 && getDaysRemaining(s.end_date) <= 7
                                ).length || 0}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">Within 7 days</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}