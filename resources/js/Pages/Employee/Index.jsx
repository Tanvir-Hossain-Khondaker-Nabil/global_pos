import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Users({ employees, ranks, filters }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        employee_id: '',
        rank_id: '',
        joining_date: '',
        basic_salary: '',
        house_rent: 0,
        medical_allowance: 0,
        transport_allowance: 0,
        other_allowance: 0,
        provident_fund_percentage: 5,
    });

    // Search form
    const { data: searchData, setData: setSearchData, get } = useForm({
        search: filters.search || '',
        rank_id: filters.rank_id || '',
        status: filters.status !== undefined ? filters.status : '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('employees.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const handleSearch = () => {
        get(route('employees.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchData({
            search: '',
            rank_id: '',
            status: '',
        });
        get(route('employees.index'), {
            preserveState: true,
            replace: true,
        });
    };

    // Calculate total allowances for display
    const calculateTotalAllowances = (user) => {
        return (
            (parseFloat(user.house_rent) || 0) +
            (parseFloat(user.medical_allowance) || 0) +
            (parseFloat(user.transport_allowance) || 0) +
            (parseFloat(user.other_allowance) || 0)
        ).toFixed(2);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add Employee
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchData.search}
                            onChange={e => setSearchData('search', e.target.value)}
                            placeholder="Search by name, email, or ID..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                        <select
                            value={searchData.rank_id}
                            onChange={e => setSearchData('rank_id', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">All Ranks</option>
                            {ranks.map(rank => (
                                <option key={rank.id} value={rank.id}>{rank.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={searchData.status}
                            onChange={e => setSearchData('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    <div className="flex items-end space-x-2">
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            Filter
                        </button>
                        <button
                            onClick={clearFilters}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Add New Employee</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* নাম */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    {errors.name && <div className="text-red-600 text-sm">{errors.name}</div>}
                                </div>

                                {/* ইমেইল */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    {errors.email && <div className="text-red-600 text-sm">{errors.email}</div>}
                                </div>

                                {/* EMPLOYEE ID FIELD যোগ করুন - এটাই মূল সমস্যা */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
                                    <input
                                        type="text"
                                        value={data.employee_id}
                                        onChange={e => setData('employee_id', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="EMP001"
                                        required
                                    />
                                    {errors.employee_id && <div className="text-red-600 text-sm">{errors.employee_id}</div>}
                                </div>

                                {/* র‍্যাংক */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rank</label>
                                    <select
                                        value={data.rank_id}
                                        onChange={e => setData('rank_id', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="">Select Rank</option>
                                        {ranks.map(rank => (
                                            <option key={rank.id} value={rank.id}>{rank.name}</option>
                                        ))}
                                    </select>
                                    {errors.rank_id && <div className="text-red-600 text-sm">{errors.rank_id}</div>}
                                </div>

                                {/* যোগদানের তারিখ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                                    <input
                                        type="date"
                                        value={data.joining_date}
                                        onChange={e => setData('joining_date', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    {errors.joining_date && <div className="text-red-600 text-sm">{errors.joining_date}</div>}
                                </div>

                                {/* বেসিক বেতন */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.basic_salary}
                                        onChange={e => setData('basic_salary', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    {errors.basic_salary && <div className="text-red-600 text-sm">{errors.basic_salary}</div>}
                                </div>

                                {/* প্রভিডেন্ট ফান্ড পার্সেন্টেজ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Provident Fund Percentage</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.provident_fund_percentage}
                                        onChange={e => setData('provident_fund_percentage', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    {errors.provident_fund_percentage && <div className="text-red-600 text-sm">{errors.provident_fund_percentage}</div>}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Creating...' : 'Create Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Employees Table - FIXED: Use employees.data instead of users */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">All Employees</h2>
                    <div className="text-sm text-gray-500">
                        Total: {employees.total} employees
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Salary
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Allowances
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
                            {/* FIX: Use employees.data instead of users */}
                            {employees.data.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.employee_id}</div>
                                            <div className="text-sm text-gray-400">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {user.rank?.name || 'No Rank'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {parseFloat(user.current_salary).toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Basic: {parseFloat(user.basic_salary).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {calculateTotalAllowances(user)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <Link
                                                href={route('employees.edit', user.id)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                href={route('users.promote-form', user.id)}
                                                className="text-green-600 hover:text-green-900 transition-colors"
                                            >
                                                Promote
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {employees.links && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {employees.from} to {employees.to} of {employees.total} results
                            </div>
                            <div className="flex space-x-2">
                                {employees.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-1 rounded-md text-sm ${link.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        preserveScroll
                                    >
                                        {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {employees.data.length === 0 && (
                <div className="bg-white shadow rounded-lg p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-500 mb-4">
                        {filters.search || filters.rank_id || filters.status !== undefined
                            ? 'Try adjusting your search filters'
                            : 'Get started by adding your first employee'
                        }
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add First Employee
                    </button>
                </div>
            )}
        </>
    );
}