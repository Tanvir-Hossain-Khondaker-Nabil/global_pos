import { Head, usePage } from "@inertiajs/react";
import { Annoyed, DollarSign, ShoppingCart } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export default function Dashboard({
    totalSales,
    totalSalespyament,
    totalselas,
    totalexpense,
    totalDue,
    totalPaid
}) {
    const { auth, appName } = usePage().props;
    const { t, locale } = useTranslation();

    return (
        <div className={locale === 'bn' ? 'bangla-font' : ''}>
            <div>
                <h1 className="text-lg text-gray-900 font-semibold">
                    {t('dashboard.title', 'Dashboard')}
                </h1>
                <p className="text-xs text-gray-500">
                    {t('dashboard.welcome_message', 'Hi, :name. Welcome back to :app :role!', {
                        name: auth.name,
                        app: appName,
                        
                        role: auth.role
                    })}
                </p>
            </div>

                <div className="grid mt-5 grid-cols-1 md:grid-cols-5 gap-3">
                    {/* Total Sales */}
                    <div className="bg-primary rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <span className="text-white text-xl font-bold">৳</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                               ৳ {Number(totalSales)?.toFixed(2) ?? "0.00"}
                            </h1>
                            <small className="text-xs text-white">
                                {t('dashboard.total_sales', 'Total Sales')}
                            </small>
                        </div>
                    </div>

                    {/* Total Payment */}
                    <div className="bg-orange-300 rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <span className="text-white text-xl font-bold">৳</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                               ৳ {Number(totalPaid)?.toFixed(2) ?? "0.00"}
                            </h1>
                            <small className="text-xs text-gray-600">
                                {t('dashboard.total_payment', 'Total Payment')}
                            </small>
                        </div>
                    </div>

                    {/* Total Due */}
                    <div className="bg-red-400 rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <span className="text-white text-xl font-bold">৳</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                ৳ {Number(totalDue)?.toFixed(2) ?? "0.00"}
                            </h1>
                            <small className="text-xs text-white">
                                {t('dashboard.total_due', 'Total Due')}
                            </small>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white rounded-box p-7 flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <ShoppingCart size={20} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {totalselas ?? 0}
                            </h1>
                            <small className="text-xs text-gray-600">
                                {t('dashboard.total_orders', 'Total Orders')}
                            </small>
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-error rounded-box p-7 flex items-center gap-3">
                        <div className="bg-white/10 rounded-full p-1 flex items-center justify-center w-10 h-10">
                            <ShoppingCart size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">
                                {totalexpense ?? 0} {t('dashboard.currency_tk', 'Tk')}
                            </h1>
                            <small className="text-xs text-white">
                                {t('dashboard.total_expenses', 'Total Expenses')}
                            </small>
                        </div>
                    </div>
                </div>


            <Head title={t('dashboard.title', 'Dashboard')} />
        </div>
    );
}