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
    FileText
} from "lucide-react";
import { useState } from "react";

export default function Create({ plans, users }) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: "",
        plan_id: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        status: "active",
        payment_status: "pending",
        amount: "",
        transaction_id: "",
        notes: "",
        payment_method: "",
        user_email: "",
    });

    const [selectedPlan, setSelectedPlan] = useState(null);

    // Handle plan selection to auto-fill amount and calculate end date
    const handlePlanSelect = (planId) => {
        const plan = plans.find(p => p.id == planId);
        if (plan) {
            setSelectedPlan(plan);
            setData("plan_id", planId);
            setData("amount", plan.price);
            
            // Calculate end date based on plan validity
            if (data.start_date && plan.validity) {
                const startDate = new Date(data.start_date);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + parseInt(plan.validity));
                setData("end_date", endDate.toISOString().split('T')[0]);
            }
        }
    };

    // Handle start date change to recalculate end date
    const handleStartDateChange = (date) => {
        setData("start_date", date);
        if (selectedPlan && date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(selectedPlan.validity));
            setData("end_date", endDate.toISOString().split('T')[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("subscriptions.store"));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Create New Subscription</h1>
                        <p className="text-gray-600 mt-2">Assign a subscription plan to a company user</p>
                    </div>
                    <a
                        href={route("subscriptions.index")}
                        className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                    >
                        <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Back</span>
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User & Plan Selection Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <User className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">User & Plan Selection</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Building size={16} className="text-blue-600" />
                                    Select Company *
                                </label>
                                <select
                                    value={data.user_id}
                                    onChange={(e) => setData("user_id", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="">Select Company</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} - {user.email}
                                        </option>
                                    ))}
                                </select>
                                {errors.user_id && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.user_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock size={16} className="text-orange-600" />
                                    User Email (manual)
                                </label>
                                <input
                                    type="email"
                                    value={data.user_email}
                                    onChange={(e) => setData("user_email", e.target.value)}
                                    placeholder="Enter user email"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 duration-200 bg-gray-50 hover:bg-white"
                                />
                                {errors.user_email && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.user_email}
                                    </p>
                                )}
                            </div>
              
                           

                            {/* Plan Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Star size={16} className="text-green-600" />
                                    Select Plan *
                                </label>
                                <select
                                    value={data.plan_id}
                                    onChange={(e) => handlePlanSelect(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="">Select Plan</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {formatCurrency(plan.price)} - {plan.validity} days
                                        </option>
                                    ))}
                                </select>
                                {errors.plan_id && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.plan_id}
                                    </p>
                                )}
                            </div>

                            {/* Selected Plan Details */}
                            {selectedPlan && (
                                <div className="md:col-span-2">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                            <CheckCircle size={18} />
                                            Selected Plan Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Plan Name:</span>
                                                <p className="text-green-700">{selectedPlan.name}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Price:</span>
                                                <p className="text-green-700">{formatCurrency(selectedPlan.price)}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Validity:</span>
                                                <p className="text-green-700">{selectedPlan.validity} days</p>
                                            </div>
                                            {selectedPlan.description && (
                                                <div className="md:col-span-3">
                                                    <span className="font-medium text-gray-700">Description:</span>
                                                    <p className="text-green-700">{selectedPlan.description}</p>
                                                </div>
                                            )}
                                            {selectedPlan.features && selectedPlan.features.length > 0 && (
                                                <div className="md:col-span-3">
                                                    <span className="font-medium text-gray-700">Features:</span>
                                                    <ul className="text-green-700 list-disc list-inside mt-1">
                                                        {selectedPlan.features.slice(0, 3).map((feature, index) => (
                                                            <li key={index} className="text-sm">{feature}</li>
                                                        ))}
                                                        {selectedPlan.features.length > 3 && (
                                                            <li className="text-sm text-blue-600">
                                                                +{selectedPlan.features.length - 3} more features
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subscription Details Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Subscription Details</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-600" />
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-[#A6A6AA] "
                                />
                                {errors.start_date && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.start_date}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock size={16} className="text-orange-600" />
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setData("end_date", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-[#A6A6AA] "
                                    readOnly
                                />
                                {errors.end_date && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.end_date}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    ৳
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData("amount", e.target.value)}
                                    className="w-full px-4 py-3 border bg-[#A6A6AA] border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    readOnly
                                />
                                {errors.amount && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.amount}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Building size={16} className="text-blue-600" />
                                    Select Payment Method
                                </label>
                                <select
                                    value={data.payment_method}
                                    onChange={(e) => setData("payment_method", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="">Select payment method</option>
                                    <option value="cash">Cash</option>
                                    <option value="mobile_banking">Mobile Banking</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                                {errors.payment_method && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                         {errors.payment_method}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CreditCard size={16} className="text-blue-600" />
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    value={data.transaction_id}
                                    onChange={(e) => setData("transaction_id", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="Enter transaction ID"
                                />
                                {errors.transaction_id && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.transaction_id}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status & Payment Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Status & Payment</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subscription Status *
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData("status", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {errors.status && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Status *
                                </label>
                                <select
                                    value={data.payment_status}
                                    onChange={(e) => setData("payment_status", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                                {errors.payment_status && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.payment_status}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-gray-600 to-slate-700 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <FileText className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Additional Information</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes & Comments
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                                    rows={4}
                                    placeholder="Any additional notes or comments about this subscription..."
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            disabled={processing}
                            className={`
                                group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white
                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                ${processing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                }
                            `}
                        >
                            <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                            {processing ? "Creating Subscription..." : "Create Subscription"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}