import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function RoleForm({ role = null, permissions }) {
    const isEditing = !!role;

    const { data, setData, errors, post, put, processing } = useForm({
        name: role?.name || '',
        permissions: role?.permissions || []
    });

    const [selectedPermissions, setSelectedPermissions] = useState({});

    // Initialize selectedPermissions from role data
    useEffect(() => {
        if (role?.permissions) {
            const initialSelected = {};
            role.permissions.forEach(perm => {
                initialSelected[perm] = true;
            });
            setSelectedPermissions(initialSelected);
        }
    }, [role]);

    const handlePermissionChange = (permissionName, isChecked) => {
        setSelectedPermissions(prev => ({
            ...prev,
            [permissionName]: isChecked
        }));

        if (isChecked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter(p => p !== permissionName));
        }
    };

    const handleSelectAll = (modulePermissions, isSelected) => {
        const newSelected = { ...selectedPermissions };
        const newPermissions = [...data.permissions];

        modulePermissions.forEach(perm => {
            newSelected[perm.name] = isSelected;
            if (isSelected && !newPermissions.includes(perm.name)) {
                newPermissions.push(perm.name);
            } else if (!isSelected) {
                const index = newPermissions.indexOf(perm.name);
                if (index > -1) {
                    newPermissions.splice(index, 1);
                }
            }
        });

        setSelectedPermissions(newSelected);
        setData('permissions', newPermissions);
    };

    const submit = (e) => {
        e.preventDefault();

        if (isEditing) {
            put(route('roles.update', role.id));
        } else {
            post(route('roles.store'));
        }
    };

    const title = isEditing ? 'Edit Role' : 'Create Role';
    const buttonText = isEditing ? 'Update Role' : 'Create Role';

    const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>

            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">

                    {/* Header */}
                    <div
                        className="mb-8 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-900/10"
                        style={{ background: gradient }}
                    >
                        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
                                <p className="text-white/80 mt-2">
                                    {isEditing
                                        ? 'Update role name and permissions.'
                                        : 'Create a new role with specific permissions.'
                                    }
                                </p>
                            </div>

                            <Link
                                href={route('roles.index')}
                                className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
                            >
                                Back to Roles
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-200">
                        <div className="p-6 bg-white">
                            <form onSubmit={submit}>
                                {/* Role Name */}
                                <div className="mb-8">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Role Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="mt-2 block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-700 transition-all"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Permissions */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Permissions *
                                    </label>

                                    <div className="space-y-6">
                                        {permissions.map((module) => (
                                            <div key={module.module} className="border border-gray-200 rounded-2xl overflow-hidden">
                                                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                                            {module.module} Management
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
                                                            onClick={() => handleSelectAll(
                                                                module.permissions,
                                                                !module.permissions.every(p => selectedPermissions[p.name])
                                                            )}
                                                        >
                                                            {module.permissions.every(p => selectedPermissions[p.name])
                                                                ? 'Deselect All'
                                                                : 'Select All'
                                                            }
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {module.permissions.map((permission) => (
                                                        <label
                                                            key={permission.name}
                                                            htmlFor={`perm-${permission.name}`}
                                                            className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                id={`perm-${permission.name}`}
                                                                className="mt-0.5 h-4 w-4 text-emerald-700 focus:ring-emerald-600 border-gray-300 rounded"
                                                                checked={selectedPermissions[permission.name] || false}
                                                                onChange={(e) => handlePermissionChange(permission.name, e.target.checked)}
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-medium text-gray-800">
                                                                    {permission.label}
                                                                </div>
                                                                <div className="text-xs text-gray-500 break-words">
                                                                    {permission.name}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {errors.permissions && (
                                        <p className="mt-2 text-sm text-red-600">{errors.permissions}</p>
                                    )}
                                </div>

                                {/* Selected Permissions Count */}
                                <div className="mb-8 p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                                    <p className="text-sm font-semibold text-emerald-800">
                                        {data.permissions.length} permissions selected
                                    </p>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                    <Link
                                        href={route('roles.index')}
                                        className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </Link>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: gradient }}
                                    >
                                        {processing
                                            ? (isEditing ? 'Updating...' : 'Creating...')
                                            : buttonText
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="h-6" />
                </div>
            </div>
        </>
    );
}
