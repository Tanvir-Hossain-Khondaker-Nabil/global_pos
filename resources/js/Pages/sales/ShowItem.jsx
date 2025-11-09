import { Link, router } from "@inertiajs/react";
import PageHeader from "../../components/PageHeader";
import { 
    ArrowLeft, 
    Eye, 
    Package, 
    User, 
    Building, 
    Calendar,
    DollarSign,
    Percent,
    Hash,
    FileText,
    Trash2
} from "lucide-react";
import { toast } from "react-toastify";

export default function SaleItemShow({ saleItem }) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this sales item? This action cannot be undone.')) {
            router.delete(route('sales.items.destroy', { id: saleItem.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Sales item deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete sales item');
                }
            });
        }
    };

    const calculateItemTotal = () => {
        const price = parseFloat(saleItem.unit_price) || 0;
        const quantity = parseFloat(saleItem.quantity) || 0;
        const discount = parseFloat(saleItem.discount) || 0;
        
        const subtotal = price * quantity;
        const discountAmount = (subtotal * discount) / 100;
        return (subtotal - discountAmount).toFixed(2);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-box p-5">
            {/* Header with Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('salesItems.list')}
                        className="btn btn-ghost btn-circle"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Item Details</h1>
                        <p className="text-gray-600">Complete information about the sold item</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={route('sales.show', { id: saleItem.sale_id })}
                        className="btn btn-primary btn-sm"
                    >
                        <Eye size={14} />
                        View Sale
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="btn btn-error btn-sm"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Information Card */}
                    <div className="card bg-base-100 border">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-box">
                                    <Package className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="card-title">Product Information</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label font-semibold">Product Name</label>
                                    <p className="text-lg">{saleItem.product?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Product Code</label>
                                    <p className="text-lg">{saleItem.product?.product_no || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Variant</label>
                                    <p className="text-lg">{saleItem.variant?.size || 'No Variant'} ({saleItem.variant?.color || 'No Color'})</p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Product Number</label>
                                    <p className="text-lg">{saleItem.product?.product_no || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sale & Pricing Information */}
                    <div className="card bg-base-100 border">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-success/10 rounded-box">
                                    <DollarSign className="w-6 h-6 text-success" />
                                </div>
                                <h2 className="card-title">Pricing Information</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label font-semibold">Unit Price</label>
                                    <p className="text-xl font-bold text-success">
                                        {parseFloat(saleItem.unit_price).toFixed(2)} Tk
                                    </p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Quantity</label>
                                    <p className="text-xl font-bold">
                                        <Hash size={16} className="inline mr-1" />
                                        {saleItem.quantity}
                                    </p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Discount</label>
                                    <p className="text-xl font-bold text-warning">
                                        {saleItem.sale.discount}%
                                    </p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Vat</label>
                                    <p className="text-xl font-bold text-warning">
                                        {saleItem.sale.vat_tax}%
                                    </p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Total Amount</label>
                                    <p className="text-2xl font-bold text-primary">
                                        {calculateItemTotal()} Tk
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Information */}
                <div className="space-y-6">
                    {/* Customer Information */}
                    <div className="card bg-base-100 border">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-info/10 rounded-box">
                                    <User className="w-6 h-6 text-info" />
                                </div>
                                <h2 className="card-title">Customer</h2>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="label font-semibold">Name</label>
                                    <p>{saleItem.sale?.customer?.customer_name || 'Walk-in Customer'}</p>
                                </div>
                                {saleItem.sale?.customer?.phone && (
                                    <div>
                                        <label className="label font-semibold">Phone</label>
                                        <p>{saleItem.sale.customer.phone}</p>
                                    </div>
                                )}
                                {saleItem.sale?.customer?.address && (
                                    <div>
                                        <label className="label font-semibold">Address</label>
                                        <p className="text-sm">{saleItem.sale.customer.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Warehouse & Sale Info */}
                    <div className="card bg-base-100 border">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-warning/10 rounded-box">
                                    <Building className="w-6 h-6 text-warning" />
                                </div>
                                <h2 className="card-title">Location & Sale</h2>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="label font-semibold">Warehouse</label>
                                    <p>{saleItem.warehouse?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Sale Invoice</label>
                                    <p className="font-mono">{saleItem.sale?.invoice_no || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Sold By</label>
                                    <p>{saleItem.sale?.user?.name || 'System Admin'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timestamp Information */}
                    <div className="card bg-base-100 border">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-100 rounded-box">
                                    <Calendar className="w-6 h-6 text-gray-600" />
                                </div>
                                <h2 className="card-title">Timestamps</h2>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="label font-semibold">Sold Date</label>
                                    <p>{formatDate(saleItem.created_at)}</p>
                                </div>
                                <div>
                                    <label className="label font-semibold">Last Updated</label>
                                    <p>{formatDate(saleItem.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="mt-6 card bg-base-100 border">
                <div className="card-body">
                    <h3 className="card-title mb-4">Calculation Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-base-200 rounded-box">
                            <div className="text-sm text-gray-600">Unit Price</div>
                            <div className="text-lg font-bold">{parseFloat(saleItem.unit_price).toFixed(2)} Tk</div>
                        </div>
                        <div className="p-4 bg-base-200 rounded-box">
                            <div className="text-sm text-gray-600">Quantity</div>
                            <div className="text-lg font-bold">{saleItem.quantity}</div>
                        </div>
                        <div className="p-4 bg-base-200 rounded-box">
                            <div className="text-sm text-gray-600">Subtotal</div>
                            <div className="text-lg font-bold">
                                {(saleItem.unit_price * saleItem.quantity).toFixed(2)} Tk
                            </div>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-box">
                            <div className="text-sm text-gray-600">Final Total</div>
                            <div className="text-lg font-bold text-primary">
                                {calculateItemTotal()} Tk
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}