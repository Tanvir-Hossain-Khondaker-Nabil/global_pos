// resources/js/Pages/Outlet/Index.jsx
import React, { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import {
    Frown, Plus, Trash2, Search, Edit, X, User,
    Mail, Phone, MapPin, CheckCircle, AlertCircle,
    Building, Check
} from "lucide-react";
import { router, useForm, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ outlets, filters = {} }) {
    const { auth, errors, flash } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: 'success',
        message: ''
    });

    // Show flash messages
    useEffect(() => {
        if (flash.success) {
            setNotification({
                show: true,
                type: 'success',
                message: flash.success
            });
            setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
        }
        if (flash.error) {
            setNotification({
                show: true,
                type: 'error',
                message: flash.error
            });
            setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
        }
    }, [flash]);

    // Handle search and filters
    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || "",
        status: filters?.status || "",
    });

    // Model close handle
    const modelClose = () => {
        outletForm.reset();
        setModel(false);
    };

    // Handle search
    const handleFilter = (field, value) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);

        router.get(route("outlets.index"),
            { search: newFilters.search, status: newFilters.status },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            }
        );
    };

    const clearFilters = () => {
        setLocalFilters({ search: "", status: "" });
        router.get(route("outlets.index"), {}, { replace: true });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            router.get(route("outlets.index"),
                { search: localFilters.search, status: localFilters.status },
                { preserveScroll: true, preserveState: true, replace: true }
            );
        }
    };

    // Handle outlet form submission
    const outletForm = useForm({
        id: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        is_active: true,
    });

    // Handle outlet edit - USING EXISTING DATA
    const handleOutletEdit = (id) => {
        // Find the outlet from the existing data
        const outlet = outlets.find(o => o.id === id);
        if (outlet) {
            outletForm.setData({
                id: outlet.id,
                name: outlet.name,
                phone: outlet.phone || "",
                email: outlet.email || "",
                address: outlet.address || "",
                is_active: Boolean(outlet.is_active),
            });
            setModel(true);
        } else {
            setNotification({
                show: true,
                type: 'error',
                message: t('outlet.fetch_error', 'Failed to find outlet details')
            });
        }
    };

    // Handle outlet delete
    const handleDelete = (id) => {
        if (confirm(t('outlet.delete_confirmation', 'Are you sure you want to delete this outlet?'))) {
            router.delete(route("outlets.destroy", { outlet: id }), {
                preserveScroll: true,
                onSuccess: () => {
                    // Flash message will be shown via the flash prop
                },
                onError: () => {
                    setNotification({
                        show: true,
                        type: 'error',
                        message: t('outlet.delete_error', 'Failed to delete outlet')
                    });
                },
            });
        }
    };

    // Handle outlet create/update form
    const handleOutletCreateForm = (e) => {
        e.preventDefault();

        if (outletForm.data.id) {
            // Update existing outlet
            outletForm.put(route("outlets.update", { outlet: outletForm.data.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    outletForm.reset();
                    setModel(false);
                    // Flash message will be shown via the flash prop
                },
                onError: (errors) => {
                    console.error('Update error:', errors);
                    // Show validation errors in notification
                    const errorMessages = Object.values(errors).join(', ');
                    setNotification({
                        show: true,
                        type: 'error',
                        message: errorMessages || t('outlet.update_error', 'Failed to update outlet')
                    });
                },
            });
        } else {
            // Create new outlet
            outletForm.post(route("outlets.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    outletForm.reset();
                    setModel(false);
                    // Flash message will be shown via the flash prop
                },
                onError: (errors) => {
                    console.error('Create error:', errors);
                    // Show validation errors in notification
                    const errorMessages = Object.values(errors).join(', ');
                    setNotification({
                        show: true,
                        type: 'error',
                        message: errorMessages || t('outlet.create_error', 'Failed to create outlet')
                    });
                },
            });
        }
    };

    // Format date based on locale
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (locale === 'bn') {
                return date.toLocaleDateString('bn-BD', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } else {
                return date.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' :
                    notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
                    'bg-yellow-100 border border-yellow-400 text-yellow-800'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
                        {notification.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
                        {notification.type === 'warning' && <AlertCircle className="h-5 w-5 mr-2" />}
                        <span>{notification.message}</span>
                        <button
                            onClick={() => setNotification({ show: false, type: '', message: '' })}
                            className="ml-4 text-gray-500 hover:text-gray-700"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <PageHeader
                title={t('outlet.title', 'Outlets')}
                subtitle={t('outlet.subtitle', 'Manage your all outlets/branches from here.')}
            >
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="search"
                            value={localFilters.search}
                            onChange={(e) => handleFilter('search', e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('outlet.search_placeholder', 'Search outlets...')}
                            className="h-8 pl-8 pr-3 text-xs font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={localFilters.status}
                        onChange={(e) => handleFilter('status', e.target.value)}
                        className="h-8 px-3 text-xs font-semibold border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
                    >
                        <option value="">{t('outlet.all_status', 'All Status')}</option>
                        <option value="active">{t('outlet.active', 'Active')}</option>
                        <option value="inactive">{t('outlet.inactive', 'Inactive')}</option>
                    </select>

                    {/* Clear Filter */}
                    {(localFilters.search || localFilters.status) && (
                        <button
                            onClick={clearFilters}
                            className="h-8 px-3 text-xs font-semibold text-gray-600 hover:text-black"
                        >
                            {t('outlet.clear', 'Clear')}
                        </button>
                    )}

                    {/* Add New Button */}
                    <button
                        onClick={() => setModel(true)}
                        className="h-8 px-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#1e4d2b] text-white rounded-md hover:bg-black"
                    >
                        <Plus size={14} />
                        {t('outlet.add_outlet', 'Add Outlet')}
                    </button>
                </div>
            </PageHeader>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#1e4d2b] text-white rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-300 mb-2">
                        {t('outlet.total_outlets', 'Total Outlets')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black">{outlets?.length || 0}</p>
                        <Building size={20} className="text-gray-400" />
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-green-700 mb-2">
                        {t('outlet.active_outlets', 'Active Outlets')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-green-700">
                            {outlets?.filter(o => o.is_active).length || 0}
                        </p>
                        <CheckCircle size={20} className="text-green-500" />
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest font-bold text-amber-700 mb-2">
                        {t('outlet.inactive_outlets', 'Inactive Outlets')}
                    </p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-amber-700">
                            {outlets?.filter(o => !o.is_active).length || 0}
                        </p>
                        <X size={20} className="text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Outlets Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
                {outlets && outlets.length > 0 ? (
                    <table className="table w-full">
                        <thead className="bg-[#1e4d2b] text-white uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="py-4">#</th>
                                <th>{t('outlet.outlet_info', 'Outlet Info')}</th>
                                <th>{t('outlet.contact_details', 'Contact Details')}</th>
                                <th>{t('outlet.status', 'Status')}</th>
                                <th className="text-right">{t('outlet.command', 'Command')}</th>
                            </tr>
                        </thead>
                        <tbody className="font-bold text-sm text-gray-700">
                            {outlets.map((outlet, index) => (
                                <tr key={outlet.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                                    <td className="text-gray-400 font-mono text-xs">
                                        {index + 1}
                                    </td>
                                    <td>
                                        <p className="font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">
                                            {outlet.name}
                                        </p>
                                        {outlet.user && (
                                            <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest mt-1">
                                                <User size={10} /> {outlet.user.name}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            {outlet.phone && (
                                                <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                                                    <Phone size={10} /> {outlet.phone}
                                                </span>
                                            )}
                                            {outlet.email && (
                                                <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                                                    <Mail size={10} /> {outlet.email}
                                                </span>
                                            )}
                                            {outlet.address && (
                                                <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                                                    <MapPin size={10} /> {outlet.address.substring(0, 30)}...
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${outlet.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    {outlet.is_active ? t('outlet.active', 'Active') : t('outlet.inactive', 'Inactive')}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1">
                                                {t('outlet.created', 'Created')}: {formatDate(outlet.created_at)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => handleOutletEdit(outlet.id)}
                                                className="btn btn-ghost btn-square btn-xs hover:bg-blue-600 hover:text-white text-blue-600"
                                                title={t('outlet.edit', 'Edit')}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(outlet.id)}
                                                className="btn btn-ghost btn-square btn-xs text-red-400 hover:bg-red-600 hover:text-white"
                                                title={t('outlet.delete', 'Delete')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
                        <Frown size={40} className="text-gray-200" />
                        <span className="font-black uppercase tracking-widest text-xs">
                            {localFilters.search
                                ? t('outlet.no_matching_outlets', 'No outlets matching ":search"', { search: localFilters.search })
                                : t('outlet.no_outlets_found', 'No outlets found')
                            }
                        </span>
                        <button
                            onClick={() => setModel(true)}
                            className="h-8 px-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-[#1e4d2b] text-white rounded-md hover:bg-black mt-2"
                        >
                            <Plus size={14} />
                            {t('outlet.add_first_outlet', 'Add Your First Outlet')}
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Outlet Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl p-0 overflow-hidden">
                    {/* Modal Header */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1e4d2b] text-white rounded-lg">
                                    <Building size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-gray-900">
                                        {outletForm.data.id ? t('outlet.edit_outlet', 'Edit Outlet') : t('outlet.new_outlet', 'New Outlet')}
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        {outletForm.data.id ? t('outlet.update_outlet_info', 'Update outlet information') : t('outlet.add_new_outlet', 'Add a new outlet to your business')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={modelClose}
                                className="btn btn-ghost btn-circle btn-sm hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                        <form onSubmit={handleOutletCreateForm}>
                            {/* Basic Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <Building size={14} className="text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('outlet.basic_information', 'Basic Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="space-y-5">
                                    {/* Outlet Name */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('outlet.outlet_name', 'Outlet Name')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Building size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={outletForm.data.name}
                                                onChange={(e) => outletForm.setData("name", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder={t('outlet.outlet_name_placeholder', 'Enter outlet name')}
                                                required
                                            />
                                        </div>
                                        {outletForm.errors.name && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {outletForm.errors.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-green-100 rounded">
                                        <Phone size={14} className="text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('outlet.contact_information', 'Contact Information')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Phone */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('outlet.phone', 'Phone')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={outletForm.data.phone}
                                                onChange={(e) => outletForm.setData("phone", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder="+880 1234 567890"
                                                required
                                            />
                                        </div>
                                        {outletForm.errors.phone && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {outletForm.errors.phone}
                                            </div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('outlet.email', 'Email')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={outletForm.data.email}
                                                onChange={(e) => outletForm.setData("email", e.target.value)}
                                                className="input input-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                                placeholder="email@example.com"
                                                required
                                            />
                                        </div>
                                        {outletForm.errors.email && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {outletForm.errors.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-amber-100 rounded">
                                        <MapPin size={14} className="text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('outlet.address', 'Address')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="space-y-5">
                                    {/* Address */}
                                    <div className="form-control">
                                        <label className="label py-0 mb-2">
                                            <span className="label-text font-bold text-gray-700 text-sm">
                                                {t('outlet.address', 'Address')} <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <textarea
                                                value={outletForm.data.address}
                                                onChange={(e) => outletForm.setData("address", e.target.value)}
                                                className="textarea textarea-bordered w-full pl-10 py-3 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 min-h-[80px]"
                                                rows="3"
                                                placeholder={t('outlet.address_placeholder', 'Enter full address')}
                                                required
                                            />
                                        </div>
                                        {outletForm.errors.address && (
                                            <div className="text-red-600 text-xs mt-2 flex items-center gap-2 bg-red-50 p-2 rounded">
                                                <AlertCircle size={12} />
                                                {outletForm.errors.address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-gray-100 rounded">
                                        <CheckCircle size={14} className="text-gray-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{t('outlet.status_settings', 'Status Settings')}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                <div className="form-control">
                                    <label className="label py-0 mb-2">
                                        <span className="label-text font-bold text-gray-700 text-sm">
                                            {t('outlet.status_field', 'Status')}
                                        </span>
                                    </label>
                                    <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-900 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1 rounded ${outletForm.data.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {outletForm.data.is_active ? (
                                                    <CheckCircle size={14} className="text-green-600" />
                                                ) : (
                                                    <X size={14} className="text-red-600" />
                                                )}
                                            </div>
                                            <span className="font-bold">
                                                {outletForm.data.is_active ? t('outlet.active_outlet', 'Active Outlet') : t('outlet.inactive_outlet', 'Inactive Outlet')}
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={outletForm.data.is_active}
                                            onChange={(e) => outletForm.setData("is_active", e.target.checked)}
                                            className="toggle toggle-primary"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-8">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={modelClose}
                                        className="btn btn-ghost flex-1 hover:bg-gray-100"
                                    >
                                        {t('outlet.cancel', 'Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={outletForm.processing}
                                        className="btn bg-[#1e4d2b] text-white flex-1 hover:bg-gray-800"
                                    >
                                        {outletForm.processing ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                {t('outlet.processing', 'Processing...')}
                                            </>
                                        ) : outletForm.data.id ? (
                                            <>
                                                <Check size={18} />
                                                {t('outlet.update_outlet', 'Update Outlet')}
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                {t('outlet.create_outlet', 'Create Outlet')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}