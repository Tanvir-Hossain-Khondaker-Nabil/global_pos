import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

// Icons
const Search = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const Filter = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);
const UploadCloud = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
);
const Plus = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const Shield = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
);
const Users = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const ArrowDown = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6" /></svg>
);

export default function Index({ roles, filters, pagination }) {
    const { data, setData, get } = useForm({
        search: filters?.search || '',
        sort_by: filters?.sort_by || 'created_at',
        sort_order: filters?.sort_order || 'desc',
        page: filters?.page || 1,
    });

    const handleFilter = () => {
        get(route('roles.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            search: '',
            sort_by: 'created_at',
            sort_order: 'desc',
            page: 1,
        });
        get(route('roles.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field) => {
        setData({
            ...data,
            sort_by: field,
            sort_order: data.sort_by === field && data.sort_order === 'asc' ? 'desc' : 'asc',
        });
        get(route('roles.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page) => {
        setData({ ...data, page });
        get(route('roles.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Convert roles to array for calculations
    const rolesArray = roles.data || [];

    // Calculate summary statistics
    const totalRoles = pagination?.total || rolesArray.length;
    const totalUsers = rolesArray.reduce((sum, role) => sum + role.users_count, 0);
    const totalPermissions = rolesArray.reduce((sum, role) => sum + role.permissions_count, 0);
    const avgPermissionsPerRole = totalRoles > 0 ? (totalPermissions / totalRoles).toFixed(1) : 0;

    const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

    return (
        <>
            <Head>
                <title>Roles Management</title>
            </Head>

            <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-gray-900">
                {/* Header Section */}
                <div
                    className="mb-8 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-900/10"
                    style={{ background: gradient }}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold">Roles Management</h1>
                                <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white ring-1 ring-white/20">
                                    {totalRoles} Roles
                                </span>
                            </div>
                            <p className="mt-2 text-white/80">Manage user roles and permissions</p>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors">
                                <UploadCloud className="h-4 w-4" />
                                Export
                            </button>

                            <Link
                                href={route('roles.create')}
                                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-white/90 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add Role
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl text-white shadow-sm" style={{ background: gradient }}>
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">Total Roles</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{totalRoles}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <Users className="h-6 w-6 text-emerald-800" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">Total Users</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <Shield className="h-6 w-6 text-indigo-700" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">Total Permissions</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{totalPermissions}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Shield className="h-6 w-6 text-amber-700" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">Avg. Permissions/Role</div>
                                <div className="text-2xl font-bold text-gray-900 mt-1">{avgPermissionsPerRole}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                        {/* Filter Tabs */}
                        <div className="flex w-full lg:w-auto rounded-xl border border-gray-200 bg-white p-1">
                            <button
                                onClick={handleReset}
                                className="flex-1 lg:flex-none rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                                style={{ background: gradient }}
                            >
                                All Roles
                            </button>
                            <button
                                onClick={() => {
                                    setData({ ...data, sort_by: 'users_count', sort_order: 'desc' });
                                    handleFilter();
                                }}
                                className="flex-1 lg:flex-none rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Most Used
                            </button>
                        </div>

                        {/* Search and Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 sm:min-w-[320px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search roles..."
                                    value={data.search}
                                    onChange={(e) => setData('search', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-700 transition-all"
                                />
                            </div>

                            <button
                                onClick={handleFilter}
                                className="flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                                style={{ background: gradient }}
                            >
                                <Filter className="h-4 w-4" />
                                Filter
                            </button>

                            <button
                                onClick={handleReset}
                                className="rounded-xl border border-gray-300 bg-white px-4 h-11 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full min-w-[1000px] border-collapse text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                            <tr>
                                <th className="px-6 py-4 w-[320px]">
                                    <div className="flex items-center gap-2">
                                        <span>Role Details</span>
                                        <button onClick={() => handleSort('name')} className="hover:text-gray-800 focus:outline-none">
                                            <ArrowDown
                                                className={`h-3 w-3 text-gray-400 transition-transform ${
                                                    data.sort_by === 'name' && data.sort_order === 'desc' ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </th>

                                <th className="px-6 py-4 w-[280px]">
                                    <div className="flex items-center gap-2">
                                        <span>Permissions</span>
                                        <button onClick={() => handleSort('permissions_count')} className="hover:text-gray-800 focus:outline-none">
                                            <ArrowDown
                                                className={`h-3 w-3 text-gray-400 transition-transform ${
                                                    data.sort_by === 'permissions_count' && data.sort_order === 'desc' ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </th>

                                <th className="px-6 py-4 w-[160px]">
                                    <div className="flex items-center gap-2">
                                        <span>Users</span>
                                        <button onClick={() => handleSort('users_count')} className="hover:text-gray-800 focus:outline-none">
                                            <ArrowDown
                                                className={`h-3 w-3 text-gray-400 transition-transform ${
                                                    data.sort_by === 'users_count' && data.sort_order === 'desc' ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </th>

                                <th className="px-6 py-4 w-[160px]">Created At</th>
                                <th className="px-6 py-4 w-[120px]">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                            {rolesArray.map((role) => (
                                <tr key={role.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm" style={{ background: gradient }}>
                                                <Shield className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{role.name}</div>
                                                <div className="text-xs text-gray-500">Role ID: {role.id}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                {role.permissions.slice(0, 3).map((permission) => (
                                                    <span
                                                        key={permission}
                                                        className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/15"
                                                    >
                                                        {permission}
                                                    </span>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                        +{role.permissions.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {role.permissions_count} permissions assigned
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-lg font-semibold text-gray-900">{role.users_count}</div>
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                                                    role.users_count > 10
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/15'
                                                        : 'bg-gray-100 text-gray-600 ring-gray-500/10'
                                                }`}
                                            >
                                                {role.users_count > 10 ? 'Popular' : 'Standard'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-gray-500">{role.created_at}</td>

                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={route('roles.edit', role.id)}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                            </Link>

                                            {role.users_count === 0 && (
                                                <Link
                                                    method="delete"
                                                    href={route('roles.destroy', role.id)}
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                                    title="Delete"
                                                    as="button"
                                                    onClick={(e) => {
                                                        if (!confirm('Are you sure you want to delete this role?')) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-white px-6 py-4">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.current_page >= pagination.last_page - 2) {
                                            pageNum = pagination.last_page - 4 + i;
                                        } else {
                                            pageNum = pagination.current_page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                                                    pageNum === pagination.current_page
                                                        ? 'text-white shadow-sm'
                                                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                                style={pageNum === pagination.current_page ? { background: gradient } : undefined}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {rolesArray.length === 0 && (
                        <div className="text-center py-14 text-gray-500">
                            <div className="flex justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <path d="M12 2l7 4v6c0 5-3.8 9-7 10-3.2-1-7-5-7-10V6l7-4z" />
                                </svg>
                            </div>
                            <div className="text-lg font-semibold text-gray-900 mb-1">No roles found</div>
                            <div className="text-sm text-gray-500">Try adjusting search or filters.</div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
