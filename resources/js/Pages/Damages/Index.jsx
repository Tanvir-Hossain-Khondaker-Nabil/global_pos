import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Edit, Plus, Trash2, Frown, AlertTriangle, Package, Eye, Calendar, DollarSign } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function DamageIndex({ damages, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const searchForm = useForm({
        search: filters.search || "",
        type: filters.type || "",
        reason: filters.reason || "",
        start_date: filters.start_date || "",
        end_date: filters.end_date || "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        searchForm.setData(name, value);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        router.get(route("damages.index"), searchForm.data, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        searchForm.setData({
            search: "",
            type: "",
            reason: "",
            start_date: "",
            end_date: "",
        });
        router.get(route("damages.index"));
    };

    const handleDelete = (id) => {
        if (confirm(t('damage.delete_confirmation', 'Are you sure you want to delete this damage record?'))) {
            router.delete(route("damages.destroy", id));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Damage type options
    const damageTypes = [
        { value: 'sale', label: t('damage.type_sale', 'Sale Return') },
        { value: 'purchase', label: t('damage.type_purchase', 'Purchase Return') },
    ];

    // Reason options
    const reasonOptions = [
        { value: 'transport', label: t('damage.reason_transport', 'Transport Damage') },
        { value: 'storage', label: t('damage.reason_storage', 'Storage Condition') },
        { value: 'manufacturing', label: t('damage.reason_manufacturing', 'Manufacturing Defect') },
        { value: 'handling', label: t('damage.reason_handling', 'Improper Handling') },
        { value: 'natural', label: t('damage.reason_natural', 'Natural Calamity') },
        { value: 'theft', label: t('damage.reason_theft', 'Theft/Pilferage') },
    ];

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
            <PageHeader
                title={t('damage.title', 'Damage Management')}
                subtitle={t('damage.subtitle', 'Track and manage damaged inventory items')}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="search"
                                name="search"
                                onChange={handleInputChange}
                                value={searchForm.data.search}
                                placeholder={t('damage.search_placeholder', 'Search damages...')}
                                className="input input-sm input-bordered"
                            />
                            <button type="submit" className="btn btn-sm bg-[#1e4d2b] text-white">
                                {t('damage.search', 'Search')}
                            </button>
                        </form>

                    </div>
                </div>
            </PageHeader>

            {/* Filters */}
            <form onSubmit={handleSubmit}>
                <div className="bg-base-100 rounded-box p-4 mb-4 border border-base-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('damage.type', 'Damage Type')}</span>
                            </label>
                            <select
                                name="type"
                                onChange={handleInputChange}
                                value={searchForm.data.type}
                                className="select select-sm select-bordered"
                            >
                                <option value="">{t('damage.all_types', 'All Types')}</option>
                                {damageTypes.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('damage.reason', 'Reason')}</span>
                            </label>
                            <select
                                name="reason"
                                onChange={handleInputChange}
                                value={searchForm.data.reason}
                                className="select select-sm select-bordered"
                            >
                                <option value="">{t('damage.all_reasons', 'All Reasons')}</option>
                                {reasonOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('damage.start_date', 'Start Date')}</span>
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                onChange={handleInputChange}
                                value={searchForm.data.start_date}
                                className="input input-sm input-bordered"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm">{t('damage.end_date', 'End Date')}</span>
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                onChange={handleInputChange}
                                value={searchForm.data.end_date}
                                className="input input-sm input-bordered"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-between">
                        <button
                            type="submit"
                            className="btn btn-sm bg-[#1e4d2b] text-white"
                        >
                            {t('damage.apply_filters', 'Apply Filters')}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-sm btn-ghost"
                        >
                            {t('damage.reset_filters', 'Reset Filters')}
                        </button>
                    </div>
                </div>
            </form>

            <div className="overflow-x-auto">
                {damages.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white">
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>{t('damage.product', 'Product')}</th>
                                <th>{t('damage.type', 'Type')}</th>
                                <th>{t('damage.quantity', 'Quantity')}</th>
                                <th>{t('damage.cost', 'Cost')}</th>
                                <th>{t('damage.date', 'Date')}</th>
                                <th>{t('damage.reason', 'Reason')}</th>
                                <th>{t('damage.action_taken', 'Action Taken')}</th>
                                <th>{t('damage.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {damages.data.map((damage, index) => (
                                <tr key={damage.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-primary" />
                                            <div>
                                                <div className="font-medium">
                                                    {damage.sale_item?.product?.name || damage.purchase_item?.product?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {damage.type === 'sale' 
                                                        ? t('damage.sale_item', 'Sale Item')
                                                        : t('damage.purchase_item', 'Purchase Item')
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`p-4 rounded badge ${getDamageTypeBadge(damage.type)}`}>
                                            {damageTypes.find(t => t.value === damage.type)?.label || damage.type}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">{damage.damage_quantity}</span>
                                            <span className="text-xs text-gray-500">
                                                {damage.saleItem?.product?.unit || damage.purchaseItem?.product?.unit || ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="font-medium">
                                        <div className="flex items-center gap-1">
                                            {formatCurrency(damage.cost)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} className="text-gray-400" />
                                            {formatDate(damage.damage_date)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="max-w-xs">
                                            <div className="text-sm font-medium">
                                                {reasonOptions.find(r => r.value === damage.reason)?.label || damage.reason}
                                            </div>
                                            {damage.description && (
                                                <div className="text-xs text-gray-500 truncate" title={damage.description}>
                                                    {damage.description}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${damage.action_taken ? 'badge-success' : 'badge-warning'}`}>
                                            {damage.action_taken 
                                                ? t('damage.action_taken_yes', 'Resolved')
                                                : t('damage.action_taken_no', 'Pending')
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route("damages.show", damage.id)}
                                                className="btn btn-xs btn-info btn-outline"
                                            >
                                                <Eye size={12} /> {t('damage.view', 'View')}
                                            </Link>
                                
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                        <AlertTriangle size={40} className="text-yellow-500" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {t('damage.no_damages', 'No damage records found!')}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {searchForm.data.search || searchForm.data.type || searchForm.data.reason || searchForm.data.start_date
                                ? t('damage.try_different_filters', 'Try different search or filter criteria')
                                : t('damage.get_started', 'Get started by adding your first damage record')
                            }
                        </p>
                        {!(searchForm.data.search || searchForm.data.type || searchForm.data.reason || searchForm.data.start_date) && (
                            <Link
                                href={route("damages.create")}
                                className="btn btn-sm bg-[#1e4d2b] text-white mt-2"
                            >
                                <Plus size={15} /> 
                                {t('damage.add_damage', 'Add Damage Record')}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <Pagination data={damages} />
        </div>
    );
}