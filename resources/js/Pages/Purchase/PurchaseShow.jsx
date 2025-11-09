import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download, Calendar, User, Warehouse, Package, DollarSign, FileText, Hash, Shield } from "lucide-react";

export default function PurchaseShow({ purchase, isShadowUser }) {
    const { auth } = usePage().props;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount);
    };

    const calculateTotalQuantity = () => {
        return purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    };

    // Get the correct price based on user type
    const getPrice = (item, field) => {
        if (isShadowUser) {
            // Use shadow prices for shadow users
            switch (field) {
                case 'unit_price': return item.shadow_unit_price || item.unit_price;
                case 'total_price': return item.shadow_total_price || item.total_price;
                case 'sale_price': return item.shadow_sale_price || item.sale_price;
                default: return item[field];
            }
        }
        // Use regular prices for general users
        return item[field];
    };

    // Get purchase amounts based on user type
    const getPurchaseAmount = (field) => {
        if (isShadowUser) {
            switch (field) {
                case 'total_amount': return purchase.shadow_total_amount || purchase.total_amount;
                case 'paid_amount': return purchase.shadow_paid_amount || purchase.paid_amount;
                case 'due_amount': return purchase.shadow_due_amount || purchase.due_amount;
                default: return purchase[field];
            }
        }
        return purchase[field];
    };

    // Helper function to get variant display name
    const getVariantDisplayName = (variant) => {
        if (!variant) return 'Default Variant';
        
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

    return (
        <div className="bg-white rounded-box p-5 print:p-0">
            {/* Header */}
            <PageHeader
                title={isShadowUser ? "Purchase Details" : "Purchase Details"}
                subtitle={`Purchase #${purchase.purchase_no}`}
            >
                <div className="flex flex-col sm:flex-row gap-2 print:hidden">
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.visit(route("purchase.list"))}
                            className="btn btn-sm btn-ghost"
                        >
                            <ArrowLeft size={15} /> Back to List
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-sm btn-outline"
                        >
                            <Printer size={15} /> Print
                        </button>
                        {auth.role === "admin" && (
                            <button className="btn btn-sm btn-outline">
                                <Download size={15} /> Export
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
                                            {isShadowUser ? 'Purchase Number' : 'Purchase Number'}
                                        </p>
                                    </div>
                                </div>
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
                                        <p className="text-sm text-gray-600">Purchase Date</p>
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
                                    <User size={16} /> Supplier Information
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm text-gray-600">Name</label>
                                        <p className="font-medium">{purchase.supplier.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Company</label>
                                        <p className="font-medium">{purchase.supplier.company}</p>
                                    </div>
                                    {purchase.supplier.phone && (
                                        <div>
                                            <label className="text-sm text-gray-600">Phone</label>
                                            <p className="font-medium">{purchase.supplier.phone}</p>
                                        </div>
                                    )}
                                    {purchase.supplier.email && (
                                        <div>
                                            <label className="text-sm text-gray-600">Email</label>
                                            <p className="font-medium">{purchase.supplier.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm border">
                            <div className="card-body p-4">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <Warehouse size={16} /> Warehouse Information
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm text-gray-600">Name</label>
                                        <p className="font-medium">{purchase.warehouse.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600">Code</label>
                                        <p className="font-medium">{purchase.warehouse.code}</p>
                                    </div>
                                    {purchase.warehouse.address && (
                                        <div>
                                            <label className="text-sm text-gray-600">Address</label>
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
                            <h3 className="font-bold mb-3">Purchase Status</h3>
                            <div className="text-center">
                                <span className={`badge badge-lg badge-${purchase.status_color}`}>
                                    {purchase.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="divider my-3"></div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Payment Status:</span>
                                    <span className={`badge badge-${getPaymentStatusColor(purchase.payment_status)}`}>
                                        {purchase.payment_status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span>{formatDate(purchase.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Updated:</span>
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
                                {isShadowUser ? 'Amount Summary' : 'Amount Summary'}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span>Total Amount:</span>
                                    <span className={`font-bold text-lg ${isShadowUser ? 'text-warning' : ''}`}>
                                        {formatCurrency(getPurchaseAmount('total_amount'))}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Paid Amount:</span>
                                    <span className="font-bold">
                                        {formatCurrency(getPurchaseAmount('paid_amount'))}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-orange-600">
                                    <span>Due Amount:</span>
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
                            {isShadowUser ? 'Purchase Items' : 'Purchase Items'} ({purchase.items.length})
                        </h3>
                        <p className="text-sm text-gray-600">
                            Total {calculateTotalQuantity()} units purchased
                        </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="table table-auto w-full">
                            <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                                <tr>
                                    <th className="bg-opacity-20">#</th>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th className="text-right">Quantity</th>
                                    <th className="text-right">
                                        {isShadowUser ? 'Unit Price' : 'Unit Price'}
                                    </th>
                                    <th className="text-right">
                                        {isShadowUser ? 'Sale Price' : 'Sale Price'}
                                    </th>
                                    <th className="text-right">
                                        {isShadowUser ? 'Total Price' : 'Total Price'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase.items.map((item, index) => (
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
                                        <td className={`text-right font-mono font-bold ${isShadowUser ? 'text-warning' : ''}`}>
                                            {formatCurrency(getPrice(item, 'total_price'))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                                <tr>
                                    <th colSpan="3" className="text-right bg-opacity-20">Totals:</th>
                                    <th className="text-right bg-opacity-20 font-bold">{calculateTotalQuantity()}</th>
                                    <th className="text-right bg-opacity-20"></th>
                                    <th className="text-right bg-opacity-20"></th>
                                    <th className="text-right bg-opacity-20 font-bold">
                                        {formatCurrency(getPurchaseAmount('total_amount'))}
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
                            <FileText size={16} /> Notes
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