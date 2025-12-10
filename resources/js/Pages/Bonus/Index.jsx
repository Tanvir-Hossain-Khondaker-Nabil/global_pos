import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

// কম্পোনেন্ট ইম্পোর্ট করুন
import BonusFormModal from '@/Components/BonusFormModal';
import EidBonusModal from '@/Components/EidBonusModal';
import FestivalBonusModal from '@/Components/FestivalBonusModal';

export default function Bonus({ bonusSettings }) {
    const [showForm, setShowForm] = useState(false);
    const [showEidForm, setShowEidForm] = useState(false);
    const [showFestivalForm, setShowFestivalForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        bonus_name: '',
        bonus_type: 'festival',
        percentage: 0,
        fixed_amount: 0,
        is_percentage: true,
        description: '',
        effective_date: new Date().toISOString().split('T')[0],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('bonus.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Bonus Management</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowEidForm(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Apply Eid Bonus
                    </button>
                    <button
                        onClick={() => setShowFestivalForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Apply Festival Bonus
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Add Bonus Setting
                    </button>
                </div>
            </div>

            {/* Bonus Settings Table */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Bonus Settings</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bonusSettings.map((setting) => (
                                <tr key={setting.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {setting.bonus_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {setting.bonus_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {setting.is_percentage ? 'Percentage' : 'Fixed Amount'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {setting.is_percentage ? `${setting.percentage}%` : `৳${setting.fixed_amount}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(setting.effective_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            setting.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {setting.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            href={route('bonus.apply', { bonus: setting.id })}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Apply
                                        </Link>
                                        <button className="text-red-600 hover:text-red-900">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {bonusSettings.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-4">🎁</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No bonus settings found</h3>
                        <p className="text-gray-500 mb-4">
                            Create your first bonus setting to get started
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                            Add Bonus Setting
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-3">
                        <div className="bg-green-100 p-3 rounded-full mr-4">
                            <span className="text-green-600 text-xl">🕌</span>
                        </div>
                        <h3 className="text-lg font-semibold text-green-800">Eid Bonus</h3>
                    </div>
                    <p className="text-green-600 text-sm mb-4">
                        Apply Eid bonus to all or selected employees
                    </p>
                    <button
                        onClick={() => setShowEidForm(true)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                        Apply Eid Bonus
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center mb-3">
                        <div className="bg-blue-100 p-3 rounded-full mr-4">
                            <span className="text-blue-600 text-xl">🎉</span>
                        </div>
                        <h3 className="text-lg font-semibold text-blue-800">Festival Bonus</h3>
                    </div>
                    <p className="text-blue-600 text-sm mb-4">
                        Apply festival bonus for various occasions
                    </p>
                    <button
                        onClick={() => setShowFestivalForm(true)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Apply Festival Bonus
                    </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center mb-3">
                        <div className="bg-purple-100 p-3 rounded-full mr-4">
                            <span className="text-purple-600 text-xl">⭐</span>
                        </div>
                        <h3 className="text-lg font-semibold text-purple-800">Custom Bonus</h3>
                    </div>
                    <p className="text-purple-600 text-sm mb-4">
                        Create custom bonus settings for different needs
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                    >
                        Add Bonus Setting
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showForm && (
                <BonusFormModal 
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    onClose={() => setShowForm(false)}
                />
            )}

            {showEidForm && (
                <EidBonusModal onClose={() => setShowEidForm(false)} />
            )}

            {showFestivalForm && (
                <FestivalBonusModal onClose={() => setShowFestivalForm(false)} />
            )}
        </>
    );
}