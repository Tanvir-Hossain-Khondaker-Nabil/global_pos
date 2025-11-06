import { Link, router, useForm, usePage } from "@inertiajs/react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import {
    BanknoteX,
    Frown,
    HandCoins,
    Landmark,
    PiggyBank,
    Plus,
    Trash2,
    Wallet,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Index({
    todaysExpense,
    todaysExpenseTotal,
    extracashTotal,
    amount,
    query,
}) {
    // model
    const [model, setModel] = useState(false);

    // search
    const [startdate, setStartDate] = useState(query?.startdate || "");
    const [date, setDate] = useState(query?.date || "");
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }
        if (date !== "" || startdate !== "") {
            router.get(route("expenses.list", { startdate, date }));
        }
    }, [date, startdate]);

    // expense form
    const { setData, data, errors, processing, reset, post } = useForm({
        date: new Date().toLocaleDateString("sv-SE"),
        details: "",
        amount: "",
    });
    const formSubmit = (e) => {
        e.preventDefault();
        post(route("expenses.post"), {
            onSuccess: () => {
                reset();
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
                title="Expense list"
                subtitle="Manage your all expenses from here."
            >
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startdate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input input-sm"
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="input input-sm"
                    />
                    {((date && date !== "" && date !== null) ||
                        (startdate &&
                            startdate !== "" &&
                            startdate !== null)) && (
                        <button
                            onClick={() => router.visit(route("expenses.list"))}
                            className="btn btn-sm btn-error"
                        >
                            <X size={13} />
                        </button>
                    )}

                    <button
                        onClick={() => setModel(!model)}
                        className="btn btn-primary btn-sm"
                    >
                        <Plus size={15} /> Add new
                    </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {todaysExpense.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th></th>
                                <th>Created by</th>
                                <th>Details</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaysExpense.data.map((user, index) => (
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
                                    <td>{user?.details}</td>
                                    <td>{user.amount} Tk</td>
                                    <td>{user.date}</td>
                                    <td>
                                        <Link
                                            href={route("expenses.del", {
                                                id: user.id,
                                            })}
                                            onClick={(e) => {
                                                if (
                                                    !confirm(
                                                        "Are you sure you want to delete this expense?"
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
            <Pagination data={todaysExpense} />

            <div className="border-t h-auto border-gray-200 p-5 mt-5">
                <h1 className="text-base font-medium text-gray-500">
                    Today's summary
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:grid-cols-5 mt-4">
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-start gap-4">
                        <Landmark size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-medium text-neutral">
                                Total Banking
                            </p>
                            <h1 className="text-md font-bold mt-2">
                                {Number(amount?.totals?.bank).toFixed(2)} Tk
                            </h1>
                        </div>
                    </div>
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-start gap-4">
                        <Wallet size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-medium text-neutral">
                                Total Mobilebanking
                            </p>
                            <h1 className="text-md font-bold mt-2">
                                {Number(amount?.totals?.mobilebanking).toFixed(
                                    2
                                )}{" "}
                                Tk
                            </h1>
                        </div>
                    </div>
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-start gap-4">
                        <HandCoins size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-medium text-neutral">
                                Total Cash
                            </p>
                            <h1 className="text-md font-bold mt-2">
                                {Number(amount?.totals?.cash).toFixed(2)} Tk
                            </h1>
                        </div>
                    </div>
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-start gap-4">
                        <HandCoins size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-medium text-neutral">
                                Extra Cash
                            </p>
                            <h1 className="text-md font-bold mt-2">
                                {Number(extracashTotal).toFixed(2)} Tk
                            </h1>
                        </div>
                    </div>
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-start gap-4">
                        <BanknoteX size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-medium text-neutral">
                                Total Expense
                            </p>
                            <h1 className="text-md font-bold text-error mt-2">
                                {Number(todaysExpenseTotal).toFixed(2)} Tk
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2">
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-start gap-4">
                        <BanknoteX size={18} className="text-primary" />
                        <div>
                            <p className="text-sm font-medium text-neutral">
                                Total Sales
                            </p>
                            <h1 className="text-md font-bold text-primary mt-2">
                                {Number(amount?.grandTotal).toFixed(2)} Tk
                            </h1>
                        </div>
                    </div>
                    <div className="border border-dashed border-primary rounded-box p-5 flex items-center justify-end gap-4">
                        <p className="text-sm font-medium text-neutral">
                            Total Incash:
                        </p>
                        <h1 className="text-md font-bold">
                            {(Number(amount?.totals?.cash) || 0) -
                                (Number(todaysExpenseTotal) || 0) <
                            0 ? (
                                <p className="text-error">
                                    {(
                                        (Number(amount?.totals?.cash) || 0) -
                                        (Number(todaysExpenseTotal) || 0)
                                    ).toFixed(2)}{" "}
                                    Tk
                                </p>
                            ) : (
                                <p className="text-primary">
                                    {(Number(amount?.totals?.cash) || 0) -
                                        (
                                            Number(todaysExpenseTotal) || 0
                                        ).toFixed(2)}{" "}
                                    Tk
                                </p>
                            )}
                        </h1>
                    </div>
                </div>
            </div>

            {/* add model */}
            <dialog className="modal" open={model}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            Add new Expense
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
                            <legend className="fieldset-legend">Details</legend>
                            <textarea
                                className="textarea h-24"
                                placeholder="Write details here"
                                value={data.details}
                                onChange={(e) =>
                                    setData("details", e.target.value)
                                }
                            ></textarea>
                            {errors.details && (
                                <p className="label text-error">
                                    {errors.details}
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
