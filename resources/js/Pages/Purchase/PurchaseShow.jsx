import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download, Calendar, User, Warehouse, Package, DollarSign, FileText, Hash, Shield } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useState, useRef } from "react";

export default function PurchaseShow({ purchase, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const printRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);

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
                case 'grand_total': return purchase.shadow_grand_total;
                case 'paid_amount': return purchase.shadow_paid_amount;
                case 'due_amount': return purchase.shadow_due_amount;
                default: return purchase[field];
            }
        }
        return purchase[field];
    };

    // Helper function to get variant display name - FIXED for new attribute_values format
    const getVariantDisplayName = (variant) => {
        const parts = [];

        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => ` ${value}`)
                    .join(', ');
                parts.push(` ${attrs}`);
            } else {
                parts.push(`Attribute: ${variant.attribute_values}`);
            }
        }

         if (variant.sku) parts.push(`Sku: ${variant.sku}`);
        return parts.join(', ') || 'Default Variant';
    };

    const getBrandName = (variant) => {
        const parts = [];

        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${key}`)
                    .join(', ');
                parts.push(` ${attrs}`);
            } else {
                parts.push(`Attribute: ${variant.attribute_values}`);
            }
        }

        return parts.join(', ') || 'Default Variant';
    };

    const handlePrint = () => {
        setIsPrinting(true);
        
        // Create a print-friendly version of the page
        const printContent = document.createElement('div');
        printContent.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase Invoice - ${purchase.purchase_no}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 0.5in;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', 'Roboto', sans-serif;
                        font-size: 12px;
                        line-height: 1.4;
                        color: #333;
                        padding: 10px;
                    }
                    .invoice-container {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                    /* Header Section */
                    .invoice-header {
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .invoice-title {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #333;
                    }
                    .invoice-subtitle {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .invoice-meta {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        margin-top: 10px;
                    }
                    .meta-item {
                        font-size: 12px;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 2px 8px;
                        border-radius: 3px;
                        font-size: 10px;
                        font-weight: bold;
                        margin-left: 5px;
                    }
                    .status-completed { background: #10b981; color: white; }
                    .status-pending { background: #f59e0b; color: white; }
                    .status-paid { background: #10b981; color: white; }
                    .status-partial { background: #f59e0b; color: white; }
                    .status-unpaid { background: #ef4444; color: white; }
                    .shadow-label {
                        background: #f59e0b;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 3px;
                        font-size: 10px;
                        font-weight: bold;
                        margin-left: 10px;
                    }
                    
                    /* Information Grid */
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .info-section {
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 15px;
                        background: #f9fafb;
                    }
                    .section-title {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        padding-bottom: 5px;
                        border-bottom: 1px solid #ddd;
                        color: #444;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                    }
                    .info-label {
                        font-weight: 500;
                        color: #555;
                        min-width: 120px;
                    }
                    .info-value {
                        color: #333;
                        text-align: right;
                    }
                    
                    /* Items Table */
                    .items-section {
                        margin: 20px 0;
                    }
                    .items-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        padding-bottom: 5px;
                        border-bottom: 1px solid #ddd;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .items-table th {
                        background-color: ${isShadowUser ? '#f59e0b' : '#3b82f6'};
                        color: white;
                        text-align: left;
                        padding: 8px;
                        font-weight: 600;
                        font-size: 11px;
                        border: 1px solid ${isShadowUser ? '#d97706' : '#2563eb'};
                    }
                    .items-table td {
                        padding: 6px 8px;
                        border: 1px solid #ddd;
                        font-size: 11px;
                        vertical-align: top;
                    }
                    .items-table tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    .items-table tfoot td {
                        background-color: ${isShadowUser ? '#fef3c7' : '#dbeafe'};
                        font-weight: bold;
                        border: 1px solid ${isShadowUser ? '#f59e0b' : '#3b82f6'};
                    }
                    
                    /* Summary Section */
                    .summary-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .summary-card {
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 15px;
                        background: #f9fafb;
                    }
                    .summary-title {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding-bottom: 5px;
                        border-bottom: 1px solid #ddd;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding-bottom: 5px;
                        border-bottom: 1px dotted #ddd;
                    }
                    .total-row {
                        font-size: 14px;
                        font-weight: bold;
                        color: ${isShadowUser ? '#d97706' : '#1d4ed8'};
                    }
                    
                    /* Notes Section */
                    .notes-section {
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 15px;
                        margin-top: 20px;
                        background: #f9fafb;
                    }
                    .notes-title {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #444;
                    }
                    
                    /* Footer */
                    .invoice-footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                        color: #666;
                        font-size: 10px;
                    }
                    
                    /* Utilities */
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .border-all { border: 1px solid #ddd; }
                    .border-top { border-top: 1px solid #ddd; }
                    .border-bottom { border-bottom: 1px solid #ddd; }
                    .bg-light { background-color: #f8f9fa; }
                    .mb-1 { margin-bottom: 5px; }
                    .mb-2 { margin-bottom: 10px; }
                    .mb-3 { margin-bottom: 15px; }
                    .mt-1 { margin-top: 5px; }
                    .mt-2 { margin-top: 10px; }
                    .mt-3 { margin-top: 15px; }
                    .py-1 { padding-top: 5px; padding-bottom: 5px; }
                    .py-2 { padding-top: 10px; padding-bottom: 10px; }
                    .py-3 { padding-top: 15px; padding-bottom: 15px; }
                    .px-1 { padding-left: 5px; padding-right: 5px; }
                    .px-2 { padding-left: 10px; padding-right: 10px; }
                    .px-3 { padding-left: 15px; padding-right: 15px; }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <!-- Header -->
                    <div class="invoice-header">
                        <div class="invoice-title">
                            PURCHASE INVOICE
                            ${isShadowUser ? '<span class="shadow-label">SHADOW PURCHASE</span>' : ''}
                        </div>
                        <div class="invoice-subtitle">
                            Invoice #${purchase.purchase_no} | Date: ${formatDate(purchase.purchase_date)}
                        </div>
                        <div class="invoice-meta">
                            <div class="meta-item">
                                Status: ${purchase.status}
                                <span class="status-badge status-${purchase.status}">${purchase.status.toUpperCase()}</span>
                            </div>
                            <div class="meta-item">
                                Payment: ${purchase.payment_status}
                                <span class="status-badge status-${purchase.payment_status}">${purchase.payment_status.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Information Grid -->
                    <div class="info-grid">
                        <!-- Supplier Info -->
                        <div class="info-section">
                            <div class="section-title">SUPPLIER INFORMATION</div>
                            <div class="info-row">
                                <span class="info-label">Name:</span>
                                <span class="info-value">${purchase.supplier?.name || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Company:</span>
                                <span class="info-value">${purchase.supplier?.company || 'N/A'}</span>
                            </div>
                            ${purchase.supplier?.phone ? `
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${purchase.supplier.phone}</span>
                            </div>` : ''}
                            ${purchase.supplier?.email ? `
                            <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${purchase.supplier.email}</span>
                            </div>` : ''}
                        </div>
                        
                        <!-- Warehouse Info -->
                        <div class="info-section">
                            <div class="section-title">WAREHOUSE INFORMATION</div>
                            <div class="info-row">
                                <span class="info-label">Name:</span>
                                <span class="info-value">${purchase.warehouse?.name || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Code:</span>
                                <span class="info-value">${purchase.warehouse?.code || 'N/A'}</span>
                            </div>
                            ${purchase.warehouse?.address ? `
                            <div class="info-row">
                                <span class="info-label">Address:</span>
                                <span class="info-value">${purchase.warehouse.address}</span>
                            </div>` : ''}
                        </div>
                    </div>
                    
                    <!-- Items Table -->
                    <div class="items-section">
                        <div class="items-title">
                            PURCHASE ITEMS (${purchase.items?.length || 0} items, ${calculateTotalQuantity()} units)
                        </div>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Variant</th>
                                    <th class="text-right">Qty</th>
                                    <th class="text-right">Unit Price</th>
                                    <th class="text-right">Sale Price</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${purchase.items?.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>
                                        <div>${item.product?.name || 'N/A'}</div>
                                        <small>#${item.product_id}</small>
                                    </td>
                                    <td>${getBrandName(item.variant)}</td>
                                    <td>
                                        <div>${getVariantDisplayName(item.variant)}</div>
                                    </td>
                                    <td class="text-right">${item.quantity}</td>
                                    <td class="text-right">${formatCurrency(getPrice(item, 'unit_price'))}</td>
                                    <td class="text-right">${formatCurrency(getPrice(item, 'sale_price'))}</td>
                                    <td class="text-right font-bold" style="color: ${isShadowUser ? '#d97706' : '#1d4ed8'}">
                                        ${formatCurrency(getPrice(item, 'total_price'))}
                                    </td>
                                </tr>`).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4" class="text-right font-bold">TOTALS:</td>
                                    <td class="text-right font-bold">${calculateTotalQuantity()}</td>
                                    <td></td>
                                    <td></td>
                                    <td class="text-right font-bold" style="font-size: 12px; color: ${isShadowUser ? '#d97706' : '#1d4ed8'}">
                                        ${formatCurrency(getPurchaseAmount('grand_total'))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <!-- Summary Grid -->
                    <div class="summary-grid">
                        <!-- Amount Summary -->
                        <div class="summary-card">
                            <div class="summary-title">AMOUNT SUMMARY</div>
                            <div class="summary-row">
                                <span>Total Amount:</span>
                                <span class="font-bold" style="color: ${isShadowUser ? '#d97706' : '#1d4ed8'}">
                                    ${formatCurrency(getPurchaseAmount('grand_total'))}
                                </span>
                            </div>
                            <div class="summary-row" style="color: #10b981;">
                                <span>Paid Amount:</span>
                                <span class="font-bold">${formatCurrency(getPurchaseAmount('paid_amount'))}</span>
                            </div>
                            <div class="summary-row total-row" style="color: ${(getPurchaseAmount('grand_total') - getPurchaseAmount('paid_amount')) > 0 ? '#f59e0b' : '#10b981'};">
                                <span>Due Amount:</span>
                                <span class="font-bold">
                                    ${formatCurrency(getPurchaseAmount('grand_total') - getPurchaseAmount('paid_amount'))}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Document Details -->
                        <div class="summary-card">
                            <div class="summary-title">DOCUMENT DETAILS</div>
                            <div class="summary-row">
                                <span>Created Date:</span>
                                <span>${formatDate(purchase.created_at)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Last Updated:</span>
                                <span>${formatDate(purchase.updated_at)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Total Items:</span>
                                <span>${purchase.items?.length || 0}</span>
                            </div>
                            <div class="summary-row">
                                <span>Total Quantity:</span>
                                <span>${calculateTotalQuantity()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notes Section -->
                    ${purchase.notes ? `
                    <div class="notes-section">
                        <div class="notes-title">NOTES</div>
                        <p>${purchase.notes.replace(/\n/g, '<br>')}</p>
                    </div>` : ''}
                    
                    <!-- Footer -->
                    <div class="invoice-footer">
                        <p>This document is computer generated and does not require a signature.</p>
                        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.close();
        
        // Add print event listener
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
                setIsPrinting(false);
            }, 500);
        };
    };

    const handleDownloadPDF = () => {
        handlePrint(); 
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
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            {/* Header */}
            <PageHeader
                title={t('purchase.purchase_details_title', 'Purchase Details')}
                subtitle={`${t('purchase.purchase_number_label', 'Purchase #')}${purchase.purchase_no}`}
            >
                <div className="flex flex-col sm:flex-row gap-2">
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
                            disabled={isPrinting}
                        >
                            <Printer size={15} /> {t('purchase.print', 'Print')}
                            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="btn btn-sm btn-outline btn-success"
                            disabled={isPrinting}
                        >
                            <Download size={15} /> {t('purchase.download_pdf', 'Download PDF')}
                            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
                        </button>
                
                    </div>
                </div>
            </PageHeader>

            {/* Main Content - This will be hidden during print */}
            <div className="print:hidden">
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
                                            <h3 className="font-bold text-lg"> { purchase.purchase_no}</h3>
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
                                        {formatCurrency(getPurchaseAmount('grand_total' ) - getPurchaseAmount('paid_amount'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="card bg-base-100 shadow-sm border mt-6">
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
                                    <th>{t('purchase.brand', 'Brand')}</th>
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
                                                {getBrandName(item.variant)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {getVariantDisplayName(item.variant)}
                                            </div>
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
        </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    .btn, .card, .table {
                        display: none !important;
                    }
                    
                    /* Only show print content */
                    .print-content, .print-content * {
                        visibility: visible;
                    }
                    
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
                
                .loading-spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}