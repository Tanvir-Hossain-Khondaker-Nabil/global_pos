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
            <div className="p-5 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link 
                                href={route('sales.index')}
                                className="btn btn-ghost btn-sm btn-circle"
                            >
                                <ArrowLeft size={16} />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Sale Invoice
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            Invoice #: <span className="font-mono font-semibold">{sale.invoice_no}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
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
                        <button
                            onClick={handleEmail}
                            className="btn btn-outline btn-sm"
                        >
                            <Mail size={16} />
                            Email
                        </button>
                        {auth.role === 'admin' && (
                            <>
                                <Link
                                    href={route('sales.edit', { sale: sale.id })}
                                    className="btn btn-warning btn-sm"
                                >
                                    <Edit size={16} />
                                    Edit
                                </Link>
                                <Link
                                    href={route('sales.destroy', { sale: sale.id })}
                                    method="delete"
                                    as="button"
                                    onClick={(e) => {
                                        if (!confirm("Are you sure you want to delete this sale? This action cannot be undone.")) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className="btn btn-error btn-sm"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Company Info */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Company Information</h2>
                        <div className="bg-gray-50 p-4 rounded-box">
                            <p className="font-bold text-lg">Your Company Name</p>
                            <p className="text-gray-600">Company Address Line 1</p>
                            <p className="text-gray-600">Company Address Line 2</p>
                            <p className="text-gray-600">Phone: +880 XXXX-XXXXXX</p>
                            <p className="text-gray-600">Email: company@example.com</p>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Invoice Details</h2>
                        <div className="bg-gray-50 p-4 rounded-box space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Invoice No:</span>
                                <span className="font-semibold">{sale.invoice_no}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Date:</span>
                                <span>{formatDate(sale.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`badge capitalize ${
                                    sale.status === 'completed' 
                                        ? 'badge-success' 
                                        : sale.status === 'cancelled'
                                        ? 'badge-error'
                                        : 'badge-warning'
                                }`}>
                                    {sale.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Type:</span>
                                <span className="capitalize">{sale.payment_type}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer and Shipping Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Customer Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Customer Information</h2>
                        <div className="bg-gray-50 p-4 rounded-box">
                            <p className="font-semibold text-gray-900">
                                {sale.customer?.customer_name || 'Walk-in Customer'}
                            </p>
                            {sale.customer?.phone && (
                                <p className="text-gray-600">Phone: {sale.customer.phone}</p>
                            )}
                            {sale.customer?.email && (
                                <p className="text-gray-600">Email: {sale.customer.email}</p>
                            )}
                            {sale.customer?.address && (
                                <p className="text-gray-600">Address: {sale.customer.address}</p>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Summary</h2>
                        <div className="bg-gray-50 p-4 rounded-box space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Items:</span>
                                <span className="font-semibold">{totalItems}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Status:</span>
                                <span className={`font-semibold ${
                                    sale.due_amount > 0 ? 'text-error' : 'text-success'
                                }`}>
                                    {sale.due_amount > 0 ? 'Partial Payment' : 'Fully Paid'}
                                </span>
                            </div>
                            {sale.due_amount > 0 && (
                                <div className="flex justify-between text-error">
                                    <span>Due Amount:</span>
                                    <span className="font-semibold">{formatCurrency(sale.due_amount)} Tk</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-auto w-full">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="text-left">Product</th>
                                    <th className="text-center">Variant</th>
                                    <th className="text-center">Warehouse</th>
                                    <th className="text-center">Quantity</th>
                                    <th className="text-right">Unit Price</th>
                                    <th className="text-right">Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items?.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td>
                                            <div>
                                                <p className="font-semibold">{item.product?.name}</p>
                                                <p className="text-sm text-gray-500">SKU: {item.product?.product_no || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {item.variant?.size || 'Default'} ({item.variant?.color || ' '})
                                        </td>
                                        <td className="text-center">
                                            {item.warehouse?.name || 'N/A'}
                                        </td>
                                        <td className="text-center">
                                            {item.quantity}
                                        </td>
                                        <td className="text-right font-semibold">
                                            {formatCurrency(item.unit_price)} Tk
                                        </td>
                                        <td className="text-right font-semibold text-primary">
                                            {formatCurrency(item.total_price)} Tk
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-start-3">
                        <div className="bg-gray-50 p-6 rounded-box space-y-3">
                            <div className="flex justify-between text-lg">
                                <span className="text-gray-600">Sub Total:</span>
                                <span className="font-semibold">{formatCurrency(sale.sub_total)} Tk</span>
                            </div>
                            
                            {sale.discount > 0 && (
                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-600">Discount:</span>
                                    <span className="font-semibold text-error">{formatCurrency(sale.discount)} %</span>
                                </div>
                            )}
                            
                            {sale.vat_tax > 0 && (
                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-600">Vat/Tax:</span>
                                    <span className="font-semibold text-warning">{formatCurrency(sale.vat_tax)} %</span>
                                </div>
                            )}
                            
                            <div className="border-t border-gray-300 pt-3">
                                <div className="flex justify-between text-xl font-bold">
                                    <span>Grand Total:</span>
                                    <span className="text-primary">{formatCurrency(sale.grand_total)} Tk</span>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-300 pt-3">
                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-600">Paid Amount:</span>
                                    <span className="font-semibold text-success">{formatCurrency(sale.paid_amount)} Tk</span>
                                </div>
                                {sale.due_amount > 0 && (
                                    <div className="flex justify-between text-lg">
                                        <span className="text-gray-600">Due Amount:</span>
                                        <span className="font-semibold text-error">{formatCurrency(sale.due_amount)} Tk</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {sale.notes && (
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h2>
                        <div className="bg-gray-50 p-4 rounded-box">
                            <p className="text-gray-700">{sale.notes}</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">If you have any questions about this invoice, please contact us.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .btn, .flex.lg\\:flex-row {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .rounded-box {
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }
                    .bg-gray-50 {
                        background-color: #f9fafb !important;
                    }
                }
            `}</style>
        </div>
    );
}