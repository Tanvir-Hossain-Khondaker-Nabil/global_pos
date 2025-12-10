import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// SVG Icons Component
const SVGIcon = ({ name, className = "w-4 h-4" }) => {
  const icons = {
    filter: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    reset: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    report: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    calculate: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    approve: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    pay: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    delete: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    clear: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    user: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    status: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    document: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    money: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    list: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    close: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    spinner: (
      <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ),
    present: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    clock: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    plus: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    minus: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
    eye: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    edit: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    download: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };

  return icons[name] || null;
};

export default function Salary({ salaries, filters, employees }) {
    const [processing, setProcessing] = useState(false);
    const [bulkSelection, setBulkSelection] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showCalculateModal, setShowCalculateModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const { data, setData, get } = useForm({
        month: filters.month || new Date().getMonth() + 1,
        year: filters.year || new Date().getFullYear(),
        status: filters.status || '',
        employee_id: filters.employee_id || '',
    });

    const { data: calculateData, setData: setCalculateData } = useForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        employee_id: '',
    });

    const { data: reportData, setData: setReportData } = useForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        department_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        get(route('salary.index'), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleCalculateSalary = async (e) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to calculate salaries? This may take a few minutes.')) {
            return;
        }

        setProcessing(true);
        try {
            await router.post(route('salary.calculate'), calculateData, {
                preserveScroll: true,
            });
            setShowCalculateModal(false);
            // Refresh the page
            get(route('salary.index'), {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Calculate salary error:', error);
            alert('Error calculating salary');
        } finally {
            setProcessing(false);
        }
    };

    const handleGenerateReport = (e) => {
        e.preventDefault();
        router.get(route('salary.report'), reportData);
    };

    const handleBulkSelection = (id) => {
        setBulkSelection(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (bulkSelection.length === salaries.data.length) {
            setBulkSelection([]);
        } else {
            setBulkSelection(salaries.data.map(s => s.id));
        }
    };

    const handleBulkAction = async (action) => {
        if (bulkSelection.length === 0) {
            alert('Please select at least one salary record');
            return;
        }

        let message = '';
        let confirmMessage = '';

        switch (action) {
            case 'approve':
                confirmMessage = `Approve ${bulkSelection.length} salary record(s)?`;
                break;
            case 'pay':
                confirmMessage = `Mark ${bulkSelection.length} salary record(s) as paid?`;
                break;
            case 'delete':
                confirmMessage = `Delete ${bulkSelection.length} salary record(s)? This action cannot be undone.`;
                break;
        }

        if (!confirm(confirmMessage)) return;

        setProcessing(true);
        try {
            await router.post(route('salary.bulk-action'), {
                action: action,
                ids: bulkSelection
            }, {
                preserveScroll: true,
            });

            setBulkSelection([]);
            setShowBulkActions(false);
            
            // Refresh data
            get(route('salary.index'), {
                preserveState: true,
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Bulk action error:', error);
            alert('Error performing bulk action');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'paid': 'bg-green-100 text-green-800',
            'approved': 'bg-blue-100 text-blue-800',
            'pending': 'bg-yellow-100 text-yellow-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'paid': <SVGIcon name="money" className="w-3 h-3 mr-1" />,
            'approved': <SVGIcon name="check" className="w-3 h-3 mr-1" />,
            'pending': <SVGIcon name="clock" className="w-3 h-3 mr-1" />,
        };
        return icons[status] || <SVGIcon name="document" className="w-3 h-3 mr-1" />;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-BD');
    };

    const getMonthName = (monthNumber) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || '';
    };

    // Update bulk actions visibility
    useEffect(() => {
        setShowBulkActions(bulkSelection.length > 0);
    }, [bulkSelection]);

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
                    <p className="text-gray-600">Manage employee salaries, calculations, and payments</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                        <SVGIcon name="report" className="w-4 h-4 mr-2" />
                        Generate Report
                    </button>
                    <button
                        onClick={() => setShowCalculateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <SVGIcon name="calculate" className="w-4 h-4 mr-2" />
                        Calculate Salary
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {showBulkActions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-blue-700 font-medium mr-3">
                                {bulkSelection.length} record(s) selected
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleBulkAction('approve')}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                                    disabled={processing}
                                >
                                    <SVGIcon name="approve" className="w-3 h-3 mr-1" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleBulkAction('pay')}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                                    disabled={processing}
                                >
                                    <SVGIcon name="pay" className="w-3 h-3 mr-1" />
                                    Mark as Paid
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                                    disabled={processing}
                                >
                                    <SVGIcon name="delete" className="w-3 h-3 mr-1" />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setBulkSelection([])}
                                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center"
                                >
                                    <SVGIcon name="clear" className="w-3 h-3 mr-1" />
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <SVGIcon name="calendar" className="w-4 h-4 mr-1" />
                            Month
                        </label>
                        <select
                            value={data.month}
                            onChange={e => setData('month', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Months</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>
                                    {getMonthName(m)}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <SVGIcon name="calendar" className="w-4 h-4 mr-1" />
                            Year
                        </label>
                        <input
                            type="number"
                            value={data.year}
                            onChange={e => setData('year', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="2000"
                            max="2100"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <SVGIcon name="user" className="w-4 h-4 mr-1" />
                            Employee
                        </label>
                        <select
                            value={data.employee_id}
                            onChange={e => setData('employee_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Employees</option>
                            {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name} ({employee.employee_id})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <SVGIcon name="status" className="w-4 h-4 mr-1" />
                            Status
                        </label>
                        <select
                            value={data.status}
                            onChange={e => setData('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <div className="flex space-x-2 w-full">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                            >
                                {processing ? (
                                    <>
                                        <SVGIcon name="spinner" className="w-4 h-4 mr-2" />
                                        Filtering...
                                    </>
                                ) : (
                                    <>
                                        <SVGIcon name="filter" className="w-4 h-4 mr-2" />
                                        Filter
                                    </>
                                )}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setData({
                                        month: '',
                                        year: new Date().getFullYear(),
                                        status: '',
                                        employee_id: ''
                                    });
                                    setTimeout(() => {
                                        get(route('salary.index'), {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }, 100);
                                }}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
                            >
                                <SVGIcon name="reset" className="w-4 h-4 mr-2" />
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Salary Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center">
                        <SVGIcon name="list" className="w-5 h-5 mr-2 text-gray-500" />
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Salary Records
                            </h2>
                            <div className="text-sm text-gray-500 mt-1">
                                Period: {filters.month ? getMonthName(filters.month) + ' ' : ''}{filters.year || 'All'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                            Total: {salaries.total} records
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="selectAll"
                                checked={bulkSelection.length === salaries.data.length && salaries.data.length > 0}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="selectAll" className="text-sm text-gray-600">
                                Select All
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    {/* Checkbox column */}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Period
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attendance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Basic + Allowances
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bonuses
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deductions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Net Salary
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salaries.data.length > 0 ? (
                                salaries.data.map((salary) => (
                                    <tr key={salary.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={bulkSelection.includes(salary.id)}
                                                onChange={() => handleBulkSelection(salary.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium">
                                                        {salary.employee?.name?.charAt(0) || 'E'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {salary.employee?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {salary.employee?.employee_id || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {salary.employee?.designation || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {getMonthName(salary.month)} {salary.year}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {salary.working_days || 0} working days
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="flex items-center">
                                                    <span className="text-green-600 mr-1">
                                                        <SVGIcon name="present" className="w-3 h-3" />
                                                    </span>
                                                    <span className="font-medium">{salary.present_days || 0}</span>
                                                    <span className="text-gray-500 mx-1">/</span>
                                                    <span>{salary.working_days || 0}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {salary.late_hours > 0 && (
                                                        <div className="flex items-center">
                                                            <SVGIcon name="clock" className="w-2 h-2 mr-1" />
                                                            Late: {salary.late_hours}h
                                                        </div>
                                                    )}
                                                    {salary.overtime_hours > 0 && (
                                                        <div className="flex items-center">
                                                            <SVGIcon name="plus" className="w-2 h-2 mr-1" />
                                                            OT: {salary.overtime_hours}h
                                                        </div>
                                                    )}
                                                    {salary.leave_days > 0 && (
                                                        <div className="flex items-center">
                                                            <SVGIcon name="minus" className="w-2 h-2 mr-1" />
                                                            Leave: {salary.leave_days}d
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {formatCurrency(salary.basic_salary)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    + {formatCurrency(salary.total_allowance)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-green-600">
                                                    + {formatCurrency(salary.total_bonus)}
                                                </div>
                                                {salary.total_bonus > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {salary.eid_bonus > 0 && <div>Eid: {formatCurrency(salary.eid_bonus)}</div>}
                                                        {salary.festival_bonus > 0 && <div>Festival: {formatCurrency(salary.festival_bonus)}</div>}
                                                        {salary.performance_bonus > 0 && <div>Performance: {formatCurrency(salary.performance_bonus)}</div>}
                                                        {salary.other_bonus > 0 && <div>Award: {formatCurrency(salary.other_bonus)}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-red-600">
                                                    - {formatCurrency(salary.total_deductions)}
                                                </div>
                                                {salary.total_deductions > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {salary.late_deduction > 0 && <div>Late: {formatCurrency(salary.late_deduction)}</div>}
                                                        {salary.absent_deduction > 0 && <div>Absent: {formatCurrency(salary.absent_deduction)}</div>}
                                                        {salary.provident_fund > 0 && <div>PF: {formatCurrency(salary.provident_fund)}</div>}
                                                        {salary.other_deductions > 0 && <div>Other: {formatCurrency(salary.other_deductions)}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatCurrency(salary.net_salary)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Gross: {formatCurrency(salary.gross_salary)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center justify-center ${getStatusColor(salary.status)}`}>
                                                    {getStatusIcon(salary.status)}
                                                    {salary.status?.charAt(0).toUpperCase() + salary.status?.slice(1)}
                                                </span>
                                                {salary.payment_date && (
                                                    <span className="text-xs text-gray-500">
                                                        Paid: {formatDate(salary.payment_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={route('salary.payslip', salary.id)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    title="View Payslip"
                                                >
                                                    <SVGIcon name="eye" className="w-4 h-4" />
                                                </Link>
                                                
                                                {salary.status === 'pending' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Approve this salary?')) {
                                                                router.post(route('salary.bulk-action'), {
                                                                    action: 'approve',
                                                                    ids: [salary.id]
                                                                }, {
                                                                    preserveScroll: true,
                                                                });
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-900 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <SVGIcon name="approve" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                
                                                {salary.status === 'approved' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Mark as paid?')) {
                                                                router.post(route('salary.pay', salary.id), {}, {
                                                                    preserveScroll: true,
                                                                });
                                                            }
                                                        }}
                                                        className="text-purple-600 hover:text-purple-900 transition-colors"
                                                        title="Mark as Paid"
                                                    >
                                                        <SVGIcon name="pay" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                
                                                {salary.status !== 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this salary record?')) {
                                                                router.delete(route('salary.destroy', salary.id), {
                                                                    preserveScroll: true,
                                                                });
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <SVGIcon name="delete" className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="px-6 py-12 text-center">
                                        <div className="text-gray-400 mb-4">
                                            <SVGIcon name="money" className="w-16 h-16 mx-auto" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No salary records found</h3>
                                        <p className="text-gray-500 mb-4">
                                            {filters.month || filters.year || filters.status || filters.employee_id
                                                ? 'Try adjusting your filters'
                                                : 'No salary records have been calculated yet'
                                            }
                                        </p>
                                        <button
                                            onClick={() => setShowCalculateModal(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                                        >
                                            <SVGIcon name="calculate" className="w-4 h-4 mr-2" />
                                            Calculate Salary
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {salaries.links && salaries.links.length > 3 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {salaries.from || 0} to {salaries.to || 0} of {salaries.total || 0} results
                            </div>
                            <div className="flex space-x-1">
                                {salaries.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (link.url) {
                                                setProcessing(true);
                                                get(link.url, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    onFinish: () => setProcessing(false),
                                                });
                                            }
                                        }}
                                        disabled={!link.url || link.active}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${
                                            link.active 
                                                ? 'bg-blue-600 text-white' 
                                                : link.url
                                                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Calculate Salary Modal */}
            {showCalculateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Calculate Salary</h3>
                            <button
                                onClick={() => setShowCalculateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <SVGIcon name="close" className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCalculateSalary} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <SVGIcon name="calendar" className="w-4 h-4 mr-1" />
                                    Month
                                </label>
                                <select
                                    value={calculateData.month}
                                    onChange={e => setCalculateData('month', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>
                                            {getMonthName(m)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <SVGIcon name="calendar" className="w-4 h-4 mr-1" />
                                    Year
                                </label>
                                <input
                                    type="number"
                                    value={calculateData.year}
                                    onChange={e => setCalculateData('year', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                    min="2000"
                                    max="2100"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <SVGIcon name="user" className="w-4 h-4 mr-1" />
                                    Employee (Optional)
                                </label>
                                <select
                                    value={calculateData.employee_id}
                                    onChange={e => setCalculateData('employee_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">All Employees</option>
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} ({employee.employee_id})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to calculate for all active employees
                                </p>
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCalculateModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                                >
                                    {processing ? (
                                        <>
                                            <SVGIcon name="spinner" className="w-4 h-4 mr-2" />
                                            Calculating...
                                        </>
                                    ) : (
                                        'Calculate'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Generate Salary Report</h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <SVGIcon name="close" className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleGenerateReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <SVGIcon name="calendar" className="w-4 h-4 mr-1" />
                                    Month
                                </label>
                                <select
                                    value={reportData.month}
                                    onChange={e => setReportData('month', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>
                                            {getMonthName(m)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <SVGIcon name="calendar" className="w-4 h-4 mr-1" />
                                    Year
                                </label>
                                <input
                                    type="number"
                                    value={reportData.year}
                                    onChange={e => setReportData('year', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                    min="2000"
                                    max="2100"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}