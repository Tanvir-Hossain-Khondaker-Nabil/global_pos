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
    RefreshCw,
    Zap,
    AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Edit({ subscription, plans }) {
    const { data, setData, post, processing, errors } = useForm({
        plan_id: subscription.plan_id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        amount: subscription.plan?.price || "",
        payment_method: "",
        transaction_id: "",
        notes: subscription.notes || "",
        auto_renew: subscription.auto_renew || false,
        renew_type: "same_plan", // same_plan, upgrade, downgrade
    });

    const [selectedPlan, setSelectedPlan] = useState(subscription.plan || null);
    const [renewOption, setRenewOption] = useState("same_plan");
    const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);

    // Initialize form with subscription data
    useEffect(() => {
        if (subscription.plan) {
            setSelectedPlan(subscription.plan);
            setData("amount", subscription.plan.price);
            
            // Calculate end date based on current subscription end or today
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(subscription.plan.validity));
            setData("end_date", endDate.toISOString().split('T')[0]);
        }
    }, [subscription]);

    // Handle plan selection
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

            // Show upgrade warning if selecting a higher-priced plan
            if (plan.price > subscription.plan.price) {
                setShowUpgradeWarning(true);
                setRenewOption("upgrade");
            } else if (plan.price < subscription.plan.price) {
                setRenewOption("downgrade");
            } else {
                setRenewOption("same_plan");
            }
        }
    };

    // Handle start date change
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
        post(route("subscriptions.renew", { subscription: subscription.id }));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Calculate price difference
    const getPriceDifference = () => {
        if (!selectedPlan) return 0;
        return selectedPlan.price - subscription.plan.price;
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            1: "text-green-600 bg-green-50 border-green-200",
            2: "text-red-600 bg-red-50 border-red-200",
            3: "text-orange-600 bg-orange-50 border-orange-200",
            4: "text-blue-600 bg-blue-50 border-blue-200",
        };
        return colors[status] || "text-gray-600 bg-gray-50 border-gray-200";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {subscription.status == 1 ? 'Renew Subscription' : 'Update Subscription'}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {subscription.status == 1
                                ? 'Extend or upgrade the current subscription plan'
                                : 'Reactivate or modify the subscription plan'
                            }
                        </p>
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
                    {/* Current Subscription Status */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-gray-600 to-slate-700 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Zap className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Current Subscription</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-4 border rounded-xl bg-blue-50 border-blue-200">
                                    <p className="text-sm text-gray-600">Current Plan</p>
                                    <p className="font-semibold text-blue-700">{subscription.plan?.name}</p>
                                </div>
                                <div className="text-center p-4 border rounded-xl bg-green-50 border-green-200">
                                    <p className="text-sm text-gray-600">Current Price</p>
                                    <p className="font-semibold text-green-700">{formatCurrency(subscription.plan?.price)}</p>
                                </div>
                                <div className="text-center p-4 border rounded-xl bg-orange-50 border-orange-200">
                                    <p className="text-sm text-gray-600">Status</p>
                                    <p className={`font-semibold capitalize ${getStatusColor(subscription.status).split(' ')[0]}`}>
                                        {subscription.status == 1 ? 'active' :
                                         subscription.status == 2 ? 'expired' :
                                         subscription.status == 3 ? 'cancelled' :
                                         subscription.status == 4 ? 'pending' : 'unknown'}
                                    </p>
                                </div>
                                <div className="text-center p-4 border rounded-xl bg-purple-50 border-purple-200">
                                    <p className="text-sm text-gray-600">Expires</p>
                                    <p className="font-semibold text-purple-700">
                                        {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <User size={18} />
                                    User Information
                                </h4>
                                <p className="text-gray-700">
                                    <strong>{subscription.user?.name}</strong> • {subscription.user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Renewal Options */}
                    
                    {/* <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Renewal Options</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <label className={`relative cursor-pointer ${renewOption === 'same_plan' ? 'ring-2 ring-green-500' : ''}`}>
                                    <input
                                        type="radio"
                                        name="renew_option"
                                        value="same_plan"
                                        checked={renewOption == 'same_plan'}
                                        onChange={(e) => setRenewOption(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center hover:border-green-300 transition-all duration-200">
                                        <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                                        <h3 className="font-semibold text-gray-800">Same Plan</h3>
                                        <p className="text-sm text-gray-600 mt-1">Renew with current plan</p>
                                        <p className="text-lg font-bold text-green-600 mt-2">
                                            {formatCurrency(subscription.plan?.price)}
                                        </p>
                                    </div>
                                </label>

                                <label className={`relative cursor-pointer ${renewOption === 'upgrade' ? 'ring-2 ring-blue-500' : ''}`}>
                                    <input
                                        type="radio"
                                        name="renew_option"
                                        value="upgrade"
                                        checked={renewOption === 'upgrade'}
                                        onChange={(e) => setRenewOption(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-all duration-200">
                                        <Star size={32} className="mx-auto text-blue-500 mb-2" />
                                        <h3 className="font-semibold text-gray-800">Upgrade</h3>
                                        <p className="text-sm text-gray-600 mt-1">Switch to a better plan</p>
                                        <p className="text-xs text-blue-600 mt-2">Select plan below</p>
                                    </div>
                                </label>

                                <label className={`relative cursor-pointer ${renewOption === 'downgrade' ? 'ring-2 ring-orange-500' : ''}`}>
                                    <input
                                        type="radio"
                                        name="renew_option"
                                        value="downgrade"
                                        checked={renewOption === 'downgrade'}
                                        onChange={(e) => setRenewOption(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition-all duration-200">
                                        <AlertTriangle size={32} className="mx-auto text-orange-500 mb-2" />
                                        <h3 className="font-semibold text-gray-800">Downgrade</h3>
                                        <p className="text-sm text-gray-600 mt-1">Switch to a basic plan</p>
                                        <p className="text-xs text-orange-600 mt-2">Select plan below</p>
                                    </div>
                                </label>
                            </div>

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
                                    <option value={subscription.plan_id}>
                                        {subscription.plan?.name} - {formatCurrency(subscription.plan?.price)} (Current)
                                    </option>
                                    {plans
                                        .filter(plan => plan.id !== subscription.plan_id)
                                        .map((plan) => (
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

                            {selectedPlan && selectedPlan.id !== subscription.plan_id && (
                                <div className="mt-4">
                                    <div className={`border rounded-xl p-4 ${
                                        selectedPlan.price > subscription.plan.price 
                                            ? 'bg-blue-50 border-blue-200' 
                                            : selectedPlan.price < subscription.plan.price
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'bg-green-50 border-green-200'
                                    }`}>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <CheckCircle size={18} className={
                                                selectedPlan.price > subscription.plan.price 
                                                    ? 'text-blue-600' 
                                                    : selectedPlan.price < subscription.plan.price
                                                    ? 'text-orange-600'
                                                    : 'text-green-600'
                                            } />
                                            {selectedPlan.price > subscription.plan.price ? 'Upgrade' : 
                                             selectedPlan.price < subscription.plan.price ? 'Downgrade' : 'Same'} Plan Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Plan Name:</span>
                                                <p className={
                                                    selectedPlan.price > subscription.plan.price 
                                                        ? 'text-blue-700' 
                                                        : selectedPlan.price < subscription.plan.price
                                                        ? 'text-orange-700'
                                                        : 'text-green-700'
                                                }>{selectedPlan.name}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Price:</span>
                                                <p className={
                                                    selectedPlan.price > subscription.plan.price 
                                                        ? 'text-blue-700' 
                                                        : selectedPlan.price < subscription.plan.price
                                                        ? 'text-orange-700'
                                                        : 'text-green-700'
                                                }>{formatCurrency(selectedPlan.price)}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Validity:</span>
                                                <p className={
                                                    selectedPlan.price > subscription.plan.price 
                                                        ? 'text-blue-700' 
                                                        : selectedPlan.price < subscription.plan.price
                                                        ? 'text-orange-700'
                                                        : 'text-green-700'
                                                }>{selectedPlan.validity} days</p>
                                            </div>
                                            {selectedPlan.description && (
                                                <div className="md:col-span-3">
                                                    <span className="font-medium text-gray-700">Description:</span>
                                                    <p className={
                                                        selectedPlan.price > subscription.plan.price 
                                                            ? 'text-blue-700' 
                                                            : selectedPlan.price < subscription.plan.price
                                                            ? 'text-orange-700'
                                                            : 'text-green-700'
                                                    }>{selectedPlan.description}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {selectedPlan.price !== subscription.plan.price && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-700">Price Difference:</span>
                                                    <span className={`font-bold text-lg ${
                                                        getPriceDifference() > 0 ? 'text-blue-600' : 'text-orange-600'
                                                    }`}>
                                                        {getPriceDifference() > 0 ? '+' : ''}{formatCurrency(getPriceDifference())}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div> */}

                    {/* Subscription Details Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Subscription Period</h2>
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50"
                                    readOnly
                                />
                                {errors.end_date && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        {errors.end_date}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.auto_renew}
                                        onChange={(e) => setData("auto_renew", e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-700">Enable Auto-Renewal</span>
                                        <p className="text-sm text-gray-500">
                                            Automatically renew this subscription when it expires
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Payment Information</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    ৳
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData("amount", e.target.value)}
                                    className="w-full px-4 py-3 border bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                                    Payment Method
                                </label>
                                <select
                                    value={data.payment_method}
                                    onChange={(e) => setData("payment_method", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white-50 hover:bg-white"
                                >
                                    <option value="">Select payment method</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit Card</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="mobile">Mobile Banking</option>
                                    <option value="online">Online Payment</option>
                                </select>
                                {errors.payment_method && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        {errors.payment_method}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CreditCard size={16} className="text-blue-600" />
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    value={data.transaction_id}
                                    onChange={(e) => setData("transaction_id", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white-50 hover:bg-white"
                                    placeholder="Enter transaction ID (if applicable)"
                                />
                                {errors.transaction_id && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        {errors.transaction_id}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
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
                                    Renewal Notes
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white-50 hover:bg-white resize-none"
                                    rows={4}
                                    placeholder="Any additional notes about this renewal or upgrade..."
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        {errors.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <a
                            href={route("subscriptions.index")}
                            className="group flex items-center gap-2 px-6 py-3 bg-white rounded-xl font-semibold text-gray-700 border border-gray-300 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                        >
                            Cancel
                        </a>
                        <button
                            disabled={processing}
                            className={`
                                group flex items-center gap-3 px-8 py-3 rounded-xl font-semibold text-white
                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                ${processing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                                }
                            `}
                        >
                            <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                            {processing 
                                ? (subscription.status == 1 ? "Renewing..." : "Updating...")
                                : (subscription.status == 1 ? "Renew Subscription" : "Update Subscription")
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}