import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, Mail, Edit, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function SaleShow({ sale }) {
    const { auth } = usePage().props;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-GB", {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Format date only (for print title)
    const formatDateOnly = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Calculate totals
    const totalItems = sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Implement PDF download functionality
        console.log('Download PDF');
    };

    const handleEmail = () => {
        // Implement email functionality
        console.log('Email invoice');
    };

    return (
        <div className="bg-white rounded-box">
       

            {/* Header */}
            <div className="p-5 border-b border-gray-200 print:p-2 print:border-b-2 print:hidden">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="print:w-full">
                        <div className="flex items-center gap-2 mb-2 print:mb-1">
                            <Link 
                                href={route('sales.index')}
                                className="btn btn-ghost btn-sm btn-circle print:hidden"
                            >
                                <ArrowLeft size={16} />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
                                Sale Invoice ({sale.type === 'inventory' ? 'Inventory' : 'POS'})
                            </h1>
                        </div>
                        <p className="text-gray-600 print:text-sm">
                            Invoice #: <span className="font-mono font-semibold">{sale.invoice_no}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap print:hidden">
                        <button
                            onClick={handlePrint}
                            className="btn btn-primary btn-sm"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            className="btn btn-outline btn-sm"
                        >
                            <Download size={16} />
                            Download
                        </button>
                        {auth.role === 'admin' && (
                            <>
                                <Link
                                    href={route('sales.edit', { sale: sale.id })}
                                    className="btn btn-warning btn-sm"
                                >
                                    <Edit size={16} />
                                    View Detais
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5 print:p-3">
                {/* Print Title Banner - Only in print view */}
                <div className="hidden print:flex print:justify-between print:items-center print:mb-6 print:p-4 print:bg-gray-50 print:border print:border-gray-300">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {sale.type === 'inventory' ? 'INVENTORY SALES INVOICE' : 'POS SALES INVOICE'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            <strong>Invoice No:</strong> {sale.invoice_no}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="bg-primary text-white px-4 py-2 rounded">
                            <h2 className="text-lg font-bold">SALES REPORT</h2>
                            <p className="text-sm opacity-90">
                                Date: {formatDateOnly(sale.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Invoice Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:mb-4 print:grid-cols-2 print:gap-4">
                    {/* Company Info */}
                    <div className="lg:col-span-2 print:col-span-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 print:text-base print:mb-1">Company Information</h2>
                        <div className="bg-gray-50 p-4 rounded-box print:p-3 print:bg-transparent print:border print:border-gray-300">
                            <p className="font-bold text-lg print:text-base">{sale?.creator?.business?.name || 'Business Name'}</p>
                            <p className="text-gray-600 print:text-sm">{sale?.creator?.business?.address || 'Business Address'}</p>
                            <p className="text-gray-600 print:text-sm">Phone: {sale?.creator?.business?.phone || 'Business Phone'}</p>
                            <p className="text-gray-600 print:text-sm">Email: {sale?.creator?.business?.email || 'Business Email'}</p>
                            {sale?.creator?.business?.website && (
                                <p className="text-gray-600 print:text-sm">Website: {sale?.creator?.business?.website}</p>
                            )}
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="print:col-span-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 print:text-base print:mb-1">Invoice Details</h2>
                        <div className="bg-gray-50 p-4 rounded-box space-y-2 print:p-3 print:bg-transparent print:border print:border-gray-300">
                            <div className="flex justify-between print:text-sm">
                                <span className="text-gray-600">Invoice No:</span>
                                <span className="font-semibold">{sale.invoice_no}</span>
                            </div>
                            <div className="flex justify-between print:text-sm">
                                <span className="text-gray-600">Date:</span>
                                <span>{formatDate(sale.created_at)}</span>
                            </div>
                            <div className="flex justify-between print:text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`badge capitalize ${
                                    sale.status === 'completed' 
                                        ? 'badge-success' 
                                        : sale.status === 'cancelled'
                                        ? 'badge-error'
                                        : 'badge-warning'
                                } print:border print:border-gray-800 print:bg-transparent print:text-gray-800 print:font-normal`}>
                                    {sale.status}
                                </span>
                            </div>
                            <div className="flex justify-between print:text-sm">
                                <span className="text-gray-600">Payment Type:</span>
                                <span className="capitalize">{sale.payment_type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer and Shipping Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:mb-4 print:gap-4">
                    {/* Customer Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 print:text-base print:mb-1">Customer Information</h2>
                        <div className="bg-gray-50 p-4 rounded-box print:p-3 print:bg-transparent print:border print:border-gray-300">
                            <p className="font-semibold text-gray-900 print:text-base">
                                {sale.customer?.customer_name || 'Walk-in Customer'}
                            </p>
                            {sale.customer?.phone && (
                                <p className="text-gray-600 print:text-sm">Phone: {sale.customer.phone}</p>
                            )}
                            {sale.customer?.email && (
                                <p className="text-gray-600 print:text-sm">Email: {sale.customer.email}</p>
                            )}
                            {sale.customer?.address && (
                                <p className="text-gray-600 print:text-sm">Address: {sale.customer.address}</p>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 print:text-base print:mb-1">Order Summary</h2>
                        <div className="bg-gray-50 p-4 rounded-box space-y-2 print:p-3 print:bg-transparent print:border print:border-gray-300">
                            <div className="flex justify-between print:text-sm">
                                <span className="text-gray-600">Total Items:</span>
                                <span className="font-semibold">{totalItems}</span>
                            </div>
                            <div className="flex justify-between print:text-sm">
                                <span className="text-gray-600">Payment Status:</span>
                                <span className={`font-semibold ${
                                    sale.due_amount > 0 ? 'text-error' : 'text-success'
                                } print:font-normal`}>
                                    {sale.due_amount > 0 ? 'Partial Payment' : 'Fully Paid'}
                                </span>
                            </div>
                            {sale.due_amount > 0 && (
                                <div className="flex justify-between text-error print:text-sm">
                                    <span>Due Amount:</span>
                                    <span className="font-semibold print:font-normal">{formatCurrency(sale.due_amount)} Tk</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8 print:mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 print:text-base">Order Items</h2>
                        <div className="print:block hidden print:text-sm print:text-gray-600">
                            Total Items: {totalItems}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-auto w-full print:text-sm">
                            <thead className="bg-primary text-white print:bg-gray-800">
                                <tr>
                                    <th className="text-left p-2 print:p-1">Product</th>
                                    <th className="text-left p-2 print:p-1">Brand</th>
                                    <th className="text-center p-2 print:p-1">Variant</th>
                                    <th className="text-center p-2 print:p-1">Warehouse</th>
                                    <th className="text-center p-2 print:p-1">Quantity</th>
                                    <th className="text-right p-2 print:p-1">Unit Price</th>
                                    <th className="text-right p-2 print:p-1">Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items?.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 print:border-b print:border-gray-300">
                                        <td className="p-2 print:p-1">
                                            <div>
                                                <p className="font-semibold print:font-normal">{item.product?.name || item?.product_name}</p>
                                                <p className="text-sm text-gray-500 print:text-xs">SKU: {item.product?.product_no || item?.product_name}</p>
                                            </div>
                                        </td>
                                        <td className='text-left p-2 print:p-1'>
                                            {item.variant && (
                                                <>
                                               {(() => {
                                                    const variant = item.variant;
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

                                                    return <>{attrsText || 'N/A'}</>;
                                                })()}<br />

                                                </>
                                            )}
                                            {item?.brand }
                                        </td>
                                        
                                        <td className="text-center p-2 print:p-1">
                                            {item.variant && (
                                                <>
                                                {(() => {
                                                    const variant = item.variant;
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

                                                    return <>{attrsText || 'N/A'}</>;
                                                })()}


                                                <br />
                                                <span className="text-sm text-gray-500 print:text-xs">
                                                    {item.variant?.sku || 'No SKU'}
                                                </span>
                                                </>
                                            )}

                                            {item?.variant_name }
                                        </td>

                                        <td className="text-center p-2 print:p-1">
                                            {item.warehouse?.name || 'N/A'}
                                        </td>
                                        <td className="text-center p-2 print:p-1">
                                            {item.quantity}
                                        </td>
                                        <td className="text-right font-semibold p-2 print:p-1 print:font-normal">
                                            {formatCurrency(item.unit_price)} Tk
                                        </td>
                                        <td className="text-right font-semibold text-primary p-2 print:p-1 print:font-normal">
                                            {formatCurrency(item.total_price)} Tk
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
                    <div className="lg:col-start-3">
                        <div className="bg-gray-50 p-6 rounded-box space-y-3 print:p-4 print:bg-transparent print:border print:border-gray-300">
                            <div className="flex justify-between text-lg print:text-base">
                                <span className="text-gray-600">Sub Total:</span>
                                <span className="font-semibold print:font-normal">{formatCurrency(sale.sub_total)} Tk</span>
                            </div>
                            
                            {sale.discount > 0 && (
                                <div className="flex justify-between text-lg print:text-base">
                                    <span className="text-gray-600">Discount:</span>
                                    <span className="font-semibold text-error print:font-normal">{formatCurrency(sale.discount)} %</span>
                                </div>
                            )}
                            
                            {sale.vat_tax > 0 && (
                                <div className="flex justify-between text-lg print:text-base">
                                    <span className="text-gray-600">Vat/Tax:</span>
                                    <span className="font-semibold text-warning print:font-normal">{formatCurrency(sale.vat_tax)} %</span>
                                </div>
                            )}
                            
                            <div className="border-t border-gray-300 pt-3 print:pt-2">
                                <div className="flex justify-between text-xl font-bold print:text-lg">
                                    <span>Grand Total:</span>
                                    <span className="text-primary">{formatCurrency(sale.grand_total)} Tk</span>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-300 pt-3 print:pt-2">
                                <div className="flex justify-between text-lg print:text-base">
                                    <span className="text-gray-600">Paid Amount:</span>
                                    <span className="font-semibold text-success print:font-normal">{formatCurrency(sale.paid_amount)} Tk</span>
                                </div>
                                {sale.due_amount > 0 && (
                                    <div className="flex justify-between text-lg print:text-base">
                                        <span className="text-gray-600">Due Amount:</span>
                                        <span className="font-semibold text-error print:font-normal">{formatCurrency(sale.due_amount)} Tk</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {sale.notes && (
                    <div className="mt-8 print:mt-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 print:text-base print:mb-1">Additional Notes</h2>
                        <div className="bg-gray-50 p-4 rounded-box print:p-3 print:bg-transparent print:border print:border-gray-300">
                            <p className="text-gray-700 print:text-sm">{sale.notes}</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm print:mt-8 print:pt-4 print:text-xs">
                    <p>Thank you for your business!</p>
                    <p className="mt-1 print:mt-0">If you have any questions about this invoice, please contact us.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0.8cm;
                    }
                    
                    body {
                        background: white !important;
                        font-size: 12px !important;
                        line-height: 1.2 !important;
                        color: #000 !important;
                    }
                    
                    .btn, .flex.lg\\:flex-row, .print\\:hidden {
                        display: none !important;
                    }
                    
                    .rounded-box {
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                    }
                    
                    .bg-gray-50 {
                        background-color: #f9fafb !important;
                    }
                    
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    
                    th, td {
                        padding: 4px 6px !important;
                        border: 1px solid #ddd !important;
                    }
                    
                    th {
                        background-color: #333 !important;
                        color: #fff !important;
                        font-weight: bold !important;
                    }
                    
                    .badge {
                        padding: 2px 6px !important;
                        border: 1px solid #000 !important;
                        background: none !important;
                        color: #000 !important;
                        font-size: 10px !important;
                    }
                    
                    /* Print title banner styling */
                    .print\\:bg-gray-50 {
                        background-color: #f0f0f0 !important;
                    }
                    
                    /* Ensure the entire invoice fits on one page */
                    div {
                        page-break-inside: avoid !important;
                    }
                    
                    h1, h2, h3 {
                        page-break-after: avoid !important;
                    }
                    
                    table {
                        page-break-inside: auto !important;
                    }
                    
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto !important;
                    }
                    
                    /* Sales Report Title Styling */
                    .bg-primary {
                        background-color: #4a5568 !important; /* Dark gray for better print visibility */
                        color: white !important;
                        padding: 8px 12px !important;
                        border-radius: 4px !important;
                    }
                    
                    /* Make sure all text is black for better readability */
                    .text-gray-900, .text-gray-800, .text-gray-700, .text-gray-600 {
                        color: #000 !important;
                    }
                    
                    /* Lighten borders for better print */
                    .border-gray-300 {
                        border-color: #ccc !important;
                    }
                }
            `}</style>
        </div>
    );
}