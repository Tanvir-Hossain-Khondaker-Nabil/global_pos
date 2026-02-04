import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, X, AlertCircle } from 'lucide-react';

export default function Create({ auth, availableOutlets, hasOutlets }) {
    const { errors } = usePage().props;
    const [form, setForm] = useState({
        title: '',
        sitebar_name: '',
        outlet_id: '',
        fav_icon: null,
    });
    const [preview, setPreview] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'fav_icon' && files.length > 0) {
            const file = files[0];
            setForm(prev => ({ ...prev, fav_icon: file }));
            setPreview(URL.createObjectURL(file));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const removeImage = () => {
        setForm(prev => ({ ...prev, fav_icon: null }));
        setPreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key] !== null && form[key] !== '') {
                formData.append(key, form[key]);
            }
        });

        router.post(route('headers.store'), formData, {
            forceFormData: true,
            onError: (errors) => {
                // Handle errors
            }
        });
    };

    if (!hasOutlets) {
        return (
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Outlets Available</h3>
                            <p className="text-gray-500 mb-6">
                                You need to create an outlet before you can configure its header.
                            </p>
                            {/* <Link
                                href={route('outlets.create')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                Create Outlet
                            </Link> */}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (availableOutlets.length === 0) {
        return (
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">All Outlets Configured</h3>
                            <p className="text-gray-500 mb-6">
                                All your outlets already have header configurations.
                            </p>
                            <Link
                                href={route('headers.index')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                                View Headers
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6">
            <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
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

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Outlet Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Outlet *
                                    </label>
                                    <select
                                        name="outlet_id"
                                        value={form.outlet_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.outlet_id ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        required
                                    >
                                        <option value="">Select an outlet</option>
                                        {availableOutlets.map(outlet => (
                                            <option key={outlet.id} value={outlet.id}>
                                                {outlet.name} ({outlet.code})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.outlet_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.outlet_id}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Each outlet can only have one header configuration
                                    </p>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Page Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.title ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., My Business Dashboard"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                    )}
                                </div>

                                {/* Sidebar Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sidebar Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="sitebar_name"
                                        value={form.sitebar_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.sitebar_name ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., Main Dashboard"
                                        required
                                    />
                                    {errors.sitebar_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sitebar_name}</p>
                                    )}
                                </div>

                                {/* Favicon Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Favicon
                                    </label>

                                    {preview ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="w-16 h-16 rounded-lg border"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition">
                                            <input
                                                type="file"
                                                name="fav_icon"
                                                onChange={handleChange}
                                                accept="image/png,image/jpeg,image/jpg,image/x-icon"
                                                className="hidden"
                                            />
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">Upload favicon</span>
                                            <span className="text-xs text-gray-400">PNG, JPG, ICO (max 2MB)</span>
                                        </label>
                                    )}
                                    {errors.fav_icon && (
                                        <p className="mt-1 text-sm text-red-600">{errors.fav_icon}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4 border-t">
                                    <div className="flex justify-end gap-3">
                                        <Link
                                            href={route('headers.index')}
                                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                        >
                                            Create Header
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}