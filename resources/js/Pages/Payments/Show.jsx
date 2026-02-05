import React, { useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { 
    ArrowLeft, 
    Download, 
    Printer, 
    User, 
    Receipt, 
    Calendar,
    DollarSign,
    CreditCard,
    FileText,
    Building,
    Smartphone,
    Globe,
    Truck,
    Package,
    Users
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PaymentShow({ payment, business, isShadowUser }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    // Check if this is a customer payment (has customer or sale)
    const isCustomerPayment = payment.customer || payment.sale;
    
    // Check if this is a supplier payment (has supplier or purchase)
    const isSupplierPayment = payment.supplier || payment.purchase;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Get payment method icon and color
    const getPaymentMethodDetails = (method) => {
        const details = {
            cash: { 
                icon: DollarSign, 
                color: "text-success",
                bgColor: "bg-success/10",
                label: t('payment.cash', 'Cash')
            },
            card: { 
                icon: CreditCard, 
                color: "text-primary",
                bgColor: "bg-[#1e4d2b] text-white/10",
                label: t('payment.card', 'Card')
            },
            bank: { 
                icon: Building, 
                color: "text-info",
                bgColor: "bg-info/10",
                label: t('payment.bank', 'Bank Transfer')
            },
            mobile: { 
                icon: Smartphone, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                label: t('payment.mobile', 'Mobile Banking')
            },
            online: { 
                icon: Globe, 
                color: "text-secondary",
                bgColor: "bg-secondary/10",
                label: t('payment.online', 'Online Payment')
            },
        };
        return details[method] || { 
            icon: CreditCard, 
            color: "text-gray-500",
            bgColor: "bg-gray-100",
            label: method
        };
    };

    const methodDetails = getPaymentMethodDetails(payment.payment_method);
    const MethodIcon = methodDetails.icon;

    // Handle print with better control
    const handlePrint = () => {
        // Store original body styles
        const originalBodyStyle = document.body.style.cssText;
        
        // Apply print styles
        document.body.style.cssText = `
            margin: 0;
            padding: 0;
            background: white !important;
            width: 100%;
            min-height: 100vh;
        `;
        
        // Remove unnecessary elements during print
        const elementsToHide = document.querySelectorAll('.print\\:hidden, nav, header, aside, footer, .no-print');
        elementsToHide.forEach(el => {
            el.classList.add('hidden');
        });
        
        // Force print layout
        const printStyles = `
            <style type="text/css" media="print">
                @page {
                    size: A4 portrait;
                    margin: 15mm 10mm;
                }
                
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                body {
                    background: white !important;
                    font-size: 12pt !important;
                    line-height: 1.4 !important;
                }
                
                .print-invoice {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 0 !important;
                    box-shadow: none !important;
                    background: white !important;
                }
                
                .print-section {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                
                table {
                    width: 100% !important;
                    table-layout: fixed !important;
                    font-size: 10pt !important;
                }
                
                th, td {
                    padding: 4px 8px !important;
                    vertical-align: top !important;
                }
                
                .text-success, .text-primary, .badge-success {
                    color: #10b981 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .badge {
                    background-color: #f3f4f6 !important;
                    color: #374151 !important;
                    border: 1px solid #d1d5db !important;
                    padding: 2px 6px !important;
                    font-size: 9pt !important;
                }
                
                a {
                    color: #000 !important;
                    text-decoration: none !important;
                }
                
                /* Hide print button during print */
                .print-button, .btn {
                    display: none !important;
                }
                
                /* Show print footer */
                .print-footer {
                    display: block !important;
                    margin-top: 20mm;
                    padding-top: 10mm;
                    border-top: 1px solid #e5e7eb;
                }
                
                /* Compact spacing for print */
                .compact-print > * {
                    margin-bottom: 8px !important;
                }
                
                .compact-print > *:last-child {
                    margin-bottom: 0 !important;
                }
            </style>
        `;
        
        // Add print styles
        document.head.insertAdjacentHTML('beforeend', printStyles);
        
        // Trigger print
        window.print();
        
        // Clean up after print
        setTimeout(() => {
            document.body.style.cssText = originalBodyStyle;
            elementsToHide.forEach(el => {
                el.classList.remove('hidden');
            });
            
            // Remove the print styles
            const styleElement = document.querySelector('style[media="print"]');
            if (styleElement) {
                styleElement.remove();
            }
        }, 100);
    };

    // Handle download as PDF
    const handleDownload = () => {
        handlePrint(); // For now, same as print
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            completed: t('payment.completed', 'Completed'),
            pending: t('payment.pending', 'Pending'),
            failed: t('payment.failed', 'Failed'),
        };
        return labels[status] || status;
    };

    // Get payment type label
    const getPaymentTypeLabel = () => {
        if (isCustomerPayment) {
            return t('payment.customer_payment', 'Customer Payment');
        }
        if (isSupplierPayment) {
            return t('payment.supplier_payment', 'Supplier Payment');
        }
        return t('payment.other_payment', 'Other Payment');
    };

    return (
        <>
            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm 10mm;
                    }
                    
                    body, html {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                    }
                    
                    #root, .print-invoice {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        min-height: 100vh !important;
                    }
                    
                    .print-hide {
                        display: none !important;
                    }
                    
                    .print-show {
                        display: block !important;
                    }
                    
                    .print-invoice .compact * {
                        margin-bottom: 4px !important;
                    }
                    
                    .print-invoice table {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    
                    .print-invoice .print-section {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>

            <div className={`bg-white rounded-box print:shadow-none print:rounded-none print:m-0 print:p-0 ${locale === 'bn' ? 'bangla-font' : ''}`}>
                {/* Header - Hidden in print */}
                <div className="p-5 border-b print:hidden print-hide">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("payments.index")}
                                className="btn btn-ghost btn-sm"
                            >
                                <ArrowLeft size={16} />
                                {t('payment.back_to_payments', 'Back to Payments')}
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {t('payment.show_title', 'Payment Receipt')}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {getPaymentTypeLabel()} • {formatDate(payment.created_at)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="btn btn-outline btn-sm"
                            >
                                <Printer size={16} />
                                {t('payment.print', 'Print')}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn btn-outline btn-sm"
                            >
                                <Download size={16} />
                                {t('payment.download', 'Download')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="p-5 print:p-0 print:m-0 print:max-w-none">
                    {/* Print Header - Only visible in print */}
                    <div className="hidden print:block print-show mb-8">
                        <div className="flex justify-between items-start border-b pb-4 mb-6">
                            <div>
                                {business && (
                                    <>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            {business.business_name || business.name}
                                        </h1>
                                        {business.address && (
                                            <p className="text-gray-600 text-sm mb-1">
                                                📍 {business.address}
                                            </p>
                                        )}
                                        {business.phone && (
                                            <p className="text-gray-600 text-sm mb-1">
                                                📞 {business.phone}
                                            </p>
                                        )}
                                        {business.email && (
                                            <p className="text-gray-600 text-sm">
                                                ✉️ {business.email}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {t('payment.receipt', 'PAYMENT RECEIPT')}
                                </h2>
                                <p className="text-gray-600 text-sm">
                                    {t('payment.receipt_no', 'Receipt No')}: <span className="font-bold">#{payment.id}</span>
                                </p>
                                <p className="text-gray-600 text-sm">
                                    {t('payment.date', 'Date')}: {formatDate(payment.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary - Compact for print */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4 print:mb-6 print-section">
                        {/* Payment Information */}
                        <div className="bg-base-100 rounded-box p-6 border print:border print:p-4 print:shadow-none print:bg-white">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-base print:mb-3 print:flex">
                                <DollarSign size={20} className="text-success print:h-4 print:w-4" />
                                {t('payment.payment_information', 'Payment Information')}
                            </h2>
                            <div className="space-y-3 print:space-y-2 compact">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.payment_id', 'Payment ID')}:
                                    </span>
                                    <span className="font-mono font-semibold print:text-sm">#{payment.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.payment_type', 'Payment Type')}:
                                    </span>
                                    <span className="badge badge-info rounded print:text-xs print:px-2 print:py-1">
                                        {getPaymentTypeLabel()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.transaction_reference', 'Transaction Ref')}:
                                    </span>
                                    <span className="font-mono font-semibold print:text-sm">
                                        {payment.txn_ref || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.amount', 'Amount')}:
                                    </span>
                                    <span className="text-success font-bold text-lg print:text-base">
                                        {formatCurrency(payment.amount)} {t('payment.currency', 'Tk')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.status', 'Status')}:
                                    </span>
                                    <span className="badge badge-success badge-lg rounded print:text-xs print:px-2 print:py-1">
                                        {getStatusLabel(payment.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-base-100 rounded-box p-6 border print:border print:p-4 print:shadow-none print:bg-white">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-base print:mb-3 print:flex">
                                <CreditCard size={20} className="text-primary print:h-4 print:w-4" />
                                {t('payment.payment_method', 'Payment Method')}
                            </h2>
                            <div className="flex items-center gap-4 print:gap-3">
                                <div className={`p-3 rounded-full ${methodDetails.bgColor} print:p-2`}>
                                    <MethodIcon size={24} className={`${methodDetails.color} print:h-5 print:w-5`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg print:text-base">
                                        {methodDetails.label}
                                    </p>
                                    <p className="text-gray-500 text-sm print:text-xs">
                                        {formatDate(payment.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Related Document */}
                        <div className="bg-base-100 rounded-box p-6 border print:border print:p-4 print:shadow-none print:bg-white">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-base print:mb-3 print:flex">
                                {isCustomerPayment ? (
                                    <Receipt size={20} className="text-info print:h-4 print:w-4" />
                                ) : (
                                    <Package size={20} className="text-warning print:h-4 print:w-4" />
                                )}
                                {isCustomerPayment 
                                    ? t('payment.related_sale', 'Related Sale') 
                                    : t('payment.related_purchase', 'Related Purchase')
                                }
                            </h2>
                            {isCustomerPayment && payment.sale ? (
                                <div className="space-y-3 print:space-y-2 compact">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.invoice_no', 'Invoice No')}:
                                        </span>
                                        <span className="font-mono font-semibold text-primary print:text-sm">
                                            {payment.sale.invoice_no}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.sale_total', 'Sale Total')}:
                                        </span>
                                        <span className="font-semibold print:text-sm">
                                            {formatCurrency(payment.sale.grand_total)} {t('payment.currency', 'Tk')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.sale_status', 'Sale Status')}:
                                        </span>
                                        <span className={`badge capitalize rounded print:text-xs print:px-2 print:py-1 ${
                                            payment.sale.status === 'completed' 
                                                ? 'badge-success' 
                                                : payment.sale.status === 'cancelled'
                                                ? 'badge-error'
                                                : 'badge-warning'
                                        }`}>
                                            {getStatusLabel(payment.sale.status)}
                                        </span>
                                    </div>
                                </div>
                            ) : isSupplierPayment && payment.purchase ? (
                                <div className="space-y-3 print:space-y-2 compact">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.purchase_invoice', 'Purchase Invoice')}:
                                        </span>
                                        <span className="font-mono font-semibold print:text-sm">
                                            {payment.purchase.purchase_no || `PUR-${payment.purchase.id}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.purchase_total', 'Purchase Total')}:
                                        </span>
                                        <span className="font-semibold print:text-sm">
                                            {formatCurrency(payment.purchase.grand_total)} {t('payment.currency', 'Tk')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.purchase_status', 'Purchase Status')}:
                                        </span>
                                        <span className={`badge capitalize rounded print:text-xs print:px-2 print:py-1 ${
                                            payment.purchase.status === 'completed' 
                                                ? 'badge-success' 
                                                : payment.purchase.status === 'cancelled'
                                                ? 'badge-error'
                                                : 'badge-warning'
                                        }`}>
                                            {getStatusLabel(payment.purchase.status)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm print:text-xs">
                                    {isCustomerPayment 
                                        ? t('payment.no_related_sale', 'No related sale found')
                                        : t('payment.no_related_purchase', 'No related purchase found')
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Party and Transaction Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:grid-cols-2 print:gap-4 print:mb-6 print-section">
                        {/* Customer/Supplier Information */}
                        <div className="bg-base-100 rounded-box p-6 border print:border print:p-4 print:shadow-none print:bg-white">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-base print:mb-3 print:flex">
                                {isCustomerPayment ? (
                                    <User size={20} className="text-warning print:h-4 print:w-4" />
                                ) : (
                                    <Truck size={20} className="text-purple-600 print:h-4 print:w-4" />
                                )}
                                {isCustomerPayment 
                                    ? t('payment.customer_information', 'Customer Information')
                                    : t('payment.supplier_information', 'Supplier Information')
                                }
                            </h2>
                            {isCustomerPayment && payment.customer ? (
                                <div className="space-y-3 print:space-y-2 compact">
                                    <div>
                                        <p className="font-semibold text-lg print:text-base">
                                            {payment.customer.customer_name}
                                        </p>
                                        {payment.customer.phone && (
                                            <p className="text-gray-600 print:text-sm">
                                                📞 {payment.customer.phone}
                                            </p>
                                        )}
                                        {payment.customer.email && (
                                            <p className="text-gray-600 print:text-sm">
                                                ✉️ {payment.customer.email}
                                            </p>
                                        )}
                                        {payment.customer.address && (
                                            <p className="text-gray-600 text-sm mt-2 print:text-xs print:mt-1">
                                                📍 {payment.customer.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : isSupplierPayment && payment.supplier ? (
                                <div className="space-y-3 print:space-y-2 compact">
                                    <div>
                                        <p className="font-semibold text-lg print:text-base">
                                            {payment.supplier.supplier_name}
                                        </p>
                                        {payment.supplier.phone && (
                                            <p className="text-gray-600 print:text-sm">
                                                📞 {payment.supplier.phone}
                                            </p>
                                        )}
                                        {payment.supplier.email && (
                                            <p className="text-gray-600 print:text-sm">
                                                ✉️ {payment.supplier.email}
                                            </p>
                                        )}
                                        {payment.supplier.address && (
                                            <p className="text-gray-600 text-sm mt-2 print:text-xs print:mt-1">
                                                📍 {payment.supplier.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 print:space-y-2 compact">
                                    <p className="font-semibold text-lg print:text-base">
                                        {isCustomerPayment 
                                            ? t('payment.walk_in_customer', 'Walk-in Customer')
                                            : t('payment.walk_in_supplier', 'Direct Supplier')
                                        }
                                    </p>
                                    <p className="text-gray-500 text-sm print:text-xs">
                                        {isCustomerPayment 
                                            ? t('payment.no_customer_info', 'No customer information available')
                                            : t('payment.no_supplier_info', 'No supplier information available')
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Transaction Details */}
                        <div className="bg-base-100 rounded-box p-6 border print:border print:p-4 print:shadow-none print:bg-white">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-base print:mb-3 print:flex">
                                <Calendar size={20} className="text-info print:h-4 print:w-4" />
                                {t('payment.transaction_details', 'Transaction Details')}
                            </h2>
                            <div className="space-y-3 print:space-y-2 compact">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.payment_date', 'Payment Date')}:
                                    </span>
                                    <span className="font-semibold print:text-sm">
                                        {formatDate(payment.created_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 print:text-sm">
                                        {t('payment.processed_by', 'Processed By')}:
                                    </span>
                                    <span className="font-semibold print:text-sm">
                                        {auth.user?.name || "System"}
                                    </span>
                                </div>
                                {business && (
                                    <div className="flex justify-between text-right">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.business', 'Business')}:
                                        </span>
                                        <span className="font-semibold print:text-sm">
                                            {business.name}
                                            <br className="print:hidden" />
                                            <span className="print:hidden">({business.phone})</span>
                                        </span>
                                    </div>
                                )}
                                {payment.updated_at !== payment.created_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 print:text-sm">
                                            {t('payment.last_updated', 'Last Updated')}:
                                        </span>
                                        <span className="font-semibold print:text-sm">
                                            {formatDate(payment.updated_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {payment.note && (
                        <div className="bg-base-100 rounded-box p-6 border mb-8 print:border print:p-4 print:mb-6 print:shadow-none print:bg-white print-section">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 print:text-base print:mb-3 print:flex">
                                <FileText size={20} className="text-gray-600 print:h-4 print:w-4" />
                                {t('payment.payment_notes', 'Payment Notes')}
                            </h2>
                            <div className="bg-gray-50 rounded-lg p-4 print:p-3 print:bg-gray-100">
                                <p className="text-gray-700 whitespace-pre-wrap print:text-sm">
                                    {payment.note}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Items Section */}
                    {(isCustomerPayment && payment.sale?.items && payment.sale.items.length > 0) ||
                     (isSupplierPayment && payment.purchase?.items && payment.purchase.items.length > 0) ? (
                        <div className="bg-base-100 rounded-box p-6 border mb-8 print:border print:p-0 print:mb-6 print:shadow-none print:bg-white print-section">
                            <h2 className="text-lg font-semibold mb-4 print:text-base print:p-4 print:mb-3">
                                {isCustomerPayment 
                                    ? t('payment.sale_items', 'Sale Items')
                                    : t('payment.purchase_items', 'Purchase Items')
                                }
                            </h2>
                            <div className="overflow-x-auto print:overflow-visible">
                                <table className="table table-auto w-full print:table-fixed print:text-xs">
                                    <thead className="bg-gray-50 print:bg-gray-100">
                                        <tr>
                                            <th className="print:px-2 print:py-2">{t('payment.product', 'Product')}</th>
                                            {isCustomerPayment && (
                                                <>
                                                    <th className="print:px-2 print:py-2">{t('payment.brand', 'Brand')}</th>
                                                    <th className="print:px-2 print:py-2">{t('payment.variant', 'Variant')}</th>
                                                </>
                                            )}
                                            {!isCustomerPayment && (
                                                <th className="print:px-2 print:py-2">{t('payment.variant', 'Variant')}</th>
                                            )}
                                            <th className="print:px-2 print:py-2">{t('payment.quantity', 'Qty')}</th>
                                            <th className="print:px-2 print:py-2">{t('payment.unit_price', 'Unit Price')}</th>
                                            <th className="print:px-2 print:py-2">{t('payment.total', 'Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isCustomerPayment && payment.sale?.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 print:border-b print:border-gray-200">
                                                <td className="print:px-2 print:py-2">
                                                    <div>
                                                        <p className="font-medium print:text-xs">
                                                            {item.product?.name || "Unknown Product"}
                                                        </p>
                                                        {item.product?.product_no && (
                                                            <p className="text-sm text-gray-500 print:text-xs">
                                                                {t('payment.sku', 'SKU')}: {item.product.product_no}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="print:px-2 print:py-2">
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
                                                            } 
                                                            }

                                                            return <span className="print:text-xs">{attrsText || 'N/A'}</span>;
                                                        })()}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="print:px-2 print:py-2">
                                                    {item.variant && (
                                                        <>
                                                        {(() => {
                                                            const variant = item.variant;
                                                            let attrsText = '';

                                                            if (variant.attribute_values) {
                                                            if (typeof variant.attribute_values === 'object') {
                                                                attrsText = Object.entries(variant.attribute_values)
                                                                .map(([key, value]) => ` ${value}`)
                                                                .join(', ');
                                                            } else {
                                                                attrsText = variant.attribute_values;
                                                            }
                                                            }

                                                            return <span className="print:text-xs">{attrsText || 'N/A'}</span>;
                                                        })()}
                                                        <br />
                                                        <span className="text-sm text-gray-500 print:text-xs">
                                                            {item.variant?.sku || t('payment.no_sku', 'No SKU')}
                                                        </span>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="font-semibold print:px-2 print:py-2 print:text-center">
                                                    {item.quantity}
                                                </td>
                                                <td className="font-semibold print:px-2 print:py-2">
                                                    {formatCurrency(item.unit_price)} {t('payment.currency', 'Tk')}
                                                </td>
                                                <td className="font-semibold text-success print:px-2 print:py-2">
                                                    {formatCurrency(item.total_price)} {t('payment.currency', 'Tk')}
                                                </td>
                                            </tr>
                                        ))}
                                        {isSupplierPayment && payment.purchase?.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 print:border-b print:border-gray-200">
                                                <td className="print:px-2 print:py-2">
                                                    <div>
                                                        <p className="font-medium print:text-xs">
                                                            {item.product?.name || "Unknown Product"}
                                                        </p>
                                                        {item.product?.product_no && (
                                                            <p className="text-sm text-gray-500 print:text-xs">
                                                                {t('payment.sku', 'SKU')}: {item.product.product_no}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="print:px-2 print:py-2">
                                                    {item.variant && (
                                                        <>
                                                        {(() => {
                                                            const variant = item.variant;
                                                            let attrsText = '';

                                                            if (variant.attribute_values) {
                                                            if (typeof variant.attribute_values === 'object') {
                                                                attrsText = Object.entries(variant.attribute_values)
                                                                .map(([key, value]) => `${key}: ${value}`)
                                                                .join(', ');
                                                            } else {
                                                                attrsText = variant.attribute_values;
                                                            }
                                                            }

                                                            return <span className="print:text-xs">{attrsText || 'N/A'}</span>;
                                                        })()}
                                                        <br />
                                                        <span className="text-sm text-gray-500 print:text-xs">
                                                            {item.variant?.sku || t('payment.no_sku', 'No SKU')}
                                                        </span>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="font-semibold print:px-2 print:py-2 print:text-center">
                                                    {item.quantity}
                                                </td>
                                                <td className="font-semibold print:px-2 print:py-2">
                                                    {formatCurrency(item.unit_price)} {t('payment.currency', 'Tk')}
                                                </td>
                                                <td className="font-semibold text-success print:px-2 print:py-2">
                                                    {formatCurrency(item.total_price)} {t('payment.currency', 'Tk')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {/* Print Footer - Only visible in print */}
                    <div className="hidden print:block print-footer border-t pt-8 mt-8">
                        <div className="text-center text-gray-500 text-sm">
                            <p className="font-semibold mb-4">
                                {t('payment.thank_you', 'Thank you for your business!')}
                            </p>
                            {business && (
                                <div className="mb-4">
                                    <p className="font-semibold">{business.business_name || business.name}</p>
                                    {business.address && <p>{business.address}</p>}
                                    {business.phone && <p> {business.phone}</p>}
                                    {business.email && <p> {business.email}</p>}
                                </div>
                            )}
                            <p className="mb-2">
                                {t('payment.computer_generated', 'This is a computer generated receipt')}
                            </p>
                            <p>
                                {t('payment.printed_on', 'Printed on')}: {formatDate(new Date().toISOString())}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}