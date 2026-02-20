import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';

export default function Edit({ auth, header, outlets }) {
    const { errors } = usePage().props;
    const [form, setForm] = useState({
        title: header.title,
        sitebar_name: header.sitebar_name,
        outlet_id: header.outlet_id,
        fav_icon: null,
        remove_fav_icon: false,
    });
    const [preview, setPreview] = useState(header.fav_icon_url);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'fav_icon' && files.length > 0) {
            const file = files[0];
            setForm(prev => ({ ...prev, fav_icon: file, remove_fav_icon: false }));
            setPreview(URL.createObjectURL(file));
        } else if (name === 'remove_fav_icon') {
            setForm(prev => ({ ...prev, fav_icon: null, remove_fav_icon: true }));
            setPreview(null);
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const removeImage = () => {
        setForm(prev => ({ ...prev, fav_icon: null, remove_fav_icon: true }));
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

        router.post(route('headers.update', header.id), {
            ...form,
            _method: 'PUT'
        }, {
            forceFormData: true,
            onError: (errors) => {
                // Handle errors
            }
        });
    };

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
                                        Change Outlet
                                    </label>
                                    <select
                                        name="outlet_id"
                                        value={form.outlet_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.outlet_id ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select an outlet</option>
                                        {outlets.map(outlet => (
                                            <option key={outlet.id} value={outlet.id}>
                                                {outlet.name} ({outlet.code}) {outlet.id === header.outlet_id ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.outlet_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.outlet_id}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Changing outlet will move this header configuration to the selected outlet
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

                                    <div className="flex items-center gap-4">
                                        {preview ? (
                                            <div className="relative">
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
                                            <div className="w-16 h-16 rounded-lg border border-gray-300 flex items-center justify-center">
                                                <span className="text-xs text-gray-400">No favicon</span>
                                            </div>
                                        )}

                                        <div>
                                            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition">
                                                <Upload className="w-4 h-4" />
                                                <span className="text-sm">Upload new favicon</span>
                                                <input
                                                    type="file"
                                                    name="fav_icon"
                                                    onChange={handleChange}
                                                    accept="image/png,image/jpeg,image/jpg,image/x-icon"
                                                    className="hidden"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PNG, JPG, ICO (max 2MB)
                                            </p>
                                        </div>
                                    </div>

                                    {header.fav_icon && !preview && (
                                        <div className="mt-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    name="remove_fav_icon"
                                                    checked={form.remove_fav_icon}
                                                    onChange={handleChange}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-red-600">
                                                    Remove existing favicon
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    {errors.fav_icon && (
                                        <p className="mt-1 text-sm text-red-600">{errors.fav_icon}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this header?')) {
                                                    router.delete(route('headers.destroy', header.id));
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                            Delete Header
                                        </button>

                                        <div className="flex gap-3">
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
                                                Update Header
                                            </button>
                                        </div>
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