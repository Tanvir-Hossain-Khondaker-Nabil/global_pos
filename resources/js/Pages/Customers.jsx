import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { Eye, Frown, Pen, Plus, Trash2, X, Mail, CheckCircle, XCircle } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";

export default function Customers({ customers, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProccesing, setEditProccesing] = useState(false);

    // model close handle
    const modelClose = () => {
        userForm.reset();
        setModel(!model);
    };

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};

        router.get(route("customer.index"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true, 
        });
    };

    // handle edit
    const userForm = useForm({
        id: "",
        customer_name: "",
        phone: "",
        address: "",
        email: "",
        advance_amount: "0",
        due_amount: "0",
        is_active: true
    });

    const handleUserCreateForm = (e) => {
        e.preventDefault();

        if (userForm.data.id) {
            userForm.put(route("customer.update", userForm.data.id), {
                onSuccess: () => {
                    userForm.reset();
                    setModel(!model);
                },
                onError: (errors) => {
                    console.log(errors);
                }
            });
        } else {
            userForm.post(route("customer.store"), {
                onSuccess: () => {
                    userForm.reset();
                    setModel(!model);
                },
                onError: (errors) => {
                    console.log(errors);
                }
            });
        }
    };

    // handle user update
    const userEdithandle = (id) => {
        setEditProccesing(true);
        axios.get(route("customer.edit", { id: id })).then((res) => {
            const data = res.data.data;
            userForm.setData("id", data.id);
            userForm.setData("customer_name", data.customer_name);
            userForm.setData("phone", data.phone);
            userForm.setData("address", data.address);
            userForm.setData("email", data.email || "");
            userForm.setData("advance_amount", data.advance_amount || "0");
            userForm.setData("due_amount", data.due_amount || "0");
            userForm.setData("is_active", data.is_active || true);
            setModel(true);
        }).catch(error => {
            console.error("Error fetching customer:", error);
        }).finally(() => {
            setEditProccesing(false);
        });
    };

    // Calculate due amount from sales
    const calculateDueAmount = (sales) => {
        if (!sales || sales.length === 0) return 0;
        return sales.reduce((total, sale) => {
            return total + (parseFloat(sale.due_amount) || 0);
        }, 0);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('customer.title', 'Customer list')}
                subtitle={t('customer.subtitle', 'Manage your all customer from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('customer.search_placeholder', 'Search by name, phone, email...')}
                        className="input input-sm input-bordered w-64"
                    />
                    <button
                        onClick={() => {
                            userForm.reset();
                            setModel(true);
                        }}
                        className="btn btn-primary btn-sm"
                    >
                        <Plus size={15} /> {t('customer.add_new', 'Add new')}
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
                                <th></th>
                                <th>{t('customer.name', 'Name')}</th>
                                <th>{t('customer.phone', 'Phone')}</th>
                                <th>{t('customer.address', 'Address')}</th>
                                <th>{t('customer.advance_amount', 'Advance Amount')}</th>
                                <th>{t('customer.due_amount', 'Due Amount')}</th>
                                {/* <th>{t('customer.status', 'Status')}</th> */}
                                <th>{t('customer.join_at', 'Join at')}</th>
                                <th>{t('customer.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((user, index) => (
                                <tr key={index} className={user.is_active ? '' : 'bg-gray-50'}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="font-medium">{user.customer_name}</div>
                                        {!user.is_active && (
                                            <span className="text-xs text-gray-500">{t('customer.inactive', 'Inactive')}</span>
                                        )}
                                    </td>
                                    <td>{user.phone}</td>
                                    <td className="max-w-xs truncate">{user.address || '-'}</td>
                                    <td className="font-medium text-green-600">
                                        {formatCurrency(user.advance_amount || 0)}
                                    </td>
                                    <td className="font-medium text-red-600">
                                        {formatCurrency(calculateDueAmount(user.sales) || 0)}
                                    </td>
                                    {/* <td>
                                        {user.is_active ? (
                                            <span className="badge badge-success badge-sm flex items-center gap-1">
                                                <CheckCircle size={12} />
                                                {t('customer.active', 'Active')}
                                            </span>
                                        ) : (
                                            <span className="badge badge-error badge-sm flex items-center gap-1">
                                                <XCircle size={12} />
                                                {t('customer.inactive', 'Inactive')}
                                            </span>
                                        )}
                                    </td> */}
                                    <td className="text-sm text-gray-600">{user.created_at}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("customer.show", { id: user.id })}
                                                className="btn btn-xs btn-info"
                                            >
                                                <Eye size={12} /> 
                                            </Link>
                                            {auth.role === "admin" && (
                                                <>
                                                    <button
                                                        disabled={editProccesing}
                                                        onClick={() => userEdithandle(user.id)}
                                                        className="btn btn-xs btn-warning"
                                                    >
                                                        <Pen size={12} /> 
                                                    </button>
                                                    <Link
                                                        href={route("customer.del", { id: user.id })}
                                                        onClick={(e) => {
                                                            if (!confirm(t('customer.delete_confirmation', 'Are you sure you want to delete this customer?'))) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={12} /> 
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            {t('customer.data_not_found', 'Data not found!')}
                        </h1>
                        <button
                            onClick={() => setModel(!model)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> {t('customer.add_new', 'Add new')}
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={customers} />

            {/* customer add && update model */}
            <dialog className="modal" open={model}>
                <div className="modal-box max-w-2xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            {userForm.data.id 
                                ? t('customer.edit_customer', 'Edit Customer') 
                                : t('customer.add_customer', 'Add new customer')
                            }
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <form onSubmit={handleUserCreateForm} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        {t('customer.customer_name', 'Name')}
                                        <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={userForm.data.customer_name}
                                    onChange={(e) => userForm.setData("customer_name", e.target.value)}
                                    className="input input-bordered"
                                    placeholder={t('customer.customer_name', 'Type here')}
                                    required
                                />
                                {userForm.errors.customer_name && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {userForm.errors.customer_name}
                                    </div>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        {t('customer.customer_phone', 'Phone')}
                                        <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <input
                                    type="tel"
                                    value={userForm.data.phone}
                                    onChange={(e) => userForm.setData("phone", e.target.value)}
                                    className="input input-bordered"
                                    placeholder={t('customer.customer_phone', 'Type here')}
                                    required
                                />
                                {userForm.errors.phone && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {userForm.errors.phone}
                                    </div>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        {t('customer.advance_amount', 'Advance Amount')}
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={userForm.data.advance_amount}
                                    onChange={(e) => userForm.setData("advance_amount", e.target.value)}
                                    className="input input-bordered"
                                    placeholder={t('customer.advance_amount_placeholder', '0.00')}
                                />
                                {userForm.errors.advance_amount && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {userForm.errors.advance_amount}
                                    </div>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">
                                        {t('customer.due_amount', 'Due Amount')}
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={userForm.data.due_amount}
                                    onChange={(e) => userForm.setData("due_amount", e.target.value)}
                                    className="input input-bordered"
                                    placeholder={t('customer.due_amount_placeholder', '0.00')}
                                />
                                {userForm.errors.due_amount && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {userForm.errors.due_amount}
                                    </div>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={userForm.data.is_active}
                                        onChange={(e) => userForm.setData("is_active", e.target.checked)}
                                        className="checkbox checkbox-primary"
                                    />
                                    <span className="label-text">
                                        {t('customer.is_active', 'Active Customer')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    {t('customer.customer_address', 'Address')}
                                </span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                value={userForm.data.address}
                                onChange={(e) => userForm.setData("address", e.target.value)}
                                placeholder={t('customer.customer_address', 'Type here')}
                                rows="3"
                            ></textarea>
                            {userForm.errors.address && (
                                <div className="text-red-500 text-sm mt-1">
                                    {userForm.errors.address}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={modelClose}
                                className="btn btn-ghost"
                            >
                                {t('customer.cancel', 'Cancel')}
                            </button>
                            <button
                                disabled={userForm.processing}
                                className="btn btn-primary"
                                type="submit"
                            >
                                {userForm.processing 
                                    ? t('customer.saving', 'Saving...') 
                                    : userForm.data.id 
                                        ? t('customer.update', 'Update Customer')
                                        : t('customer.add_now', 'Add Customer')
                                }
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={modelClose}>close</button>
                </form>
            </dialog>
        </div>
    );
}