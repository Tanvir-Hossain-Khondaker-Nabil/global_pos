import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Plus, Printer, Trash2, Eye, Search, Check, X } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";

export default function SalesIndex({ sales, filters, isShadowUser }) {
    const { auth } = usePage().props;

    // Handle search and filters
    const filterForm = useForm({
        search: filters.search || "",
        status: filters.status || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
    });

    const handleFilter = () => {
        const queryParams = {};
        
        // Only add non-empty values to query params
        if (filterForm.data.search.trim()) queryParams.search = filterForm.data.search.trim();
        if (filterForm.data.status) queryParams.status = filterForm.data.status;
        if (filterForm.data.date_from) queryParams.date_from = filterForm.data.date_from;
        if (filterForm.data.date_to) queryParams.date_to = filterForm.data.date_to;

        router.get(route("salesPos.index",'pos'), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const clearFilters = () => {
        filterForm.setData({
            search: "",
            status: "",
            date_from: "",
            date_to: "",
        });
        setTimeout(() => {
            router.get(route("salesPos.index" , 'pos'), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }, 0);
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

    const calculateTotals = () => {
        const salesData = sales.data || [];
        
        const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.grand_total || 0), 0);
        const totalPaid = salesData.reduce((sum, sale) => sum + parseFloat(sale.paid_amount || 0), 0);
        const totalDue = salesData.reduce((sum, sale) => sum + parseFloat(sale.due_amount || 0), 0);

        return {
            totalRevenue,
            totalPaid,
            totalDue,
            totalSales: salesData.length
        };
    };

    const totals = calculateTotals();

    const hasActiveFilters = filterForm.data.search || filterForm.data.status || filterForm.data.date_from || filterForm.data.date_to;

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title= {isShadowUser ? "Sales History (POS)" : "Sales History (POS)"}
                subtitle={isShadowUser ? "View sales data" : "Manage your product sales"}
            >
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="join">
                        <input
                            type="search"
                            value={filterForm.data.search}
                            onChange={(e) => filterForm.setData("search", e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Search invoice or customer..."
                            className="input input-sm input-bordered join-item"
                        />
                      
                    </div>
                    
                    <select
                        value={filterForm.data.status}
                        onChange={(e) => filterForm.setData("status", e.target.value)}
                        onKeyPress={handleKeyPress}
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
                        onChange={(e) => filterForm.setData("date_from", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="input input-sm input-bordered"
                    />
                    
                    <input
                        type="date"
                        value={filterForm.data.date_to}
                        onChange={(e) => filterForm.setData("date_to", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="input input-sm input-bordered"
                    />
                    
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-sm btn-ghost"
                        >
                            Clear Filters
                        </button>
                    )}

                    <button
                        onClick={handleFilter}
                        className="btn btn-sm bg-[#1e4d2b] text-white join-item"
                    >
                        <Search size={16} />
                        Search
                    </button>
                    
                    <Link
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                        href={route("sales.add")}
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
                            <thead className={`${isShadowUser ? 'bg-warning' : 'bg-[#1e4d2b] text-white'} text-white`}>
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
                                                sale.status === 'paid' 
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
                                                    href={route("salesPrint.show", { sale: sale.id, print: 'print' })}
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Eye size={13} />
                                                    View
                                                </Link>

                                                {sale.shadow_type == 'shadow' && !isShadowUser && (
                                                    <>
                                                        <Link
                                                            href={route("sales.edit", { sale: sale.id })}
                                                            className="btn btn-xs btn-success flex items-center gap-1"
                                                        >
                                                            <Check size={13} /> Accepted
                                                        </Link>

                                                        <Link
                                                            href={route("sales.rejected", { sale: sale.id })}
                                                            method="delete"
                                                            as="button"
                                                            onClick={(e) => {
                                                                if (!confirm("Are you sure you want to reject this order?")) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className="btn btn-xs btn-error"
                                                        >
                                                            <X size={13} />
                                                            Rejected
                                                        </Link>

                                                    </>

                                                )}

                                                {sale.shadow_type == 'general' && (
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
                                {hasActiveFilters
                                    ? "Try adjusting your search filters to find what you're looking for."
                                    : "Get started by creating your first sale record."
                                }
                            </p>
                            {!hasActiveFilters && (
                                <Link
                                    className="btn bg-[#1e4d2b] text-white btn-sm mt-2"
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
                                {totals.totalSales}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-xl font-bold text-success">
                                {formatCurrency(totals.totalRevenue)} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-xl font-bold text-info">
                                {formatCurrency(totals.totalPaid)} Tk
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Due</p>
                            <p className="text-xl font-bold text-error">
                                {formatCurrency(totals.totalDue)} Tk
                            </p>
                        </div>
                    </div>
                )}

                {sales.data.length > 0 && <Pagination data={sales} />}
            </div>
        </div>
    );
}