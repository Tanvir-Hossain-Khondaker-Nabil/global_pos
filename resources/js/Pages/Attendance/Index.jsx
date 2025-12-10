import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Attendance({ attendances, filters, employees }) {
    const [processing, setProcessing] = useState(false);
    const [checkingStates, setCheckingStates] = useState({});

    const { data, setData, get } = useForm({
        date: filters.date || new Date().toISOString().split('T')[0],
        employee_id: filters.employee_id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        get(route('attendance.index'), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleCheckIn = async (employeeId) => {
        if (checkingStates[`checkin-${employeeId}`]) return;
        
        setCheckingStates(prev => ({ ...prev, [`checkin-${employeeId}`]: true }));
        
        try {
            const response = await axios.post(route('attendance.checkin'), {
                employee_id: employeeId
            });
            
            if (response.data.success) {
                router.visit(route('attendance.index'), {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['attendances', 'filters', 'employees'],
                });
            } else {
                alert(response.data.message || 'Check-in failed');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            alert(error.response?.data?.message || error.response?.data?.error || 'Check-in failed');
        } finally {
            setCheckingStates(prev => ({ ...prev, [`checkin-${employeeId}`]: false }));
        }
    };

    const handleCheckOut = async (employeeId) => {
        if (checkingStates[`checkout-${employeeId}`]) return;
        
        setCheckingStates(prev => ({ ...prev, [`checkout-${employeeId}`]: true }));
        
        try {
            const response = await axios.post(route('attendance.checkout'), {
                employee_id: employeeId
            });
            
            if (response.data.success) {
                router.visit(route('attendance.index'), {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['attendances', 'filters', 'employees'],
                });
            } else {
                alert(response.data.message || 'Check-out failed');
            }
        } catch (error) {
            console.error('Check-out error:', error);
            alert(error.response?.data?.message || error.response?.data?.error || 'Check-out failed');
        } finally {
            setCheckingStates(prev => ({ ...prev, [`checkout-${employeeId}`]: false }));
        }
    };

    const handleEarlyOut = async (employeeId) => {
        if (!confirm('Are you sure you want to check out early? Overtime will not be calculated.')) {
            return;
        }
        
        if (checkingStates[`earlyout-${employeeId}`]) return;
        
        setCheckingStates(prev => ({ ...prev, [`earlyout-${employeeId}`]: true }));
        
        try {
            const response = await axios.post(route('attendance.early-out'), {
                employee_id: employeeId
            });
            
            if (response.data.success) {
                router.visit(route('attendance.index'), {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['attendances', 'filters', 'employees'],
                });
            } else {
                alert(response.data.message || 'Early out failed');
            }
        } catch (error) {
            console.error('Early out error:', error);
            alert(error.response?.data?.message || error.response?.data?.error || 'Early out failed');
        } finally {
            setCheckingStates(prev => ({ ...prev, [`earlyout-${employeeId}`]: false }));
        }
    };

    // SVG Icons
    const Icons = {
        Calendar: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        Users: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.384-.612.735-.983 1.05a10.697 10.697 0 01-4.031 1.95 11.056 11.056 0 01-4.986 0 10.697 10.697 0 01-4.031-1.95 6.487 6.487 0 01-.983-1.05" />
            </svg>
        ),
        Search: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        Reset: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        Plus: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
        ChartBar: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        CheckCircle: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        XCircle: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        Clock: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        Hourglass: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        CheckIn: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        CheckOut: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        ),
        EarlyOut: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        Loading: () => (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        ),
        Money: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        Employee: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        List: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        UsersGroup: () => (
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        ChartPie: () => (
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
        ),
        Warning: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        ),
        CircleCheck: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        CircleX: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        Time: () => (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        ChevronLeft: () => (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        ),
        ChevronRight: () => (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        ),
    };

    const getStatusColor = (status) => {
        const colors = {
            'present': 'bg-green-100 text-green-800',
            'absent': 'bg-red-100 text-red-800',
            'late': 'bg-yellow-100 text-yellow-800',
            'half_day': 'bg-blue-100 text-blue-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'present': return <Icons.CheckCircle />;
            case 'absent': return <Icons.XCircle />;
            case 'late': return <Icons.Clock />;
            case 'half_day': return <Icons.Hourglass />;
            default: return <Icons.Clock />;
        }
    };

    const attendanceData = attendances?.data || attendances || [];
    const todayDate = new Date().toISOString().split('T')[0];

    const todayAttendances = Array.isArray(attendanceData) 
        ? attendanceData.filter(att => att.date === todayDate || att.date === todayDate.split('T')[0])
        : [];

    const employeeStatus = {};
    employees.forEach(employee => {
        const attendance = todayAttendances.find(a => 
            a.employee_id === employee.id || a.employee?.id === employee.id
        );
        employeeStatus[employee.id] = {
            checkedIn: !!attendance,
            checkedOut: !!attendance?.check_out,
            status: attendance?.status || 'not_checked',
            attendance: attendance
        };
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="text-gray-600">Track employee attendance, late hours, and overtime</p>
                </div>
                <div className="flex space-x-3">
                    {/* <Link
                        href={route('attendance.manual-form')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                        <Icons.Plus className="mr-2" />
                        Manual Entry
                    </Link>
                    <Link
                        href={route('attendance.monthly-report')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Icons.ChartBar className="mr-2" />
                        Monthly Report
                    </Link> */}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Icons.Calendar className="mr-1" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={data.date}
                            onChange={e => setData('date', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Icons.Users className="mr-1" />
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
                    
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                            {processing ? (
                                <>
                                    <Icons.Loading className="mr-2" />
                                    Filtering...
                                </>
                            ) : (
                                <>
                                    <Icons.Search className="mr-2" />
                                    Filter
                                </>
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => {
                                setData({
                                    date: new Date().toISOString().split('T')[0],
                                    employee_id: ''
                                });
                                setTimeout(() => {
                                    get(route('attendance.index'), {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }, 100);
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
                        >
                            <Icons.Reset className="mr-2" />
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Today's Attendance Quick Actions */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Icons.List className="mr-2" />
                        Today's Attendance ({new Date(todayDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })})
                    </h2>
                    <div className="text-sm text-gray-600 flex items-center">
                        <Icons.Users className="mr-1" />
                        {employees.length} employees • {todayAttendances.length} checked in
                    </div>
                </div>
                
                {employees.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <Icons.UsersGroup />
                        <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">No Employees Found</h3>
                        <p className="text-gray-500">Please add employees to start tracking attendance</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {employees.map(employee => {
                            const status = employeeStatus[employee.id];
                            const isCheckingIn = checkingStates[`checkin-${employee.id}`];
                            const isCheckingOut = checkingStates[`checkout-${employee.id}`];
                            const isEarlyOut = checkingStates[`earlyout-${employee.id}`];
                            
                            return (
                                <div key={employee.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{employee.name}</h3>
                                                <p className="text-sm text-gray-600 flex items-center">
                                                    <Icons.Employee className="mr-1" />
                                                    ID: {employee.employee_id}
                                                </p>
                                            </div>
                                            {status.checkedIn && (
                                                <span className={`px-2 py-1 text-xs rounded-full flex items-center ${getStatusColor(status.status)}`}>
                                                    <span className="mr-1">{getStatusIcon(status.status)}</span>
                                                    {status.status?.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            {!status.checkedIn ? (
                                                <button
                                                    onClick={() => handleCheckIn(employee.id)}
                                                    disabled={isCheckingIn}
                                                    className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                                                >
                                                    {isCheckingIn ? (
                                                        <>
                                                            <Icons.Loading className="mr-2" />
                                                            Checking In...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icons.CheckIn className="mr-2" />
                                                            Check In
                                                        </>
                                                    )}
                                                </button>
                                            ) : !status.checkedOut ? (
                                                <div className="space-y-2">
                                                    <button
                                                        onClick={() => handleCheckOut(employee.id)}
                                                        disabled={isCheckingOut}
                                                        className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                                                    >
                                                        {isCheckingOut ? (
                                                            <>
                                                                <Icons.Loading className="mr-2" />
                                                                Checking Out...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Icons.CheckOut className="mr-2" />
                                                                Check Out (After 5 PM)
                                                            </>
                                                        )}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleEarlyOut(employee.id)}
                                                        disabled={isEarlyOut}
                                                        className="w-full bg-orange-500 text-white py-2 px-3 rounded text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center"
                                                    >
                                                        {isEarlyOut ? (
                                                            <>
                                                                <Icons.Loading className="mr-2" />
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Icons.EarlyOut className="mr-2" />
                                                                Early Out (Before 5 PM)
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-2 text-sm text-green-600 bg-green-50 rounded flex items-center justify-center">
                                                    <Icons.CircleCheck className="mr-2" />
                                                    Completed for Today
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Attendance Details */}
                                        {status.checkedIn && status.attendance && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-gray-500 flex items-center">
                                                            <Icons.CheckIn className="mr-1 w-3 h-3" />
                                                            In:
                                                        </span>
                                                        <div className="font-medium">{status.attendance.formatted_check_in || status.attendance.check_in || '-'}</div>
                                                    </div>
                                                    {status.checkedOut && (
                                                        <div>
                                                            <span className="text-gray-500 flex items-center">
                                                                <Icons.CheckOut className="mr-1 w-3 h-3" />
                                                                Out:
                                                            </span>
                                                            <div className="font-medium">{status.attendance.formatted_check_out || status.attendance.check_out || '-'}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {(status.attendance.late_hours > 0 || status.attendance.overtime_hours > 0) && (
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        {status.attendance.late_hours > 0 && (
                                                            <div className="bg-red-50 p-2 rounded">
                                                                <div className="text-red-700 font-medium flex items-center">
                                                                    <Icons.Clock className="mr-1 w-3 h-3" />
                                                                    {Number(status.attendance.late_hours).toFixed(2)}h late
                                                                </div>
                                                                <div className="text-red-600 text-xs flex items-center">
                                                                    <Icons.Money className="mr-1 w-3 h-3" />
                                                                    {formatCurrency(status.attendance.late_amount)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {status.attendance.overtime_hours > 0 && (
                                                            <div className="bg-green-50 p-2 rounded">
                                                                <div className="text-green-700 font-medium flex items-center">
                                                                    <Icons.Time className="mr-1 w-3 h-3" />
                                                                    {Number(status.attendance.overtime_hours).toFixed(2)}h OT
                                                                </div>
                                                                <div className="text-green-600 text-xs flex items-center">
                                                                    <Icons.Money className="mr-1 w-3 h-3" />
                                                                    +{formatCurrency(status.attendance.overtime_amount)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {status.attendance.total_hours > 0 && (
                                                    <div className="mt-2 text-xs text-gray-600 flex items-center">
                                                        <Icons.Clock className="mr-1 w-3 h-3" />
                                                        Total hours: {Number(status.attendance.total_hours).toFixed(2)}h
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* All Attendance Records */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 flex items-center">
                            <Icons.List className="mr-2" />
                            All Attendance Records
                        </h2>
                        <div className="text-sm text-gray-500">
                            Total: {attendances?.total || attendanceData.length} records
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Icons.Employee className="mr-1" />
                                        Employee
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Icons.Calendar className="mr-1" />
                                        Date
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Icons.CheckIn className="mr-1" />
                                        Check In
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Icons.CheckOut className="mr-1" />
                                        Check Out
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Icons.Clock className="mr-1" />
                                        Late Hours
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Icons.Time className="mr-1" />
                                        OT Hours
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceData.length > 0 ? (
                                attendanceData.map((attendance) => (
                                    <tr key={attendance.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Icons.Employee className="text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {attendance.employee?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {attendance.employee?.employee_id || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {attendance.formatted_date || attendance.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                {attendance.check_in_time && attendance.check_in_time > '09:00:00' ? (
                                                    <Icons.Warning className="mr-2 text-red-500" />
                                                ) : (
                                                    <Icons.CheckCircle className="mr-2 text-green-500" />
                                                )}
                                                {attendance.formatted_check_in || attendance.check_in || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                {attendance.check_out_time && attendance.check_out_time > '17:00:00' ? (
                                                    <Icons.Money className="mr-2 text-green-500" />
                                                ) : (
                                                    <Icons.Time className="mr-2 text-blue-500" />
                                                )}
                                                {attendance.formatted_check_out || attendance.check_out || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {attendance.late_hours > 0 ? (
                                                <div className="bg-red-50 px-3 py-1 rounded-full inline-block">
                                                    <div className="text-red-700 font-medium flex items-center">
                                                        <Icons.Clock className="mr-1" />
                                                        {Number(attendance.late_hours).toFixed(2)}h
                                                    </div>
                                                    <div className="text-red-600 text-xs flex items-center">
                                                        <Icons.Money className="mr-1" />
                                                        {formatCurrency(attendance.late_amount)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 flex items-center">
                                                    <Icons.Clock className="mr-1" />
                                                    0h
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {attendance.overtime_hours > 0 ? (
                                                <div className="bg-green-50 px-3 py-1 rounded-full inline-block">
                                                    <div className="text-green-700 font-medium flex items-center">
                                                        <Icons.Time className="mr-1" />
                                                        {Number(attendance.overtime_hours).toFixed(2)}h
                                                    </div>
                                                    <div className="text-green-600 text-xs flex items-center">
                                                        <Icons.Money className="mr-1" />
                                                        +{formatCurrency(attendance.overtime_amount)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 flex items-center">
                                                    <Icons.Time className="mr-1" />
                                                    0h
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center w-fit ${getStatusColor(attendance.status)}`}>
                                                <span className="mr-1">{getStatusIcon(attendance.status)}</span>
                                                {attendance.status?.charAt(0).toUpperCase() + attendance.status?.slice(1).replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <Icons.ChartPie />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">No attendance records found</h3>
                                        <p className="text-gray-500">
                                            {filters.date || filters.employee_id 
                                                ? 'Try adjusting your filters'
                                                : 'No attendance has been recorded yet'
                                            }
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {attendances?.links && attendances.links.length > 3 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {attendances.from || 0} to {attendances.to || 0} of {attendances.total || 0} results
                            </div>
                            <div className="flex space-x-1">
                                {attendances.links.map((link, index) => {
                                    const isPrevious = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');
                                    const isCurrent = link.active;
                                    
                                    return (
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
                                            disabled={!link.url || isCurrent}
                                            className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${
                                                isCurrent 
                                                    ? 'bg-blue-600 text-white' 
                                                    : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {isPrevious && <Icons.ChevronLeft />}
                                            {isNext && <Icons.ChevronRight />}
                                            {!isPrevious && !isNext && (
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}