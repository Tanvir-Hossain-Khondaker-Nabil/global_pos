import React from "react";
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
    Globe
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

export default function PaymentShow({ payment }) {
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
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Format date only (without time)
    const formatDateOnly = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Get payment method icon and color
    const getPaymentMethodDetails = (method) => {
        const details = {
            cash: { 
                icon: DollarSign, 
                color: "text-success",
                bgColor: "bg-success/10",
                label: "Cash"
            },
            card: { 
                icon: CreditCard, 
                color: "text-primary",
                bgColor: "bg-primary/10",
                label: "Card"
            },
            bank: { 
                icon: Building, 
                color: "text-info",
                bgColor: "bg-info/10",
                label: "Bank Transfer"
            },
            mobile: { 
                icon: Smartphone, 
                color: "text-warning",
                bgColor: "bg-warning/10",
                label: "Mobile Banking"
            },
            online: { 
                icon: Globe, 
                color: "text-secondary",
                bgColor: "bg-secondary/10",
                label: "Online Payment"
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

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-box">
            {/* Header */}
            <div className="p-5 border-b print:border-none">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("payments.index")}
                            className="btn btn-ghost btn-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to Payments
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Payment Receipt
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Payment details and transaction information
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={handlePrint}
                            className="btn btn-outline btn-sm"
                        >
                            <Download size={16} />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Payment Summary Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Payment Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-success" />
                            Payment Information
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Payment ID:</span>
                                <span className="font-mono font-semibold">#{payment.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Transaction Ref:</span>
                                <span className="font-mono font-semibold">
                                    {payment.txn_ref || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Amount:</span>
                                <span className="text-success font-bold text-lg">
                                    {formatCurrency(payment.amount)} Tk
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status:</span>
                                <span className="badge badge-success badge-lg">
                                    Completed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-primary" />
                            Payment Method
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${methodDetails.bgColor}`}>
                                <MethodIcon size={24} className={methodDetails.color} />
                            </div>
                            <div>
                                <p className="font-semibold text-lg capitalize">
                                    {methodDetails.label}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {formatDate(payment.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Related Sale */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Receipt size={20} className="text-info" />
                            Related Sale
                        </h2>
                        {payment.sale ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Invoice No:</span>
                                    <Link
                                        href={route("sales.show", { sale: payment.sale.id })}
                                        className="font-mono font-semibold text-primary hover:underline"
                                    >
                                        {payment.sale.invoice_no}
                                    </Link>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Sale Total:</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payment.sale.grand_total)} Tk
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Sale Status:</span>
                                    <span className={`badge capitalize ${
                                        payment.sale.status === 'completed' 
                                            ? 'badge-success' 
                                            : payment.sale.status === 'cancelled'
                                            ? 'badge-error'
                                            : 'badge-warning'
                                    }`}>
                                        {payment.sale.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No related sale found</p>
                        )}
                    </div>
                </div>

                {/* Customer and Transaction Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Customer Information */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User size={20} className="text-warning" />
                            Customer Information
                        </h2>
                        {payment.customer ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-lg">
                                        {payment.customer.customer_name}
                                    </p>
                                    {payment.customer.phone && (
                                        <p className="text-gray-600">
                                            📞 {payment.customer.phone}
                                        </p>
                                    )}
                                    {payment.customer.email && (
                                        <p className="text-gray-600">
                                            ✉️ {payment.customer.email}
                                        </p>
                                    )}
                                    {payment.customer.address && (
                                        <p className="text-gray-600 text-sm mt-2">
                                            📍 {payment.customer.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="font-semibold text-lg">Walk-in Customer</p>
                                <p className="text-gray-500 text-sm">No customer information available</p>
                            </div>
                        )}
                    </div>

                    {/* Transaction Details */}
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-info" />
                            Transaction Details
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Date:</span>
                                <span className="font-semibold">
                                    {formatDate(payment.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Processed By:</span>
                                <span className="font-semibold">
                                    {auth.user?.name || "System"}
                                </span>
                            </div>
                            {payment.updated_at !== payment.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Updated:</span>
                                    <span className="font-semibold">
                                        {formatDate(payment.updated_at)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                {payment.note && (
                    <div className="bg-base-100 rounded-box p-6 border mb-8">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-600" />
                            Payment Notes
                        </h2>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {payment.note}
                            </p>
                        </div>
                    </div>
                )}

                {/* Sale Items (if available) */}
                {payment.sale?.items && payment.sale.items.length > 0 && (
                    <div className="bg-base-100 rounded-box p-6 border">
                        <h2 className="text-lg font-semibold mb-4">
                            Sale Items
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="table table-auto w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th>Product</th>
                                        <th>Variant</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payment.sale.items.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td>
                                                <div>
                                                    <p className="font-medium">
                                                        {item.product?.name || "Unknown Product"}
                                                    </p>
                                                    {item.product?.product_no && (
                                                        <p className="text-sm text-gray-500">
                                                            SKU: {item.product.product_no}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-left">
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

                                                        return <>{attrsText || 'N/A'}</>;
                                                    })()}
                                                    <br />
                                                    <span className="text-sm text-gray-500">
                                                        {item.variant?.sku || 'No SKU'}
                                                    </span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="font-semibold">
                                                {item.quantity}
                                            </td>
                                            <td className="font-semibold">
                                                {formatCurrency(item.unit_price)} Tk
                                            </td>
                                            <td className="font-semibold text-success">
                                                {formatCurrency(item.total_price)} Tk
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Print Footer */}
                <div className="hidden print:block mt-12 pt-8 border-t">
                    <div className="text-center text-gray-500">
                        <p className="font-semibold">Thank you for your business!</p>
                        <p className="text-sm">This is an computer generated receipt</p>
                        <p className="text-xs mt-2">
                            Printed on: {formatDate(new Date().toISOString())}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}