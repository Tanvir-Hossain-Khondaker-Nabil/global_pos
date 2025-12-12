import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { Eye, Frown, Pen, Plus, Trash2, X, Mail, Phone, MapPin, User, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";

export default function Customers({ customers, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProcessing, setEditProcessing] = useState(false);

    // Model close handle
    const modelClose = () => {
        customerForm.reset();
        setModel(false);
    };

    // Handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        router.get(route("customer.index"), 
            { search: value }, 
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            }
        );
    };

    // Handle form submission
    const customerForm = useForm({
        id: "",
        customer_name: "",
        phone: "",
        address: "",
        email: "",
        advance_amount: 0,
        due_amount: 0,
        is_active: true,
    });

    const handleCustomerCreateForm = (e) => {
        e.preventDefault();

        if (customerForm.data.id) {
            // Update existing customer
            customerForm.put(route("customer.update", customerForm.data.id), {
                onSuccess: () => {
                    customerForm.reset();
                    setModel(false);
                },
                onError: (errors) => {
                    console.log(errors);
                }
            });
        } else {
            // Create new customer
            customerForm.post(route("customer.store"), {
                onSuccess: () => {
                    customerForm.reset();
                    setModel(false);
                },
                onError: (errors) => {
                    console.log(errors);
                }
            });
        }
    };

    // Handle customer edit
    const handleCustomerEdit = (id) => {
        setEditProcessing(true);
        axios.get(route("customer.edit", { id: id })).then((res) => {
            const data = res.data.data;
            customerForm.setData({
                id: data.id,
                customer_name: data.customer_name,
                phone: data.phone,
                address: data.address || "",
                email: data.email || "",
                advance_amount: parseFloat(data.advance_amount) || 0,
                due_amount: parseFloat(data.due_amount) || 0,
                is_active: Boolean(data.is_active),
            });
            setModel(true);
        }).catch(error => {
            console.error("Error fetching customer:", error);
        }).finally(() => {
            setEditProcessing(false);
        });
    };

    // Calculate due amount from sales
    const calculateDueAmount = (sales) => {
        if (!sales || sales.length === 0) return 0;
        return sales.reduce((total, sale) => {
            return total + (parseFloat(sale.due_amount) || 0);
        }, 0);
    };

    // Format currency based on locale
    const formatCurrency = (amount) => {
        if (locale === 'bn') {
            return new Intl.NumberFormat('bn-BD', {
                style: 'currency',
                currency: 'BDT',
                minimumFractionDigits: 2
            }).format(amount);
        } else {
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
                title={t('customer.title', 'Customer Management')}
                subtitle={t('customer.subtitle', 'Manage your all customers from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('customer.search_placeholder', 'Search customers...')}
                        className="input input-sm input-bordered w-64"
                    />
                    <button
                        onClick={() => {
                            customerForm.reset();
                            setModel(true);
                        }}
                        className="btn btn-primary btn-sm"
                    >
                        <Plus size={15} /> {t('customer.add_new', 'Add New')}
                    </button>
                </div>
            </PageHeader>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-box p-4">
                    <p className="text-sm text-blue-600 font-medium">{t('customer.total_customers', 'Total Customers')}</p>
                    <p className="text-2xl font-bold text-blue-700">{customers.total}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-box p-4">
                    <p className="text-sm text-green-600 font-medium">{t('customer.active_customers', 'Active Customers')}</p>
                    <p className="text-2xl font-bold text-green-700">
                        {customers.data.filter(c => c.is_active).length}
                    </p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-box p-4">
                    <p className="text-sm text-amber-600 font-medium">{t('customer.total_advance', 'Total Advance')}</p>
                    <p className="text-2xl font-bold text-amber-700">
                        {formatCurrency(customers.data.reduce((sum, c) => sum + parseFloat(c.advance_amount || 0), 0))}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-box p-4">
                    <p className="text-sm text-red-600 font-medium">{t('customer.total_due', 'Total Due')}</p>
                    <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(customers.data.reduce((sum, c) => sum + calculateDueAmount(c.sales), 0))}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {customers.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="w-12">#</th>
                                <th>{t('customer.contact_info', 'Contact Info')}</th>
                                <th>{t('customer.address', 'Address')}</th>
                                <th>{t('customer.financial_info', 'Financial Info')}</th>
                                <th>{t('customer.status', 'Status')}</th>
                                <th>{t('customer.join_at', 'Joined On')}</th>
                                <th className="w-32">{t('customer.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((customer, index) => (
                                <tr key={customer.id} className={!customer.is_active ? 'opacity-70' : ''}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <User size={14} />
                                                <span>{customer.customer_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone size={12} />
                                                <span>{customer.phone}</span>
                                            </div>
                                            {customer.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={12} />
                                                    <span>{customer.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="max-w-xs">
                                        {customer.address ? (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{customer.address}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                                {t('customer.no_address', 'No address')}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                    {t('customer.advance', 'Advance')}: 
                                                    <span className="font-semibold ml-1 text-green-600">
                                                        {formatCurrency(customer.advance_amount || 0)}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                    {t('customer.due', 'Due')}: 
                                                    <span className="font-semibold ml-1 text-red-600">
                                                        {formatCurrency(calculateDueAmount(customer.sales) || 0)}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                {customer.sales?.length || 0} {t('customer.sales', 'sales')}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {customer.is_active ? (
                                                <>
                                                    <CheckCircle size={10} />
                                                    <span>{t('customer.active', 'Active')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={10} />
                                                    <span>{t('customer.inactive', 'Inactive')}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(customer.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("customer.show", { id: customer.id })}
                                                className="btn btn-xs btn-info"
                                                title={t('customer.view_details', 'View Details')}
                                            >
                                                <Eye size={12} />
                                            </Link>
                                                <>
                                                    <button
                                                        disabled={editProcessing}
                                                        onClick={() => handleCustomerEdit(customer.id)}
                                                        className="btn btn-xs btn-warning"
                                                        title={t('customer.edit', 'Edit')}
                                                    >
                                                        <Pen size={12} />
                                                    </button>
                                                    <Link
                                                        href={route("customer.del", { id: customer.id })}
                                                        onClick={(e) => {
                                                            if (!confirm(t('customer.delete_confirmation', 'Are you sure you want to delete this customer?'))) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                        title={t('customer.delete', 'Delete')}
                                                    >
                                                        <Trash2 size={12} />
                                                    </Link>
                                                </>
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
                                {t('customer.no_customers_found', 'No customers found')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {searchForm.data.search 
                                    ? t('customer.no_matching_customers', 'No customers matching ":search"', {
                                        search: searchForm.data.search
                                    })
                                    : t('customer.get_started_message', 'Get started by adding your first customer')
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setModel(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> {t('customer.add_new_customer', 'Add New Customer')}
                        </button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {customers.data.length > 0 && (
                <div className="mt-6">
                    <Pagination data={customers} />
                </div>
            )}

            {/* Add/Edit Modal */}
            <dialog className={`modal ${model ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {customerForm.data.id 
                                ? t('customer.edit_customer', 'Edit Customer')
                                : t('customer.add_new_customer', 'Add New Customer')
                            }
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-ghost"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleCustomerCreateForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Customer Name */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('customer.customer_name', 'Customer Name')}
                                    <span className="text-red-500 ml-1">*</span>
                                </legend>
                                <input
                                    type="text"
                                    value={customerForm.data.customer_name}
                                    onChange={(e) => customerForm.setData("customer_name", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('customer.customer_name_placeholder', 'Enter customer name')}
                                    required
                                />
                                {customerForm.errors.customer_name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {customerForm.errors.customer_name}
                                    </div>
                                )}
                            </fieldset>

                            {/* Phone */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('customer.customer_phone', 'Phone')}
                                    <span className="text-red-500 ml-1">*</span>
                                </legend>
                                <input
                                    type="tel"
                                    value={customerForm.data.phone}
                                    onChange={(e) => customerForm.setData("phone", e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={t('customer.customer_phone_placeholder', 'Enter phone number')}
                                    required
                                />
                                {customerForm.errors.phone && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {customerForm.errors.phone}
                                    </div>
                                )}
                            </fieldset>


                            {/* Advance Amount */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('customer.advance_amount', 'Advance Amount')}
                                </legend>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customerForm.data.advance_amount}
                                    onChange={(e) => customerForm.setData("advance_amount", parseFloat(e.target.value) || 0)}
                                    className="input input-bordered w-full"
                                    placeholder={t('customer.advance_amount_placeholder', 'Enter advance amount')}
                                />
                                {customerForm.errors.advance_amount && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {customerForm.errors.advance_amount}
                                    </div>
                                )}
                            </fieldset>

                     

                            {/* Status */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('customer.status_field', 'Status')}
                                </legend>
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={customerForm.data.is_active}
                                        onChange={(e) => customerForm.setData("is_active", e.target.checked)}
                                        className="toggle toggle-primary"
                                    />
                                    <span className="label-text">
                                        {customerForm.data.is_active 
                                            ? t('customer.active_status', 'Active')
                                            : t('customer.inactive_status', 'Inactive')
                                        }
                                    </span>
                                </label>
                            </fieldset>
                        </div>

                        {/* Address */}
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('customer.customer_address', 'Address')}
                            </legend>
                            <textarea
                                value={customerForm.data.address}
                                onChange={(e) => customerForm.setData("address", e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows="3"
                                placeholder={t('customer.customer_address_placeholder', 'Enter full address')}
                            />
                            {customerForm.errors.address && (
                                <div className="text-red-500 text-sm mt-1">
                                    {customerForm.errors.address}
                                </div>
                            )}
                        </fieldset>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={customerForm.processing}
                                className="btn btn-primary flex-1"
                            >
                                {customerForm.processing 
                                    ? t('customer.saving', 'Saving...')
                                    : customerForm.data.id 
                                        ? t('customer.update_customer', 'Update Customer')
                                        : t('customer.add_customer', 'Add Customer')
                                }
                            </button>
                            <button
                                type="button"
                                onClick={modelClose}
                                className="btn btn-ghost"
                            >
                                {t('customer.cancel', 'Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    );
}