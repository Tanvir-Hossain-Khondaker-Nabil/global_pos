import { useForm, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Save,
    User,
    Building,
    Calendar,
    CreditCard,
    CheckCircle,
    Clock,
    Star,
    FileText,
    Tag,
    Grid,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Create({ plans, user }) {
    const { t, locale } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        plan_id: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        amount: "",
        transaction_id: "",
        notes: "",
        payment_method: "",
    });

    const [selectedPlan, setSelectedPlan] = useState(null);
    const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

    // Handle plan selection to auto-fill amount and calculate end date
    const handlePlanSelect = (planId) => {
        const plan = plans.find((p) => p.id == planId);
        if (plan) {
            setSelectedPlan(plan);
            setData("plan_id", planId);
            setData("amount", plan.price);

            if (data.start_date && plan.validity) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + parseInt(plan.validity));
                setData("end_date", endDate.toISOString().split("T")[0]);
            }
        } else {
            setSelectedPlan(null);
        }
    };

    // Handle start date change to recalculate end date
    const handleStartDateChange = (date) => {
        setData("start_date", date);
        if (selectedPlan && date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(selectedPlan.validity));
            setData("end_date", endDate.toISOString().split("T")[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("subscriptions.store"));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Get plan type badge
    const getPlanTypeBadge = (type) => {
        const typeMap = {
            "1": {
                label: t("plan.free", "Free"),
                class: "bg-blue-100 text-blue-800 border-blue-200",
            },
            "2": {
                label: t("plan.premium", "Premium"),
                class: "bg-purple-100 text-purple-800 border-purple-200",
            },
        };
        return typeMap[type] || {
            label: type,
            class: "bg-gray-100 text-gray-800 border-gray-200",
        };
    };

    return (
        <div className={`min-h-screen bg-slate-50 p-6 ${locale === "bn" ? "bangla-font" : ""}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div
                    className="rounded-2xl p-8 text-white shadow-lg mb-8"
                    style={{ background: gradient }}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-extrabold">
                                {t("subscription.create_subscription", "Create New Subscription")}
                            </h1>
                            <p className="text-white/80 mt-2">
                                {t("subscription.assign_subscription_plan", "Assign a subscription plan to a company user")}
                            </p>
                        </div>
                        <a
                            href={route("subscriptions.index")}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition"
                        >
                            <ArrowLeft size={18} />
                            {t("subscription.back", "Back")}
                        </a>
                    </div>
                </div>

                    <div >
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* User & Plan Card */}
                            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                                <div className="px-6 py-4 text-white font-bold text-lg"
                                    style={{ background: gradient }}>
                                    {t("subscription.subscription_details", "User & Plan Selection")}
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Plan */}
                                    <div >
                                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                            <Star size={16} className="text-emerald-700" />
                                            {t("subscription.select_plan", "Select Plan")} *
                                        </label>
                                        <select
                                            value={data.plan_id}
                                            onChange={(e) => handlePlanSelect(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-200"
                                        >
                                            <option value="">
                                                {t("subscription.select_plan", "Select Plan")}
                                            </option>
                                            {plans.map((plan) => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} - {formatCurrency(plan.price)} -{" "}
                                                    {plan.validity} days
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                        {/* Start Date */}
                                    <div>
                                        <label className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Calendar size={16} />
                                            {t("subscription.start_date", "Start Date")} *
                                        </label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-200"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Clock size={16} />
                                            {t("subscription.end_date", "End Date")} *
                                        </label>
                                        <input
                                            type="date"
                                            value={data.end_date}
                                            readOnly
                                            className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            ৳ {t("subscription.amount", "Amount")}
                                        </label>
                                        <input
                                            type="number"
                                            value={data.amount}
                                            readOnly
                                            className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                                        />
                                    </div>

                                    {/* Payment */}
                                    <div>
                                        <label className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <CreditCard size={16} />
                                            {t("subscription.payment_method", "Payment Method")}
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData("payment_method", e.target.value)}
                                            className="w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-200"
                                        >
                                            <option value="">Select Payment Method</option>
                                            <option value="adjust_deposit">Adjust User Deposit</option>
                                            <option value="cash">Cash</option>
                                            <option value="mobile_banking">Mobile Banking</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                        {errors.payment_method && (
                                            <p className="text-red-500 text-sm mt-2">
                                                {errors.payment_method}
                                            </p>
                                        )}
                                    </div>
                                    {
                                        data.payment_method !== 'adjust_deposit' &&
                                        data.payment_method !== 'cash' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                    <CreditCard size={16} className="text-blue-600" />
                                                    {t('subscription.transaction_id', 'Transaction ID')}
                                                </label>

                                                <input
                                                    type="text"
                                                    value={data.transaction_id}
                                                    onChange={(e) => setData("transaction_id", e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                                    placeholder={t('subscription.transaction_placeholder', 'Enter transaction ID')}
                                                    required
                                                />

                                                {errors.transaction_id && (
                                                    <p className="text-red-500 text-sm mt-2">
                                                        {errors.transaction_id}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    }

                                    <div className="md:col-span-2">
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData("notes", e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-emerald-200 resize-none"
                                            placeholder="Any additional notes..."
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* Submit */}
                            <div className="flex justify-end">
                                <button
                                    disabled={processing}
                                    className="px-8 py-4 rounded-2xl font-bold text-white shadow-md hover:shadow-lg transition"
                                    style={{ background: gradient }}
                                >
                                    <Save size={18} className="inline mr-2" />
                                    {processing ? "Creating..." : "Create Subscription"}
                                </button>
                            </div>
                        </form>
                    </div>
            </div>
        </div>
    );
}
