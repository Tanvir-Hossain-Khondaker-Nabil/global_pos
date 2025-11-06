import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { Eye, Frown, Pen, Plus, Trash2, X } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";

export default function Customers({ customers, filters }) {
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

        router.get(route("customer.index"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true, // prevents pushing new history entry on every keystroke
        });
    };

    // handle edit
    const userForm = useForm({
        id: "",
        customer_name: "",
        phone: "",
        address: "",
    });
    const handleUserCreateForm = (e) => {
        e.preventDefault();

        userForm.post(route("customer.store"), {
            onSuccess: () => {
                userForm.reset();
                setModel(!model);
            },
        });
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
            setModel(true);
        });
        setEditProccesing(false);
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Customer list"
                subtitle="Manage your all customer from here."
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder="Search.."
                        className="input input-sm"
                    />
                    <button
                        onClick={() => setModel(!model)}
                        className="btn btn-primary btn-sm"
                    >
                        <Plus size={15} /> Add new
                    </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {customers.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th></th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Address</th>
                                <th>Join at</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.map((user, index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>{user.customer_name}</td>
                                    <td>{user.phone}</td>
                                    <td>{user.address}</td>
                                    <td>{user.join_at}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {auth.role === "admin" && (
                                                <>
                                                    <button
                                                        disabled={
                                                            editProccesing
                                                        }
                                                        onClick={() =>
                                                            userEdithandle(
                                                                user.id
                                                            )
                                                        }
                                                        className="btn btn-xs btn-info"
                                                    >
                                                        <Pen size={10} /> Edit
                                                    </button>
                                                    <Link
                                                        href={route(
                                                            "customer.del",
                                                            {
                                                                id: user.id,
                                                            }
                                                        )}
                                                        onClick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    "Are you sure you want to delete this customer?"
                                                                )
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={10} />{" "}
                                                        Delete
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
            <Pagination data={customers} />

            {/* user add && update model */}
            <dialog className="modal" open={model}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            Add new customer
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
                                value={userForm.data.customer_name}
                                onChange={(e) =>
                                    userForm.setData(
                                        "customer_name",
                                        e.target.value
                                    )
                                }
                                className="input"
                                placeholder="Type here"
                            />
                            {userForm.errors.customer_name && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.customer_name}
                                </div>
                            )}
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Phone</legend>
                            <input
                                type="tel"
                                value={userForm.data.phone}
                                onChange={(e) =>
                                    userForm.setData("phone", e.target.value)
                                }
                                className="input"
                                placeholder="Type here"
                            />
                            {userForm.errors.phone && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.phone}
                                </div>
                            )}
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Address</legend>
                            <textarea
                                className="textarea"
                                value={userForm.data.address}
                                onChange={(e) =>
                                    userForm.setData("address", e.target.value)
                                }
                            ></textarea>
                            {userForm.errors.address && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.address}
                                </div>
                            )}
                        </fieldset>
                        <button
                            disabled={userForm.processing}
                            className="btn btn-primary"
                            type="submit"
                        >
                            Add now
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
}
