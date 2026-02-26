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
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "react-toastify";

export default function Index({ users, filters, roles, statistics, hasSubscription }) {
  const { t, locale } = useTranslation();
  const [showFilters, setShowFilters] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(null);

  // Search and filter states
  const [search, setSearch] = useState(filters?.search || "");
  const [role, setRole] = useState(filters?.role || "");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(filters?.page) || 1);

  const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

  // Apply filters manually
  const applyFilters = () => {
    const params = {};

    if (search) params.search = search;
    if (role) params.role = role;
    if (currentPage > 1) params.page = currentPage;

    router.get(route("userlist.view"), params, {
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
    setRole("");
    setCurrentPage(1);
    router.get(route("userlist.view"), {
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
    return search || role;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dateString;
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return dateString;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', class: 'bg-emerald-100 text-emerald-800 ring-emerald-200', icon: CheckCircle },
      inactive: { label: 'Inactive', class: 'bg-gray-100 text-gray-800 ring-gray-200', icon: XCircle },
    };

    const statusInfo = statusMap[status] || { label: 'Unknown', class: 'bg-gray-100 text-gray-800 ring-gray-200', icon: AlertCircle };
    const StatusIcon = statusInfo.icon;

    return {
      ...statusInfo,
      icon: <StatusIcon size={12} />
    };
  };

  // Get role badge
  const getRoleBadge = (roles) => {
    if (!roles || roles.length === 0) return null;

    const role = roles[0];
    const roleMap = {
      'admin': { class: 'bg-purple-100 text-purple-800 ring-purple-200', icon: Shield },
      'seller': { class: 'bg-blue-100 text-blue-800 ring-blue-200', icon: Briefcase },
    };

    const roleInfo = roleMap[role] || { class: 'bg-gray-100 text-gray-800 ring-gray-200', icon: User };
    const RoleIcon = roleInfo.icon;

    return {
      label: role,
      class: roleInfo.class,
      icon: <RoleIcon size={12} />
    };
  };

  const handleActiveStatusToggle = (userId) => {
    const confirmAction = window.confirm(
      "Do you want to activate this user?"
    );

    if (!confirmAction) return;

    router.post(route("users.active", userId), {
      preserveScroll: true,
      onError: () => {
        alert("Failed to update user status. Please try again.");
      },
    });
  };

  const handleHoldStatusToggle = (userId) => {
    const confirmAction = window.confirm(
      "Do you want to hold this user?"
    );

    if (!confirmAction) return;

    router.post(route("users.hold", userId), {
      preserveScroll: true,
      onError: () => {
        alert("Failed to update user status. Please try again.");
      },
    });
  };

  // Prepare data for export
  const prepareExportData = () => {
    return users.data.map(user => ({
      'Name': user.name || 'N/A',
      'Email': user.email || 'N/A',
      'Phone': user.phone || 'N/A',
      'Role': user.roles?.[0] || 'N/A',
      'Status': getStatusBadge(user.status).label,
      'Join Date': user.join_at,
      'Last Login': user.last_login || 'Never',
      'Address': user.address || 'N/A'
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
      csvRows.push(`Role,${role || 'All'}`);

      csvRows.push('');
      csvRows.push('SUMMARY STATISTICS');

      csvRows.push(`Total Users,${statistics.total_users || 0}`);
      csvRows.push(`Active Users,${statistics.active_users || 0}`);
      csvRows.push(`Admins,${statistics.admins_count || 0}`);
      csvRows.push(`Sellers,${statistics.sellers_count || 0}`);

      const csvString = csvRows.join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `users_${formatDateForFilename()}.csv`;
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

  // Format date for filename
  const formatDateForFilename = () => {
    const now = new Date();
    return now.toISOString().split('T')[0] + '_' +
      now.getHours() + '-' +
      now.getMinutes() + '-' +
      now.getSeconds();
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
        { 'Filter': 'Role', 'Value': role || 'All' }
      ];
      const wsFilters = XLSX.utils.json_to_sheet(filterData);

      // Summary sheet
      const summaryData = [
        { 'Metric': 'Total Users', 'Value': statistics.total_users || 0 },
        { 'Metric': 'Active Users', 'Value': statistics.active_users || 0 },
        { 'Metric': 'Admins', 'Value': statistics.admins_count || 0 },
        { 'Metric': 'Sellers', 'Value': statistics.sellers_count || 0 }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      XLSX.utils.book_append_sheet(wb, ws, 'Users');
      XLSX.utils.book_append_sheet(wb, wsFilters, 'Filters Applied');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      XLSX.writeFile(wb, `users_${formatDateForFilename()}.xlsx`);

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

      if (users.data.length === 0) {
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
      doc.text('Users Management Report', 14, 15);

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      // Add filter information
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Search: ${search || 'None'} | Role: ${role || 'All'}`, 14, 29);

      // Prepare table columns and rows
      const tableColumns = [
        'Name',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Join Date'
      ];

      const tableRows = users.data.map(user => [
        user.name?.substring(0, 20) || 'N/A',
        user.email?.substring(0, 20) || 'N/A',
        user.phone || 'N/A',
        user.roles?.[0] || 'N/A',
        getStatusBadge(user.status).label,
        user.join_at
      ]);

      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 77, 43], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Add summary statistics
      const finalY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.setTextColor(30, 77, 43);
      doc.text('Summary Statistics', 14, finalY);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Users: ${statistics.total_users || 0}`, 14, finalY + 7);
      doc.text(`Active Users: ${statistics.active_users || 0}`, 14, finalY + 14);
      doc.text(`Admins: ${statistics.admins_count || 0}`, 14, finalY + 21);
      doc.text(`Sellers: ${statistics.sellers_count || 0}`, 14, finalY + 28);

      // Save PDF
      doc.save(`users_${formatDateForFilename()}.pdf`);

      toast.success('PDF downloaded successfully');
      setShowDownloadDropdown(false);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle user status toggle
  const handleToggleStatus = (userId) => {
    const action = confirm('Are you sure you want to change this user\'s status?');
    if (action) {
      router.post(route("users.toggle-status", userId), {}, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('User status updated successfully');
        },
        onError: () => {
          toast.error('Failed to update user status');
        }
      });
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    const params = {};
    if (search) params.search = search;
    if (role) params.role = role;
    params.page = page;

    router.get(route("userlist.view"), params, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const nextPage = () => {
    if (users.next_page_url) {
      const url = new URL(users.next_page_url);
      const page = url.searchParams.get('page');
      if (page) goToPage(parseInt(page));
    }
  };

  const prevPage = () => {
    if (users.prev_page_url) {
      const url = new URL(users.prev_page_url);
      const page = url.searchParams.get('page');
      if (page) goToPage(parseInt(page));
    }
  };

  const firstPage = () => {
    goToPage(1);
  };

  const lastPage = () => {
    goToPage(users.last_page);
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
                Users Management
              </h1>
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/20">
                {statistics?.total_users || 0} Users
              </span>
            </div>
            <p className="mt-2 text-white/80">
              Manage system users, roles, and permissions
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={route("users.create")}
              className="group flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New User
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
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Total Users
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.total_users || 0}
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
                  Active Users
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.active_users || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Admins
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.admins_count || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">
                  Sellers
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {statistics.sellers_count || 0}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Search by name, email, phone..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                >
                  <option value="">All Roles</option>
                  {roles?.map(roleName => (
                    <option key={roleName} value={roleName}>
                      {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                    </option>
                  ))}
                </select>
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
            {role && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                Role: {role}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Download Button */}
      {users.data?.length > 0 && (
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
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {users.data?.map((user, index) => (
                <tr key={user.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(users.from || 0) + index}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={`/media/uploads/${user.avatar}`}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center border border-emerald-900/10 text-white text-sm font-semibold shadow-sm"
                            style={{ background: gradient }}
                          >
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {user.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Mail size={12} className="text-gray-400" />
                        <span className="text-gray-600">{user.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone size={12} className="text-gray-400" />
                        <span className="text-gray-600">{user.phone || 'N/A'}</span>
                      </div>
                      {user.address && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin size={12} className="text-gray-400" />
                          <span className="text-gray-600">{user.address}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {user.roles && user.roles.length > 0 ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadge(user.roles).class}`}>
                        {getRoleBadge(user.roles).icon}
                        {user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No role</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(user.status).class}`}>
                      {getStatusBadge(user.status).icon}
                      {getStatusBadge(user.status).label}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.join_at}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.last_login || 'Never'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="relative action-dropdown">
                      <button
                        onClick={() => setShowActionDropdown(showActionDropdown === user.id ? null : user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-sm font-medium"
                      >
                        <MoreVertical size={14} />
                        Actions
                      </button>

                      {showActionDropdown === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20">

                          <Link
                            href={route("userlist.edit", user.id)}
                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit size={14} className="text-amber-600" />
                            Edit
                          </Link>

                          {user.status === 'inactive' ? (
                            <button
                              onClick={() => handleActiveStatusToggle(user.id)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                              title="Activate"
                            >
                              <CheckCircle className="h-4 w-4" /> Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHoldStatusToggle(user.id)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                              title="Hold"
                            >
                              <Plus className="h-4 w-4" /> Hold
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
        {(!users.data || users.data.length === 0) && (
          <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 text-gray-400">
              <Users className="h-16 w-16" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No users found
            </h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              {hasActiveFilters()
                ? "No users match your search criteria. Try changing your filters."
                : "Get started by adding your first user."
              }
            </p>
            <div className="mt-6">
              <Link
                href={route("users.create")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                style={{ background: gradient }}
              >
                <Plus className="h-4 w-4" />
                Add New User
              </Link>
            </div>
          </div>
        )}

        {/* Enhanced Pagination with First/Last buttons */}
        {users.data?.length > 0 && users.links && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-semibold">{users.from}</span>{" "}
              to{" "}
              <span className="font-semibold">{users.to}</span>{" "}
              of <span className="font-semibold">{users.total}</span>{" "}
              users
            </div>

            <div className="flex items-center gap-2">
              {/* First Page Button */}
              <button
                onClick={firstPage}
                disabled={users.current_page === 1}
                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft size={18} />
              </button>

              {/* Previous Button */}
              <button
                onClick={prevPage}
                disabled={!users.prev_page_url}
                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {users.links.slice(1, -1).map((link) => (
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
                    className={`min-w-[40px] h-10 rounded-xl text-sm font-medium transition-colors ${link.active
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
                disabled={!users.next_page_url}
                className="p-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={18} />
              </button>

              {/* Last Page Button */}
              <button
                onClick={lastPage}
                disabled={users.current_page === users.last_page}
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
      {users.data?.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Users Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
              <p className="text-sm font-medium text-blue-800 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_users || 0}</p>
              <p className="text-xs text-blue-600 mt-1">All registered users</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <p className="text-sm font-medium text-emerald-800 mb-1">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.active_users || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Currently active</p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
              <p className="text-sm font-medium text-purple-800 mb-1">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.admins_count || 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">With admin role</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-sm font-medium text-amber-800 mb-1">Sellers</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.sellers_count || 0}
              </p>
              <p className="text-xs text-amber-600 mt-1">With seller role</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}