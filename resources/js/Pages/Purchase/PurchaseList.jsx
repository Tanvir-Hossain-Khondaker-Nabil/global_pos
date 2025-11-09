import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Plus, Trash2, Frown, Calendar, User, Warehouse, DollarSign, Package, Shield, Search, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function PurchaseList({ purchases, filters, isShadowUser }) {
    const { auth } = usePage().props;

    const [localFilters, setLocalFilters] = useState({
        search: filters.search || "",
        status: filters.status || "",
        date: filters.date || "",
    });

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters({
            search: filters.search || "",
            status: filters.status || "",
            date: filters.date || "",
        });
    }, [filters]);

    const handleFilter = (field, value) => {
        const newFilters = {
            ...localFilters,
            [field]: value
        };
        setLocalFilters(newFilters);

        // Remove empty filters
        const queryString = {};
        if (newFilters.search) queryString.search = newFilters.search;
        if (newFilters.status) queryString.status = newFilters.status;
        if (newFilters.date) queryString.date = newFilters.date;

        router.get(route("purchase.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({
            search: "",
            status: "",
            date: "",
        });
        router.get(route("purchase.list"), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this purchase? This will reverse the stock.")) {
            router.delete(route("purchase.destroy", id));
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount);
    };

    const hasActiveFilters = localFilters.search || localFilters.status || localFilters.date;

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={isShadowUser ? "Purchase Management" : "Purchase Management"}
                subtitle={isShadowUser ? "View purchase data" : "Manage your product purchases"}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                onChange={(e) => handleFilter('search', e.target.value)}
                                value={localFilters.search}
                                style={{ padding: '0 0 0 20px' , width: '150px' }}
                                placeholder="Search purchases..."
                                className="input input-sm input-bordered pl-9"
                            />
                        </div>
                        <select
                            onChange={(e) => handleFilter('status', e.target.value)}
                            value={localFilters.status}
                            className="select select-sm select-bordered"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            onChange={(e) => handleFilter('date', e.target.value)}
                            value={localFilters.date}
                            className="input input-sm input-bordered"
                        />
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="btn btn-sm btn-ghost"
                                title="Clear all filters"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {auth.role === "admin" && (
                        <Link
                            href={route("purchase.create")}
                            className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                        >
                            <Plus size={15} /> 
                            {isShadowUser ? 'New Purchase' : 'New Purchase'}
                        </Link>
                    )}
                </div>
            </PageHeader>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mb-4 p-3 bg-base-200 rounded-box">
                    <div className="flex items-center gap-2 text-sm">
                        <Filter size={14} className="text-gray-500" />
                        <span className="font-medium">Active Filters:</span>
                        {localFilters.search && (
                            <span className="badge badge-outline">
                                Search: "{localFilters.search}"
                            </span>
                        )}
                        {localFilters.status && (
                            <span className="badge badge-outline">
                                Status: {localFilters.status}
                            </span>
                        )}
                        {localFilters.date && (
                            <span className="badge badge-outline">
                                Date: {localFilters.date}
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="btn btn-xs btn-ghost ml-auto"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                {purchases.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>Purchase Details</th>
                                <th>Supplier & Warehouse</th>
                                <th>Items & Amount</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.data.map((purchase, index) => (
                                <tr key={purchase.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="font-mono font-bold">
                                                {purchase.purchase_no}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} />
                                                {formatDate(purchase.purchase_date)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-blue-600" />
                                                <div>
                                                    <div className="font-medium">{purchase.supplier.name}</div>
                                                    <div className="text-xs text-gray-500">{purchase.supplier.company}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Warehouse size={14} className="text-green-600" />
                                                <div>
                                                    <div className="font-medium">{purchase.warehouse.name}</div>
                                                    <div className="text-xs text-gray-500">{purchase.warehouse.code}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-purple-600" />
                                                <span className="font-medium">
                                                    {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({purchase.items.length} items)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={14} className={isShadowUser ? "text-warning" : "text-green-600"} />
                                                <span className="font-bold">
                                                    {formatCurrency(purchase.total_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`badge badge-${purchase.status_color} badge-sm`}>
                                                {purchase.status}
                                            </span>
                                            <div className="text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Paid:</span>
                                                    <span className="text-green-600">
                                                        {formatCurrency(purchase.paid_amount)}
                                                    </span>
                                                </div>
                                                {purchase.due_amount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Due:</span>
                                                        <span className="text-orange-600">
                                                            {formatCurrency(purchase.due_amount)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`badge badge-xs ${
                                                    purchase.payment_status === 'paid' ? 'badge-success' :
                                                    purchase.payment_status === 'partial' ? 'badge-warning' : 'badge-error'
                                                }`}>
                                                    {purchase.payment_status}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                href={route("purchase.show", purchase.id)}
                                                className="btn btn-xs btn-info btn-outline"
                                            >
                                                <Eye size={12} /> Details
                                            </Link>
                                            {auth.role === "admin" && purchase.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleDelete(purchase.id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {hasActiveFilters ? "No purchases match your filters" : 
                             isShadowUser ? "No purchases found!" : "No purchases found!"}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {hasActiveFilters ? "Try adjusting your search criteria" :
                             isShadowUser ? "Get started by creating your first purchase" : 
                             "Get started by creating your first purchase"}
                        </p>
                        <div className="flex gap-2 mt-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Clear Filters
                                </button>
                            )}
                            {auth.role === "admin" && (
                                <Link
                                    href={route("purchase.create")}
                                    className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                                >
                                    <Plus size={15} /> 
                                    {isShadowUser ? 'Create Purchase' : 'Create Purchase'}
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Pagination data={purchases} />
        </div>
    );
}