import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Edit, Plus, Trash2, Frown, Warehouse as WarehouseIcon, Eye } from "lucide-react";

export default function WarehouseList({ warehouses, filters }) {
    const { auth } = usePage().props;

    const searchForm = useForm({
        search: filters.search || "",
    });

    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};
        router.get(route("warehouse.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this warehouse?")) {
            router.delete(route("warehouse.destroy", id));
        }
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Warehouse Management"
                subtitle="Manage your warehouses and inventory"
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder="Search warehouses..."
                        className="input input-sm"
                    />
                    {auth.role === "admin" && (
                        <Link
                            href={route("warehouse.create")}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add Warehouse
                        </Link>
                    )}
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {warehouses.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Contact</th>
                                <th>Address</th>
                                <th>Status</th>
                                <th>Total Products</th>
                                <th>Stock Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.data.map((warehouse, index) => (
                                <tr key={warehouse.id}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <WarehouseIcon size={16} className="text-primary" />
                                            {warehouse.name}
                                        </div>
                                    </td>
                                    <td className="font-mono">{warehouse.code}</td>
                                    <td>
                                        <div className="text-sm">
                                            <div>{warehouse.phone}</div>
                                            <div className="text-gray-500">{warehouse.email}</div>
                                        </div>
                                    </td>
                                    <td className="max-w-xs truncate">{warehouse.address}</td>
                                    <td>
                                        <span className={`badge badge-${warehouse.is_active ? 'success' : 'error'}`}>
                                            {warehouse.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{warehouse.total_products}</td>
                                    <td className="font-medium">₹{warehouse.total_stock_value?.toFixed(2) || '0.00'}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("warehouse.edit", warehouse.id)}
                                                className="btn btn-xs btn-warning"
                                            >
                                                <Edit size={12} /> Edit
                                            </Link>
                                            <Link
                                                href={route("warehouse.show", warehouse.id)}
                                                className="btn btn-xs btn-warning"
                                            >
                                                <Eye size={12} /> Show
                                            </Link>
                                            {auth.role === "admin" && (
                                                <button
                                                    onClick={() => handleDelete(warehouse.id)}
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
                        <h1 className="text-gray-500 text-sm">No warehouses found!</h1>
                        <Link
                            href={route("warehouse.create")}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add Warehouse
                        </Link>
                    </div>
                )}
            </div>

            <Pagination data={warehouses} />
        </div>
    );
}