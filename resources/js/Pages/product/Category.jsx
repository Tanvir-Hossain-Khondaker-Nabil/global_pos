import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Frown, Pen, Plus, Trash2, X, Package, BarChart3 } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";

export default function Category({ category, filters }) {
    const { auth } = usePage().props;
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

        router.get(route("category.view"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // handle edit
    const userForm = useForm({
        id: "",
        name: "",
    });
    const handleUserCreateForm = (e) => {
        e.preventDefault();

        userForm.post(route("category.store"), {
            onSuccess: () => {
                userForm.reset();
                setModel(!model);
            },
        });
    };

    // handle user update
    const userEdithandle = (id) => {
        setEditProccesing(true);
        axios.get(route("category.edit", { id: id })).then((res) => {
            const data = res.data.data;
            userForm.setData("id", data.id);
            userForm.setData("name", data.name);
            setModel(true);
        });
        setEditProccesing(false);
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Category list"
                subtitle="Manage your all category from here."
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder="Search.."
                        className="input input-sm"
                    />
                    {auth.role == "admin" && (
                        <button
                            onClick={() => setModel(!model)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add new
                        </button>
                    )}
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {category.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th></th>
                                <th>Name</th>
                                <th>Products</th>
                                <th>Join at</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.data.map((user, index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="font-medium">{user.name}</div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-blue-600" />
                                            <div>
                                                <div className="font-bold text-lg">{user.products_count || 0}</div>
                                                <div className="text-xs text-gray-500">products</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.join_at}</td>
                                    <td>
                                        {auth.role === "admin" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={editProccesing}
                                                    onClick={() =>
                                                        userEdithandle(user.id)
                                                    }
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Pen size={10} /> Edit
                                                </button>
                                                <Link
                                                    href={route(
                                                        "category.del",
                                                        {
                                                            id: user.id,
                                                        }
                                                    )}
                                                    onClick={(e) => {
                                                        if (
                                                            !confirm(
                                                                "Are you sure you want to delete this category?"
                                                            )
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={10} /> Delete
                                                </Link>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                No permission
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            Data not found!
                        </h1>
                        <button
                            onClick={() => setModel(!model)}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add new
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={category} />

            {/* user add && update model */}
            <dialog className="modal" open={model}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            {userForm.data.id ? "Update Category" : "Add new category"}
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <form onSubmit={handleUserCreateForm} className="space-y-2">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Name*</legend>
                            <input
                                type="text"
                                value={userForm.data.name}
                                onChange={(e) =>
                                    userForm.setData("name", e.target.value)
                                }
                                className="input"
                                placeholder="Type here"
                            />
                            {userForm.errors.name && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.name}
                                </div>
                            )}
                        </fieldset>
                        <button
                            disabled={userForm.processing}
                            className="btn btn-primary"
                            type="submit"
                        >
                            {userForm.data.id ? "Update Category" : "Add now"}
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
}