import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Edit, Plus, Trash2, Frown, Warehouse as WarehouseIcon, Eye, Shield } from "lucide-react";

export default function WarehouseList({ warehouses, filters, isShadowUser }) {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={isShadowUser ? "Warehouse Management" : "Warehouse Management"}
                subtitle={isShadowUser ? "Manage shadow warehouses and inventory" : "Manage your warehouses and inventory"}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <input
                            type="search"
                            onChange={handleSearch}
                            value={searchForm.data.search}
                            placeholder="Search warehouses..."
                            className="input input-sm input-bordered"
                        />
                        {auth.role === "admin" && (
                            <Link
                                href={route("warehouse.create")}
                                className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                            >
                                <Plus size={15} /> 
                                {isShadowUser ? 'Add Warehouse' : 'Add Warehouse'}
                            </Link>
                        )}
                    </div>
                </div>
            </PageHeader>


            <div className="overflow-x-auto">
                {warehouses.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                            <tr>
                                <th className="bg-opacity-20">#</th>
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
                                <tr key={warehouse.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <WarehouseIcon size={16} className={isShadowUser ? "text-warning" : "text-primary"} />
                                            <div>
                                                <div className="font-medium">{warehouse.name}</div>
                                            </div>
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
                                    <td className="font-medium">
                                        <div className="flex items-center gap-1">
                                            {formatCurrency(warehouse.total_stock_value)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("warehouse.edit", warehouse.id)}
                                                className="btn btn-xs btn-warning btn-outline"
                                            >
                                                <Edit size={12} /> Edit
                                            </Link>
                                            <Link
                                                href={route("warehouse.show", warehouse.id)}
                                                className="btn btn-xs btn-info btn-outline"
                                            >
                                                <Eye size={12} /> Stock
                                            </Link>
                                            {auth.role === "admin" && (
                                                <button
                                                    onClick={() => handleDelete(warehouse.id)}
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
                            {isShadowUser ? "No shadow warehouses found!" : "No warehouses found!"}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {isShadowUser ? "Get started by creating your first shadow warehouse" : "Get started by creating your first warehouse"}
                        </p>
                        {auth.role === "admin" && (
                            <Link
                                href={route("warehouse.create")}
                                className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'btn-primary'} mt-2`}
                            >
                                <Plus size={15} /> 
                                {isShadowUser ? 'Add Warehouse' : 'Add Warehouse'}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <Pagination data={warehouses} />
        </div>
    );
}