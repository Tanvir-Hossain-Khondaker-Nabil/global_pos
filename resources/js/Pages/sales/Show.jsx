import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, Edit, Trash2, ChevronRight, Package2, User, DollarSign, Calendar, CheckCircle, Truck } from 'lucide-react';

export default function SaleShow({ sale }) {
    const { auth } = usePage().props;

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) amount = 0;
        return parseFloat(amount).toFixed(2);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Format date with time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Calculate total items
    const getTotalItems = () => {
        return sale.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
    };

    // Handle print
    const handlePrint = () => {
        window.open(route('sales.print', sale.id), '_blank');
    };

    // Handle PDF download
    const handleDownloadPDF = () => {
        const printWindow = window.open(route('sales.print', sale.id), '_blank');
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    };

    // Get variant display name
    const getVariantDisplayName = (variant) => {
        if (!variant) return 'N/A';
        
        const parts = [];
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${value}`)
                    .join(', ');
                parts.push(attrs);
            } else {
                parts.push(variant.attribute_values);
            }
        }
        
        return parts.join(', ') || 'N/A';
    };

    // Get brand name
    const getBrandName = (variant) => {
        if (!variant) return 'N/A';
        
        const parts = [];
        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${key}`)
                    .join(', ');
                parts.push(attrs);
            } else {
                parts.push(variant.attribute_values);
            }
        }
        
        return parts.join(', ') || 'N/A';
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'error';
            default: return 'neutral';
        }
    };

    // Get payment status color
    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'success';
            case 'partial': return 'warning';
            case 'unpaid': return 'error';
            default: return 'neutral';
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4">
            {/* Header Actions */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="bg-red-700 text-white py-1 px-4 text-xs font-bold inline-block mb-2">
                            {sale.type === 'inventory' ? 'INVENTORY SALE' : 'POS SALE'}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {sale.type === 'inventory' ? 'Inventory Sale' : 'POS Sale'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <span>Invoice: {sale.invoice_no}</span>
                            <ChevronRight size={12} />
                            <span>Customer: {sale.customer?.customer_name || 'Walk-in Customer'}</span>
                            <ChevronRight size={12} />
                            <span>{formatDate(sale.created_at)}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('sales.index')}
                            className="btn btn-sm btn-ghost border border-gray-300"
                        >
                            <ArrowLeft size={15} className="mr-1" />
                            Back to Sales
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
                        >
                            <Printer size={15} className="mr-1" />
                            Print Invoice
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="btn btn-sm bg-gray-800 hover:bg-gray-900 text-white"
                        >
                            <Download size={15} className="mr-1" />
                            Download PDF
                        </button>
                        {auth.role === 'admin' && (
                            <Link
                                href={route('sales.edit', { sale: sale.id })}
                                className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Edit size={15} className="mr-1" />
                                Edit Sale
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice Design */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
                {/* Company Header */}
                <div className="flex items-center border-b border-black pb-4 mb-4">
                    <div className="mr-4 flex-shrink-0">
                        <svg className="h-10 w-10 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <div className="flex-grow">
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            {sale.type === 'inventory' ? 'INVENTORY SALE INVOICE' : 'POS SALE INVOICE'}
                        </h1>
                        <p className="text-xs text-gray-600">Official sales invoice document</p>
                    </div>

                    <div className="w-1/3 flex text-xs text-gray-700">
                        <div className="w-55 pr-4 border-r border-gray-300">
                            <p className="font-bold uppercase text-xs">Head Office</p>
                            <p className="text-xs leading-tight mt-1">{sale?.creator?.business?.address || 'Business Address'}</p>
                            <p className="font-semibold text-xs mt-1">PH: {sale?.creator?.business?.phone || 'N/A'}</p>
                            <p className="text-xs mt-1">Email: {sale?.creator?.business?.email || 'N/A'}</p>
                        </div>
                        <div className="w-45 pl-4">
                            <p className="font-bold uppercase text-xs">Dhaka Office</p>
                            <p className="text-xs leading-tight mt-1">358, Babor Road, Shyamoli, Dhaka</p>
                            <p className="font-semibold text-xs mt-1">PH: 02-58133544</p>
                        </div>
                    </div>
                </div>
                
                {/* Invoice Details Grid */}
                <div className="grid grid-cols-4 gap-4 text-xs py-4 border-b border-gray-200">
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Bill No.</span>
                            <span className="font-mono">{sale.invoice_no}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Delivery Date</span>
                            <span>{formatDate(sale.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Bill To</span>
                            <span className="text-right">{sale.customer?.customer_name || 'Walk-in Customer'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Address</span>
                            <span className="text-right text-xs">{sale.customer?.address || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Invoice No.</span>
                            <span className="font-mono">{sale.invoice_no}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Project</span>
                            <span>{sale.type === 'inventory' ? 'Inventory Sale' : 'POS Sale'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Delivered By</span>
                            <span>{sale.delivered_by || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Ref No.</span>
                            <span>{sale.reference_no || sale.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Served By</span>
                            <span>{sale.creator?.name || auth.user?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Terms</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPaymentStatusColor(sale.payment_status)}`}>
                                {sale.payment_type?.toUpperCase() || 'CASH'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Warehouse</span>
                            <span>{sale.warehouse?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Code</span>
                            <span>{sale.warehouse?.code || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Status</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(sale.status)}`}>
                                {sale.status?.toUpperCase() || 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                            <Package2 className="inline mr-2" size={18} />
                            Sale Items ({sale.items?.length || 0})
                        </h3>
                        <div className="text-sm text-gray-600">
                            Total Quantity: <span className="font-bold">{getTotalItems()}</span> units
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-black">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="w-[3%] p-2 border-r border-gray-600">SL</th>
                                    <th className="w-[10%] p-2 border-r border-gray-600">Part No.</th>
                                    <th className="w-[25%] p-2 border-r border-gray-600 text-left">Description</th>
                                    <th className="w-[10%] p-2 border-r border-gray-600">Model</th>
                                    <th className="w-[10%] p-2 border-r border-gray-600">Brand</th>
                                    <th className="w-[5%] p-2 border-r border-gray-600">Qty.</th>
                                    <th className="w-[10%] p-2 border-r border-gray-600">Pcs.</th>
                                    <th className="w-[7%] p-2 border-r border-gray-600">Price</th>
                                    <th className="w-[7%] p-2 border-r border-gray-600">Discount</th>
                                    <th className="w-[8%] p-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items?.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-200">
                                        <td className="p-2 border-r border-gray-200 text-center">{index + 1}</td>
                                        <td className="p-2 border-r border-gray-200 text-center font-mono">
                                            {item.product?.product_no || item.product_id || 'N/A'}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-left">
                                            <div className="font-medium">{item.product?.name || 'N/A'}</div>
                                            {item.variant && (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {getVariantDisplayName(item.variant)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-center">
                                            {getVariantDisplayName(item.variant)}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-center">
                                            {getBrandName(item.variant)}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-center font-bold">
                                            {item.quantity}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-center font-mono">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-right font-mono">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-right">
                                            {sale.discount || 0}%
                                        </td>
                                        <td className="p-2 text-right font-mono font-bold text-blue-600">
                                            {formatCurrency(item.total_price)}
                                        </td>
                                    </tr>
                                ))}
                                {(!sale.items || sale.items.length === 0) && (
                                    <tr>
                                        <td colSpan="10" className="p-4 text-center text-gray-500">
                                            No items found in this sale
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                <tr>
                                    <td colSpan="5" className="p-2 text-right font-bold">
                                        GRAND TOTAL:
                                    </td>
                                    <td className="p-2 text-center font-bold">{getTotalItems()}</td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                    <td className="p-2"></td>
                                    <td className="p-2 text-right font-bold text-lg text-blue-600">
                                        {formatCurrency(sale.grand_total)} Tk
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-4 text-xs pt-4 mt-6 border-t border-gray-300">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">Sub Total:</span>
                            <span>{formatCurrency(sale.sub_total)} Tk</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Tax (VAT):</span>
                            <span>{formatCurrency(sale.vat_tax)} Tk</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">Discount:</span>
                            <span className="text-red-600">-{sale.discount || 0}%</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Grand Total:</span>
                            <span className="text-green-600">{formatCurrency(sale.grand_total)} Tk</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">Paid Amount:</span>
                            <span className="text-blue-600">{formatCurrency(sale.paid_amount)} Tk</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Due Amount:</span>
                            <span className="text-orange-600">{formatCurrency(sale.due_amount)} Tk</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">Payment Method:</span>
                            <span className="font-bold">{sale.payment_type?.toUpperCase() || 'CASH'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Payment Status:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPaymentStatusColor(sale.payment_status)}`}>
                                {sale.payment_status?.toUpperCase() || 'UNPAID'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Detailed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Customer Card */}
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-100 p-2 rounded">
                                <User size={16} className="text-blue-600" />
                            </div>
                            <h4 className="font-bold text-sm text-blue-700">Customer Information</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Name:</span>
                                <span className="font-medium">{sale.customer?.customer_name || 'Walk-in Customer'}</span>
                            </div>
                            {sale.customer?.phone && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Phone:</span>
                                    <span className="font-medium">{sale.customer.phone}</span>
                                </div>
                            )}
                            {sale.customer?.email && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Email:</span>
                                    <span className="font-medium">{sale.customer.email}</span>
                                </div>
                            )}
                            {sale.customer?.address && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Address:</span>
                                    <span className="font-medium text-xs">{sale.customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sale Information Card */}
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-green-100 p-2 rounded">
                                <Calendar size={16} className="text-green-600" />
                            </div>
                            <h4 className="font-bold text-sm text-green-700">Sale Information</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Sale Type:</span>
                                <span className="font-medium">{sale.type === 'inventory' ? 'Inventory' : 'POS'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Invoice Date:</span>
                                <span className="font-medium">{formatDateTime(sale.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Sold By:</span>
                                <span className="font-medium">{sale.creator?.name || 'System Admin'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Sale Status:</span>
                                <span className={`font-medium ${sale.status === 'completed' ? 'text-green-600' : sale.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {sale.status?.toUpperCase() || 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information Card */}
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-purple-100 p-2 rounded">
                                <DollarSign size={16} className="text-purple-600" />
                            </div>
                            <h4 className="font-bold text-sm text-purple-700">Payment Information</h4>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Payment Method:</span>
                                <span className="font-medium">{sale.payment_type?.toUpperCase() || 'CASH'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Payment Status:</span>
                                <span className={`font-medium ${sale.payment_status === 'paid' ? 'text-green-600' : sale.payment_status === 'partial' ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {sale.payment_status?.toUpperCase() || 'UNPAID'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Paid Amount:</span>
                                <span className="font-medium text-blue-600">{formatCurrency(sale.paid_amount)} Tk</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700">Due Amount:</span>
                                <span className="font-medium text-orange-600">{formatCurrency(sale.due_amount)} Tk</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Signature Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs border-t border-black pt-4 mt-6">
                    <div className="col-span-2">
                        <p className="font-bold border-b border-dashed border-black w-2/3 text-center mb-2">Checked By</p>
                        <p className="text-xs text-gray-700">
                            (Name, seal, time) checked and verified the sale. (All materials checked, verified, and sealed as per company policy.)
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold border-b border-dashed border-black w-2/3 mx-auto mb-2">Authorised</p>
                        <p className="text-xs text-gray-700">(Signature & Seal)</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold border-b border-dashed border-black w-2/3 mx-auto mb-2">Received</p>
                        <p className="text-xs text-gray-700">(Signature & Seal)</p>
                    </div>
                    <div className="col-span-4 text-right">
                        <div className="inline-block text-left">
                            <p className="font-bold border-b border-dashed border-black mb-2">Delivery By</p>
                            <p className="text-[0.6rem] text-gray-600">Software by TETRA SOFT</p>
                            <p className="text-[0.6rem] text-gray-600">Phone 01911-387001</p>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {sale.notes && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-bold text-sm mb-2">Additional Notes</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{sale.notes}</p>
                    </div>
                )}

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-red-100 p-1.5 rounded">
                                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-700">Total Items</p>
                                <p className="text-sm font-bold">{sale.items?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded">
                                <Package2 size={16} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-700">Total Quantity</p>
                                <p className="text-sm font-bold">{getTotalItems()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded">
                                <DollarSign size={16} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-700">Grand Total</p>
                                <p className="text-sm font-bold">{formatCurrency(sale.grand_total)} Tk</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-1.5 rounded">
                                <CheckCircle size={16} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-700">Payment Status</p>
                                <p className={`text-sm font-bold ${sale.payment_status === 'paid' ? 'text-green-600' : sale.payment_status === 'partial' ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {sale.payment_status?.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}