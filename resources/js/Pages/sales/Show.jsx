// resources/js/Pages/sales/SaleShow.jsx
import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function SaleShow({ sale }) {
  const { auth } = usePage().props;

  // ---------- helpers ----------
  const formatCurrency = (amount) => {
    const n = Number(amount || 0);
    return n.toFixed(2);
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
    // if (!item.variant) return "N/A";
    // if (item.variant?.name) return item.variant.name;
    if (item.variant?.attribute_values && typeof item.variant.attribute_values === "object") {
      return Object.values(item.variant.attribute_values).join(", ");
    }
    return item.variant?.attribute_values || "N/A";
  };

  const getBrandName = (item) => {
    // if (item.item_type === "pickup") return item.brand || "N/A";
    return item.product?.brand?.name || item.brand?.name || item.product?.brand || "N/A";
  };

  // const getBrandName = (item) => {
  //      if (item.variant?.attribute_values && typeof item.variant.attribute_values === "object") {
  //         return Object.keys(item.variant.attribute_values).join(", ");
  //     }
  //     return item.variant?.attribute_values || "N/A";
  // };

  const totalQty = useMemo(() => {
    return sale.items?.reduce((t, it) => t + Number(it.quantity || 0), 0) || 0;
  }, [sale]);

  const getAddAmount = (item) => {
    return Number(item.add_amount || item.vat_amount || item.tax_amount || 0);
  };

  const rowTotal = (item) => {
    // prefer backend total_price; else calculate
    const backend = Number(item.total_price || 0);
    if (backend) return backend;
    const qty = Number(item.quantity || 0);
    const unit = Number(item.unit_price || 0);
    return qty * unit + getAddAmount(item);
  };

  const items = sale.items || [];

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
            body { background: white; }
            table { width: 100%; border-collapse: collapse; }
            </style>
        </head>
        <body>${printContents}</body>
        </html>
    `;

    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // page back to normal
  };


  // “PDF” button: open print dialog -> user selects Save as PDF (no extra package)
  const handleDownloadPDF = () => {
    handlePrint();
  };


  // ---------- business info ----------
  const business = sale?.creator?.business || "Business Name";
  const headOfficeTitle = business?.name || business?.business_name || "মেসার্স মোটর সাইকেল এন্টারপ্রাইজ";
  const headOfficeAddr = business?.address || "Address";
  const headOfficePhone = business?.phone || "phone number";
  const headOfficeEmail = "email";

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
          <Link href={route("sales.index")} className="btn btn-sm btn-ghost border border-gray-300">
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Link>
          <button onClick={handlePrint} className="btn btn-sm bg-gray-900 hover:bg-black text-white">
            <Printer size={16} className="mr-1" />
            Print
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-sm bg-gray-700 hover:bg-gray-800 text-white">
            <Download size={16} className="mr-1" />
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
                className="h-full w-full object-contain p-1 "
                style={
                  { borderRadius: "50%" }
                }
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/media/uploads/logo.png";
                }}
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
                  className="h-full w-full object-contain p-1 "
                  style={
                    { borderRadius: "50%" }
                  }
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/media/uploads/logo.png";
                  }}
                />
              </div>
              <div>
                <div className="text-xl font-black tracking-wide text-gray-900">
                  {headOfficeTitle}
                </div>
                <div className="text-[11px] font-semibold tracking-[0.22em] text-gray-700 -mt-0.5">

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
                <span className="text-right">{sale.customer?.customer_name || "Walk-in Customer"}</span>
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
                <span>{sale.creator?.name || auth?.user?.name || "N/A"}</span>
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
                        {item.unit ? (
                          <span className="text-[9px] text-gray-600"> {item.unit}</span>
                        ) : null}
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
                  <td className="border border-black p-1 text-center font-bold">{totalQty}
                
                  </td>
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
              <span>বিক্রয়িত পণ্য  ১৫  দিনের  মধ্যে ফেরত যোগ্য । পণ্য  ফেরতের সময়  অবশ্যই মেমোর ফটোকপি  দিতে হবে </span>
            </div>
            <div>
              Powered by: Nexoryn
              <br />
              {/* Phone: 01676-773088 */}
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
