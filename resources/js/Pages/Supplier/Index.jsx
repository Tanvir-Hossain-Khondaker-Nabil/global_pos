import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, Mail, Phone, MapPin, Globe } from "lucide-react";
import { router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";

export default function Index({ suppliers, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProcessing, setEditProcessing] = useState(false);

    // Model close handle
    const modelClose = () => {
        supplyForm.reset();
        setModel(false);
    };

    // Handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        router.get(route("supplier.view"), 
            { search: value }, 
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            }
        );
    };

    // Handle form submission
    const supplyForm = useForm({
        id: "",
        name: "",
        description: "",
        contact_person: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        website: "",
    });

    const handleSupplyCreateForm = (e) => {
        e.preventDefault();

        if (supplyForm.data.id) {
            // Update existing supplier
            supplyForm.put(route("supplier.update", { id: supplyForm.data.id }), {
                onSuccess: () => {
                    supplyForm.reset();
                    setModel(false);
                },
            });
        } else {
            // Create new supplier
            supplyForm.post(route("supplier.store"), {
                onSuccess: () => {
                    supplyForm.reset();
                    setModel(false);
                },
            });
        }
    };

    // Handle supplier edit
    const handleSupplyEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("supplier.edit", { id: id })).then((res) => {
            const data = res.data.data;
            supplyForm.setData({
                id: data.id,
                name: data.name,
                description: data.description || "",
                contact_person: data.contact_person,
                email: data.email,
                phone: data.phone,
                company: data.company || "",
                address: data.address || "",
                website: data.website || "",
            });
            setModel(true);
        }).finally(() => {
            setEditProcessing(false);
        });
    };

    // Handle supplier delete
    const handleDelete = (id) => {
        if (confirm(t('supplier.delete_confirmation', 'Are you sure you want to delete this supplier contact?'))) {
            router.delete(route("supplier.del", { id }), {
                preserveScroll: true,
                onSuccess: () => {
                    // Success message will come from backend
                },
            });
        }
    };

    // Format date based on locale
    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (locale === 'bn') {
            // Bengali locale formatting
            return new Date(dateString).toLocaleDateString('bn-BD', options);
        } else {
            // English locale formatting
            return new Date(dateString).toLocaleDateString('en-US', options);
        }
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('supplier.title', 'Supplier Contacts')}
                subtitle={t('supplier.subtitle', 'Manage your all supplier contacts from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('supplier.search_placeholder', 'Search suppliers...')}
                        className="input input-sm input-bordered w-64"
                    />
                    {auth.role === "admin" && (
                        <button
                            onClick={() => setModel(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> {t('supplier.add_new', 'Add New')}
                        </button>
                    )}
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {suppliers.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="w-12">#</th>
                                <th>{t('supplier.contact_info', 'Contact Info')}</th>
                                <th>{t('supplier.company', 'Company')}</th>
                                <th>{t('supplier.description', 'Description')}</th>
                                <th>{t('supplier.added_on', 'Added On')}</th>
                                <th className="w-32">{t('supplier.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.data.map((supplier, index) => (
                                <tr key={supplier.id}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="font-semibold">{supplier.contact_person}</div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail size={12} />
                                                <span>{supplier.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone size={12} />
                                                <span>{supplier.phone}</span>
                                            </div>
                                            {supplier.address && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin size={12} />
                                                    <span className="truncate max-w-xs">{supplier.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="font-medium">{supplier.name}</div>
                                            {supplier.company && (
                                                <div className="text-sm text-gray-600">{supplier.company}</div>
                                            )}
                                            {supplier.website && (
                                                <div className="flex items-center gap-1 text-sm text-blue-600">
                                                    <Globe size={12} />
                                                    <a 
                                                        href={supplier.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {t('supplier.website', 'Website')}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="max-w-xs">
                                        {supplier.description ? (
                                            <div className="text-sm text-gray-600 line-clamp-3">
                                                {supplier.description}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                                {t('supplier.no_description', 'No description')}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(supplier.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        {auth.role === "admin" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={editProcessing}
                                                    onClick={() => handleSupplyEdit(supplier.id)}
                                                    className="btn btn-xs btn-warning"
                                                >
                                                    <Pen size={12} /> {t('supplier.edit', 'Edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={12} /> {t('supplier.delete', 'Delete')}
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                {t('supplier.no_permission', 'No permission')}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3 text-center">
                        <Frown size={40} className="text-gray-400" />
                        <div>
                            <h3 className="text-gray-500 font-medium mb-1">
                                {t('supplier.no_contacts_found', 'No supplier contacts found')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {searchForm.data.search 
                                    ? t('supplier.no_matching_contacts', 'No contacts matching ":search"', {
                                        search: searchForm.data.search
                                    })
                                    : t('supplier.get_started_message', 'Get started by adding your first supplier contact')
                                }
                            </p>
                        </div>
                        {auth.role === "admin" && (
                            <button
                                onClick={() => setModel(true)}
                                className="btn btn-primary btn-sm"
                            >
                                <Plus size={15} /> {t('supplier.add_new_contact', 'Add New Contact')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {suppliers.data.length > 0 && (
                <div className="mt-6">
                    <Pagination data={suppliers} />
                </div>
            )}

            {/* Add/Edit Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {supplyForm.data.id 
                                ? t('supplier.edit_contact', 'Edit Supply Contact')
                                : t('supplier.add_new_contact', 'Add New Contact')
                            }
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-ghost"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSupplyCreateForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Supply Name */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.supply_name', 'Supply Name')}
                                    <span className="text-red-500 ml-1">
                                        {t('supplier.required_field', '*')}
                                    </span>
                                </legend>
                                <input
                                    type="text"
                                    value={supplyForm.data.name}
                                    onChange={(e) => supplyForm.setData("name", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.supply_name_placeholder', 'Enter supplier name')}
                                    required
                                />
                                {supplyForm.errors.name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {supplyForm.errors.name}
                                    </div>
                                )}
                            </fieldset>

                            {/* Contact Person */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.contact_person', 'Contact Person')}
                                    <span className="text-red-500 ml-1">
                                        {t('supplier.required_field', '*')}
                                    </span>
                                </legend>
                                <input
                                    type="text"
                                    value={supplyForm.data.contact_person}
                                    onChange={(e) => supplyForm.setData("contact_person", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.contact_person_placeholder', 'Enter contact person name')}
                                    required
                                />
                                {supplyForm.errors.contact_person && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {supplyForm.errors.contact_person}
                                    </div>
                                )}
                            </fieldset>

                            {/* Email */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.email', 'Email')}
                                    <span className="text-red-500 ml-1">
                                        {t('supplier.required_field', '*')}
                                    </span>
                                </legend>
                                <input
                                    type="email"
                                    value={supplyForm.data.email}
                                    onChange={(e) => supplyForm.setData("email", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.email_placeholder', 'Enter email address')}
                                    required
                                />
                                {supplyForm.errors.email && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {supplyForm.errors.email}
                                    </div>
                                )}
                            </fieldset>

                            {/* Phone */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.phone', 'Phone')}
                                    <span className="text-red-500 ml-1">
                                        {t('supplier.required_field', '*')}
                                    </span>
                                </legend>
                                <input
                                    type="tel"
                                    value={supplyForm.data.phone}
                                    onChange={(e) => supplyForm.setData("phone", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.phone_placeholder', 'Enter phone number')}
                                    required
                                />
                                {supplyForm.errors.phone && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {supplyForm.errors.phone}
                                    </div>
                                )}
                            </fieldset>

                            {/* Company */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.company_name', 'Company')}
                                </legend>
                                <input
                                    type="text"
                                    value={supplyForm.data.company}
                                    onChange={(e) => supplyForm.setData("company", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.company_placeholder', 'Enter company name')}
                                />
                            </fieldset>

                            {/* Website */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.website_url', 'Website')}
                                </legend>
                                <input
                                    type="url"
                                    value={supplyForm.data.website}
                                    onChange={(e) => supplyForm.setData("website", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.website_placeholder', 'https://example.com')}
                                />
                                {supplyForm.errors.website && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {supplyForm.errors.website}
                                    </div>
                                )}
                            </fieldset>
                        </div>

                        {/* Address */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('supplier.address', 'Address')}
                            </legend>
                            <textarea
                                value={supplyForm.data.address}
                                onChange={(e) => supplyForm.setData("address", e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows="2"
                                placeholder={t('supplier.address_placeholder', 'Enter full address')}
                            />
                        </fieldset>

                        {/* Description */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('supplier.description_field', 'Description')}
                            </legend>
                            <textarea
                                value={supplyForm.data.description}
                                onChange={(e) => supplyForm.setData("description", e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows="3"
                                placeholder={t('supplier.description_placeholder', 'Enter description or notes')}
                            />
                        </fieldset>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={supplyForm.processing}
                                className="btn btn-primary flex-1"
                            >
                                {supplyForm.processing 
                                    ? t('supplier.processing', 'Processing...')
                                    : supplyForm.data.id 
                                        ? t('supplier.update_contact', 'Update Contact')
                                        : t('supplier.add_contact', 'Add Contact')
                                }
                            </button>
                            <button
                                type="button"
                                onClick={modelClose}
                                className="btn btn-ghost"
                            >
                                {t('supplier.cancel', 'Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}