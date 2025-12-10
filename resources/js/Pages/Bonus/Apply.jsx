import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function ApplyBonus({ bonusSetting, employees }) {
    const { data, setData, post, processing, errors } = useForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        employee_ids: []
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);

    const submit = (e) => {
        e.preventDefault();
        post(route('bonus.apply', { bonus: bonusSetting.id }), {
            onSuccess: () => {
                // Success handling
            },
        });
    };

    const toggleEmployee = (employeeId) => {
        const newSelected = selectedEmployees.includes(employeeId)
            ? selectedEmployees.filter(id => id !== employeeId)
            : [...selectedEmployees, employeeId];
        
        setSelectedEmployees(newSelected);
        setData('employee_ids', newSelected);
    };

    const selectAll = () => {
        const allIds = employees.map(emp => emp.id);
        setSelectedEmployees(allIds);
        setData('employee_ids', allIds);
    };

    const clearAll = () => {
        setSelectedEmployees([]);
        setData('employee_ids', []);
    };

    return (
        <>
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link 
                        href={route('bonus.index')} 
                        className="text-blue-600 hover:text-blue-900 mb-4 inline-block"
                    >
                        ← Back to Bonus Management
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Apply {bonusSetting.bonus_name}</h1>
                    <p className="text-gray-600 mt-2">
                        Apply this bonus to employees for the selected period
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Bonus Details</h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">Bonus Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div><strong>Type:</strong> <span className="capitalize">{bonusSetting.bonus_type}</span></div>
                                    <div><strong>Calculation:</strong> {bonusSetting.is_percentage ? 'Percentage' : 'Fixed Amount'}</div>
                                    <div><strong>Value:</strong> {bonusSetting.is_percentage ? `${bonusSetting.percentage}%` : `৳${bonusSetting.fixed_amount}`}</div>
                                    <div><strong>Effective Date:</strong> {new Date(bonusSetting.effective_date).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="font-medium text-blue-900 mb-2">Calculation Example</h3>
                                <p className="text-sm text-blue-700">
                                    For an employee with basic salary ৳30,000:
                                    <br />
                                    <strong>
                                        Bonus Amount: ৳
                                        {bonusSetting.is_percentage 
                                            ? (30000 * bonusSetting.percentage / 100).toFixed(2)
                                            : bonusSetting.fixed_amount
                                        }
                                    </strong>
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Month</label>
                                        <select
                                            value={data.month}
                                            onChange={e => setData('month', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            required
                                        >
                                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>
                                                    {new Date(2000, m-1).toLocaleString('default', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.month && <div className="text-red-600 text-sm">{errors.month}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Year</label>
                                        <input
                                            type="number"
                                            value={data.year}
                                            onChange={e => setData('year', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            required
                                            min="2020"
                                            max="2100"
                                        />
                                        {errors.year && <div className="text-red-600 text-sm">{errors.year}</div>}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Select Employees ({selectedEmployees.length} selected)
                                        </label>
                                        <div className="space-x-2">
                                            <button
                                                type="button"
                                                onClick={selectAll}
                                                className="text-sm text-blue-600 hover:text-blue-900"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearAll}
                                                className="text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                                        {employees.map(employee => (
                                            <label key={employee.id} className="flex items-center p-3 border-b border-gray-200 hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.includes(employee.id)}
                                                    onChange={() => toggleEmployee(employee.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {employee.employee_id} • Basic: ৳{employee.basic_salary}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        If no employees are selected, bonus will be applied to all active employees
                                    </p>
                                    {errors.employee_ids && <div className="text-red-600 text-sm">{errors.employee_ids}</div>}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <Link
                                        href={route('bonus.index')}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Applying Bonus...' : `Apply ${bonusSetting.bonus_name}`}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}