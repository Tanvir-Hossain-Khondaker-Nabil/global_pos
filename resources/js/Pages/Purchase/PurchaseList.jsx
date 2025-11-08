import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Plus, Trash2, Frown, Calendar, User, Warehouse, DollarSign, Package, Shield } from "lucide-react";

export default function PurchaseList({ purchases, filters, isShadowUser }) {
    const { auth } = usePage().props;

    const searchForm = useForm({
        search: filters.search || "",
        status: filters.status || "",
        date: filters.date || "",
    });

    const handleFilter = (field, value) => {
        searchForm.setData(field, value);
        
        const queryString = {};
        if (searchForm.data.search) queryString.search = searchForm.data.search;
        if (searchForm.data.status) queryString.status = searchForm.data.status;
        if (searchForm.data.date) queryString.date = searchForm.data.date;

        router.get(route("purchase.list"), queryString, {
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

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={isShadowUser ? "Purchase Management" : "Purchase Management"}
                subtitle={isShadowUser ? "View shadow purchase data" : "Manage your product purchases"}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <input
                            type="search"
                            onChange={(e) => handleFilter('search', e.target.value)}
                            value={searchForm.data.search}
                            placeholder="Search purchases..."
                            className="input input-sm input-bordered"
                        />
                        <select
                            onChange={(e) => handleFilter('status', e.target.value)}
                            value={searchForm.data.status}
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
                            value={searchForm.data.date}
                            className="input input-sm input-bordered"
                        />
                    </div>
                    {auth.role === "admin" && (
                        <Link
                            href={route("purchase.create")}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> New Purchase
                        </Link>
                    )}
                </div>
            </PageHeader>


            <div className="overflow-x-auto">
                {purchases.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>Purchase Details</th>
                                <th>Supplier & Warehouse</th>
                                <th>Items & Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.data.map((purchase, index) => (
                                <tr key={purchase.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="font-mono font-bold text-primary">
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
                                            {purchase.paid_amount > 0 && (
                                                <div className="text-xs">
                                                    <div className="text-gray-600">
                                                        Paid: {formatCurrency(purchase.paid_amount)}
                                                    </div>
                                                    {purchase.due_amount > 0 && (
                                                        <div className="text-orange-600">
                                                            Due: {formatCurrency(purchase.due_amount)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                        <h1 className="text-gray-500 text-lg font-medium">No purchases found!</h1>
                        <p className="text-gray-400 text-sm">
                            {isShadowUser ? "No shadow purchases available" : "Get started by creating your first purchase"}
                        </p>
                        {!isShadowUser && auth.role === "admin" && (
                            <Link
                                href={route("purchase.create")}
                                className="btn btn-primary btn-sm mt-2"
                            >
                                <Plus size={15} /> Create Purchase
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <Pagination data={purchases} />
        </div>
    );
}