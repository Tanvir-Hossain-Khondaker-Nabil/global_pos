import PageHeader from "../../components/PageHeader";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download, ChevronRight } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useState } from "react";

export default function PurchaseShow({ purchase, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [isPrinting, setIsPrinting] = useState(false);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) amount = 0;
        return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const calculateTotalQuantity = () => {
        return purchase.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    // Get the correct price based on user type
    const getPrice = (item, field) => {
        if (isShadowUser) {
            switch (field) {
                case 'unit_price': return item.shadow_unit_price;
                case 'total_price': return item.shadow_total_price;
                case 'sale_price': return item.shadow_sale_price;
                default: return item[field];
            }
        }
        return item[field];
    };

    // Get purchase amounts based on user type
    const getPurchaseAmount = (field) => {
        if (isShadowUser) {
            switch (field) {
                case 'grand_total': return purchase.shadow_grand_total;
                case 'paid_amount': return purchase.shadow_paid_amount;
                case 'due_amount': return purchase.shadow_due_amount;
                default: return purchase[field];
            }
        }
        return purchase[field];
    };

    // Get company name from supplier or default
    const getCompanyName = () => {
        if (purchase.supplier?.company) {
            return purchase.supplier.company;
        }
        if (purchase.supplier?.name) {
            return purchase.supplier.name;
        }
        return "AUTO PARTS LTD.";
    };

    // Get address from supplier or default
    const getSupplierAddress = () => {
        if (purchase.supplier?.address) {
            return purchase.supplier.address;
        }
        return "N/A";
    };

    // Get phone from supplier or default
    const getSupplierPhone = () => {
        if (purchase.supplier?.phone) {
            return purchase.supplier.phone;
        }
        return "N/A";
    };

    // Get email from supplier or default
    const getSupplierEmail = () => {
        if (purchase.supplier?.email) {
            return purchase.supplier.email;
        }
        return "N/A";
    };

    // Helper function to get variant display name
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
        
        if (variant.sku) {
            parts.push(`SKU: ${variant.sku}`);
        }
        
        return parts.join(', ') || 'N/A';
    };

    const getBrandName = (variant) => {
        if (!variant?.brand) return 'N/A';
        return variant.brand.name || variant.brand;
    };

    const handlePrint = () => {
        setIsPrinting(true);
        
        // Calculate totals for print
        const totalQuantity = calculateTotalQuantity();
        const grandTotal = getPurchaseAmount('grand_total');
        const paidAmount = getPurchaseAmount('paid_amount');
        const dueAmount = grandTotal - paidAmount;
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${getCompanyName()} - Invoice ${purchase.purchase_no}</title>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0.2in;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: Arial, sans-serif;
                    }
                    body {
                        font-size: 11px;
                        color: #000;
                        background: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .invoice-paper {
                        width: 100%;
                        max-width: 8.5in;
                        padding: 5px;
                        margin: 0 auto;
                    }
                    .header-red {
                        background-color: #dc2626 !important;
                        color: white;
                        padding: 2px 12px;
                        font-size: 9px;
                        font-weight: bold;
                        width: 50%;
                        display: inline-block;
                        margin-bottom: 15px;
                    }
                    .company-name {
                        font-size: 20px;
                        font-weight: 900;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                        color: #000;
                    }
                    .company-red {
                        color: #dc2626;
                    }
                    .flex-container {
                        display: flex;
                        align-items: center;
                        border-bottom: 1px solid #000;
                        padding-bottom: 8px;
                        margin-bottom: 8px;
                    }
                    .logo-space {
                        margin-right: 15px;
                        flex-shrink: 0;
                    }
                    .logo-svg {
                        height: 35px;
                        width: 35px;
                        color: #dc2626;
                    }
                    .company-info {
                        flex-grow: 1;
                    }
                    .office-info {
                        width: 35%;
                        display: flex;
                        font-size: 0.65rem;
                        line-height: 0.85rem;
                    }
                    .office-left, .office-right {
                        padding: 0 5px;
                    }
                    .office-left {
                        border-right: 1px solid #ccc;
                        width: 55%;
                    }
                    .office-right {
                        width: 45%;
                        padding-left: 8px;
                    }
                    .office-title {
                        font-weight: 700;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                        color: #c10007;
                    }
                    .detail-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        margin-bottom: 10px;
                    }
                    .detail-item {
                        margin-bottom: 3px;
                    }
                    .detail-label {
                        font-weight: 600;
                        display: inline-block;
                        width: 80px;
                    }
                    .detail-value {
                        float: right;
                        text-align: right;
                        font-weight: 500;
                    }
                    .invoice-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 2px;
                    }
                    .invoice-table th {
                        padding: 3px 4px;
                        border: 1px solid #000 !important;
                        font-weight: 600;
                        text-align: center;
                        background-color: #f0f0f0 !important;
                        font-size: 10px;
                    }
                    .invoice-table td {
                        padding: 3px 4px;
                        border: 1px solid #ccc !important;
                        vertical-align: top;
                        font-size: 10px;
                    }
                    .table-footer-row {
                        border: 1px solid #ccc !important;
                        height: 20px;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr 1fr;
                        gap: 10px;
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #000;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-title {
                        font-weight: 700;
                        border-bottom: 1px dashed #000;
                        width: 70%;
                        margin: 0 auto 3px auto;
                        padding-bottom: 1px;
                    }
                    .signature-text {
                        font-size: 0.6rem;
                        line-height: 0.8rem;
                    }
                    .software-info {
                        text-align: right;
                        font-size: 0.55rem;
                        color: #666;
                        margin-top: 5px;
                    }
                    .text-left { text-align: left; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                    .font-semibold { font-weight: 600; }
                    .float-right { float: right; }
                    .w-3 { width: 3%; }
                    .w-10 { width: 10%; }
                    .w-30 { width: 30%; }
                    .w-5 { width: 5%; }
                    .w-7 { width: 7%; }
                    .w-8 { width: 8%; }
                    .w-55 { width: 55%; }
                    .w-45 { width: 45%; }
                    .border-r { border-right: 1px solid #ccc; }
                    .border-b { border-bottom: 1px solid #000; }
                    .border-t { border-top: 1px solid #000; }
                    .mb-1 { margin-bottom: 3px; }
                    .mt-2 { margin-top: 8px; }
                    .pt-4 { padding-top: 16px; }
                    .col-span-2 { grid-column: span 2; }
                    
                    /* Print-specific styles */
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            width: 100%;
                            height: 100%;
                        }
                        .invoice-paper {
                            padding: 0;
                            margin: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-paper">
                    <!-- Authorised Channel Partner Banner -->
                    <div class="header-red">
                        Authorised Channel Partner
                    </div>
                    
                    <!-- Company Header -->
                    <div class="flex-container">
                        <div class="logo-space">
                            <svg class="logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        
                        <div class="company-info">
                            <h1 class="company-name">
                                ${getCompanyName()}
                            </h1>
                            <p class="text-xss" style="font-size: 0.65rem; line-height: 0.9rem; color: #666;">Quality Auto Parts Supplier</p>
                        </div>

                        <div class="office-info">
                            <div class="office-left">
                                <p class="office-title">Head Office</p>
                                <p>${getSupplierAddress()}</p>
                                <p class="font-semibold">PH: ${getSupplierPhone()}</p>
                                <p>Email: ${getSupplierEmail()}</p>
                            </div>
                            <div class="office-right">
                                <p class="office-title">Dhaka Office</p>
                                <p>358, Babor Road, Shyamoli, Dhaka</p>
                                <p class="font-semibold">PH: 02-58133544</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Invoice Title -->
                    <div style="text-align: center; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #000;">
                        <h1 style="font-weight: 600; font-size: 14px;">INVOICE</h1>
                    </div>
                    
                    <!-- Invoice Details Grid - 4 columns -->
                    <div class="detail-grid">
                        <!-- Column 1 -->
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Bill No.</span>
                                <span class="detail-value">${purchase.purchase_no}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Delivery Date</span>
                                <span class="detail-value">${formatDate(purchase.purchase_date)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Bill To</span>
                                <span class="detail-value">${purchase.supplier?.company || purchase.supplier?.name || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Address</span>
                                <span class="detail-value">${getSupplierAddress()}</span>
                            </div>
                        </div>
                        
                        <!-- Column 2 -->
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Invoice No.</span>
                                <span class="detail-value">${purchase.purchase_no}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Project</span>
                                <span class="detail-value">${getCompanyName()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Delivered By</span>
                                <span class="detail-value">${purchase.delivered_by || 'HASIBUL'}</span>
                            </div>
                        </div>
                        
                        <!-- Column 3 -->
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Ref No.</span>
                                <span class="detail-value">${purchase.reference_no || purchase.id}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Served By</span>
                                <span class="detail-value">${purchase.created_by?.name || auth.user?.name || 'HASIB'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Terms</span>
                                <span class="detail-value">${purchase.payment_status === 'paid' ? 'Cash' : 'Credit'}</span>
                            </div>
                        </div>
                        
                        <!-- Column 4 -->
                        <div>
                            <div class="detail-item">
                                <span class="detail-label">Warehouse</span>
                                <span class="detail-value">${purchase.warehouse?.name || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Code</span>
                                <span class="detail-value">${purchase.warehouse?.code || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status</span>
                                <span class="detail-value">${purchase.status?.toUpperCase() || 'PENDING'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th class="w-3 text-center">SL</th>
                                <th class="w-10 text-center">Part No.</th>
                                <th class="w-30 text-left">Description</th>
                                <th class="w-10 text-center">Model</th>
                                <th class="w-10 text-center">Brand</th>
                                <th class="w-5 text-center">Qty.</th>
                                <th class="w-10 text-center">Pcs.</th>
                                <th class="w-7 text-center">Price</th>
                                <th class="w-7 text-center">Trades Add (5%)</th>
                                <th class="w-8 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${purchase.items?.map((item, index) => `
                                <tr>
                                    <td class="text-center">${index + 1}</td>
                                    <td class="text-center">${item.product?.sku || item.product_id || 'N/A'}</td>
                                    <td class="text-left">${item.product?.name || 'N/A'}</td>
                                    <td class="text-center">${getVariantDisplayName(item.variant)}</td>
                                    <td class="text-center">${getBrandName(item.variant)}</td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-center">${formatCurrency(getPrice(item, 'unit_price'))}</td>
                                    <td class="text-right">${formatCurrency(getPrice(item, 'unit_price'))}</td>
                                    <td class="text-right">0.00</td>
                                    <td class="text-right" style="${isShadowUser ? 'color: #d97706;' : 'color: #1d4ed8;'} font-weight: bold;">
                                        ${formatCurrency(getPrice(item, 'total_price'))}
                                    </td>
                                </tr>
                            `).join('')}
                            <tr class="table-footer-row">
                                <td colspan="10"></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Summary Section -->
                    <div style="margin-top: 10px; padding: 8px; background: #f9f9f9; border: 1px solid #ccc; font-size: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span>Total Items: <strong>${purchase.items?.length || 0}</strong></span>
                            <span>Total Quantity: <strong>${totalQuantity}</strong></span>
                            <span>Grand Total: <strong style="${isShadowUser ? 'color: #d97706;' : 'color: #1d4ed8;'}">${formatCurrency(grandTotal)}</strong></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid #ccc;">
                            <span style="color: #16a34a;">Paid: <strong>${formatCurrency(paidAmount)}</strong></span>
                            <span style="color: #ea580c;">Due: <strong>${formatCurrency(dueAmount)}</strong></span>
                            <span>Status: <strong style="color: ${purchase.payment_status === 'paid' ? '#16a34a' : purchase.payment_status === 'partial' ? '#d97706' : '#dc2626'}">
                                ${purchase.payment_status?.toUpperCase() || 'UNPAID'}
                            </strong></span>
                        </div>
                    </div>
                    
                    <!-- Signature Section -->
                    <div class="signature-grid">
                        <div class="signature-box text-left">
                            <p class="signature-title">Checked By</p>
                            <p class="signature-text">(Name, seal, time) checked and verified the consignment. (All materials checked, verified, and sealed as per company policy.)</p>
                        </div>
                        <div class="signature-box">
                            <p class="signature-title">Authorised</p>
                            <p class="signature-text">(Signature & Seal)</p>
                        </div>
                        <div class="signature-box">
                            <p class="signature-title">Received</p>
                            <p class="signature-text">(Signature & Seal)</p>
                        </div>
                        <div class="signature-box">
                            <p class="signature-title">Delivery By</p>
                            <div class="software-info">
                                <p>Software by TETRA SOFT</p>
                                <p>Phone 01911-387001</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notes Section (if any) -->
                    ${purchase.notes ? `
                        <div style="margin-top: 10px; padding: 4px; background: #fef3c7; border: 1px solid #fbbf24; font-size: 9px;">
                            <strong>Notes:</strong> ${purchase.notes}
                        </div>
                    ` : ''}
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => {
                                window.close();
                            }, 100);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        
        // Write the complete HTML document
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Handle print completion
        printWindow.onbeforeunload = () => {
            setIsPrinting(false);
        };
        
        // Fallback in case print window doesn't open properly
        setTimeout(() => {
            if (printWindow.closed || !printWindow.document) {
                setIsPrinting(false);
            }
        }, 3000);
    };

    const handleDownloadPDF = () => {
        // For now, we'll use print as PDF
        handlePrint();
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4">
            {/* Header Actions - Hidden during print */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Purchase Invoice</h1>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <span>Invoice #{purchase.purchase_no}</span>
                            <ChevronRight size={12} />
                            <span>{formatDate(purchase.purchase_date)}</span>
                            {isShadowUser && (
                                <>
                                    <ChevronRight size={12} />
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Shadow Purchase</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => router.visit(route("purchase.list"))}
                            className="btn btn-sm btn-ghost border border-gray-300"
                        >
                            <ArrowLeft size={15} className="mr-1" />
                            Back to List
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
                            disabled={isPrinting}
                        >
                            <Printer size={15} className="mr-1" />
                            Print Invoice
                            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="btn btn-sm bg-gray-800 hover:bg-gray-900 text-white"
                            disabled={isPrinting}
                        >
                            <Download size={15} className="mr-1" />
                            Download PDF
                            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Design for Web View */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 invoice-container">
                {/* Authorised Channel Partner Banner */}
                <div className="mb-6">
                    <div className="bg-red-700 text-white py-1 px-4 text-xs font-bold inline-block">
                        Authorised Channel Partner
                    </div>
                </div>
                
                {/* Company Header */}
                <div className="flex items-center pb-4 mb-4">
                    <div className="mr-4 flex-shrink-0">
                        <svg className="h-10 w-10 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    
                    <div className="flex-grow">
                        <h1 className="text-2xl font-extrabold tracking-tight">
                            {getCompanyName()}
                        </h1>
                        <p className="text-xs text-gray-600">Quality Auto Parts Supplier</p>
                    </div>

                    <div className="w-1/3 flex text-xs text-gray-700">
                        <div className="w-55 pr-4 border-r border-gray-300">
                            <p className="font-bold uppercase text-xs text-[#c10007]">Head Office</p>
                            <p className="text-xs leading-tight mt-1">{getSupplierAddress()}</p>
                            <p className="font-semibold text-xs mt-1">PH: {getSupplierPhone()}</p>
                            <p className="text-xs mt-1">Email: {getSupplierEmail()}</p>
                        </div>
                        <div className="w-45 pl-4">
                            <p className="font-bold uppercase text-xs text-[#c10007]">Dhaka Office</p>
                            <p className="text-xs leading-tight mt-1">358, Babor Road, Shyamoli, Dhaka</p>
                            <p className="font-semibold text-xs mt-1">PH: 02-58133544</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center pb-4 mb-4">
                    <div className="border-b border-black">
                        <h1 className="font-semibold">
                        Invoice
                        </h1>
                    </div>
                </div>
                
                {/* Invoice Details Grid - 4 columns */}
                <div className="grid grid-cols-4 gap-4 text-xs mb-6">
                    {/* Column 1 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Bill No.</span>
                            <span className="font-mono">{purchase.purchase_no}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Delivery Date</span>
                            <span>{formatDate(purchase.purchase_date)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Bill To</span>
                            <span className="text-right">{purchase.supplier?.company || purchase.supplier?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Address</span>
                            <span className="text-right text-xs">{getSupplierAddress()}</span>
                        </div>
                    </div>
                    
                    {/* Column 2 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Invoice No.</span>
                            <span className="font-mono">{purchase.purchase_no}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Project</span>
                            <span>{getCompanyName()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Delivered By</span>
                            <span>{purchase.delivered_by || 'HASIBUL'}</span>
                        </div>
                    </div>
                    
                    {/* Column 3 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Ref No.</span>
                            <span>{purchase.reference_no || purchase.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Served By</span>
                            <span>{purchase.created_by?.name || auth.user?.name || 'HASIB'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Terms</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {purchase.payment_status === 'paid' ? 'Cash' : 'Credit'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Column 4 */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="font-semibold">Warehouse</span>
                            <span>{purchase.warehouse?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Code</span>
                            <span>{purchase.warehouse?.code || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Status</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${purchase.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {purchase.status?.toUpperCase() || 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-xs border border-gray-300">
                        <thead>
                            <tr>
                                <th className="w-[3%] p-1 border border-gray-300 text-center font-semibold">SL</th>
                                <th className="w-[10%] p-1 border border-gray-300 text-center font-semibold">Part No.</th>
                                <th className="w-[30%] p-1 border border-gray-300 text-left font-semibold">Description</th>
                                <th className="w-[10%] p-1 border border-gray-300 text-center font-semibold">Model</th>
                                <th className="w-[10%] p-1 border border-gray-300 text-center font-semibold">Brand</th>
                                <th className="w-[5%] p-1 border border-gray-300 text-center font-semibold">Qty.</th>
                                <th className="w-[10%] p-1 border border-gray-300 text-center font-semibold">Pcs.</th>
                                <th className="w-[7%] p-1 border border-gray-300 text-center font-semibold">Price</th>
                                <th className="w-[7%] p-1 border border-gray-300 text-center font-semibold">Trades Add (5%)</th>
                                <th className="w-[8%] p-1 border border-gray-300 text-center font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchase.items?.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-1 border border-gray-300 text-center">{index + 1}</td>
                                    <td className="p-1 border border-gray-300 text-center font-mono">
                                        {item.product?.sku || item.product_id || 'N/A'}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-left">
                                        <div className="font-medium">{item.product?.name || 'N/A'}</div>
                                        {item.variant && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {getVariantDisplayName(item.variant)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-center">
                                        {getVariantDisplayName(item.variant)}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-center">
                                        {getBrandName(item.variant)}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-center font-bold">
                                        {item.quantity}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-center font-mono">
                                        {formatCurrency(getPrice(item, 'unit_price'))}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-right font-mono">
                                        {formatCurrency(getPrice(item, 'unit_price'))}
                                    </td>
                                    <td className="p-1 border border-gray-300 text-right font-mono">
                                        0.00
                                    </td>
                                    <td className="p-1 border border-gray-300 text-right font-mono font-bold" style={{ color: isShadowUser ? '#d97706' : '#1d4ed8' }}>
                                        {formatCurrency(getPrice(item, 'total_price'))}
                                    </td>
                                </tr>
                            ))}
                            {(!purchase.items || purchase.items.length === 0) && (
                                <tr>
                                    <td colSpan="10" className="p-4 text-center text-gray-500">
                                        No items found in this purchase
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="10" className="h-8 border border-gray-300"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Amount Summary */}
                <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded mb-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Total Items</p>
                            <p className="text-lg font-bold">{purchase.items?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Total Quantity</p>
                            <p className="text-lg font-bold">{calculateTotalQuantity()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Total Amount</p>
                            <p className={`text-lg font-bold ${isShadowUser ? 'text-yellow-600' : 'text-blue-600'}`}>
                                {formatCurrency(getPurchaseAmount('grand_total'))}
                            </p>
                        </div>
                        <div className="col-span-3 mt-2 pt-2 border-t border-gray-300">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-green-600">
                                    <p className="text-sm font-semibold mb-1">Paid Amount</p>
                                    <p className="text-lg font-bold">{formatCurrency(getPurchaseAmount('paid_amount'))}</p>
                                </div>
                                <div className="text-orange-600">
                                    <p className="text-sm font-semibold mb-1">Due Amount</p>
                                    <p className="text-lg font-bold">{formatCurrency(getPurchaseAmount('grand_total') - getPurchaseAmount('paid_amount'))}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Payment Status</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {purchase.payment_status?.toUpperCase() || 'UNPAID'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="grid grid-cols-4 gap-4 text-xs border-t border-black pt-4">
                    <div className="col-span-2">
                        <p className="font-bold border-b border-dashed border-black w-2/3 text-center mb-2">Checked By</p>
                        <p className="text-xs text-gray-700 leading-tight">
                            (Name, seal, time) checked and verified the consignment. (All materials checked, verified, and sealed as per company policy.)
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
                {purchase.notes && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-bold text-sm mb-2">Additional Notes</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
                    </div>
                )}
            </div>

            {/* Global Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .invoice-container,
                    .invoice-container * {
                        visibility: visible;
                    }
                    .invoice-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                        box-shadow: none;
                        border: none;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        margin: 0.2in;
                        size: A4;
                    }
                }
            `}</style>
        </div>
    );
}