import React from 'react';
import { usePage } from '@inertiajs/react';
import { Printer, Download, Mail, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function Invoice({ sale }) {
    const { auth } = usePage().props;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    // Format date for receipt
    const formatReceiptDate = (date) => {
        return new Date(date).toLocaleString('en-BD', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    // Calculate total items
    const getTotalItems = () => {
        return sale.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle PDF download
    const handleDownloadPDF = async () => {
        try {
            const printWindow = window.open('', '_blank');
            const receiptHTML = generateReceiptHTML();
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice ${sale.invoice_no}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap');
                        
                        body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 12px; 
                            margin: 0; 
                            padding: 8px; 
                            max-width: 80mm;
                            background: white;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 10px; 
                            border-bottom: 2px solid #000;
                            padding-bottom: 8px;
                        }
                        .company-name { 
                            font-weight: bold; 
                            font-size: 16px; 
                            margin-bottom: 4px;
                        }
                        .receipt-info { 
                            margin: 8px 0; 
                            padding: 8px 0;
                            border-bottom: 1px dashed #ccc;
                        }
                        .barcode { 
                            text-align: center; 
                            margin: 10px 0; 
                            padding: 8px 0;
                            border-bottom: 1px dashed #ccc;
                        }
                        .barcode-text {
                            font-family: 'Libre Barcode 128', cursive;
                            font-size: 32px;
                            line-height: 1;
                        }
                        .items-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 10px 0; 
                        }
                        .items-table td { 
                            padding: 3px 0; 
                            border-bottom: 1px dashed #ccc; 
                            vertical-align: top;
                        }
                        .summary { 
                            margin-top: 10px; 
                            padding-top: 10px; 
                            border-top: 2px solid #000; 
                        }
                        .footer { 
                            text-align: center; 
                            margin-top: 15px; 
                            font-size: 10px; 
                            border-top: 1px dashed #ccc;
                            padding-top: 8px;
                        }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .text-bold { font-weight: bold; }
                        .border-top { border-top: 1px dashed #000; }
                        @media print { 
                            body { margin: 0; padding: 5px; }
                        }
                    </style>
                </head>
                <body>
                    ${receiptHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            
            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
                // Optional: close window after print
                // setTimeout(() => printWindow.close(), 500);
            }, 500);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to regular print
            window.print();
        }
    };

    // Generate barcode-like representation
    const generateBarcode = (text) => {
        return `*${text}*`;
    };

    // Generate compact receipt HTML for PDF
    const generateReceiptHTML = () => {
        return `
            <div class="header">
                <div class="company-name">YOUR STORE NAME</div>
                <div>Store Address Line 1</div>
                <div>Store Address Line 2, Dhaka</div>
                <div>Phone: +880 XXXX-XXXXXX</div>
                <div>VAT: XXXXXXXX</div>
            </div>
            
            <div class="receipt-info">
                <div><strong>INVOICE: ${sale.invoice_no}</strong></div>
                <div>Date: ${formatReceiptDate(sale.created_at)}</div>
                <div>Customer: ${sale.customer?.customer_name || "Walk-in Customer"}</div>
                ${sale.customer?.phone ? `<div>Phone: ${sale.customer.phone}</div>` : ''}
            </div>

            <div class="barcode">
                <div class="barcode-text">${generateBarcode(sale.invoice_no)}</div>
                <div style="font-size: 10px; margin-top: -5px;">${sale.invoice_no}</div>
            </div>

            <table class="items-table">
                <tbody>
                    ${sale.items?.map(item => `
                        <tr>
                            <td>${item.product?.name}</td>
                            <td class="text-center">${item.quantity} x ${formatCurrency(item.unit_price)}</td>
                            <td class="text-right">${formatCurrency(item.total_price)}</td>
                        </tr>
                        ${item.variant?.name ? `<tr><td colspan="3" style="font-size: 10px; padding-left: 10px;">↳ ${item.variant.name}</td></tr>` : ''}
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <div style="display: flex; justify-content: space-between;">
                    <span>Sub Total:</span>
                    <span>${formatCurrency(sale.sub_total)} Tk</span>
                </div>
                ${sale.discount > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Discount:</span>
                    <span>-${formatCurrency(sale.discount)} Tk</span>
                </div>
                ` : ''}
                ${sale.tax > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Tax:</span>
                    <span>${formatCurrency(sale.tax)} Tk</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px;">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(sale.grand_total)} Tk</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Paid:</span>
                    <span>${formatCurrency(sale.paid_amount)} Tk</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Due:</span>
                    <span>${formatCurrency(sale.due_amount)} Tk</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px;">
                    <span>Payment:</span>
                    <span class="text-bold">${sale.payment_method || 'Cash'}</span>
                </div>
                ${sale.payment_reference ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Reference:</span>
                    <span>${sale.payment_reference}</span>
                </div>
                ` : ''}
            </div>

            <div class="footer">
                <div>*** ${getTotalItems()} Items ***</div>
                <div style="margin-top: 8px;">Thank you for your purchase!</div>
                <div style="margin-top: 5px;">
                    <div>This is computer generated receipt</div>
                    <div>No signature required</div>
                </div>
            </div>
        `;
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm print-preview">
            {/* Header Actions */}
            <div className="flex justify-between items-center p-6 border-b print-hidden">
                <Link
                    href={route('sales.index')}
                    className="btn btn-ghost btn-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Sales
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="btn btn-primary btn-sm"
                    >
                        <Printer size={16} />
                        Print Invoice
                    </button>
                    <button 
                        onClick={handleDownloadPDF}
                        className="btn btn-outline btn-sm"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>
                    <button className="btn btn-outline btn-sm">
                        <Mail size={16} />
                        Email Invoice
                    </button>
                </div>
            </div>

            {/* Compact Invoice Content */}
            <div className="p-6 print-p-2 print-max-w-80mm print-mx-auto thermal-receipt">
                {/* Company Header - Compact */}
                <div className="text-center print-mb-2 border-b-2 border-black print-border-b-2 print-border-black pb-4 print-pb-2">
                    <h1 className="text-xl font-bold print-text-lg">YOUR STORE NAME</h1>
                    <p className="text-sm text-gray-600 print-text-xs">Store Address Line 1</p>
                    <p className="text-sm text-gray-600 print-text-xs">Store Address Line 2, Dhaka</p>
                    <p className="text-sm text-gray-600 print-text-xs">Phone: +880 XXXX-XXXXXX</p>
                    <p className="text-sm text-gray-600 print-text-xs">VAT: XXXXXXXX</p>
                </div>

                {/* Receipt Info */}
                <div className="grid grid-cols-2 gap-4 print-grid-cols-1 print-gap-1 print-mb-2 print-space-y-1 my-4 print-my-2 border-b border-dashed border-gray-300 print-border-b print-border-dashed print-border-gray-300 pb-4 print-pb-2">
                    <div className="col-span-2 print-col-span-1">
                        <p className="font-semibold print-text-sm">INVOICE NO:</p>
                        <p className="text-primary font-mono print-text-sm">{sale.invoice_no}</p>
                    </div>
                    <div className="col-span-2 print-col-span-1">
                        <p className="font-semibold print-text-sm">DATE:</p>
                        <p className="print-text-sm">{formatReceiptDate(sale.created_at)}</p>
                    </div>
                    <div className="col-span-2 print-col-span-1">
                        <p className="font-semibold print-text-sm">CUSTOMER:</p>
                        <p className="print-text-sm">{sale.customer?.customer_name || "Walk-in Customer"}</p>
                        {sale.customer?.phone && (
                            <p className="text-sm text-gray-600 print-text-xs">Phone: {sale.customer.phone}</p>
                        )}
                    </div>
                </div>

                {/* Barcode */}
                <div className="text-center print-mb-2 border-b border-dashed border-gray-300 print-border-b print-border-dashed print-border-gray-300 pb-4 print-pb-2">
                    <div className="font-barcode text-3xl print-text-xl" style={{ fontFamily: "'Libre Barcode 128', cursive" }}>
                        {generateBarcode(sale.invoice_no)}
                    </div>
                    <p className="text-xs text-gray-600 print-text-xs mt-1 print-mt-1">{sale.invoice_no}</p>
                </div>

                {/* Items Table - Compact */}
                <div className="print-mb-2 my-4 print-my-2">
                    <table className="w-full text-sm print-text-xs receipt-table">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="text-left pb-1 print-pb-1">ITEM</th>
                                <th className="text-center pb-1 print-pb-1">QTY</th>
                                <th className="text-right pb-1 print-pb-1">PRICE</th>
                                <th className="text-right pb-1 print-pb-1">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items?.map((item, index) => (
                                <React.Fragment key={item.id}>
                                    <tr className="border-bottom-dashed">
                                        <td className="py-1 print-py-1">
                                            <div>
                                                <p className="font-medium">{item.product?.name}</p>
                                                {item.variant?.name && (
                                                    <p className="text-xs text-gray-500 print-text-xs">↳ {item.variant.name}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-center py-1 print-py-1">{item.quantity}</td>
                                        <td className="text-right py-1 print-py-1">{formatCurrency(item.unit_price)}</td>
                                        <td className="text-right py-1 print-py-1 font-semibold">{formatCurrency(item.total_price)}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Payment Summary - Compact */}
                <div className="border-t-2 border-black print-border-t-2 print-border-black pt-2 print-pt-2 print-space-y-1">
                    <div className="space-y-1 print-space-y-1 text-sm print-text-xs">
                        <div className="flex justify-between">
                            <span>Sub Total:</span>
                            <span>{formatCurrency(sale.sub_total)} Tk</span>
                        </div>
                        {sale.discount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-{formatCurrency(sale.discount)} Tk</span>
                            </div>
                        )}
                        {sale.tax > 0 && (
                            <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>+{formatCurrency(sale.tax)} Tk</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-dashed border-gray-300 print-border-t print-border-dashed print-border-gray-300 pt-1 print-pt-1 font-bold print-text-sm">
                            <span>GRAND TOTAL:</span>
                            <span className="text-primary">{formatCurrency(sale.grand_total)} Tk</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Paid Amount:</span>
                            <span>{formatCurrency(sale.paid_amount)} Tk</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Due Amount:</span>
                            <span>{formatCurrency(sale.due_amount)} Tk</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-gray-300 print-border-t print-border-dashed print-border-gray-300 pt-1 print-pt-1">
                            <span>Payment Method:</span>
                            <span className="font-semibold">{sale.payment_method || 'Cash'}</span>
                        </div>
                        {sale.payment_reference && (
                            <div className="flex justify-between">
                                <span>Reference:</span>
                                <span className="font-mono text-xs print-text-xs">{sale.payment_reference}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Compact */}
                <div className="text-center print-mt-2 mt-4 text-xs print-text-xs text-gray-500 border-t border-dashed border-gray-300 print-border-t print-border-dashed print-border-gray-300 pt-4 print-pt-2">
                    <p>*** {getTotalItems()} Items ***</p>
                    <p className="mt-1 print-mt-1">Thank you for your business!</p>
                    <p className="mt-2 print-mt-1">This is computer generated receipt</p>
                    <p>No signature required</p>
                </div>
            </div>
        </div>
    );
}