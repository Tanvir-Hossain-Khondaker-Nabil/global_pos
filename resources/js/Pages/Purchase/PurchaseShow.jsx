import { router, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useMemo } from "react";

export default function PurchaseShow({ purchase, isShadowUser = false, businessProfile }) {
  const { auth } = usePage().props;

  const safeItems = useMemo(() => purchase?.items || [], [purchase]);

  // ================== Helpers ==================
  const formatMoney = (num) => {
    const n = Number(num || 0);
    return n.toFixed(2);
  };

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
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ variant attribute_values -> pretty text
  const normalizeVariantText = (variant) => {
    if (!variant) return "";

    if (variant?.sku) return variant.sku;

    const raw = variant?.attribute_values;
    if (!raw) return "";

    let obj = null;
    if (typeof raw === "string") {
      try {
        obj = JSON.parse(raw);
      } catch (e) {
        obj = null;
      }
    } else if (typeof raw === "object") {
      obj = raw;
    }

    if (!obj || typeof obj !== "object") return "";

    const parts = Object.entries(obj)
      .map(([k, v]) => {
        const key = String(k || "").split("-")[0] || k;
        const val = String(v ?? "");
        if (!key && !val) return "";
        return `${key}: ${val}`;
      })
      .filter(Boolean);

    return parts.join(", ");
  };

  // Shadow price support
  const getPrice = (item, field) => {
    if (!item) return 0;
    if (isShadowUser) {
      if (field === "unit_price") return item.shadow_unit_price ?? item.unit_price ?? 0;
      if (field === "total_price") return item.shadow_total_price ?? item.total_price ?? 0;
    }
    return item[field] ?? 0;
  };

  const getPurchaseAmount = (field) => {
    if (!purchase) return 0;
    if (isShadowUser) {
      if (field === "grand_total") return purchase.shadow_grand_total ?? purchase.grand_total ?? 0;
      if (field === "paid_amount") return purchase.shadow_paid_amount ?? purchase.paid_amount ?? 0;
      if (field === "due_amount") return purchase.shadow_due_amount ?? purchase.due_amount ?? 0;
    }
    return purchase[field] ?? 0;
  };

  const totalQty = useMemo(
    () => safeItems.reduce((s, it) => s + Number(it?.quantity || 0), 0),
    [safeItems]
  );

  const totals = useMemo(() => {
    const grandTotal = Number(getPurchaseAmount("grand_total") || 0);
    const paid = Number(getPurchaseAmount("paid_amount") || 0);
    const due = Number(getPurchaseAmount("due_amount") || (grandTotal - paid) || 0);
    return { grandTotal, paid, due };
  }, [purchase, isShadowUser]);

  const paymentStatus = useMemo(() => {
    const due = Number(totals.due || 0);
    if (due <= 0) return "PAID";
    if (due > 0 && Number(totals.paid || 0) > 0) return "PARTIAL";
    return "UNPAID";
  }, [totals]);

  // ================== Business Profile Dynamic ==================
  const bp = businessProfile || {};
  const companyName = bp?.name || "আল-মদিনা স্টোর";
  const companyPhone = bp?.phone || "";
  const companyEmail = bp?.email || "";
  const companyAddress = bp?.address || "";
  const companyWebsite = bp?.website || "";

  const logoUrl = bp?.logo ? `/storage/${bp.logo}` : null;
  const watermarkUrl = bp?.thum ? `/storage/${bp.thum}` : logoUrl;

  // ================== Invoice Data ==================
  const billNo = purchase?.purchase_no || `#PUR-${purchase?.id || ""}`;
  const purchaseDate = formatDate(purchase?.purchase_date || purchase?.created_at);
  const dateTime = formatDateTime(purchase?.purchase_date || purchase?.created_at);

  const supplierName =
    purchase?.supplier?.company ||
    purchase?.supplier?.name ||
    purchase?.supplier?.contact_person ||
    "N/A";

  const supplierAddress = purchase?.supplier?.address || "N/A";
  const warehouseName = purchase?.warehouse?.name || "N/A";
  const servedBy = purchase?.served_by || "N/A";
  const referenceNo = purchase?.reference_no || purchase?.reference || "";

  const totalItems = safeItems.length;

  // ✅ rows mapping
  const rows = useMemo(() => {
    return safeItems.map((item, idx) => {
      const code =
        item?.product?.product_no ||
        item?.product?.sku ||
        item?.product?.code ||
        item?.code ||
        "N/A";

      const itemName = item?.product?.name || item?.product_name || item?.description || "N/A";

      const variantText =
        normalizeVariantText(item?.variant) ||
        item?.variant?.name ||
        item?.variant?.title ||
        item?.model ||
        item?.variant_name ||
        "";

      const brandName =
        item?.product?.brand?.name || item?.brand?.name || item?.brand_name || "N/A";

      const qty = Number(item?.quantity || 0);
      const unitPrice = Number(getPrice(item, "unit_price") || 0);
      const amount = Number(getPrice(item, "total_price") || qty * unitPrice || 0);

      const add5 = Number(item?.tax_amount || item?.vat_amount || 0);
      const totalValue = amount + add5;

      return {
        sl: idx + 1,
        code,
        itemName,
        variantText,
        brandName,
        qty,
        unitPrice,
        add5,
        totalValue,
      };
    });
  }, [safeItems, isShadowUser]);

  // ================== Print (DIRECT) ==================
  const handlePrint = () => window.print();
  const handleDownloadPDF = () => window.print(); // browser "Save as PDF"

  // ================== Invoice Template ==================
  const Invoice = () => (
    <div className="invoice-wrap">
      <div className="invoice-sheet">
        {watermarkUrl ? (
          <div
            className="invoice-watermark"
            style={{ backgroundImage: `url('${watermarkUrl}')` }}
          />
        ) : null}

        <div className="invoice-header">
          <div className="header-left">
            <div className="logo-circle">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" />
              ) : (
                <div className="logo-fallback">LOGO</div>
              )}
            </div>
            <div className="company-title">{companyName}</div>
          </div>

          <div className="header-right">
            <div className="office-title">অফিস</div>
            <div className="office-text">
              {companyAddress ? <div>{companyAddress}</div> : null}
              {companyPhone ? <div>{companyPhone}</div> : null}
              {companyEmail ? <div>{companyEmail}</div> : null}
              {companyWebsite ? <div>{companyWebsite}</div> : null}
            </div>
          </div>
        </div>

        <div className="hr-thin" />

        <div className="invoice-title-row">
          <div className="invoice-title-box">PURCHASE INVOICE</div>
        </div>

        <div className="info-grid">
          <div className="info-col">
            <div className="info-row">
              <div className="k">Bill No</div>
              <div className="v">{billNo}</div>
            </div>
            <div className="info-row">
              <div className="k">Purchase Date</div>
              <div className="v">{purchaseDate}</div>
            </div>
            <div className="info-row">
              <div className="k">Supplier</div>
              <div className="v">{supplierName}</div>
            </div>
            <div className="info-row">
              <div className="k">Supplier Address</div>
              <div className="v">{supplierAddress}</div>
            </div>
          </div>

          <div className="info-col">
            <div className="info-row">
              <div className="k">Reference No</div>
              <div className="v">{referenceNo || "—"}</div>
            </div>
            <div className="info-row">
              <div className="k">Warehouse</div>
              <div className="v">{warehouseName}</div>
            </div>
            <div className="info-row">
              <div className="k">Served By</div>
              <div className="v">{servedBy}</div>
            </div>
            <div className="info-row">
              <div className="k">Date &amp; Time</div>
              <div className="v">{dateTime}</div>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="w-sl">SL</th>
                <th className="w-code">Code</th>
                <th className="w-item">Item Name</th>
                <th className="w-variant">Model / Variant</th>
                <th className="w-brand">Brand</th>
                <th className="w-qty">Qty</th>
                <th className="w-unit">Unit Price</th>
                <th className="w-add">Add (5%)</th>
                <th className="w-total">Total Value</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.sl}>
                    <td className="center">{r.sl}</td>
                    <td className="center">{r.code}</td>
                    <td>
                      <div className="item-strong">{r.itemName}</div>
                    </td>
                    <td>{r.variantText || "—"}</td>
                    <td className="center">{r.brandName}</td>
                    <td className="center">{r.qty}</td>
                    <td className="right">{formatMoney(r.unitPrice)}</td>
                    <td className="right">{formatMoney(r.add5)}</td>
                    <td className="right total-blue">{formatMoney(r.totalValue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="empty">
                    কোনো আইটেম পাওয়া যায়নি
                  </td>
                </tr>
              )}

              <tr className="table-summary-row">
                <td colSpan={5} className="right bold">
                  Total Items: {totalItems}
                </td>
                <td className="center bold">{totalQty}</td>
                <td colSpan={2}></td>
                <td className="right bold total-blue">{formatMoney(totals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="summary-grid">
          <div className="sum-box">
            <div className="sum-row">
              <div>Total Items</div>
              <div className="bold">{totalItems}</div>
            </div>
            <div className="sum-row">
              <div>Total Quantity</div>
              <div className="bold">{totalQty}</div>
            </div>
            <div className="sum-row">
              <div className="bold">Grand Total</div>
              <div className="bold total-blue">{formatMoney(totals.grandTotal)}</div>
            </div>
          </div>

          <div className="sum-box">
            <div className="sum-row">
              <div>Paid Amount</div>
              <div className="bold">{formatMoney(totals.paid)}</div>
            </div>
            <div className="sum-row">
              <div>Due Amount</div>
              <div className="bold">{formatMoney(totals.due)}</div>
            </div>
            <div className="sum-row status-row">
              <div>Payment Status</div>
              <div
                className={`status-pill ${
                  paymentStatus === "PAID"
                    ? "paid"
                    : paymentStatus === "PARTIAL"
                    ? "partial"
                    : "unpaid"
                }`}
              >
                {paymentStatus}
              </div>
            </div>
          </div>
        </div>

        <div className="sign-grid">
          <div className="sign">
            <div className="sign-line" />
            <div className="sign-title">Checked By</div>
            <div className="sign-sub">(Name, seal, time)</div>
          </div>
          <div className="sign">
            <div className="sign-line" />
            <div className="sign-title">Authorised</div>
            <div className="sign-sub">(Signature &amp; Seal)</div>
          </div>
          <div className="sign">
            <div className="sign-line" />
            <div className="sign-title">Received</div>
            <div className="sign-sub">(Signature &amp; Seal)</div>
          </div>
          <div className="sign">
            <div className="sign-line" />
            <div className="sign-title">Delivery By</div>
            <div className="sign-sub">(Signature &amp; Seal)</div>
          </div>
        </div>

        {/* <div className="bottom-note">
          বিক্রয়কৃত পণ্য ৭ দিনের মধ্যে ফেরত দেওয়া যাবে। পণ্য ফেরতের সময় অবশ্যই মেমোসহ উপস্থিত থাকতে হবে।
        </div> */}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <style>{`
        /* --- DEFAULT VIEW --- */
        .no-print { display: block; }

        /* --- PRINT: ONLY .invoice-wrap --- */
        @media print {
          html, body {
            margin: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* hide everything by default */
          body * { visibility: hidden !important; }

          /* show only invoice-wrap */
          .invoice-wrap, .invoice-wrap * { visibility: visible !important; }

          /* position invoice at top-left */
          .invoice-wrap {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
          }

          .invoice-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }

          /* make sure buttons/header area never prints */
          .no-print { display: none !important; }
        }

        .invoice-wrap{ display:flex; justify-content:center; }
        .invoice-sheet{
          position:relative;
          background:#fff;
          border:1px solid #d6d6d6;
          border-radius:8px;
          padding:16px 16px 12px 16px;
          box-shadow: 0 1px 10px rgba(0,0,0,.06);
          overflow:hidden;
        }

        .invoice-watermark{
          position:absolute;
          inset:0;
          background-repeat:no-repeat;
          background-position:center;
          background-size: 420px;
          opacity:.06;
          pointer-events:none;
        }

        .hr-thin{ border-top:1px solid #cfcfcf; margin:10px 0; }

        .invoice-header{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:14px;
        }
        .header-left{
          display:flex;
          align-items:center;
          gap:10px;
          flex: 1;
          min-width: 0;
        }
        .logo-circle{
          width:54px;
          height:54px;
          border-radius:999px;
          border:2px solid #ef4444;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          background:#fff;
          flex: 0 0 auto;
        }
        .logo-circle img{ width:100%; height:100%; object-fit:cover; }
        .logo-fallback{ font-size:10px; color:#666; }
        .company-title{
          font-size:28px;
          font-weight:800;
          color:#111;
          line-height:1.1;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .header-right{
          width: 260px;
          border-left: 1px solid #dedede;
          padding-left: 12px;
        }
        .office-title{ color:#dc2626; font-weight:800; margin-bottom:4px; }
        .office-text{ font-size:12px; color:#333; line-height:1.35; white-space:pre-wrap; }

        .invoice-title-row{ display:flex; justify-content:center; margin: 2px 0 10px 0; }
        .invoice-title-box{
          border:1px solid #bdbdbd;
          padding:6px 18px;
          font-weight:800;
          letter-spacing:.5px;
          font-size:14px;
          background:#fff;
          border-radius:4px;
        }

        .info-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          font-size:12px;
          color:#222;
          margin-bottom:10px;
        }
        .info-row{
          display:grid;
          grid-template-columns: 110px 1fr;
          gap: 10px;
          margin: 6px 0;
        }
        .info-row .k{ font-weight:700; color:#444; }
        .info-row .v{ color:#111; }

        .table-wrap{ margin-top:6px; }
        .invoice-table{
          border-collapse:collapse;
          table-layout:fixed;
          font-size:12px;
        }
        .invoice-table thead th{
          border:1px solid #cfcfcf;
          padding:8px 6px;
          background:#f6f7f8;
          font-weight:800;
          text-align:center;
          color:#111;
        }
        .invoice-table tbody td{
          border-left:1px solid #d6d6d6;
          border-right:1px solid #d6d6d6;
          border-bottom:1px solid #ededed;
          padding:8px 6px;
          vertical-align:top;
        }
        .invoice-table tbody tr:last-child td{ border-bottom:1px solid #d6d6d6; }

        .invoice-table .center{ text-align:center; }
        .invoice-table .right{ text-align:right; }
        .invoice-table .empty{
          text-align:center;
          padding:22px 8px;
          color:#666;
          border:1px solid #d6d6d6;
        }
        .item-strong{ font-weight:800; }
        .total-blue{ color:#1d4ed8; font-weight:900; }

        .w-sl{ width: 36px; }
        .w-code{ width: 90px; }
        .w-item{ width: 240px; }
        .w-variant{ width: 170px; }
        .w-brand{ width: 80px; }
        .w-qty{ width: 55px; }
        .w-unit{ width: 80px; }
        .w-add{ width: 70px; }
        .w-total{ width: 90px; }

        .table-summary-row td{
          border-top:1px solid #cfcfcf;
          border-bottom:1px solid #cfcfcf;
          padding:8px 6px;
          background:#fbfbfb;
        }
        .bold{ font-weight:900; }

        .summary-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        .sum-box{
          border:1px solid #dedede;
          padding:10px 12px;
          font-size:12px;
          background:#fff;
          border-radius:6px;
        }
        .sum-row{
          display:flex;
          justify-content:space-between;
          padding:4px 0;
        }

        .status-pill{
          padding:4px 10px;
          border-radius:4px;
          font-weight:900;
          font-size:12px;
          border:1px solid #ddd;
        }
        .status-pill.unpaid{ color:#b91c1c; border-color:#fecaca; background:#fff5f5; }
        .status-pill.paid{ color:#166534; border-color:#bbf7d0; background:#f0fdf4; }
        .status-pill.partial{ color:#92400e; border-color:#fde68a; background:#fffbeb; }

        .sign-grid{
          display:grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 18px;
          font-size:12px;
        }
        .sign{ text-align:center; color:#333; }
        .sign-line{
          border-top:1px solid #9a9a9a;
          margin: 18px 10px 8px 10px;
        }
        .sign-title{ font-weight:800; }
        .sign-sub{ font-size:11px; color:#666; margin-top:2px; }
        .rightText{ text-align:right; }
        .rightText .sign-line{ margin-left:auto; margin-right:0; width: 80%; }

        .bottom-note{
          margin-top:10px;
          font-size:11px;
          color:#444;
          display:flex;
          justify-content:space-between;
          gap:10px;
          flex-wrap:wrap;
        }

        @media (max-width: 860px){
          .company-title{ font-size:22px; }
          .header-right{ width: 220px; }
          .info-grid{ grid-template-columns:1fr; }
          .sign-grid{ grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* Top bar (NOT printed) */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Purchase Invoice</h1>
            <p className="text-sm text-gray-600 mt-1">
              Bill: <span className="font-semibold">{billNo}</span> • Date:{" "}
              <span className="font-semibold">{purchaseDate}</span>
              {isShadowUser && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                  Shadow
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.visit(route("purchase.list"))}
              className="btn btn-sm btn-ghost border border-gray-300"
            >
              <ArrowLeft size={15} className="mr-1" />
              Back
            </button>

            <button onClick={handlePrint} className="btn btn-sm text-white bg-gray-900">
              <Printer size={15} className="mr-1" />
              Print
            </button>

            <button onClick={handleDownloadPDF} className="btn btn-sm text-white bg-gray-900">
              <Download size={15} className="mr-1" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Invoice (this is what prints; print CSS shows ONLY invoice-wrap) */}
      <Invoice />
    </div>
  );
}
