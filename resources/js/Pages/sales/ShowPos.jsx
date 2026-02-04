// resources/js/Pages/sales/SaleShow.jsx
import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function SaleShow({ sale }) {
    const { auth } = usePage().props;

    // ---------- helpers ----------
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n(amount));
    };

    const money = (amount) => `৳ ${formatCurrency(amount)}`;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    const formatReceiptDate = (date) => {
        if (!date) return "N/A";
        return new Date(date)
            .toLocaleString("en-BD", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            })
            .replace(",", "");
    };

    const getProductDisplayName = (item) => {
        if (item.item_type === "pickup") return item.product_name || "Pickup Item";
        return item.product?.name || "N/A";
    };

    const getProductCode = (item) => {
        if (item.item_type === "pickup") return "PICKUP";
        return item.product?.product_no || item.product_id || "N/A";
    };

    const getVariantDisplayName = (item) => {
        // if (item.item_type === "pickup") return item.variant_name || item.variant || "N/A";
        if (!item.variant) return "N/A";
        if (item.variant?.name) return item.variant.name;
        if (item.variant?.attribute_values && typeof item.variant.attribute_values === "object") {
            return Object.values(item.variant.attribute_values).join(", ");
        }
        return item.variant?.attribute_values || "N/A";
    };

    // const getBrandName = (item) => {
    //      if (item.variant?.attribute_values && typeof item.variant.attribute_values === "object") {
    //         return Object.keys(item.variant.attribute_values).join(", ");
    //     }
    //     return item.variant?.attribute_values || "N/A";
    // };

    const getBrandName = (item) => {
        return item.product?.brand?.name || item.brand?.name || item.product?.brand || "N/A";
    };

    const totalQty = useMemo(() => {
        return sale.items?.reduce((t, it) => t + Number(it.quantity || 0), 0) || 0;
    }, [sale]);

    const getAddAmount = (item) => {
        return Number(item.add_amount || item.vat_amount || item.tax_amount || 0);
    };

    const rowTotal = (item) => {
        const backend = Number(item.total_price || 0);
        if (backend) return backend;
        const qty = Number(item.quantity || 0);
        const unit = Number(item.unit_price || 0);
        return qty * unit + getAddAmount(item);
    };

    const items = sale.items || [];

    // ---------- totals ----------
    const subTotal = n(sale.sub_total);
    const discount = n(sale.discount);
    const vatTax = n(sale.vat_tax ?? sale.tax ?? 0);
    const grandTotal = n(sale.grand_total);
    const paid = n(sale.paid_amount);
    const due = n(sale.due_amount);

    const getTotalItems = () => {
        return sale.items?.reduce((total, item) => total + n(item.quantity), 0) || 0;
    };

    // ---------- business info ----------
    const business = sale?.creator?.business || sale?.business || {};
    const headOfficeTitle = business?.name || business?.business_name || "Business Name";
    const headOfficeAddr = business?.address || "Address.";
    const headOfficePhone = business?.phone || "016****8";
    const headOfficeEmail = business?.email || "mail@example.com";

    const customerName = sale?.customer?.customer_name || "Walk-in Customer";
    const customerPhone = sale?.customer?.phone || "";
    const servedBy = sale?.served_by || sale?.creator?.name || auth?.user?.name || "N/A";

    // ---------- actions ----------
    const handlePrint = () => {
        const printContents = document.getElementById("invoiceArea")?.innerHTML;
        if (!printContents) return;

        const originalContents = document.body.innerHTML;

        document.body.innerHTML = `
        <html>
        <head>
            <title>Invoice Print</title>
            <style>
            @page { size: A4; margin: 10mm; }
            body { background: white; font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            </style>
        </head>
        <body>${printContents}</body>
        </html>
    `;

        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const generateBarcode = (text) => {
        // Simple text-based barcode simulation
        return `*${text}*`;
    };

    const generateReceiptHTML = () => {
        const receiptStyles = `
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 80mm; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .company-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .receipt-info { margin-bottom: 10px; }
            .barcode { text-align: center; margin: 10px 0; font-family: 'Libre Barcode 39', monospace; font-size: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .items-table td { padding: 2px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-bold { font-weight: bold; }
            .summary { margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
    `;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - ${sale.invoice_no}</title>
            ${receiptStyles}
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="header">
                <div class="company-name">${business?.name || "Business Name"}</div>
                <div>${business?.address || ""}</div>
                <div>${business?.phone || "018*******"}</div>
            </div>

            <div class="receipt-info">
                <div><strong>INVOICE: ${sale.invoice_no}</strong></div>
                <div>Date: ${formatReceiptDate(sale.created_at)}</div>
                <div>Customer: ${customerName}</div>
                ${customerPhone ? `<div>Phone: ${customerPhone}</div>` : ""}
                <div>Served By: ${servedBy}</div>
            </div>

            <div class="barcode">
                <div class="barcode-text">${generateBarcode(sale.invoice_no)}</div>
                <div style="font-size: 10px; margin-top: -5px;">${sale.invoice_no}</div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th align="left">Item</th>
                        <th align="center">Qty</th>
                        <th align="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items?.map((item, idx) => `
                        <tr>
                            <td>${getProductDisplayName(item)}</td>
                            <td align="center">${item.quantity} × ${formatCurrency(item.unit_price)}</td>
                            <td align="right">${formatCurrency(item.total_price || rowTotal(item))}</td>
                        </tr>
                        ${item.variant ? `<tr><td colspan="3" style="font-size: 10px; padding-left: 10px;">↳ ${getVariantDisplayName(item)}</td></tr>` : ''}
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <div style="display: flex; justify-content: space-between;">
                    <span>Sub Total:</span>
                    <span>${formatCurrency(subTotal)} Tk</span>
                </div>
                ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Discount:</span>
                    <span>-${formatCurrency(discount)} ${sale.discount_type === 'flat' ? 'Tk' : '%'}</span>
                </div>
                ` : ''}
                ${vatTax > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Tax:</span>
                    <span>${formatCurrency(vatTax)} Tk</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px;">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(grandTotal)} Tk</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Paid:</span>
                    <span>${formatCurrency(paid)} Tk</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Due:</span>
                    <span>${formatCurrency(due)} Tk</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px;">
                    <span>Payment:</span>
                    <span class="text-bold">${sale.payment_type || "Cash"}</span>
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
                <div style="margin-top: 8px;">বিক্রয়িত পণ্য ১৫ দিনের মধ্যে ফেরত যোগ্য । পণ্য ফেরতের সময় অবশ্যই মেমোর ফটোকপি দিতে হবে</div>
            </div>
        </body>
        </html>
    `;
    };

    const handleDownloadPDF = () => {
        try {
            const receiptHTML = generateReceiptHTML();
            const printWindow = window.open('', '_blank');
            
            if (!printWindow) {
                alert('Popup blocked! Please allow popups for this site to download receipt.');
                return;
            }
            
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } catch (error) {
            console.error('Error generating receipt:', error);
            // Fallback to regular print
            handlePrint();
        }
    };


    return (
        <div className="bg-gray-100 min-h-screen p-3">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    @page { size: A4; margin: 10mm; }
                }
            `}</style>

            {/* Top actions (hidden on print) */}
            <div className="no-print mb-3 bg-white border border-gray-300 rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                    <div className="font-semibold text-gray-800">Invoice: {sale.invoice_no}</div>
                    <div className="text-gray-600">Date: {formatDate(sale.created_at)}</div>
                </div>

                <div className="flex gap-2">
                    <Link href={route("salesPos.index")} className="btn btn-sm btn-ghost border border-gray-300">
                        <ArrowLeft size={16} className="mr-1" />
                        Back
                    </Link>
                    <button onClick={handlePrint} className="btn btn-sm bg-gray-900 hover:bg-black text-white">
                        <Printer size={16} className="mr-1" />
                        {/* Print */}
                    </button>
                    <button onClick={handleDownloadPDF} className="btn btn-sm bg-gray-700 hover:bg-gray-800 text-white">
                        <Download size={16} className="mr-1" />
                        {/* Download Receipt */}
                    </button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div id="invoiceArea"
                className="bg-white border border-gray-400 mx-auto rounded-md shadow-sm relative overflow-hidden"
                style={{ maxWidth: "210mm" }}
            >
                {/* Watermark (like image) */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-[200px] h-[200px] rounded-full border-[10px] border-red-700 flex items-center justify-center">
                        <div className="text-[80px] font-black text-red-200">
                            <img
                                src="/media/uploads/logo.png"
                                className="h-full w-full object-contain p-1"
                                style={{ borderRadius: "50%" }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "/media/uploads/logo.png";
                                }}
                                alt="Logo"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative p-4">
                    {/* Header line like image */}
                    <div className="flex items-start justify-between gap-4 border-b border-black pb-2">
                        {/* Left brand */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center">
                                <img
                                    src="/media/uploads/logo.png"
                                    className="h-full w-full object-contain p-1"
                                    style={{ borderRadius: "50%" }}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/media/uploads/logo.png";
                                    }}
                                    alt="Logo"
                                />
                            </div>
                            <div>
                                <div className="text-xl font-black tracking-wide text-gray-900">
                                    {headOfficeTitle}
                                </div>
                                <div className="text-[11px] font-semibold tracking-[0.22em] text-gray-700 -mt-0.5">
                                    {/* Optional subtitle */}
                                </div>
                            </div>
                        </div>

                        {/* Offices (2 blocks) */}
                        <div className="flex gap-4 text-[10px] leading-4 text-gray-800">
                            <div className="border-l border-gray-300 pl-3">
                                <div className="font-bold text-red-700">অফিস</div>
                                <div className="max-w-[240px]">{headOfficeAddr}</div>
                                <div>{headOfficePhone}</div>
                                <div>{headOfficeEmail}</div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Title row */}
                    <div className="flex items-center justify-center py-2">
                        <div className="px-4 py-1 border border-black text-[12px] font-bold uppercase tracking-wider">
                            Invoice
                        </div>
                    </div>

                    {/* Meta info grid (like image small fields) */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] border-b border-gray-300 pb-2">
                        <div className="space-y-1">
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Bill No</span>
                                <span className="font-mono">{sale.invoice_no}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Delivery Date</span>
                                <span>{formatDate(sale.delivery_date || sale.created_at)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Bill To</span>
                                <span className="text-right">{customerName}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Address</span>
                                <span className="text-right">{sale.customer?.address || "N/A"}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Project</span>
                                <span>{sale.project_name || "Ms Motors"}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Memo No</span>
                                <span>{sale.reference_no || sale.id}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Served By</span>
                                <span>{servedBy}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="font-semibold">Date & Time</span>
                                <span>{formatDateTime(sale.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items table like image */}
                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-[10px] border border-black">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-1 w-[4%]">SL</th>
                                    <th className="border border-black p-1 w-[10%]">Code</th>
                                    <th className="border border-black p-1 text-left w-[30%]">Item Name</th>
                                    <th className="border border-black p-1 text-left w-[16%]">Model / Variant</th>
                                    <th className="border border-black p-1 w-[10%]">Brand</th>
                                    <th className="border border-black p-1 w-[6%]">Qty</th>
                                    <th className="border border-black p-1 w-[10%]">Trade Price</th>
                                    <th className="border border-black p-1 w-[6%]">Add</th>
                                    <th className="border border-black p-1 w-[8%]">Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const add = getAddAmount(item);
                                    const total = rowTotal(item);
                                    return (
                                        <tr key={item.id || idx}>
                                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                                            <td className="border border-black p-1 text-center font-mono">{getProductCode(item)}</td>
                                            <td className="border border-black p-1">
                                                <div className="font-semibold">{getProductDisplayName(item)}</div>
                                                {item.item_type === "pickup" ? (
                                                    <div className="text-[9px] text-gray-600">Pickup Item</div>
                                                ) : (
                                                    <div className="text-[9px] text-gray-600">
                                                        {item.variant?.sku ? `SKU: ${item.variant.sku}` : ""}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="border border-black p-1">
                                                {getVariantDisplayName(item)}
                                            </td>
                                            <td className="border border-black p-1 text-center">{getBrandName(item)}</td>
                                            <td className="border border-black p-1 text-center font-bold">
                                                {item.quantity}
                                                {item.unit ? ` ${item.unit}` : ""}
                                            </td>
                                            <td className="border border-black p-1 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                                            <td className="border border-black p-1 text-right font-mono">{formatCurrency(add)}</td>
                                            <td className="border border-black p-1 text-right font-mono font-bold">{formatCurrency(total)}</td>
                                        </tr>
                                    );
                                })}

                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="border border-black p-3 text-center text-gray-600">
                                            No items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                            {/* Footer totals row like image */}
                            <tfoot>
                                <tr>
                                    <td colSpan={5} className="border border-black p-1 text-right font-bold">
                                        Pcs.
                                    </td>
                                    <td className="border border-black p-1 text-center font-bold">{totalQty}</td>
                                    <td className="border border-black p-1"></td>
                                    <td className="border border-black p-1"></td>
                                    <td className="border border-black p-1 text-right font-bold">
                                        {formatCurrency(sale.grand_total)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Bottom summary (compact like invoice) */}
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
                        <div className="border border-gray-300 p-2">
                            <div className="flex justify-between">
                                <span className="font-semibold">Sub Total</span>
                                <span className="font-mono">{formatCurrency(sale.sub_total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">VAT/Tax</span>
                                <span className="font-mono">
                                    {sale.vat_tax || 0}% ({formatCurrency((Number(sale.sub_total || 0) * Number(sale.vat_tax || 0)) / 100)})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Discount</span>
                                <span className="font-mono">
                                    {sale.discount || 0}% ({formatCurrency((Number(sale.sub_total || 0) * Number(sale.discount || 0)) / 100)})
                                </span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                                <span>Grand Total</span>
                                <span className="font-mono">{formatCurrency(sale.grand_total)}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 p-2">
                            <div className="flex justify-between">
                                <span className="font-semibold">Paid Amount</span>
                                <span className="font-mono">{formatCurrency(sale.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Due Amount</span>
                                <span className="font-mono">{formatCurrency(sale.due_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Payment Method</span>
                                <span className="font-semibold">{(sale.payment_type || "CASH").toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Signature row like image */}
                    <div className="mt-5 grid grid-cols-4 gap-4 text-[10px]">
                        <div className="text-center">
                            <div className="border-t border-black pt-1 font-semibold">Checked By</div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-black pt-1 font-semibold">Authorised</div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-black pt-1 font-semibold">Received</div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-black pt-1 font-semibold">Delivery By</div>
                        </div>
                    </div>

                    {/* Footer note line */}
                    <div className="mt-3 text-[9px] text-gray-600 flex justify-between border-t border-gray-300 pt-2">
                        <div>
                            <span>বিক্রয়িত পণ্য ১৫ দিনের মধ্যে ফেরত যোগ্য । পণ্য ফেরতের সময় অবশ্যই মেমোর ফটোকপি দিতে হবে</span>
                        </div>
                        <div>
                            Powered by: Nexoryn
                            <br />
                        </div>
                    </div>
                    {/* <br /> <hr /> */}
                    {/* Signatures images like image */}
                    {/* <div className="flex space-x-2 pt-2">
                        <img src="/media/uploads/sig4.png" alt="Signature 1" className="w-1/5 h-12" />
                        <img src="/media/uploads/sig5.png" alt="Signature 2" className="w-1/5 h-12" />
                        <img src="/media/uploads/sig6.png" alt="Signature 3" className="w-1/8 h-12" />
                        <img src="/media/uploads/sig7.png" alt="Signature 4" className="w-1/5 h-12" />
                        <img src="/media/uploads/sig8.png" alt="Signature 5" className="w-1/5 h-12" />
                    </div> */}
                </div>
            </div>
        </div>
    );
}