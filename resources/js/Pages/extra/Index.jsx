import { Link, router, useForm, usePage } from "@inertiajs/react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { useEffect, useState } from "react";
import { Frown, Trash2, X, Plus } from "lucide-react";

export default function Index({ extracashdata, query }) {
    // model
    const [model, setModel] = useState(false);

    // search
    const [date, setDate] = useState(query || "");
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }
        if (date !== "") {
            router.get(route("extra.cash.all", { date }));
        }
    }, [date]);

    // form
    const { data, setData, errors, processing, reset, post } = useForm({
        date: new Date().toLocaleDateString('sv-SE'),
        amount: "",
    });
    const formSubmit = (e) => {
        e.preventDefault();
        post(route("extra.cash.post"), {
            onSuccess: () => {
                modelClose();
            },
        });
    };

    // close add model
    const modelClose = () => {
        reset();
        setModel(!model);
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Extra cash list"
                subtitle="Manage your all extra cash from here."
            >
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onBlur={() => {
                            if (date) {
                                router.get(route("extra.cash.all", { date }));
                            }
                        }}
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
                {extracashdata.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th></th>
                                <th>Created by</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extracashdata.data.map((user, index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <p>
                                            <strong>Name: </strong>{" "}
                                            {user?.createdby?.name}
                                        </p>
                                        <p>
                                            <strong>Email: </strong>{" "}
                                            {user?.createdby?.email}
                                        </p>
                                    </td>
                                    <td>{user.amount} Tk</td>
                                    <td>{user.date}</td>
                                    <td>
                                        <Link
                                            href={route("extra.cash.del", {
                                                id: user.id,
                                            })}
                                            onClick={(e) => {
                                                if (
                                                    !confirm(
                                                        "Are you sure you want to delete this?"
                                                    )
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="btn btn-xs btn-error"
                                        >
                                            <Trash2 size={10} /> Delete
                                        </Link>
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
            <Pagination data={data} />

            {/* add model */}
            <dialog className="modal" open={model}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            Add extra cash
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <form onSubmit={formSubmit} className="space-y-2">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Date*</legend>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) =>
                                    setData("date", e.target.value)
                                }
                                className="input"
                            />
                            {errors.date && (
                                <p className="label text-error">
                                    {errors.date}
                                </p>
                            )}
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Amount*</legend>
                            <input
                                type="number"
                                step={0.01}
                                min={1}
                                value={data.amount}
                                onChange={(e) =>
                                    setData("amount", e.target.value)
                                }
                                className="input"
                            />
                            {errors.amount && (
                                <p className="label text-error">
                                    {errors.amount}
                                </p>
                            )}
                        </fieldset>

                        <button
                            disabled={processing}
                            className="btn btn-sm btn-primary"
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
