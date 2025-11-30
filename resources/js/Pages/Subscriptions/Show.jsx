import React from "react";
import PageHeader from "../../components/PageHeader";
import { 
    ArrowLeft, 
    Download, 
    Printer, 
    User, 
    Calendar,
    CreditCard,
    FileText,
    Clock,
    Zap,
    Building,
    Smartphone,
    Globe,
    CheckCircle,
    XCircle,
    AlertCircle,
    PauseCircle
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

export default function SubscriptionShow({ subscription }) {
    const { auth } = usePage().props;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Format date only (without time)
    const formatDateOnly = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Get status details
    const getStatusDetails = (status) => {
        const details = {
            1: { 
                icon: CheckCircle, 
                color: "text-success",
                bgColor: "bg-success/10",
                badge: "badge-success",
                label: "Active"
            },
            3: { 
                icon: XCircle, 
                color: "text-error",
                bgColor: "bg-error/10",
                badge: "badge-error",
                label: "Canceled"
            },
            2: { 
                icon: AlertCircle, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                badge: "badge-warning",
                label: "Expired"
            },
            4: { 
                icon: Clock, 
                color: "text-info",
                bgColor: "bg-info/10",
                badge: "badge-info",
                label: "Pending"
            },
            
        };
        return details[status] || { 
            icon: AlertCircle, 
            color: "text-gray-500",
            bgColor: "bg-gray-100",
            badge: "badge-gray-500",
            label: status
        };
    };

    // Get billing cycle details
    const getBillingCycleDetails = (cycle) => {
        const details = {
            monthly: { label: "Monthly", icon: Calendar },
            yearly: { label: "Yearly", icon: Building },
            quarterly: { label: "Quarterly", icon: Clock },
            weekly: { label: "Weekly", icon: Calendar },
        };
        return details[cycle] || { label: cycle, icon: Calendar };
    };

    const statusDetails = getStatusDetails(subscription.status);
    const StatusIcon = statusDetails.icon;

    const billingDetails = getBillingCycleDetails(subscription.plan?.billing_cycle || "monthly");
    const BillingIcon = billingDetails.icon;

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Calculate days remaining
    const getDaysRemaining = () => {
        const endDate = new Date(subscription.end_date);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const daysRemaining = getDaysRemaining();

    return (
        <div className="bg-white rounded-box">
            {/* Header */}
            <div className="p-5 border-b print:border-none">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("subscriptions.index")}
                            className="btn btn-ghost btn-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to Subscriptions
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Subscription Details
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Subscription information and billing history
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Download size={16} />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Subscription Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Subscription Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-warning" />
                            Subscription Information
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Subscription ID:</span>
                                <span className="font-mono font-semibold">#{subscription.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status:</span>
                                <span className={`badge ${statusDetails.badge} badge-lg capitalize`}>
                                    {statusDetails.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Plan:</span>
                                <span className="font-semibold">
                                    {subscription.plan?.name || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Price:</span>
                                <span className="text-success font-bold text-lg">
                                    {formatCurrency(subscription.plan?.price || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Billing Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-primary" />
                            Billing Information
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Billing Cycle:</span>
                                <div className="flex items-center gap-2">
                                    <BillingIcon size={16} className="text-gray-400" />
                                    <span className="font-semibold capitalize">
                                        {billingDetails.label}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Next Billing:</span>
                                <span className="font-semibold">
                                    {subscription.end_date ? formatDateOnly(subscription.end_date) : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Days Remaining:</span>
                                <span className={`font-semibold ${
                                    daysRemaining < 7 ? 'text-error' : 'text-success'
                                }`}>
                                    {daysRemaining} days
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Auto-renew:</span>
                                <span className={`badge ${
                                    subscription.auto_renew ? 'badge-success' : 'badge-error'
                                }`}>
                                    {subscription.auto_renew ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* User Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User size={20} className="text-info" />
                            User Information
                        </h2>
                        {subscription.user ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-lg">
                                        {subscription.user.name}
                                    </p>
                                    {subscription.user.email && (
                                        <p className="text-gray-600 text-sm">
                                            ✉️ {subscription.user.email}
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Member since:</span>
                                    <span className="font-semibold text-sm">
                                        {subscription.user.created_at ? formatDateOnly(subscription.user.created_at) : "N/A"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No user information available</p>
                        )}
                    </div>
                </div>

                {/* Timeline and Plan Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Subscription Timeline */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-success" />
                            Subscription Timeline
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Created:</span>
                                <span className="font-semibold">
                                    {formatDate(subscription.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Started:</span>
                                <span className="font-semibold">
                                    {subscription.start_date ? formatDate(subscription.start_date) : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Expires:</span>
                                <span className="font-semibold">
                                    {subscription.end_date ? formatDate(subscription.end_date) : "N/A"}
                                </span>
                            </div>
                 
                        </div>
                    </div>

                    {/* Plan Details */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Plan Details
                        </h2>
                        {subscription.plan ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Plan Name:</span>
                                    <span className="font-semibold">{subscription.plan.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Description:</span>
                                    <span className="font-semibold text-sm text-right">
                                        {subscription.plan.description || "No description"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Features:</span>
                                    <span className="font-semibold">
                                        {subscription.plan.features.length || 0} features
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Max Users:</span>
                                    <span className="font-semibold">
                                        {subscription.plan.max_users || "Unlimited"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No plan information available</p>
                        )}
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-base-100 rounded-box p-6 border mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-success" />
                        Payment History
                    </h2>
                    {subscription.payments && subscription.payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table table-auto w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th>Payment ID</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscription.payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="font-mono font-semibold">
                                                #{payment.id}
                                            </td>
                                            <td className="font-semibold">
                                                {formatDate(payment.created_at)}
                                            </td>
                                            <td className="font-semibold text-success">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="capitalize">
                                                {payment.payment_method}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    payment.status === 'completed' 
                                                        ? 'badge-success' 
                                                        : payment.status === 'failed'
                                                        ? 'badge-error'
                                                        : 'badge-warning'
                                                } capitalize`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="font-mono text-sm">
                                                {payment.txn_ref || "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No payment history available</p>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                {subscription.notes && (
                    <div className="bg-base-100 rounded-box p-6 border mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-600" />
                            Subscription Notes
                        </h2>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {subscription.notes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:block mt-12 pt-8 border-t">
                    <div className="text-center text-gray-500">
                        <p className="font-semibold">Subscription Management System</p>
                        <p className="text-sm">This is an computer generated subscription report</p>
                        <p className="text-xs mt-2">
                            Printed on: {formatDate(new Date().toISOString())}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}