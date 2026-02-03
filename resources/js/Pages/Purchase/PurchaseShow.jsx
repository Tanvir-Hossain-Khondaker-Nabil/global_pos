import PageHeader from "../../components/PageHeader";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download, ChevronRight } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useState, useMemo } from "react";

export default function PurchaseShow({ purchase, isShadowUser }) {
  const { auth } = usePage().props;
  const { t, locale } = useTranslation();
  const [isPrinting, setIsPrinting] = useState(false);

  // ---------- helpers ----------
  const formatCurrency = (amount) => {
    const n = Number(amount || 0);
    return n.toFixed(2);
  };
  const money = (amount) => `৳ ${formatCurrency(amount)}`;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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

  // Calculate total quantity
  const totalQty = useMemo(() => {
    return purchase.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  }, [purchase]);

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

  // Helper function to get variant display name
  // const getVariantDisplayName = (variant) => {
  //     if (!variant) return 'N/A';

  //     const parts = [];
  //     if (variant.attribute_values) {
  //         if (typeof variant.attribute_values === 'object') {
  //             const attrs = Object.entries(variant.attribute_values)
  //                 .map(([key, value]) => `${value}`)
  //                 .join(', ');
  //             parts.push(attrs);
  //         } else {
  //             parts.push(variant.attribute_values);
  //         }
  //     }

  //     if (variant.sku) {
  //         parts.push(`SKU: ${variant.sku}`);
  //     }

  //     return parts.join(', ') || 'N/A';
  // };

  const getVariantDisplayName = (variant) => {

    if (variant?.attribute_values && typeof variant.attribute_values === "object") {
      return Object.values(variant.attribute_values).join(", ");
    }
    return variant?.attribute_values || "N/A";
  };

  // const getBrandName = (variant) => {
  //     if (variant?.attribute_values && typeof variant.attribute_values === "object") {
  //         return Object.keys(variant.attribute_values).join(", ");
  //     }
  //     return variant?.attribute_values || "N/A";
  // };

  const getBrandName = (item) => {
    // if (item.item_type === "pickup") return item.brand || "N/A";
    return item.product?.brand?.name || item.brand?.name || item.product?.brand || "N/A";
  };


  const getProductDisplayName = (item) => {
    return item.product?.name || 'N/A';
  };

  const getProductCode = (item) => {
    return item.product?.product_no || item.product_id || 'N/A';
  };

  // Get company name from supplier or default
  const getCompanyName = () => {
    return "Business Name";
  };

  // Get supplier business info
  const getSupplierBusiness = () => {
    if (purchase.supplier?.business) {
      return purchase.supplier.business;
    }
    return "Supplier Business";
  };

  // ---------- actions ----------
  const handlePrint = () => {
    const printContents = document.getElementById("invoiceArea")?.innerHTML;
    if (!printContents) return;

    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
        <html>
        <head>
            <title>Purchase Invoice Print</title>
            <style>
            @page { size: A4; margin: 10mm; }
            body { background: white; }
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

  const handleDownloadPDF = () => {
    handlePrint();
  };

  // ---------- business info ----------
  const business = purchase?.supplier?.business || "Supplier Business";
  const headOfficeTitle = business?.name || business?.business_name || 'Business Name';
  const headOfficeAddr = business?.address || "Address ";
  const headOfficePhone = business?.phone || "০১৬******৮৮";
  const headOfficeEmail = "mail@example.com";

  const items = purchase.items || [];

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
          <div className="font-semibold text-gray-800">Purchase Invoice: #{purchase.purchase_no}</div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>Date: {formatDate(purchase.purchase_date)}</span>
            {isShadowUser && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Shadow Purchase</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.visit(route("purchase.list"))}
            className="btn btn-sm btn-ghost border border-gray-300"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to List
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
            disabled={isPrinting}
          >
            <Printer size={16} className="mr-1" />
            Print
            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-sm bg-gray-800 hover:bg-gray-900 text-white"
            disabled={isPrinting}
          >
            <Download size={16} className="mr-1" />
            Download
          </button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div id="invoiceArea"
        className="bg-white border border-gray-400 mx-auto rounded-md shadow-sm relative overflow-hidden"
        style={{ maxWidth: "210mm" }}
      >
        {/* Watermark */}
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
          {/* Header line */}
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
                  alt="Company Logo"
                />
              </div>
              <div>
                <div className="text-xl font-black tracking-wide text-gray-900">
                  {getCompanyName()}
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
              Purchase Invoice
            </div>
          </div>

          {/* Meta info grid */}
          <div className="grid grid-cols-2 gap-3 text-[10px] border-b border-gray-300 pb-2">
            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Bill No</span>
                <span className="font-mono">#{purchase.purchase_no}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Purchase Date</span>
                <span>{formatDate(purchase.purchase_date)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Supplier</span>
                <span className="text-right">{purchase.supplier?.company || purchase.supplier?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Supplier Address</span>
                <span className="text-right">{purchase.supplier?.address || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Reference No</span>
                <span>{purchase.reference_no || purchase.id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Warehouse</span>
                <span>{purchase.warehouse?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Served By</span>
                <span>{purchase.created_by?.name || auth.user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Date & Time</span>
                <span>{formatDateTime(purchase.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Items table */}
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
                  <th className="border border-black p-1 w-[10%]">Unit Price</th>
                  <th className="border border-black p-1 w-[6%]">Add (5%)</th>
                  <th className="border border-black p-1 w-[8%]">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const unitPrice = getPrice(item, 'unit_price');
                  const totalPrice = getPrice(item, 'total_price');
                  const addAmount = totalPrice - (unitPrice * item.quantity);

                  return (
                    <tr key={item.id || index}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1 text-center font-mono">
                        {getProductCode(item)}
                      </td>
                      <td className="border border-black p-1">
                        <div className="font-semibold">{getProductDisplayName(item)}</div>
                        {item.variant?.sku && (
                          <div className="text-[9px] text-gray-600">
                            SKU: {item.variant.sku}
                          </div>
                        )}
                      </td>
                      <td className="border border-black p-1">
                        {getVariantDisplayName(item.variant)}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {getBrandName(item.variant)}
                      </td>
                      <td className="border border-black p-1 text-center font-bold">
                        {item.quantity}
                        {item.unit ? (
                          <span className="text-[9px] text-gray-600"> {item.unit}</span>
                        ) : null}
                      </td>
                      <td className="border border-black p-1 text-right font-mono">
                        {formatCurrency(unitPrice)}
                      </td>
                      <td className="border border-black p-1 text-right font-mono">
                        {formatCurrency(addAmount)}
                      </td>
                      <td className="border border-black p-1 text-right font-mono font-bold"
                        style={{ color: isShadowUser ? '#d97706' : '#1d4ed8' }}>
                        {formatCurrency(totalPrice)}
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="border border-black p-3 text-center text-gray-600">
                      No items found in this purchase
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Footer totals row */}
              <tfoot>
                <tr>
                  <td colSpan={5} className="border border-black p-1 text-right font-bold">
                    Total Items: {items.length}
                  </td>
                  <td className="border border-black p-1 text-center font-bold">{totalQty}</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 text-right font-bold"
                    style={{ color: isShadowUser ? '#d97706' : '#1d4ed8' }}>
                    {formatCurrency(getPurchaseAmount('grand_total'))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom summary */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
            <div className="border border-gray-300 p-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total Items</span>
                <span className="font-mono">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Quantity</span>
                <span className="font-mono">{totalQty}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                <span>Grand Total</span>
                <span className="font-mono" style={{ color: isShadowUser ? '#d97706' : '#1d4ed8' }}>
                  {formatCurrency(getPurchaseAmount('grand_total'))}
                </span>
              </div>
            </div>

            <div className="border border-gray-300 p-2">
              <div className="flex justify-between">
                <span className="font-semibold">Paid Amount</span>
                <span className="font-mono">{formatCurrency(getPurchaseAmount('paid_amount'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Due Amount</span>
                <span className="font-mono">
                  {formatCurrency(getPurchaseAmount('grand_total') - getPurchaseAmount('paid_amount'))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Payment Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {purchase.payment_status?.toUpperCase() || 'UNPAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Signature row */}
          <div className="mt-5 grid grid-cols-4 gap-4 text-[10px]">
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Checked By</div>
              <div className="text-[9px] text-gray-600">(Name, seal, time)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Authorised</div>
              <div className="text-[9px] text-gray-600">(Signature & Seal)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Received</div>
              <div className="text-[9px] text-gray-600">(Signature & Seal)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Delivery By</div>
              <div className="text-[9px] text-gray-600">Software by TETRA SOFT</div>
              <div className="text-[9px] text-gray-600">Phone 01911-387001</div>
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

          {/* Signatures images */}
          {/* <div className="flex space-x-2 pt-2">
                        <img src="/media/uploads/sig4.png" alt="Signature 1" className="w-1/5 h-12" />
                        <img src="/media/uploads/sig5.png" alt="Signature 2" className="w-1/5 h-12" />
                        <img src="/media/uploads/sig6.png" alt="Signature 3" className="w-1/8 h-12" />
                        <img src="/media/uploads/sig7.png" alt="Signature 4" className="w-1/5 h-12" />
                        <img src="/media/uploads/sig8.png" alt="Signature 5" className="w-1/5 h-12" />
                    </div> */}

          {/* Notes Section */}
          {purchase.notes && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-bold text-sm mb-2">Additional Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}