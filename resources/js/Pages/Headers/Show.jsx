import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Edit,
    Store,
    FileText,
    Calendar,
    User,
    Globe,
    Sidebar
} from 'lucide-react';

export default function Show({ auth, header }) {
    return (

        <div className="py-6">
            <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6">
                    <Link
                        href={route('headers.index')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={18} />
                        Back to Headers
                    </Link>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{header.title}</h3>
                                <p className="text-sm text-gray-500">Header configuration details</p>
                            </div>

                            <Link
                                href={route('headers.edit', header.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                <Edit size={16} />
                                Edit Header
                            </Link>
                        </div>

                        {/* Favicon Preview */}
                        {header.fav_icon_url && (
                            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 border rounded-lg overflow-hidden">
                                        <img
                                            src={header.fav_icon_url}
                                            alt="Favicon"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700">Favicon Preview</h4>
                                        <p className="text-xs text-gray-500">Displayed in browser tabs</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Outlet Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Store size={16} />
                                    Outlet Information
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Outlet Name</label>
                                        <p className="text-sm font-medium">{header.outlet?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Outlet Code</label>
                                        <p className="text-sm font-medium">{header.outlet?.code || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Header Settings */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Globe size={16} />
                                    Header Settings
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Page Title</label>
                                        <p className="text-sm font-medium">{header.title}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 flex items-center gap-1">
                                            <Sidebar size={12} />
                                            Sidebar Name
                                        </label>
                                        <p className="text-sm font-medium">{header.sitebar_name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FileText size={16} />
                                    Metadata
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Created By</label>
                                        <p className="text-sm font-medium">{header.creator?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            Created Date
                                        </label>
                                        <p className="text-sm font-medium">
                                            {new Date(header.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Last Updated</label>
                                        <p className="text-sm font-medium">
                                            {new Date(header.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Preview</h4>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-900 mb-1">
                                        {header.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Sidebar: {header.sitebar_name}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        Browser tab would show: {header.title}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Important Notes</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Each outlet can only have one header configuration</li>
                                <li>• The page title appears in browser tabs and bookmarks</li>
                                <li>• Sidebar name is displayed in the application sidebar</li>
                                <li>• Favicon should be a square image for best results</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}