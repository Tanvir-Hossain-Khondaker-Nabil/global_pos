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
    Trash2,
    Printer,
    Download
} from "lucide-react";
import { toast } from "react-toastify";
import { useRef } from "react";

export default function SaleItemShow({ saleItem }) {
    const printRef = useRef();

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
        const discount = parseFloat(saleItem.sale?.discount) || 0;
        
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

    const formatDateForPrint = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getVariantText = () => {
        if (!saleItem.variant) return 'N/A';
        
        const variant = saleItem.variant;
        let attrsText = '';
        
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                attrsText = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${value}`)
                    .join(', ');
            } else {
                attrsText = variant.attribute_values;
            }
        }
        
        return attrsText || 'N/A';
    };

    
    const getBrandText = () => {
        if (!saleItem.variant) return 'N/A';
        
        const variant = saleItem.variant;
        let attrsText = '';
        
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                attrsText = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${key}`)
                    .join(', ');
            } else {
                attrsText = variant.attribute_values;
            }
        }
        
        return attrsText || 'N/A';
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sales Item Receipt - #${saleItem.id}</title>
                <style>
                    @media print {
                        @page {
                            margin: 0.2in;
                            size: A4;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            color: #1a202c;
                            line-height: 1.3;
                            font-size: 12px;
                            background: #fff;
                        }
                        .print-container {
                            max-width: 100%;
                            margin: 0 auto;
                            padding: 0;
                        }
                        .no-print { display: none !important; }
                        .print-break { page-break-inside: avoid; }
                        .print-mt-1 { margin-top: 0.25rem; }
                        .print-mt-2 { margin-top: 0.5rem; }
                        .print-mt-3 { margin-top: 0.75rem; }
                        .print-mb-1 { margin-bottom: 0.25rem; }
                        .print-mb-2 { margin-bottom: 0.5rem; }
                        .print-mb-3 { margin-bottom: 0.75rem; }
                        .print-mb-4 { margin-bottom: 1rem; }
                        .print-p-2 { padding: 0.5rem; }
                        .print-p-3 { padding: 0.75rem; }
                        .print-p-4 { padding: 1rem; }
                        .print-border { border: 1px solid #e2e8f0; }
                        .print-border-t { border-top: 2px solid #4299e1; }
                        .print-border-b { border-bottom: 1px solid #e2e8f0; }
                        .print-bg-blue-50 { background-color: #ebf8ff; }
                        .print-bg-gray-50 { background-color: #f7fafc; }
                        .print-text-center { text-align: center; }
                        .print-text-right { text-align: right; }
                        .print-text-left { text-align: left; }
                        .print-text-xs { font-size: 0.75rem; }
                        .print-text-sm { font-size: 0.875rem; }
                        .print-text-base { font-size: 1rem; }
                        .print-text-lg { font-size: 1.125rem; }
                        .print-text-xl { font-size: 1.25rem; }
                        .print-font-bold { font-weight: bold; }
                        .print-font-semibold { font-weight: 600; }
                        .print-font-medium { font-weight: 500; }
                        .print-text-gray-600 { color: #718096; }
                        .print-text-gray-700 { color: #4a5568; }
                        .print-text-gray-800 { color: #2d3748; }
                        .print-text-gray-900 { color: #1a202c; }
                        .print-text-blue-600 { color: #3182ce; }
                        .print-text-blue-700 { color: #2b6cb0; }
                        .print-text-green-600 { color: #38a169; }
                        .print-text-red-600 { color: #e53e3e; }
                        .print-rounded { border-radius: 0.25rem; }
                        .print-rounded-lg { border-radius: 0.375rem; }
                        .print-grid { display: grid; }
                        .print-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .print-grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                        .print-gap-2 { gap: 0.5rem; }
                        .print-gap-3 { gap: 0.75rem; }
                        .print-gap-4 { gap: 1rem; }
                        .print-flex { display: flex; }
                        .print-flex-col { flex-direction: column; }
                        .print-justify-between { justify-content: space-between; }
                        .print-justify-end { justify-content: flex-end; }
                        .print-justify-center { justify-content: center; }
                        .print-items-start { align-items: flex-start; }
                        .print-items-center { align-items: center; }
                        .print-space-y-1 > * + * { margin-top: 0.25rem; }
                        .print-space-y-2 > * + * { margin-top: 0.5rem; }
                        .print-w-full { width: 100%; }
                        .print-w-48 { width: 12rem; }
                        .print-w-64 { width: 16rem; }
                        .table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; }
                        .table th, .table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                        .table th { background-color: #edf2f7; font-weight: 600; color: #4a5568; }
                        .table tbody tr:last-child td { border-bottom: none; }
                        .highlight-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.4rem 0.75rem; border-radius: 0.25rem; }
                        .accent-border { border-left: 3px solid #4299e1; }
                        .section-header { padding: 0.5rem 0.75rem; background-color: #f7fafc; border-radius: 0.25rem; margin-bottom: 0.75rem; font-weight: 600; color: #2d3748; font-size: 0.875rem; }
                        .info-card { padding: 0.75rem; background-color: white; border: 1px solid #e2e8f0; border-radius: 0.375rem; margin-bottom: 0.75rem; }
                        .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 0.75rem 0; }
                        .badge { display: inline-block; padding: 0.2rem 0.4rem; font-size: 0.7rem; font-weight: 600; border-radius: 0.2rem; }
                        .badge-primary { background-color: #bee3f8; color: #2c5282; }
                        .compact { margin: 0; padding: 0; }
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: A4; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${printRef.current.innerHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 100);
                    };
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const handleDownload = () => {
        handlePrint();
    };

    return (
        <>
            <div className="bg-white rounded-box p-5">
                <PageHeader 
                    title="Iduvisul Sales Items" 
                    description="Comprehensive list of all sold items with detailed information"
                />
                
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
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm no-print"
                        >
                            <Printer size={14} />
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            className="btn btn-outline btn-sm no-print"
                        >
                            <Download size={14} />
                            Download
                        </button>
                        <Link
                            href={route('sales.show', { id: saleItem.sale_id })}
                            className="btn btn-primary btn-sm no-print"
                        >
                            <Eye size={14} />
                            View Sale
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="btn btn-error btn-sm no-print"
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
                                        <p>{getVariantText()}</p>
                                        <span className="text-sm text-gray-500">
                                           ( {saleItem.variant?.sku || 'No SKU'})
                                        </span>
                                    </div>
                                    <div>
                                        <label className="label font-semibold">Brand Name</label>
                                        <p className="text-lg">{getBrandText() || 'N/A'}</p>
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
                                            {saleItem.sale?.discount || 0}%
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

            {/* Hidden Print View - COMPACT VERSION */}
            <div className="hidden">
                <div ref={printRef} className="print-p-3 compact">
                    {/* Header */}
                    <div className="print-text-center print-mb-4">
                        <div className="highlight-box print-mb-3">
                            <h1 className="print-text-xl print-font-bold">SALES ITEM RECEIPT</h1>
                            <p className="print-text-xs print-mt-1">Official Sales Item Confirmation</p>
                        </div>
                        
                        <div className="print-flex print-justify-center print-gap-4">
                            <div className="print-text-center">
                                <p className="print-text-xs print-font-medium print-text-gray-700">Receipt #</p>
                                <p className="print-text-sm print-font-bold print-text-blue-700">SALE-ITEM-{saleItem.id}</p>
                            </div>
                            <div className="print-text-center">
                                <p className="print-text-xs print-font-medium print-text-gray-700">Invoice</p>
                                <p className="print-text-sm print-font-bold print-text-blue-700">{saleItem.sale?.invoice_no || 'N/A'}</p>
                            </div>
                            <div className="print-text-center">
                                <p className="print-text-xs print-font-medium print-text-gray-700">Date</p>
                                <p className="print-text-sm print-font-bold print-text-blue-700">{formatDateForPrint(saleItem.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Company & Client Info */}
                    <div className="print-grid print-grid-cols-2 print-gap-3 print-mb-4">
                        <div className="info-card accent-border">
                            <h3 className="print-text-sm print-font-semibold print-mb-2 print-text-gray-800">FROM</h3>
                            <div className="print-space-y-1">
                                <p className="print-text-base print-font-bold print-text-gray-900">{saleItem.sale?.creator?.business?.name || 'Iduvisul'}</p>
                                <p className="print-text-xs print-text-gray-700">{saleItem.sale?.creator?.business?.address || '123 Business Street'}</p>
                                <p className="print-text-xs print-text-gray-700">{saleItem.sale?.creator?.business?.city || 'City'}, {saleItem.sale?.creator?.business?.country || 'Country'} {saleItem.sale?.creator?.business?.zip || '12345'}</p>
                                <p className="print-text-xs print-text-gray-700">{saleItem.sale?.creator?.business?.email || 'info@iduvisul.com'}</p>
                                <div className="print-mt-2">
                                    <span className="badge badge-primary">Sales Item</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-card accent-border">
                            <h3 className="print-text-sm print-font-semibold print-mb-2 print-text-gray-800">TO</h3>
                            <div className="print-space-y-1">
                                <p className="print-text-base print-font-bold print-text-gray-900">
                                    {saleItem.sale?.customer?.customer_name || 'Walk-in Customer'}
                                </p>
                                {saleItem.sale?.customer?.phone && (
                                    <p className="print-text-xs print-text-gray-700"> {saleItem.sale.customer.phone}</p>
                                )}
                                {saleItem.sale?.customer?.address && (
                                    <p className="print-text-xs print-text-gray-700"> {saleItem.sale.customer.address}</p>
                                )}
                                <div className="divider print-my-2"></div>
                                <p className="print-text-xs print-text-gray-600">Generated: {formatDate(new Date().toISOString())}</p>
                            </div>
                        </div>
                    </div>

                    {/* Product & Sale Details */}
                    <div className="section-header print-mb-3">PRODUCT & SALE DETAILS</div>
                    
                    <div className="print-grid print-grid-cols-2 print-gap-3 print-mb-4">
                        <div>
                            <div className="info-card print-p-2">
                                <h4 className="print-text-xs print-font-semibold print-text-gray-700 print-mb-2">Product Info</h4>
                                <div className="print-space-y-2">
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Product:</span>
                                        <span className="print-text-xs print-font-medium">{saleItem.product?.name || 'N/A'} ( {saleItem.product?.product_no || 'N/A'} )</span>
                                    </div>
                                     <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Brand:</span>
                                        <span className="print-text-xs print-font-medium">{getBrandText()}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Variant:</span>
                                        <span className="print-text-xs print-font-medium">{getVariantText()}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">SKU:</span>
                                        <span className="print-text-xs print-font-medium">{saleItem.variant?.sku || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="info-card print-p-2">
                                <h4 className="print-text-xs print-font-semibold print-text-gray-700 print-mb-2">Sale Info</h4>
                                <div className="print-space-y-2">
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Warehouse:</span>
                                        <span className="print-text-xs print-font-medium">{saleItem.warehouse?.name || 'N/A'}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Sold By:</span>
                                        <span className="print-text-xs print-font-medium">{saleItem.sale?.user?.name || 'System Admin'}</span>
                                    </div>
                                    <div className="print-flex print-justify-between">
                                        <span className="print-text-xs print-text-gray-600">Sale Date:</span>
                                        <span className="print-text-xs print-font-medium">{formatDateForPrint(saleItem.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="section-header print-mb-3">PRICING BREAKDOWN</div>
                    
                    <div className="print-mb-4">
                        <table className="table print-mb-3">
                            <thead>
                                <tr>
                                    <th className="print-text-left print-p-2">Item</th>
                                    <th className="print-text-right print-p-2">Qty</th>
                                    <th className="print-text-right print-p-2">Unit Price</th>
                                    <th className="print-text-right print-p-2">Disc%</th>
                                    <th className="print-text-right print-p-2">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="print-p-2 print-font-medium">{saleItem.product?.name}</td>
                                    <td className="print-p-2 print-text-right">{saleItem.quantity}</td>
                                    <td className="print-p-2 print-text-right">{parseFloat(saleItem.unit_price).toFixed(2)} Tk</td>
                                    <td className="print-p-2 print-text-right">{saleItem.sale?.discount || 0}%</td>
                                    <td className="print-p-2 print-text-right print-font-semibold">
                                        {(saleItem.unit_price * saleItem.quantity).toFixed(2)} Tk
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="print-flex print-justify-end">
                            <div className="print-w-48 print-space-y-2">
                                <div className="print-flex print-justify-between">
                                    <span className="print-text-xs print-text-gray-600">Subtotal:</span>
                                    <span className="print-text-xs print-font-medium">{(saleItem.unit_price * saleItem.quantity).toFixed(2)} Tk</span>
                                </div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-text-xs print-text-gray-600">Discount:</span>
                                    <span className="print-text-xs print-font-medium print-text-red-600">
                                        -{((saleItem.unit_price * saleItem.quantity * (saleItem.sale?.discount || 0)) / 100).toFixed(2)} Tk
                                    </span>
                                </div>
                                <div className="divider print-my-2"></div>
                                <div className="print-flex print-justify-between">
                                    <span className="print-text-sm print-font-bold print-text-gray-900">Total:</span>
                                    <span className="print-text-base print-font-bold print-text-green-600">
                                        {calculateItemTotal()} Tk
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="section-header print-mb-3">SUMMARY</div>
                    
                    <div className="print-grid print-grid-cols-4 print-gap-2 print-mb-4">
                        <div className="print-p-2 print-bg-blue-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-blue-700 print-mb-1">UNIT PRICE</div>
                            <div className="print-text-sm print-font-bold print-text-gray-900">{parseFloat(saleItem.unit_price).toFixed(2)} Tk</div>
                        </div>
                        <div className="print-p-2 print-bg-blue-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-blue-700 print-mb-1">QUANTITY</div>
                            <div className="print-text-sm print-font-bold print-text-gray-900">{saleItem.quantity}</div>
                        </div>
                        <div className="print-p-2 print-bg-blue-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-blue-700 print-mb-1">DISCOUNT</div>
                            <div className="print-text-sm print-font-bold print-text-gray-900">{saleItem.sale?.discount || 0}%</div>
                        </div>
                        <div className="print-p-2 print-bg-blue-50 print-rounded print-text-center">
                            <div className="print-text-xs print-font-medium print-text-blue-700 print-mb-1">TOTAL</div>
                            <div className="print-text-sm print-font-bold print-text-white">{calculateItemTotal()} Tk</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="divider print-mb-3"></div>
                    
                    <div className="print-text-center">
                        <p className="print-text-xs print-font-medium print-text-gray-700 print-mb-2">
                            Thank you for your business!
                        </p>
                        <p className="print-text-xs print-text-gray-500">
                            Computer-generated receipt • No signature required
                        </p>
                        <div className="print-mt-3 print-text-xs print-text-gray-400">
                            <p>{saleItem.sale?.creator?.business?.name || 'Iduvisul'} • Email: {saleItem.sale?.creator?.email || 'info@iduvisul.com'}</p>
                            <p className="print-mt-1">Generated: {formatDate(new Date().toISOString())}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}