import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Allowance({ allowanceSettings, employees }) {
    const [showForm, setShowForm] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        allowance_type: '',
        percentage: 50,
        fixed_amount: 0,
        is_percentage: true,
        description: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        
        const url = editingSetting 
            ? route('allowances.update', editingSetting.id)
            : route('allowances.store');
        
        const method = editingSetting ? 'put' : 'post';
        
        router[method](url, data, {
            onSuccess: () => {
                reset();
                setShowForm(false);
                setEditingSetting(null);
            },
        });
    };

    const { post: applySettings, processing: applying } = useForm();
    const { post: resetAllowances, processing: resetting } = useForm();

    const handleApplySettings = () => {
        if (confirm('Are you sure you want to apply these allowance settings to all employees? This will update their allowance amounts based on their basic salary.')) {
            applySettings(route('allowances.apply-settings'), {
                preserveScroll: true,
            });
        }
    };

    const handleResetAllowances = () => {
        if (confirm('⚠️ WARNING: This will set ALL employee allowances to 0. Are you sure?')) {
            resetAllowances(route('allowances.reset-allowances'), {
                preserveScroll: true,
            });
            setShowResetConfirm(false);
        }
    };

    const handleEdit = (setting) => {
        setEditingSetting(setting);
        setData({
            allowance_type: setting.allowance_type,
            percentage: setting.percentage,
            fixed_amount: setting.fixed_amount,
            is_percentage: setting.is_percentage,
            description: setting.description,
            is_active: setting.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = (setting) => {
        if (confirm('Are you sure you want to delete this allowance setting?')) {
            router.delete(route('allowances.destroy', setting.id), {
                preserveScroll: true,
            });
        }
    };

    const handleDebugAllowance = async (employeeId) => {
        try {
            const response = await fetch(`/debug/allowance-calculation/${employeeId}`);
            const data = await response.json();
            console.log('Allowance debug data:', data);
            alert('Check console for allowance calculation details');
        } catch (error) {
            console.error('Debug error:', error);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Allowance Management</h1>
                    <p className="text-gray-600">Configure and manage employee allowance settings</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        disabled={resetting}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                    >
                        {resetting ? 'Resetting...' : 'Reset All to 0'}
                    </button>
                    <button
                        onClick={handleApplySettings}
                        disabled={applying}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                        {applying ? 'Applying...' : 'Apply to All Employees'}
                    </button>
                    <button
                        onClick={() => { setEditingSetting(null); setShowForm(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <span className="mr-2">➕</span> Add Setting
                    </button>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0  bg-[#0000003b] flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="text-center">
                            <div className="text-red-500 text-4xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold mb-2">Reset All Allowances to 0</h2>
                            <p className="text-gray-600 mb-4">
                                This action will set ALL employee allowances to 0. This is irreversible. 
                                Are you sure you want to continue?
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetAllowances}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Yes, Reset All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Allowance Form */}
            {showForm && (
                <div className="fixed inset-0  bg-[#0000003b] flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {editingSetting ? 'Edit Allowance Setting' : 'Add Allowance Setting'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingSetting(null); reset(); }} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={submit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Allowance Type *</label>
                                    <select
                                        value={data.allowance_type}
                                        onChange={e => setData('allowance_type', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="house_rent">House Rent</option>
                                        <option value="medical_allowance">Medical Allowance</option>
                                        <option value="transport_allowance">Transport Allowance</option>
                                        <option value="other_allowance">Other Allowance</option>
                                    </select>
                                    {errors.allowance_type && <div className="text-red-600 text-sm">{errors.allowance_type}</div>}
                                </div>

                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.is_percentage}
                                            onChange={e => setData('is_percentage', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Calculate as percentage of basic salary</span>
                                    </label>
                                </div>

                                {data.is_percentage ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Percentage (%) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={data.percentage}
                                            onChange={e => setData('percentage', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            required={data.is_percentage}
                                        />
                                        {errors.percentage && <div className="text-red-600 text-sm">{errors.percentage}</div>}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fixed Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.fixed_amount}
                                            onChange={e => setData('fixed_amount', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            required={!data.is_percentage}
                                        />
                                        {errors.fixed_amount && <div className="text-red-600 text-sm">{errors.fixed_amount}</div>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="e.g., House rent allowance calculated at 50% of basic salary"
                                    />
                                    {errors.description && <div className="text-red-600 text-sm">{errors.description}</div>}
                                </div>

                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingSetting(null); reset(); }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : (editingSetting ? 'Update Setting' : 'Create Setting')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allowance Settings Table */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Allowance Settings</h2>
                    <p className="text-sm text-gray-500">
                        {allowanceSettings.length} active settings
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allowanceSettings.length > 0 ? (
                                allowanceSettings.map((setting) => (
                                    <tr key={setting.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 capitalize">
                                                {setting.allowance_type.replace(/_/g, ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {setting.is_percentage ? 'Percentage' : 'Fixed Amount'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {setting.is_percentage 
                                                ? `${setting.percentage}%` 
                                                : `৳${setting.fixed_amount?.toLocaleString() || 0}`
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {setting.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                setting.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {setting.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(setting)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(setting)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="text-gray-400 text-4xl mb-4">💰</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No allowance settings found</h3>
                                        <p className="text-gray-500 mb-4">Create your first allowance setting to get started</p>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Create Allowance Setting
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Employee Allowances</h2>
                    <p className="text-sm text-gray-500">
                        Current allowance values for employees (should be 0 if using settings)
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House Rent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Other</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                        <div className="text-sm text-gray-500">{employee.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ৳{employee.basic_salary?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={employee.house_rent > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                            ৳{employee.house_rent?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={employee.medical_allowance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                            ৳{employee.medical_allowance?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={employee.transport_allowance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                            ৳{employee.transport_allowance?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={employee.other_allowance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                            ৳{employee.other_allowance?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDebugAllowance(employee.id)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="Debug allowance calculation"
                                        >
                                            Debug
                                        </button>
                                        <Link
                                            href={route('employees.edit', employee.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}