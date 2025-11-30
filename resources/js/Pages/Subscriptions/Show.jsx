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
import { useTranslation } from "../../hooks/useTranslation";

export default function SubscriptionShow({ subscription }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

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
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
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
        return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
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
                label: t('payments.active', 'Active')
            },
            3: { 
                icon: XCircle, 
                color: "text-error",
                bgColor: "bg-error/10",
                badge: "badge-error",
                label: t('payments.cancelled', 'Canceled')
            },
            2: { 
                icon: AlertCircle, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                badge: "badge-warning",
                label: t('payments.expired', 'Expired')
            },
            4: { 
                icon: Clock, 
                color: "text-info",
                bgColor: "bg-info/10",
                badge: "badge-info",
                label: t('payments.pending', 'Pending')
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
            monthly: { label: t('payments.monthly', 'Monthly'), icon: Calendar },
            yearly: { label: t('payments.yearly', 'Yearly'), icon: Building },
            quarterly: { label: t('payments.quarterly', 'Quarterly'), icon: Clock },
            weekly: { label: t('payments.weekly', 'Weekly'), icon: Calendar },
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
        <div className={`bg-white rounded-box ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <div className="p-5 border-b print:border-none">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("subscriptions.index")}
                            className="btn btn-ghost btn-sm"
                        >
                            <ArrowLeft size={16} />
                            {t('payments.back', 'Back to Subscriptions')}
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('payments.subscription_details', 'Subscription Details')}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {t('payments.subscription_information', 'Subscription information and billing history')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Printer size={16} />
                            {t('payments.print', 'Print')}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Download size={16} />
                            {t('payments.download', 'Download')}
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
                            {t('payments.subscription_information', 'Subscription Information')}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.subscription_id', 'Subscription ID')}:</span>
                                <span className="font-mono font-semibold">#{subscription.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.status', 'Status')}:</span>
                                <span className={`badge ${statusDetails.badge} badge-lg capitalize`}>
                                    {statusDetails.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.plan', 'Plan')}:</span>
                                <span className="font-semibold">
                                    {subscription.plan?.name || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.price', 'Price')}:</span>
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
                            {t('payments.billing_information', 'Billing Information')}
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.billing_cycle', 'Billing Cycle')}:</span>
                                <div className="flex items-center gap-2">
                                    <BillingIcon size={16} className="text-gray-400" />
                                    <span className="font-semibold capitalize">
                                        {billingDetails.label}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.next_billing', 'Next Billing')}:</span>
                                <span className="font-semibold">
                                    {subscription.end_date ? formatDateOnly(subscription.end_date) : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.days_remaining', 'Days Remaining')}:</span>
                                <span className={`font-semibold ${
                                    daysRemaining < 7 ? 'text-error' : 'text-success'
                                }`}>
                                    {daysRemaining} {t('payments.days', 'days')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.auto_renew', 'Auto-renew')}:</span>
                                <span className={`badge ${
                                    subscription.auto_renew ? 'badge-success' : 'badge-error'
                                }`}>
                                    {subscription.auto_renew ? t('payments.yes', 'Yes') : t('payments.no', 'No')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* User Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User size={20} className="text-info" />
                            {t('payments.user_information', 'User Information')}
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
                                    <span className="text-gray-600">{t('payments.member_since', 'Member since')}:</span>
                                    <span className="font-semibold text-sm">
                                        {subscription.user.created_at ? formatDateOnly(subscription.user.created_at) : "N/A"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">{t('payments.no_user_information', 'No user information available')}</p>
                        )}
                    </div>
                </div>

                {/* Timeline and Plan Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Subscription Timeline */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-success" />
                            {t('payments.subscription_timeline', 'Subscription Timeline')}
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.created', 'Created')}:</span>
                                <span className="font-semibold">
                                    {formatDate(subscription.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.started', 'Started')}:</span>
                                <span className="font-semibold">
                                    {subscription.start_date ? formatDate(subscription.start_date) : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">{t('payments.expires', 'Expires')}:</span>
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
                            {t('payments.plan_details', 'Plan Details')}
                        </h2>
                        {subscription.plan ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.plan_name', 'Plan Name')}:</span>
                                    <span className="font-semibold">{subscription.plan.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.description', 'Description')}:</span>
                                    <span className="font-semibold text-sm text-right">
                                        {subscription.plan.description || t('payments.no_description', 'No description')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.features', 'Features')}:</span>
                                    <span className="font-semibold">
                                        {subscription.plan.features.length || 0} {t('payments.features', 'features')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('payments.max_users', 'Max Users')}:</span>
                                    <span className="font-semibold">
                                        {subscription.plan.max_users || t('payments.unlimited', 'Unlimited')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">{t('payments.no_plan_information', 'No plan information available')}</p>
                        )}
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-base-100 rounded-box p-6 border mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-success" />
                        {t('payments.payment_history', 'Payment History')}
                    </h2>
                    {subscription.payments && subscription.payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table table-auto w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th>{t('payments.payment_id', 'Payment ID')}</th>
                                        <th>{t('payments.date', 'Date')}</th>
                                        <th>{t('payments.amount', 'Amount')}</th>
                                        <th>{t('payments.method', 'Method')}</th>
                                        <th>{t('payments.status', 'Status')}</th>
                                        <th>{t('payments.reference', 'Reference')}</th>
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
                            <p className="text-gray-500">{t('payments.no_payment_history', 'No payment history available')}</p>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                {subscription.notes && (
                    <div className="bg-base-100 rounded-box p-6 border mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-600" />
                            {t('payments.subscription_notes', 'Subscription Notes')}
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
                        <p className="font-semibold">{t('payments.subscription_management_system', 'Subscription Management System')}</p>
                        <p className="text-sm">{t('payments.computer_generated_report', 'This is a computer generated subscription report')}</p>
                        <p className="text-xs mt-2">
                            {t('payments.printed_on', 'Printed on')}: {formatDate(new Date().toISOString())}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}