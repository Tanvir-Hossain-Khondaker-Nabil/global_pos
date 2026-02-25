import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';

export default function Show({ system }) {
    const [activeTab, setActiveTab] = useState(system.status === 'active' ? 'active' : 'inactive');
    const [isUpdating, setIsUpdating] = useState(false);
    const [holdReason, setHoldReason] = useState(system.hold_reason || '');

    const handleStatusUpdate = (newStatus) => {
        if (newStatus === system.status) return;
        
        setIsUpdating(true);
        
        router.put(`/systems/${system.id}`, {
            status: newStatus,
            hold_reason: newStatus === 'inactive' ? holdReason : null
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUpdating(false);
                setActiveTab(newStatus);
            },
            onError: (errors) => {
                setIsUpdating(false);
                alert('Failed to update status. Please try again.');
            }
        });
    };

    const handleSubmitHoldReason = () => {
        if (!holdReason.trim()) {
            alert('Please provide a reason for holding');
            return;
        }
        handleStatusUpdate('inactive');
    };

    return (
        <>
            <Head title={`System Details`} />
            
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header with Back Button */}
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">System Details</h1>
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Back
                        </button>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Status Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                <button
                                    onClick={() => {
                                        setActiveTab('active');
                                        handleStatusUpdate('active');
                                    }}
                                    disabled={isUpdating}
                                    className={`relative flex-1 py-4 px-6 text-sm font-medium text-center transition-colors
                                        ${activeTab === 'active'
                                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }
                                        ${system.status === 'active' ? 'bg-emerald-50/50' : ''}
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${system.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                        Active
                                    </div>
                                    {system.status === 'active' && (
                                        <span className="absolute top-2 right-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                            Current
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setActiveTab('inactive')}
                                    disabled={isUpdating}
                                    className={`relative flex-1 py-4 px-6 text-sm font-medium text-center transition-colors
                                        ${activeTab === 'inactive'
                                            ? 'text-rose-600 border-b-2 border-rose-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }
                                        ${system.status === 'inactive' ? 'bg-rose-50/50' : ''}
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${system.status === 'inactive' ? 'bg-rose-500' : 'bg-gray-300'}`}></span>
                                        Inactive
                                    </div>
                                    {system.status === 'inactive' && (
                                        <span className="absolute top-2 right-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                            Current
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'active' && (
                                <div className="space-y-6">
                                    {/* Active Status Details */}
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-emerald-800">System is Active</h3>
                                                <p className="text-sm text-emerald-600">This system is currently operational and available</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">System ID</p>
                                            <p className="font-medium text-gray-900">{system.id}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Status</p>
                                            <p className="font-medium text-emerald-600">Active</p>
                                        </div>
                                    </div>

                                    {/* Update to Inactive Button */}
                                    {system.status === 'active' && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <button
                                                onClick={() => setActiveTab('inactive')}
                                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
                                            >
                                                Move to Inactive
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'inactive' && (
                                <div className="space-y-6">
                                    {/* Inactive Status Details */}
                                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-rose-800">System is Inactive</h3>
                                                <p className="text-sm text-rose-600">This system is currently on hold or inactive</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hold Reason Display/Input */}
                                    {system.status === 'inactive' && system.hold_reason && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500 mb-2">Hold Reason</p>
                                            <p className="text-gray-900">{system.hold_reason}</p>
                                        </div>
                                    )}

                                    {/* System Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">System ID</p>
                                            <p className="font-medium text-gray-900">{system.id}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Status</p>
                                            <p className="font-medium text-rose-600">Inactive</p>
                                        </div>
                                    </div>

                                    {/* Update Form */}
                                    {system.status !== 'inactive' && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Move to Inactive</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Reason for holding
                                                    </label>
                                                    <textarea
                                                        value={holdReason}
                                                        onChange={(e) => setHoldReason(e.target.value)}
                                                        rows="3"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                                        placeholder="Please provide a reason..."
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleSubmitHoldReason}
                                                        disabled={isUpdating || !holdReason.trim()}
                                                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isUpdating ? 'Updating...' : 'Confirm Inactive Status'}
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveTab('active')}
                                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Status Legend */}
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-gray-600">Active - System is operational</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    <span className="text-gray-600">Inactive - System is on hold</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}