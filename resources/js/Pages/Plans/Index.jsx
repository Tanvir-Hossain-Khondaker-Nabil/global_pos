import { Link, router, useForm } from "@inertiajs/react";
import { 
    Plus, 
    Trash2, 
    X, 
    Frown,
    Search,
    Filter,
    Edit,
    Eye,
    Tag,
    DollarSign,
    Calendar,
    Star
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Index({ plans }) {
    // Search and filter states
    const [search, setSearch] = useState("");
    const [planType, setPlanType] = useState("");
    const [initialized, setInitialized] = useState(false);

    // Handle search and filter changes
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }

        const timer = setTimeout(() => {
            router.get(route("plans.index"), {
                search: search || null,
                plan_type: planType || null,
            }, {
                preserveState: true,
                replace: true
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [search, planType]);

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        setPlanType("");
        router.get(route("plans.index"));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            '1': { label: 'Active', class: 'badge-success' },
            '2': { label: 'Inactive', class: 'badge-error' },
        };
        
        return statusMap[status] || { label: status, class: 'badge-warning' };
    };

    // Get plan type badge
    const getPlanTypeBadge = (type) => {
        const typeMap = {
            '1': { label: 'Free', class: 'badge-info' },
            '2': { label: 'Premium', class: 'badge-primary' },
        };
        
        return typeMap[type] || { label: type, class: 'badge-neutral' };
    };

    return (
        <div className="bg-white rounded-box p-5">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Plans Management</h1>
                    <p className="text-gray-600 mt-1">Manage your subscription plans and pricing</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route("plans.create")}
                        className="btn btn-primary btn-sm"
                    >
                        <Plus size={15} /> Create New Plan
                    </Link>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    {/* Search Input */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Plans
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by plan name, description..."
                                className="input input-bordered w-full pl-10"
                            />
                        </div>
                    </div>

                    {/* Plan Type Filter */}
                    <div className="w-full lg:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plan Type
                        </label>
                        <select
                            value={planType}
                            onChange={(e) => setPlanType(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">All Types</option>
                            <option value="1">Free</option>
                            <option value="2">Premium</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    {(search || planType) && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-error btn-sm"
                        >
                            <X size={15} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Plans Table */}
            <div className="overflow-x-auto">
                {plans.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="text-center">SL</th>
                                <th>Plan Name</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Validity</th>
                                <th>Features</th>
                                <th>Total Sales</th>
                                <th>Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.data.map((plan, index) => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="text-center">
                                        {plans.from + index}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">{plan.name}</p>
                                                {plan.description && (
                                                    <p className="text-xs text-gray-500 truncate max-w-xs">
                                                        {plan.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getPlanTypeBadge(plan.plan_type).class} badge-sm`}>
                                            {getPlanTypeBadge(plan.plan_type).label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={14} className="text-green-600" />
                                            <span className="font-semibold">
                                                {formatCurrency(plan.price)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} className="text-purple-600" />
                                            <span>{plan.validity} days</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="max-w-xs">
                                            {plan.features && plan.features.length > 0 ? (
                                                <div className="text-sm">
                                                    <span className="badge badge-outline badge-sm">
                                                        {plan.features.length} features
                                                    </span>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {plan.features.slice(0, 2).map((feature, i) => (
                                                            <div key={i} className="truncate">
                                                                • {feature}
                                                            </div>
                                                        ))}
                                                        {plan.features.length > 2 && (
                                                            <div className="text-primary">
                                                                +{plan.features.length - 2} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">No features</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="text-yellow-600" />
                                            <span>{plan.total_sell || 0}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(plan.status).class} badge-sm`}>
                                            {getStatusBadge(plan.status).label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Link
                                                href={route("plans.edit", plan.id)}
                                                className="btn btn-info btn-xs"
                                            >
                                                <Edit size={12} /> Edit
                                            </Link>
                                            <Link
                                                href={route("plans.show", plan.id)}
                                                className="btn btn-primary btn-xs"
                                            >
                                                <Eye size={12} /> View
                                            </Link>
                                            <Link
                                                href={route("plans.destroy", plan.id)}
                                                method="delete"
                                                as="button"
                                                onClick={(e) => {
                                                    if (!confirm("Are you sure you want to delete this plan?")) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="btn btn-error btn-xs"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">No plans found!</h1>
                        <p className="text-gray-400 text-sm mb-4">
                            {search || planType ? "Try adjusting your search or filters" : "Get started by creating your first plan"}
                        </p>
                        <Link
                            href={route("plans.create")}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Create New Plan
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {plans.data.length > 0 && (
                <div className="mt-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {plans.from} to {plans.to} of {plans.total} entries
                        </div>
                        
                        {/* Custom Pagination Component */}
                        <div className="join">
                            {/* Previous Button */}
                            {plans.links.prev && (
                                <Link
                                    href={plans.links.prev}
                                    className="join-item btn btn-sm"
                                >
                                    «
                                </Link>
                            )}
                            
                            {/* Page Numbers */}
                            {plans.links && plans.links.links && plans.links.links.slice(1, -1).map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`join-item btn btn-sm ${link.active ? 'btn-primary' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                            
                            {/* Next Button */}
                            {plans.links.next && (
                                <Link
                                    href={plans.links.next}
                                    className="join-item btn btn-sm"
                                >
                                    »
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {plans.data.length > 0 && (
                <div className="border-t border-gray-200 p-5 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Plans Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Tag className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Total Plans</p>
                                    <p className="text-xl font-bold text-blue-900">{plans.total}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-green-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Active Plans</p>
                                    <p className="text-xl font-bold text-green-900">
                                        {plans.data.filter(plan => plan.status === '1' || plan.status === 'active').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Star className="text-purple-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-purple-800">Total Sales</p>
                                    <p className="text-xl font-bold text-purple-900">
                                        {plans.data.reduce((sum, plan) => sum + (parseInt(plan.total_sell) || 0), 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <Filter className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">Premium Plans</p>
                                    <p className="text-xl font-bold text-orange-900">
                                        {plans.data.filter(plan => 
                                            plan.plan_type === '2' || 
                                            plan.plan_type === 'premium' || 
                                            plan.plan_type === 'enterprise'
                                        ).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}