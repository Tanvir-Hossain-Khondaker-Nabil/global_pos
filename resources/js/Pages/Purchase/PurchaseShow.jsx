import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download, Calendar, User, Warehouse, Package, DollarSign, FileText, Hash, Shield } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PurchaseShow({ purchase, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    const calculateTotalQuantity = () => {
        return purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    };

    // Get the correct price based on user type - FIXED
    const getPrice = (item, field) => {
        if (isShadowUser) {
            // Use shadow prices for shadow users
            switch (field) {
                case 'unit_price': return item.shadow_unit_price;
                case 'total_price': return item.shadow_total_price;
                case 'sale_price': return item.shadow_sale_price;
                default: return item[field];
            }
        }
        // Use regular prices for general users
        return item[field];
    };

    // Get purchase amounts based on user type - FIXED
    const getPurchaseAmount = (field) => {
        if (isShadowUser) {
            switch (field) {
                case 'grand_total': return purchase.shadow_total_amount;
                case 'paid_amount': return purchase.shadow_paid_amount;
                case 'due_amount': return purchase.shadow_due_amount;
                default: return purchase[field];
            }
        }
        return purchase[field];
    };

    // Helper function to get variant display name - FIXED for new attribute_values format
    const getVariantDisplayName = (variant) => {
        if (!variant) return 'Default Variant';
        
        // Check if variant has attribute_values (new format)
        if (variant.attribute_values && Object.keys(variant.attribute_values).length > 0) {
            const parts = [];
            for (const [attributeCode, value] of Object.entries(variant.attribute_values)) {
                parts.push(`${attributeCode}: ${value}`);
            }
            return parts.join(', ');
        }
        
        // Fallback to old format
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
        if (variant.material) parts.push(`Material: ${variant.material}`);
        
        return parts.length > 0 ? parts.join(', ') : 'Default Variant';
    };

    const handlePrint = () => {
        window.print();
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'success';
            case 'partial': return 'warning';
            case 'unpaid': return 'error';
            default: return 'neutral';
        }
    };

    // Debug: Check what data we're receiving
    console.log('Purchase data:', purchase);
    console.log('Is shadow user:', isShadowUser);
    console.log('Items data:', purchase.items);

    return (
        <div className={`bg-white rounded-box p-5 print:p-0 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <PageHeader
                title={t('purchase.purchase_details_title', 'Purchase Details')}
                subtitle={`${t('purchase.purchase_number_label', 'Purchase #')}${purchase.purchase_no}`}
            >
                <div className="flex flex-col sm:flex-row gap-2 print:hidden">
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.visit(route("purchase.list"))}
                            className="btn btn-sm btn-ghost"
                        >
                            <ArrowLeft size={15} /> {t('purchase.back_to_list', 'Back to List')}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-sm btn-outline"
                        >
                            <Printer size={15} /> {t('purchase.print', 'Print')}
                        </button>
                        {auth.role === "admin" && (
                            <button className="btn btn-sm btn-outline">
                                <Download size={15} /> {t('purchase.export', 'Export')}
                            </button>
                        )}
                    </div>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Purchase Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="card bg-base-100 shadow-sm border">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-primary/10'}`}>
                                        <Hash size={20} className={isShadowUser ? 'text-warning' : 'text-primary'} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{purchase.purchase_no}</h3>
                                        <p className="text-sm text-gray-600">
                                            {t('purchase.purchase_number_label', 'Purchase Number')}
                                        </p>
                                    </div>
                                </div>
                                {isShadowUser && (
                                    <div className="mt-2">
                                        <span className="badge badge-warning badge-sm">
                                            <Shield size={12} className="mr-1" />
                                            {t('purchase.shadow_purchase', 'Shadow Purchase')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm border">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-info/10 p-2 rounded-box">
                                        <Calendar size={20} className="text-info" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{formatDate(purchase.purchase_date)}</h3>
                                        <p className="text-sm text-gray-600">{t('purchase.purchase_date_label', 'Purchase Date')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supplier & Warehouse */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="card bg-base-100 shadow-sm border">
                            <div className="card-body p-4">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <User size={16} /> {t('purchase.supplier_information', 'Supplier Information')}
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm text-gray-600">{t('purchase.name', 'Name')}</label>
                                        <p className="font-medium">{purchase.supplier?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">{t('purchase.company', 'Company')}</label>
                                        <p className="font-medium">{purchase.supplier?.company || 'N/A'}</p>
                                    </div>
                                    {purchase.supplier?.phone && (
                                        <div>
                                            <label className="text-sm text-gray-600">{t('purchase.phone', 'Phone')}</label>
                                            <p className="font-medium">{purchase.supplier.phone}</p>
                                        </div>
                                    )}
                                    {purchase.supplier?.email && (
                                        <div>
                                            <label className="text-sm text-gray-600">{t('purchase.email', 'Email')}</label>
                                            <p className="font-medium">{purchase.supplier.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm border">
                            <div className="card-body p-4">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <Warehouse size={16} /> {t('purchase.warehouse_information', 'Warehouse Information')}
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm text-gray-600">{t('purchase.name', 'Name')}</label>
                                        <p className="font-medium">{purchase.warehouse?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">{t('purchase.code', 'Code')}</label>
                                        <p className="font-medium">{purchase.warehouse?.code || 'N/A'}</p>
                                    </div>
                                    {purchase.warehouse?.address && (
                                        <div>
                                            <label className="text-sm text-gray-600">{t('purchase.address', 'Address')}</label>
                                            <p className="font-medium text-sm">{purchase.warehouse.address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status & Summary */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="card bg-base-100 shadow-sm border">
                        <div className="card-body p-4">
                            <h3 className="font-bold mb-3">{t('purchase.purchase_status', 'Purchase Status')}</h3>
                            <div className="text-center">
                                <span className={`badge badge-lg badge-${purchase.status === 'completed' ? 'success' : 'warning'}`}>
                                    {t(`purchase.${purchase.status}`, purchase.status?.toUpperCase() || 'PENDING')}
                                </span>
                            </div>
                            <div className="divider my-3"></div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>{t('purchase.payment_status', 'Payment Status')}:</span>
                                    <span className={`badge badge-${getPaymentStatusColor(purchase.payment_status)}`}>
                                        {t(`purchase.${purchase.payment_status}`, purchase.payment_status)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('purchase.created', 'Created')}:</span>
                                    <span>{formatDate(purchase.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('purchase.last_updated', 'Last Updated')}:</span>
                                    <span>{formatDate(purchase.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="card bg-base-100 shadow-sm border">
                        <div className="card-body p-4">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <DollarSign size={16} /> 
                                {t('purchase.amount_summary', 'Amount Summary')}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span>{t('purchase.total_amount', 'Total Amount')}:</span>
                                    <span className={`font-bold text-lg ${isShadowUser ? 'text-warning' : 'text-primary'}`}>
                                        {formatCurrency(getPurchaseAmount('grand_total'))}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-green-600">
                                    <span>{t('purchase.paid_amount', 'Paid Amount')}:</span>
                                    <span className="font-bold">
                                        {formatCurrency(getPurchaseAmount('paid_amount'))}
                                    </span>
                                </div>
                                
                                <div className={`flex justify-between items-center ${getPurchaseAmount('due_amount') > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    <span>{t('purchase.due_amount', 'Due Amount')}:</span>
                                    <span className="font-bold">
                                        {formatCurrency(getPurchaseAmount('due_amount'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="card bg-base-100 shadow-sm border">
                <div className="card-body p-0">
                    <div className="p-4 border-b">
                        <h3 className="font-bold flex items-center gap-2">
                            <Package size={16} /> 
                            {t('purchase.purchase_items', 'Purchase Items')} ({purchase.items?.length || 0})
                        </h3>
                        <p className="text-sm text-gray-600">
                            {t('purchase.total_units_purchased', 'Total units purchased')} {calculateTotalQuantity()}
                        </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="table table-auto w-full">
                            <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                                <tr>
                                    <th className="bg-opacity-20">#</th>
                                    <th>{t('purchase.product', 'Product')}</th>
                                    <th>{t('purchase.variant', 'Variant')}</th>
                                    <th className="text-right">{t('purchase.quantity', 'Quantity')}</th>
                                    <th className="text-right">
                                        {t('purchase.unit_price', 'Unit Price')}
                                    </th>
                                    <th className="text-right">
                                        {t('purchase.sale_price', 'Sale Price')}
                                    </th>
                                    <th className="text-right">
                                        {t('purchase.total_price', 'Total Price')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase.items?.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-base-100">
                                        <th className="bg-base-200">{index + 1}</th>
                                        <td>
                                            <div>
                                                <div className="font-medium">
                                                    {item.product?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    #{item.product_id}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {getVariantDisplayName(item.variant)}
                                            </div>
                                            {item.variant && (
                                                <div className="text-xs text-gray-500">
                                                    #{item.variant_id}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-right font-mono">{item.quantity}</td>
                                        <td className="text-right font-mono">
                                            {formatCurrency(getPrice(item, 'unit_price'))}
                                        </td>
                                        <td className="text-right font-mono">
                                            {formatCurrency(getPrice(item, 'sale_price'))}
                                        </td>
                                        <td className={`text-right font-mono font-bold ${isShadowUser ? 'text-warning' : 'text-primary'}`}>
                                            {formatCurrency(getPrice(item, 'total_price'))}
                                        </td>
                                    </tr>
                                ))}
                                {(!purchase.items || purchase.items.length === 0) && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-8 text-gray-500">
                                            {t('purchase.no_items_found', 'No items found in this purchase')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                                <tr>
                                    <th colSpan="3" className="text-right bg-opacity-20">{t('purchase.totals', 'Totals')}:</th>
                                    <th className="text-right bg-opacity-20 font-bold">{calculateTotalQuantity()}</th>
                                    <th className="text-right bg-opacity-20"></th>
                                    <th className="text-right bg-opacity-20"></th>
                                    <th className="text-right bg-opacity-20 font-bold">
                                        {formatCurrency(getPurchaseAmount('grand_total'))}
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {purchase.notes && (
                <div className="card bg-base-100 shadow-sm border mt-6">
                    <div className="card-body p-4">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                            <FileText size={16} /> {t('purchase.notes', 'Notes')}
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .btn { display: none !important; }
                    .card { border: 1px solid #000 !important; break-inside: avoid; }
                    table { break-inside: avoid; }
                    .badge { display: none !important; }
                    .alert { display: none !important; }
                }
            `}</style>
        </div>
    );
}