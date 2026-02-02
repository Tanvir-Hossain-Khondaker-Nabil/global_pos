import { Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Tag,
    DollarSign,
    Calendar,
    FileText,
    CheckCircle,
    Star,
    Grid,
    Users,
    TrendingUp,
    Clock,
    Shield,
    Globe,
    CreditCard,
    Award,
    BadgeCheck,
    Zap,
    Target,
    BarChart,
    Download,
    Share2,
    Edit,
    Trash2
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Show({ plans }) {
    const { t, locale } = useTranslation();

    const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            '1': { label: t('plan.active', 'Active'), class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            '2': { label: t('plan.inactive', 'Inactive'), class: 'bg-rose-50 text-rose-800 border-rose-200' },
        };
        return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    // Get plan type badge
    const getPlanTypeBadge = (type) => {
        const typeMap = {
            '1': { label: t('plan.free', 'Free'), class: 'bg-sky-50 text-sky-800 border-sky-200' },
            '2': { label: t('plan.premium', 'Premium'), class: 'bg-violet-50 text-violet-800 border-violet-200' },
        };
        return typeMap[type] || { label: type, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    // Get plan type icon
    const getPlanTypeIcon = (type) => {
        const iconMap = {
            '1': <Award className="text-sky-700" size={20} />,
            '2': <Shield className="text-violet-700" size={20} />,
        };
        return iconMap[type] || <Star className="text-gray-600" size={20} />;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div
                    className="rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-900/10 mb-8"
                    style={{ background: gradient }}
                >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {getPlanTypeIcon(plans.plan_type)}
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPlanTypeBadge(plans.plan_type).class}`}>
                                    {getPlanTypeBadge(plans.plan_type).label}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(plans.status).class}`}>
                                    {getStatusBadge(plans.status).label}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{plans.name}</h1>
                            <p className="text-white/85 text-lg">{plans.description}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={route("plans.index")}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 rounded-xl ring-1 ring-white/20 hover:bg-white/20 transition-all"
                            >
                                <ArrowLeft size={18} className="text-white" />
                                <span className="font-semibold text-white">{t('plan.back_to_plans', 'Back to Plans')}</span>
                            </Link>

                            <Link
                                href={route("plans.edit", plans.id)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 rounded-xl shadow-sm hover:bg-white/90 transition-all"
                            >
                                <Edit size={18} />
                                <span className="font-bold">{t('plan.edit', 'Edit')}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Plan Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Plan Overview Card */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                            <div className="px-6 py-4 text-white" style={{ background: gradient }}>
                                <h2 className="text-xl font-bold">
                                    {t('plan.plan_overview', 'Plan Overview')}
                                </h2>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center">
                                                <DollarSign className="text-emerald-800" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{t('plan.price', 'Price')}</p>
                                                <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(plans.price)}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {plans.plan_type === '1'
                                                ? t('plan.free_plan', 'Free subscription plan')
                                                : t('plan.premium_plan', 'Premium subscription plan')
                                            }
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                                                <Calendar className="text-gray-800" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{t('plan.validity', 'Validity')}</p>
                                                <p className="text-2xl font-extrabold text-gray-900">{plans.validity}</p>
                                                <p className="text-sm text-gray-500">{t('plan.validity_days', 'days')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{t('plan.auto_renewal', 'Auto-renewal subscription')}</p>
                                    </div>

                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center">
                                                <Grid className="text-emerald-800" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{t('plan.product_range', 'Product Range')}</p>
                                                <p className="text-2xl font-extrabold text-gray-900">{plans.product_range || 0}</p>
                                                <p className="text-sm text-gray-500">{t('plan.max_products', 'maximum products')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{t('plan.product_limit', 'Product listing limit')}</p>
                                    </div>
                                </div>

                                {/* Sales Performance */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        {t('plan.sales_performance', 'Sales Performance')}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                                                    <Star className="text-amber-600" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">{t('plan.total_sales', 'Total Sales')}</p>
                                                    <p className="text-xl font-extrabold text-gray-900">{plans.total_sell || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                                                    <TrendingUp className="text-emerald-800" size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">{t('plan.created_on', 'Created On')}</p>
                                                    <p className="text-sm font-semibold text-gray-900">{formatDate(plans.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Modules Card */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                            <div className="px-6 py-4 text-white" style={{ background: gradient }}>
                                <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                                    <div className="flex items-center gap-3">
                                        <Grid className="text-white" size={22} />
                                        <h2 className="text-xl font-bold">
                                            {t('plan.included_modules', 'Included Modules')}
                                        </h2>
                                    </div>
                                    <div className="text-white/90 font-semibold">
                                        {plans.modules?.length || 0} {t('plan.modules', 'modules')}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {plans.modules && plans.modules.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {plans.modules.map((module) => (
                                            <div
                                                key={module.id}
                                                className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all duration-200"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center flex-shrink-0">
                                                        <Grid size={18} className="text-emerald-800" />
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900 mb-1">{module.name}</h3>
                                                        {module.description && <p className="text-sm text-gray-700">{module.description}</p>}
                                                    </div>

                                                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle size={14} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <Grid size={48} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-600">{t('plan.no_modules_assigned', 'No modules assigned to this plan')}</p>
                                        <p className="text-sm text-gray-400 mt-1">{t('plan.edit_to_add_modules', 'Edit the plan to add modules')}</p>
                                    </div>
                                )}

                                {plans.modules && plans.modules.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <CheckCircle size={16} className="text-emerald-700" />
                                            <span>{t('plan.all_modules_included', 'All selected modules are included in this plan')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                            <div className="px-6 py-4 text-white" style={{ background: gradient }}>
                                <h2 className="text-xl font-bold">{t('plan.quick_actions', 'Quick Actions')}</h2>
                            </div>

                            <div className="p-6 space-y-3">
                                <Link
                                    href={route("plans.edit", plans.id)}
                                    className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-200 transition-all duration-200"
                                >
                                    <Edit size={18} className="text-emerald-800" />
                                    <span className="font-semibold text-gray-900">{t('plan.edit_plan', 'Edit Plan')}</span>
                                </Link>

                                <button
                                    onClick={() => {
                                        if (confirm(t('plan.delete_confirmation', 'Are you sure you want to delete this plan?'))) {
                                            router.delete(route("plans.destroy", plans.id));
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 p-3 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-200 transition-all duration-200"
                                >
                                    <Trash2 size={18} className="text-rose-700" />
                                    <span className="font-semibold text-gray-900">{t('plan.delete_plan', 'Delete Plan')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Plan Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                            <div className="px-6 py-4 text-white" style={{ background: gradient }}>
                                <h2 className="text-xl font-bold">{t('plan.plan_details', 'Plan Details')}</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.plan_id', 'Plan ID')}</p>
                                    <p className="font-bold text-gray-900">{plans.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.created_at', 'Created At')}</p>
                                    <p className="font-semibold text-gray-900">{formatDate(plans.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.updated_at', 'Last Updated')}</p>
                                    <p className="font-semibold text-gray-900">{formatDate(plans.updated_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('plan.plan_type', 'Plan Type')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getPlanTypeIcon(plans.plan_type)}
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getPlanTypeBadge(plans.plan_type).class}`}>
                                            {getPlanTypeBadge(plans.plan_type).label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            {t('plan.plan_last_updated', 'Plan last updated')}: {formatDate(plans.updated_at)}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("plans.edit", plans.id)}
                                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                                style={{ background: gradient }}
                            >
                                <Edit size={16} />
                                <span className="font-bold">{t('plan.edit_plan', 'Edit Plan')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
