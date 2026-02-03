import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { 
    AlertTriangle, 
    Package, 
    Calendar, 
    DollarSign, 
    Edit, 
    Trash2, 
    ArrowLeft, 
    FileText, 
    User,
    Warehouse,
    ClipboardCheck,
    RefreshCw,
    CheckCircle,
    XCircle
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function DamageShow({ damage }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = () => {
        if (confirm(t('damage.delete_confirmation', 'Are you sure you want to delete this damage record?'))) {
            router.delete(route("damages.destroy", damage.id));
        }
    };

    const handleMarkResolved = () => {
        if (confirm(t('damage.mark_resolved_confirmation', 'Mark this damage as resolved?'))) {
            router.patch(route("damages.update", damage.id), {
                action_taken: 'resolved',
                _method: 'PATCH'
            });
        }
    };

    const getDamageTypeLabel = (type) => {
        const types = {
            'sale': t('damage.type_sale', 'Sale Return'),
            'purchase': t('damage.type_purchase', 'Purchase Return'),
            'internal': t('damage.type_internal', 'Internal Damage'),
            'expired': t('damage.type_expired', 'Expired'),
            'defective': t('damage.type_defective', 'Defective'),
            'other': t('damage.type_other', 'Other'),
        };
        return types[type] || type;
    };

    const getReasonLabel = (reason) => {
        const reasons = {
            'transport': t('damage.reason_transport', 'Transport Damage'),
            'storage': t('damage.reason_storage', 'Storage Condition'),
            'manufacturing': t('damage.reason_manufacturing', 'Manufacturing Defect'),
            'handling': t('damage.reason_handling', 'Improper Handling'),
            'natural': t('damage.reason_natural', 'Natural Calamity'),
            'theft': t('damage.reason_theft', 'Theft/Pilferage'),
        };
        return reasons[reason] || reason;
    };

    const getDamageTypeBadge = (type) => {
        const colors = {
            sale: 'badge-info',
            purchase: 'badge-warning',
            internal: 'badge-error',
            expired: 'badge-secondary',
            defective: 'badge-accent',
            other: 'badge-neutral'
        };
        return colors[type] || 'badge-neutral';
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {/* <Link
                        href={route("damages.index")}
                        className="btn btn-ghost btn-sm"
                    >
                        <ArrowLeft size={16} />
                    </Link> */}
                    <PageHeader
                        title={t('damage.details_title', 'Damage Details')}
                        subtitle={t('damage.details_subtitle', 'View detailed information about this damage record')}
                    />
                </div>
                
                <div className="flex gap-2">
                    {/* {auth.user.can.edit && (
                        <Link
                            href={route("damages.edit", damage.id)}
                            className="btn btn-warning btn-sm"
                        >
                            <Edit size={14} />
                            {t('damage.edit', 'Edit')}
                        </Link>
                    )}
                    {auth.user.can.delete && (
                        <button
                            onClick={handleDelete}
                            className="btn btn-error btn-sm"
                        >
                            <Trash2 size={14} />
                            {t('damage.delete', 'Delete')}
                        </button>
                    )} */}
                </div>
            </div>

            {/* Status Banner */}
            <div className={`alert ${damage.action_taken ? 'alert-success' : 'alert-warning'} mb-6`}>
                <AlertTriangle size={20} />
                <div className="flex-1">
                    <h3 className="font-bold">
                        {damage.action_taken 
                            ? t('damage.status_resolved', 'Damage Resolved')
                            : t('damage.status_pending', 'Damage Pending Action')
                        }
                    </h3>
                    <div className="text-sm">
                        {damage.action_taken 
                            ? t('damage.status_resolved_desc', 'This damage has been resolved and appropriate action has been taken.')
                            : t('damage.status_pending_desc', 'This damage requires attention and action to be taken.')
                        }
                    </div>
                </div>
                {!damage.action_taken && auth.user.can.edit && (
                    <button
                        onClick={handleMarkResolved}
                        className="btn btn-success btn-sm"
                    >
                        <CheckCircle size={14} />
                        {t('damage.mark_resolved', 'Mark as Resolved')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-2">
                    <div className="bg-base-100 rounded-box border border-base-300 p-5">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-warning" />
                            {t('damage.damage_info', 'Damage Information')}
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Product Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-base-200 p-4 rounded-box">
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('damage.product', 'Product')}
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Package size={16} className="text-primary" />
                                        <span className="font-medium">
                                            {damage.sale_item?.product?.name || damage.purchase_item?.product?.name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {damage.type === 'sale' 
                                            ? t('damage.sale_item', 'Sale Item')
                                            : t('damage.purchase_item', 'Purchase Item')
                                        }
                                    </div>
                                </div>

                                <div className="bg-base-200 p-4 rounded-box">
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('damage.damage_type', 'Damage Type')}
                                    </label>
                                    <div className="mt-1">
                                        <span className={`badge ${getDamageTypeBadge(damage.type)}`}>
                                            {getDamageTypeLabel(damage.type)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity and Cost */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-base-200 p-4 rounded-box">
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('damage.damage_quantity', 'Damage Quantity')}
                                    </label>
                                    <div className="mt-1">
                                        <span className="text-xl font-bold">{damage.damage_quantity}</span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            {damage.sale_item?.product?.unit || damage.purchase_item?.product?.unit || ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-base-200 p-4 rounded-box">
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('damage.total_cost', 'Total Cost')}
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xl font-bold text-success">
                                            {formatCurrency(damage.cost)}
                                        </span>
                                    </div>
                                    {damage.cost > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {t('damage.unit_cost', 'Unit Cost')}: {formatCurrency(damage.cost / damage.damage_quantity)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reason and Description */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-base-200 p-4 rounded-box">
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('damage.reason', 'Reason')}
                                    </label>
                                    <div className="mt-1">
                                        <span className="font-medium">
                                            {getReasonLabel(damage.reason)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-base-200 p-4 rounded-box">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FileText size={14} />
                                        {t('damage.description', 'Description')}
                                    </label>
                                    <div className="mt-2 whitespace-pre-line">
                                        {damage.description || (
                                            <span className="text-gray-400 italic">
                                                {t('damage.no_description', 'No description provided')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Taken */}
                            <div className="bg-base-200 p-4 rounded-box">
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                    <ClipboardCheck size={14} />
                                    {t('damage.action_taken', 'Action Taken')}
                                </label>
                                <div className="mt-2">
                                    {damage.action_taken ? (
                                        <div>
                                            <div className="flex items-center gap-2 text-success">
                                                <CheckCircle size={16} />
                                                <span className="font-medium">
                                                    {t('damage.action_taken_yes', 'Resolved')}
                                                </span>
                                            </div>
                                            <div className="mt-2 whitespace-pre-line text-sm">
                                                {damage.action_taken}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-warning">
                                            <XCircle size={16} />
                                            <span className="font-medium">
                                                {t('damage.action_taken_no', 'Pending Action')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Metadata */}
                <div className="space-y-6">
                    {/* Timeline */}
                    <div className="bg-base-100 rounded-box border border-base-300 p-5">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-primary" />
                            {t('damage.timeline', 'Timeline')}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('damage.damage_date', 'Damage Date')}
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{formatDate(damage.damage_date)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('damage.created_at', 'Record Created')}
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{formatDate(damage.created_at)}</span>
                                </div>
                            </div>

                            {damage.updated_at !== damage.created_at && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        {t('damage.last_updated', 'Last Updated')}
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <RefreshCw size={14} className="text-gray-400" />
                                        <span>{formatDate(damage.updated_at)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Created By & Ownership */}
                    <div className="bg-base-100 rounded-box border border-base-300 p-5">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User size={18} className="text-info" />
                            {t('damage.ownership', 'Ownership')}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('damage.created_by', 'Created By')}
                                </label>
                                <div className="mt-1">
                                    {damage.createdBy ? (
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            <span>{damage.createdBy.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">
                                            {t('damage.unknown_user', 'Unknown User')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('damage.owner', 'Owner')}
                                </label>
                                <div className="mt-1">
                                    {damage.owner ? (
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            <span>{damage.owner.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">
                                            {t('damage.no_owner', 'No owner assigned')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    {t('damage.outlet', 'Outlet')}
                                </label>
                                <div className="mt-1">
                                    {damage.outlet ? (
                                        <div className="flex items-center gap-2">
                                            <Warehouse size={14} className="text-gray-400" />
                                            <span>{damage.outlet.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">
                                            {t('damage.no_outlet', 'No outlet assigned')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related References */}
                    <div className="bg-base-100 rounded-box border border-base-300 p-5">
                        <h3 className="text-lg font-semibold mb-4">
                            {t('damage.references', 'References')}
                        </h3>
                        
                        <div className="space-y-3">
                            {damage.saleItem && (
                                <div className="flex items-center justify-between p-3 bg-base-200 rounded-box">
                                    <div>
                                        <div className="text-sm font-medium">
                                            {t('damage.sale_reference', 'Sale Reference')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            #{damage.saleItem.id}
                                        </div>
                                    </div>
                                    <Link
                                        href={route("sales.show", damage.saleItem.sale_id)}
                                        className="btn btn-xs btn-info"
                                    >
                                        {t('damage.view_sale', 'View Sale')}
                                    </Link>
                                </div>
                            )}

                            {damage.purchaseItem && (
                                <div className="flex items-center justify-between p-3 bg-base-200 rounded-box">
                                    <div>
                                        <div className="text-sm font-medium">
                                            {t('damage.purchase_reference', 'Purchase Reference')}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            #{damage.purchaseItem.id}
                                        </div>
                                    </div>
                                    <Link
                                        href={route("purchases.show", damage.purchaseItem.purchase_id)}
                                        className="btn btn-xs btn-info"
                                    >
                                        {t('damage.view_purchase', 'View Purchase')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}