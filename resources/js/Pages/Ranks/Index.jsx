import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Ranks({ ranks }) {
    const [showForm, setShowForm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        level: '',
        base_salary: '',
        salary_increment_percentage: '',
        min_working_days: 22,
        max_late_minutes: 30,
        benefits: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('ranks.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Rank Management</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Add Rank
                </button>
            </div>

            {/* Add Rank Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Add New Rank</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={submit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rank Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-sm">{errors.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Level</label>
                                    <input
                                        type="text"
                                        value={data.level}
                                        onChange={e => setData('level', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="e.g., A, B, C or 1, 2, 3"
                                        required
                                    />
                                    {errors.level && <div className="text-red-600 text-sm">{errors.level}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.base_salary}
                                        onChange={e => setData('base_salary', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                    {errors.base_salary && <div className="text-red-600 text-sm">{errors.base_salary}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Increment Percentage</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.salary_increment_percentage}
                                        onChange={e => setData('salary_increment_percentage', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                    {errors.salary_increment_percentage && <div className="text-red-600 text-sm">{errors.salary_increment_percentage}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Min Working Days</label>
                                    <input
                                        type="number"
                                        value={data.min_working_days}
                                        onChange={e => setData('min_working_days', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                    {errors.min_working_days && <div className="text-red-600 text-sm">{errors.min_working_days}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Late Minutes</label>
                                    <input
                                        type="number"
                                        value={data.max_late_minutes}
                                        onChange={e => setData('max_late_minutes', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    />
                                    {errors.max_late_minutes && <div className="text-red-600 text-sm">{errors.max_late_minutes}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Benefits</label>
                                    <textarea
                                        value={data.benefits}
                                        onChange={e => setData('benefits', e.target.value)}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="Describe the benefits for this rank..."
                                    />
                                    {errors.benefits && <div className="text-red-600 text-sm">{errors.benefits}</div>}
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
                                    {processing ? 'Creating...' : 'Create Rank'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ranks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ranks.map((rank) => (
                    <div key={rank.id} className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{rank.name}</h3>
                                    <p className="text-sm text-gray-600">Level: {rank.level}</p>
                                </div>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {rank.users_count} employees
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Base Salary:</span>
                                    <span className="text-sm font-medium">${rank.base_salary}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Increment %:</span>
                                    <span className="text-sm font-medium">{rank.salary_increment_percentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Working Days:</span>
                                    <span className="text-sm font-medium">{rank.min_working_days}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Max Late:</span>
                                    <span className="text-sm font-medium">{rank.max_late_minutes} mins</span>
                                </div>
                            </div>

                            {rank.benefits && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-1">Benefits:</p>
                                    <p className="text-sm text-gray-900">{rank.benefits}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                {/* <Link
                                    href={route('ranks.users', rank.id)}
                                    className="text-blue-600 hover:text-blue-900 text-sm"
                                >
                                    View Employees
                                </Link> */}
                                <div className="flex space-x-2">
                                    {/* <button className="text-blue-600 hover:text-blue-900 text-sm">
                                        Edit
                                    </button> */}
                                    <button className="text-red-600 hover:text-red-900 text-sm">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}