import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Plus, Printer, Trash2, Eye } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";

export default function SalesIndex({ sales, filters }) {
    const { auth } = usePage().props;

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
        status: filters.status || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
    });

    const handleFilter = (field, value) => {
        filterForm.setData(field, value);
        
        const queryString = {};
        if (filterForm.data.search) queryString.search = filterForm.data.search;
        if (filterForm.data.status) queryString.status = filterForm.data.status;
        if (filterForm.data.date_from) queryString.date_from = filterForm.data.date_from;
        if (filterForm.data.date_to) queryString.date_to = filterForm.data.date_to;

        router.get(route("sales.index"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        router.get(route("sales.index"));
    };

    // Calculate item counts for each sale
    const getTotalItems = (sale) => {
        return sale.items?.reduce((total, item) => total + item.quantity, 0) || 0;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Sales History"
                subtitle="Manage and view all your sales records"
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="search"
                        onChange={(e) => handleFilter("search", e.target.value)}
                        value={filterForm.data.search}
                        placeholder="Search invoice or customer..."
                        className="input input-sm input-bordered"
                    />
                    <select
                        value={filterForm.data.status}
                        onChange={(e) => handleFilter("status", e.target.value)}
                        className="select select-sm select-bordered"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                        type="date"
                        value={filterForm.data.date_from}
                        onChange={(e) => handleFilter("date_from", e.target.value)}
                        className="input input-sm input-bordered"
                    />
                    <input
                        type="date"
                        value={filterForm.data.date_to}
                        onChange={(e) => handleFilter("date_to", e.target.value)}
                        className="input input-sm input-bordered"
                    />
                    {(filterForm.data.search || filterForm.data.status || filterForm.data.date_from || filterForm.data.date_to) && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-sm btn-ghost"
                        >
                            Clear
                        </button>
                    )}
                    <Link
                        className="btn btn-primary btn-sm"
                        href={route("sales.create")}
                    >
                        <Plus size={16} />
                        New Sale
                    </Link>
                </div>
            </PageHeader>

            <div className="print:hidden">
                <div className="overflow-x-auto">
                    {sales.data.length > 0 ? (
                        <table className="table table-auto w-full">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Sub Total</th>
                                    <th>Grand Total</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((sale, index) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="font-mono font-semibold">
                                            {sale.invoice_no}
                                        </td>
                                        <td>
                                            <div>
                                                <p className="font-medium">
                                                    {sale.customer?.customer_name || "Walk-in Customer"}
                                                </p>
                                                {sale.customer?.phone && (
                                                    <p className="text-sm text-gray-500">
                                                        {sale.customer.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline">
                                                {getTotalItems(sale)}
                                            </span>
                                        </td>
                                        <td className="font-semibold">
                                            {formatCurrency(sale.sub_total)} Tk
                                        </td>
                                        <td className="font-semibold text-primary">
                                            {formatCurrency(sale.grand_total)} Tk
                                        </td>
                                        <td className="text-success font-semibold">
                                            {formatCurrency(sale.paid_amount)} Tk
                                        </td>
                                        <td className={`font-semibold ${
                                            sale.due_amount > 0 ? "text-error" : "text-success"
                                        }`}>
                                            {formatCurrency(sale.due_amount)} Tk
                                        </td>
                                        <td>
                                            <span className={`badge capitalize ${
                                                sale.status === 'completed' 
                                                    ? 'badge-success' 
                                                    : sale.status === 'cancelled'
                                                    ? 'badge-error'
                                                    : 'badge-warning'
                                            }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(sale.created_at).toLocaleString("en-GB", {
                                                timeZone: "Asia/Dhaka",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <Link
                                                    href={route("sales.show", { sale: sale.id })}
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Eye size={13} />
                                                    View
                                                </Link>
                                                {auth.role === "admin" && (
                                                    <Link
                                                        href={route("sales.destroy", { sale: sale.id })}
                                                        method="delete"
                                                        as="button"
                                                        onClick={(e) => {
                                                            if (!confirm("Are you sure you want to delete this sale?")) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                            <Frown size={32} className="text-gray-400" />
                            <h1 className="text-gray-500 text-lg font-medium">
                                No sales found!
                            </h1>
                            <p className="text-gray-400 text-sm text-center max-w-md">
                                {filterForm.data.search || filterForm.data.status 
                                    ? "Try adjusting your search filters to find what you're looking for."
                                    : "Get started by creating your first sale record."
                                }
                            </p>
                            {!filterForm.data.search && !filterForm.data.status && (
                                <Link
                                    className="btn btn-primary btn-sm mt-2"
                                    href={route("sales.create")}
                                >
                                    <Plus size={16} />
                                    Create First Sale
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {sales.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-box">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Sales</p>
                            <p className="text-xl font-bold text-primary">
                                {sales.data.length}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-xl font-bold text-success">
                                {formatCurrency(sales.data.reduce((sum, sale) => sum + sale.grand_total, 0))} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-xl font-bold text-info">
                                {formatCurrency(sales.data.reduce((sum, sale) => sum + sale.paid_amount, 0))} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Due</p>
                            <p className="text-xl font-bold text-error">
                                {formatCurrency(sales.data.reduce((sum, sale) => sum + sale.due_amount, 0))} Tk
                            </p>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {sales.data.length > 0 && <Pagination data={sales} />}
            </div>
        </div>
    );
}