import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Plus, Trash2, Frown, Calendar, User, Warehouse } from "lucide-react";

export default function PurchaseList({ purchases, filters }) {
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

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Purchase Management"
                subtitle="Manage your product purchases"
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={(e) => handleFilter('search', e.target.value)}
                        value={searchForm.data.search}
                        placeholder="Search purchases..."
                        className="input input-sm"
                    />
                    <select
                        onChange={(e) => handleFilter('status', e.target.value)}
                        value={searchForm.data.status}
                        className="select select-sm"
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
                        className="input input-sm"
                    />
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
                        <thead className="bg-primary text-white">
                            <tr>
                                <th>#</th>
                                <th>Purchase No</th>
                                <th>Supplier</th>
                                <th>Warehouse</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.data.map((purchase, index) => (
                                <tr key={purchase.id}>
                                    <th>{index + 1}</th>
                                    <td className="font-mono">{purchase.purchase_no}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <User size={14} />
                                            {purchase.supplier.name}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Warehouse size={14} />
                                            {purchase.warehouse.name}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {formatDate(purchase.purchase_date)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm">
                                            {purchase.items.length} items
                                        </div>
                                    </td>
                                    <td className="font-bold">₹{purchase.total_amount}</td>
                                    <td>
                                        <span className={`badge badge-${purchase.status_color}`}>
                                            {purchase.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("purchase.show", purchase.id)}
                                                className="btn btn-xs btn-info"
                                            >
                                                <Eye size={12} /> View
                                            </Link>
                                            {auth.role === "admin" && (
                                                <button
                                                    onClick={() => handleDelete(purchase.id)}
                                                    className="btn btn-xs btn-error"
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
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">No purchases found!</h1>
                        <Link
                            href={route("purchase.create")}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Create Purchase
                        </Link>
                    </div>
                )}
            </div>

            <Pagination data={purchases} />
        </div>
    );
}