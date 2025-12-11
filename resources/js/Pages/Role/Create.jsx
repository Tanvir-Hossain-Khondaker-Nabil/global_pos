import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ roles }) {
    const { data, setData, errors, post, processing } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
        is_active: true
    });

    const handleRoleChange = (roleName, isChecked) => {
        if (isChecked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData('roles', data.roles.filter(role => role !== roleName));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <>
            <div className="py-8">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={submit}>
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                            Confirm Password *
                                        </label>
                                        <input
                                            type="password"
                                            id="password_confirmation"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Assign Roles *
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {roles.map((role) => (
                                            <div key={role.name} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`role-${role.name}`}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    checked={data.roles.includes(role.name)}
                                                    onChange={(e) => handleRoleChange(role.name, e.target.checked)}
                                                />
                                                <label 
                                                    htmlFor={`role-${role.name}`}
                                                    className="ml-2 text-sm text-gray-700"
                                                >
                                                    {role.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.roles && (
                                        <p className="mt-1 text-sm text-red-600">{errors.roles}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="mb-6">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <label 
                                            htmlFor="is_active"
                                            className="ml-2 text-sm text-gray-700"
                                        >
                                            Active User
                                        </label>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-4">
                                    <Link
                                        href={route('users.index')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

