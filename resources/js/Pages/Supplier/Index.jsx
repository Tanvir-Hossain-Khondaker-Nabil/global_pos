import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, Mail, Phone, MapPin, Globe, DollarSign, CheckCircle, XCircle } from "lucide-react";
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
        advance_amount: 0,
        due_amount: 0,
        is_active: true,
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
                advance_amount: parseFloat(data.advance_amount) || 0,
                due_amount: parseFloat(data.due_amount) || 0,
                is_active: Boolean(data.is_active),
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
                    // Optionally show a success message or perform additional actions
                    alert(t('supplier.deleted_successfully', 'Supplier contact deleted successfully!'));
                },
            });
        }
    };

    // Format currency based on locale
    const formatCurrency = (amount) => {
        if (locale === 'bn') {
            // Bengali locale formatting
            return new Intl.NumberFormat('bn-BD', {
                style: 'currency',
                currency: 'BDT',
                minimumFractionDigits: 2
            }).format(amount);
        } else {
            // English locale formatting
            return new Intl.NumberFormat('en-BD', {
                style: 'currency',
                currency: 'BDT',
                minimumFractionDigits: 2
            }).format(amount);
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
            return new Date(dateString).toLocaleDateString('bn-BD', options);
        } else {
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
                        <button
                            onClick={() => setModel(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> {t('supplier.add_new', 'Add New')}
                        </button>
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
                                <th>{t('supplier.financial_info', 'Financial Info')}</th>
                                <th>{t('supplier.status', 'Status')}</th>
                                <th>{t('supplier.added_on', 'Added On')}</th>
                                <th className="w-32">{t('supplier.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.data.map((supplier, index) => (
                                <tr key={supplier.id} className={!supplier.is_active ? 'opacity-70' : ''}>
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
                                    <td>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                    {t('supplier.advance_amount', 'Advance')}:
                                                    <span className="font-semibold ml-1 text-green-600">
                                                        {formatCurrency(supplier.advance_amount)}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                    {t('supplier.due_amount', 'Due')}:
                                                    <span className="font-semibold ml-1 text-red-600">
                                                        {formatCurrency(
                                                            supplier?.purchases?.reduce(
                                                                (sum, p) => sum + (parseFloat(p?.grand_total - p?.paid_amount) || 0),
                                                                0
                                                            )
                                                        )}


                                                    </span>
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                {supplier.purchases_count || 0} {t('supplier.purchases', 'purchases')}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {supplier.is_active ? (
                                                <>
                                                    <CheckCircle size={10} />
                                                    <span>{t('supplier.active', 'Active')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={10} />
                                                    <span>{t('supplier.inactive', 'Inactive')}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(supplier.created_at)}
                                        </div>
                                    </td>
                                    <td>
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
                            <button
                                onClick={() => setModel(true)}
                                className="btn btn-primary btn-sm"
                            >
                                <Plus size={15} /> {t('supplier.add_new_contact', 'Add New Contact')}
                            </button>
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
                <div className="modal-box max-w-3xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {supplyForm.data.id
                                ? t('supplier.edit_contact', 'Edit Supplier Contact')
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
                                    {t('supplier.supply_name', 'Supplier Name')}
                                    <span className="text-red-500 ml-1">*</span>
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
                                    <span className="text-red-500 ml-1">*</span>
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
                                    <span className="text-red-500 ml-1">*</span>
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
                                    <span className="text-red-500 ml-1">*</span>
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

                            {/* Advance Amount */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.advance_amount', 'Advance Amount')}
                                </legend>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={supplyForm.data.advance_amount}
                                    onChange={(e) => supplyForm.setData("advance_amount", parseFloat(e.target.value) || 0)}
                                    className="input input-bordered w-full"
                                    placeholder={t('supplier.advance_amount_placeholder', 'Enter advance amount')}
                                />
                                {supplyForm.errors.advance_amount && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {supplyForm.errors.advance_amount}
                                    </div>
                                )}
                            </fieldset>



                            {/* Status */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('supplier.status_field', 'Status')}
                                </legend>
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={supplyForm.data.is_active}
                                        onChange={(e) => supplyForm.setData("is_active", e.target.checked)}
                                        className="toggle toggle-primary"
                                    />
                                    <span className="label-text">
                                        {supplyForm.data.is_active
                                            ? t('supplier.active_status', 'Active')
                                            : t('supplier.inactive_status', 'Inactive')
                                        }
                                    </span>
                                </label>
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