import { Head, usePage } from "@inertiajs/react";
import { Annoyed, DollarSign, ShoppingCart } from "lucide-react";

export default function Dashboard({
    totalSales,
    totalSalespyament,
    totalselas,
    totalexpense,
    totalDue,
    totalPaid
}) {
    const { auth, appName } = usePage().props;

    return (
        <div>
            <div>
                <h1 className="text-lg text-gray-900 font-semibold">
                    Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                    Hi, {auth.name}. Welcome back to {appName} {auth.role}!
                </p>
            </div>

            {auth.role == "admin" ? (
                <div className="grid mt-5 grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="bg-primary rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <span className="text-white text-xl font-bold">৳</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                               ৳ {Number(totalSales)?.toFixed(2) ?? "0.00"}
                            </h1>
                            <small className="text-xs text-white">
                                Total seles
                            </small>
                        </div>
                    </div>
                    <div className="bg-orange-300 rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <span className="text-white text-xl font-bold">৳</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                               ৳ {Number(totalPaid)?.toFixed(2) ?? "0.00"}
                            </h1>
                            <small className="text-xs text-gray-600">
                                Total Payment
                            </small>
                        </div>
                    </div>
                    <div className="bg-red-400 rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <span className="text-white text-xl font-bold">৳</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                ৳ {Number(totalDue)?.toFixed(2)}
                            </h1>
                            <small className="text-xs text-white">Total Due</small>
                        </div>
                    </div>

                    <div className="bg-white rounded-box p-7 flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <ShoppingCart size={20} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {totalselas}
                            </h1>
                            <small className="text-xs text-gray-600">
                                Total Orders
                            </small>
                        </div>
                    </div>
                    <div className="bg-error rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <ShoppingCart size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {totalexpense} Tk
                            </h1>
                            <small className="text-xs text-white">
                                Total Expenses
                            </small>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border border-gray-400 border-dashed rounded-box py-8 px-5 mt-5 flex flex-col items-center">
                    <Annoyed size={25} className="mb-2 text-gray-500"/>
                    <p className="text-gray-500">You have no permission!</p>
                </div>
            )}

            <Head title="Dashboard" />
        </div>
    );
}
