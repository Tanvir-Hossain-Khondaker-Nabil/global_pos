import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, usePage } from "@inertiajs/react";
import {
  Eye,
  Plus,
  Trash2,
  Frown,
  Calendar,
  User,
  Warehouse,
  Edit,
  Search,
  X,
  RefreshCw,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Receipt,
  Barcode,
  Printer,
  CheckSquare,
  Square,
  Layers,
  AlignLeft,
  AlignRight,
  Tag,
  Copy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PurchaseList({ purchases, filters, isShadowUser, accounts }) {
  const { auth } = usePage().props;
  const { t, locale } = useTranslation();

  const safePurchases = purchases?.data || [];

  const [localFilters, setLocalFilters] = useState({
    search: filters?.search || "",
    status: filters?.status || "",
    date: filters?.date || "",
  });

  // ===================== Payment Modal =====================
  const [paymentForm, setPaymentForm] = useState({
    payment_amount: "",
    account_id: "",
    notes: "",
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});

  // ===================== Bulk Barcode Print =====================
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState(() => new Set());
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const [barcodeConfig, setBarcodeConfig] = useState({
    showProductName: true,
    showBatchNo: true,
    showSalePrice: true,

    align: "left", // left | right

    labelWidthMm: 50,
    labelHeightMm: 30,
    gapMm: 2,

    copiesMode: "one", // one | byQty | fixed
    fixedCopies: 1,

    barcodeImgHeightPx: 40,
  });

  const selectedPurchases = useMemo(() => {
    const ids = selectedPurchaseIds;
    return safePurchases.filter((p) => ids.has(p.id));
  }, [safePurchases, selectedPurchaseIds]);

  // ===================== Helpers =====================
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const formatAccountBalance = (balance) => {
    const num = parseFloat(balance) || 0;
    return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  // ===================== Filters =====================
  const handleFilter = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);

    const qs = {};
    if (newFilters.search) qs.search = newFilters.search;
    if (newFilters.status) qs.status = newFilters.status;
    if (newFilters.date) qs.date = newFilters.date;

    router.get(route("purchase.list"), qs, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    setLocalFilters({ search: "", status: "", date: "" });
    router.get(route("purchase.list"), {}, { replace: true });
  };

  const handleDelete = (id) => {
    if (confirm("Permanently wipe record and reverse stock?")) {
      router.delete(route("purchase.destroy", id));
    }
  };

  // ===================== Amounts =====================
  const getDisplayAmounts = (purchase) => {
    if (!purchase) return { total: 0, paid: 0, due: 0, payment_status: "unpaid" };

    const total = parseFloat(purchase.grand_total) || 0;
    const paid = parseFloat(purchase.paid_amount) || 0;
    const due = parseFloat(purchase.due_amount) || 0;
    const paymentStatus = purchase.payment_status || "unpaid";

    if (isShadowUser && purchase.shadow_total_amount !== undefined) {
      return {
        total: parseFloat(purchase.shadow_total_amount) || total,
        paid: parseFloat(purchase.shadow_paid_amount) || paid,
        due: parseFloat(purchase.shadow_due_amount) || due,
        payment_status: purchase.shadow_payment_status || paymentStatus,
      };
    }

    return { total, paid, due: due > 0 ? due : Math.max(0, total - paid), payment_status: paymentStatus };
  };

  // ===================== Payment Modal =====================
  const openPaymentModal = (purchase) => {
    const amounts = getDisplayAmounts(purchase);
    setSelectedPurchase(purchase);
    setPaymentForm({
      payment_amount: Math.max(0, amounts.due).toFixed(2),
      account_id: "",
      notes: "",
    });
    setPaymentErrors({});
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPurchase(null);
    setPaymentForm({ payment_amount: "", account_id: "", notes: "" });
    setProcessingPayment(false);
    setPaymentErrors({});
  };

  const validatePaymentForm = () => {
    const errors = {};
    const amounts = getDisplayAmounts(selectedPurchase);
    const maxAmount = amounts.due;

    if (!paymentForm.account_id) errors.account_id = "Please select a payment method";
    if (!paymentForm.payment_amount || parseFloat(paymentForm.payment_amount) <= 0) {
      errors.payment_amount = "Please enter a valid payment amount";
    } else if (parseFloat(paymentForm.payment_amount) > maxAmount) {
      errors.payment_amount = `Payment amount cannot exceed due amount of ${formatCurrency(maxAmount)}`;
    }
    return errors;
  };

  const handlePaymentFormChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
    if (paymentErrors[field]) setPaymentErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setFullPayment = () => {
    if (!selectedPurchase) return;
    const amounts = getDisplayAmounts(selectedPurchase);
    handlePaymentFormChange("payment_amount", Math.max(0, amounts.due).toFixed(2));
  };

  const setHalfPayment = () => {
    if (!selectedPurchase) return;
    const amounts = getDisplayAmounts(selectedPurchase);
    handlePaymentFormChange("payment_amount", Math.max(0, amounts.due * 0.5).toFixed(2));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    const errors = validatePaymentForm();
    if (Object.keys(errors).length > 0) return setPaymentErrors(errors);

    setProcessingPayment(true);

    router.post(
      route("purchase.updatePayment", selectedPurchase.id),
      {
        payment_amount: parseFloat(paymentForm.payment_amount),
        account_id: paymentForm.account_id,
        notes: paymentForm.notes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          closePaymentModal();
          router.reload({ only: ["purchases"], preserveScroll: true });
        },
        onError: (errors) => {
          const formatted = {};
          Object.keys(errors).forEach((k) => (formatted[k] = Array.isArray(errors[k]) ? errors[k][0] : errors[k]));
          setPaymentErrors(formatted);
        },
        onFinish: () => setProcessingPayment(false),
      }
    );
  };

  // ===================== Bulk Select =====================
  const isAllSelected = safePurchases.length > 0 && selectedPurchaseIds.size === safePurchases.length;

  const toggleSelectAll = () => {
    setSelectedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (safePurchases.length === 0) return next;

      if (next.size === safePurchases.length) next.clear();
      else safePurchases.forEach((p) => next.add(p.id));

      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedPurchaseIds(new Set());

  // ===================== Barcode Modal =====================
  const openBarcodeModal = () => {
    if (selectedPurchaseIds.size === 0) return alert("Please select at least 1 purchase");
    setShowBarcodeModal(true);
  };
  const closeBarcodeModal = () => setShowBarcodeModal(false);

  const updateBarcodeConfig = (key, value) => setBarcodeConfig((prev) => ({ ...prev, [key]: value }));

  // ===================== Barcode Image Generator =====================
  const getBarcodeImageUrl = (codeValue) => {
    const code = String(codeValue || "").trim();
    if (!code) return "";
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=Code128&dpi=96&dataseparator=`;
  };

  // ===================== Build Labels =====================
  const buildBarcodeLabels = () => {
    const labels = [];
    const seen = new Set();

    const { copiesMode, fixedCopies } = barcodeConfig;

    const resolveCopies = (qty) => {
      if (copiesMode === "fixed") return Math.max(1, Number(fixedCopies || 1));
      if (copiesMode === "byQty") return Math.max(1, Math.round(Number(qty || 1)));
      return 1;
    };

    selectedPurchases.forEach((purchase) => {
      const items = Array.isArray(purchase?.items) ? purchase.items : [];

      if (items.length) {
        items.forEach((item) => {
          const product = item?.product || {};
          const stock = item?.stock || {};

          const barcode = stock?.barcode || product?.barcode || item?.barcode || stock?.batch_no || product?.sku || "";
          const code = String(barcode || "").trim();
          if (!code) return;

          // ✅ Dedup by code + batch (same product different batch print allowed)
          const batchNo = String(stock?.batch_no || "").trim();
          const key = `${code}__${batchNo || "-"}`;
          if (seen.has(key)) return;
          seen.add(key);

          const copies = resolveCopies(item?.quantity);

          for (let i = 0; i < copies; i++) {
            labels.push({
              codeValue: code,
              imgSrc: getBarcodeImageUrl(code),
              productName: product?.name || item?.product_name || "Product",
              batchNo,
              salePrice: item?.sale_price || product?.sale_price || "",
            });
          }
        });
      } else {
        const purchaseCode = String(purchase?.purchase_no || purchase?.id || "").trim();
        if (!purchaseCode) return;

        const key = `${purchaseCode}__-`;
        if (seen.has(key)) return;
        seen.add(key);

        labels.push({
          codeValue: purchaseCode,
          imgSrc: getBarcodeImageUrl(purchaseCode),
          productName: purchase?.supplier?.name ? `Supplier: ${purchase.supplier.name}` : "Purchase",
          batchNo: "",
          salePrice: "",
        });
      }
    });

    return labels;
  };

  // ===================== PRINT FUNCTION - RIGHT/LEFT FIXED =====================
  const handleBarcodePrint = () => {
    const labels = buildBarcodeLabels();
    if (!labels.length) {
      alert("No barcodes found to print.");
      return;
    }

    const {
      showProductName,
      showBatchNo,
      showSalePrice,
      align,
      labelWidthMm,
      labelHeightMm,
      gapMm,
      barcodeImgHeightPx,
    } = barcodeConfig;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print barcodes.");
      return;
    }

    // ✅ KEY FIX:
    // - grid has fixed column width: repeat(auto-fill, ${labelWidthMm}mm)
    // - wrap grid inside .sheet (flex) and align with justify-content (left/right)
    const css = `
      @page { margin: 5mm; }
      @media print {
        body { margin: 0; padding: 0; }
        .no-print { display: none !important; }
      }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body {
        margin: 0;
        padding: 10px;
        font-family: Arial, sans-serif;
        background: white;
      }

      .sheet {
        display: flex;
        justify-content: ${align === "right" ? "flex-end" : "flex-start"};
        width: 100%;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, ${labelWidthMm}mm);
        gap: ${gapMm}mm;
        align-content: start;
      }

      .label {
        width: ${labelWidthMm}mm;
        height: ${labelHeightMm}mm;
        padding: 5px;
        border: 1px solid #eee;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-inside: avoid;
        break-inside: avoid;
        overflow: hidden;
        background: #fff;
      }

      .label-top { font-size: 10px; line-height: 1.2; }
      .product-name { font-weight: bold; font-size: 11px; margin-bottom: 3px; color: #333; }
      .label-details {
        font-size: 9px;
        color: #666;
        display: flex;
        justify-content: space-between;
        margin: 2px 0;
        gap: 8px;
      }

      .barcode-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 5px 0;
      }

      .barcode-img { max-width: 100%; height: ${barcodeImgHeightPx}px; object-fit: contain; }
      .barcode-text {
        text-align: center;
        font-family: monospace;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1px;
        margin-top: 3px;
        color: #000;
      }

      .print-info { font-size: 8px; color: #999; text-align: center; margin-top: 5px; }

      .no-print {
        text-align: center;
        margin-top: 20px;
        padding: 10px;
      }
      .print-btn {
        background: #111827;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        margin: 0 6px;
        font-weight: 700;
      }
      .print-btn:hover { opacity: .9; }
    `;

    const labelsHtml = labels
      .map((label, index) => `
        <div class="label">
          <div class="label-top">
            ${showProductName ? `<div class="product-name">${escapeHtml(label.productName)}</div>` : ""}
          </div>

          <div class="barcode-container">
            <img
              src="${escapeHtml(label.imgSrc)}"
              class="barcode-img"
              alt="Barcode ${escapeHtml(label.codeValue)}"
            />
            <div class="barcode-text "> ${label.salePrice ? `৳${Number(label.salePrice).toFixed(2)}` : "-"}</div>
          </div>
        </div>
      `)
      .join("");

    // ✅ Single reliable print trigger: wait for images load/error
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Print Barcodes</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="sheet">
          <div class="grid">${labelsHtml}</div>
        </div>

        <div class="no-print">
          <div style="margin-bottom:8px;color:#6b7280;font-size:12px;font-weight:700;">
            Total: ${labels.length} labels
          </div>
          <button class="print-btn" onclick="window.print()">Print Now</button>
          <button class="print-btn" onclick="window.close()">Close</button>
        </div>

        <script>
          (function() {
            var imgs = Array.from(document.images || []);
            if (!imgs.length) { setTimeout(function(){ window.print(); }, 300); return; }

            var done = 0;
            function finish() {
              done++;
              if (done >= imgs.length) setTimeout(function(){ window.print(); }, 250);
            }

            imgs.forEach(function(img) {
              // Force re-check complete state
              if (img.complete) return finish();
              img.onload = finish;
              img.onerror = finish;
            });

            // Hard fallback
            setTimeout(function(){ window.print(); }, 4000);
          })();
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    closeBarcodeModal();
  };

  const copyText = (txt) => {
    const text = String(txt || "");
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => { });
  };

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===================== UI =====================
  return (
    <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
      {/* ===================== Payment Modal ===================== */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-[#3333333d] bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mt-20">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Receipt className="text-red-600" size={20} />
                  Clear Payment
                </h3>
                <button onClick={closePaymentModal} className="btn btn-ghost btn-circle btn-sm" disabled={processingPayment}>
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total</div>
                    <div className="text-lg font-black text-gray-900">
                      {formatCurrency(getDisplayAmounts(selectedPurchase).total)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Due</div>
                    <div className="text-lg font-black text-red-600">
                      {formatCurrency(getDisplayAmounts(selectedPurchase).due)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Purchase #:</span>
                    <span className="font-bold">{selectedPurchase.purchase_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-bold">{selectedPurchase.supplier?.name || "N/A"}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text font-bold text-gray-700">Select Payment Method *</span>
                    </label>
                    <select
                      name="account_id"
                      value={paymentForm.account_id}
                      onChange={(e) => handlePaymentFormChange("account_id", e.target.value)}
                      className="select select-bordered w-full"
                      disabled={processingPayment}
                      required
                    >
                      <option value="">Select Payment Method</option>
                      {accounts?.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatAccountBalance(account.current_balance)} tk)
                        </option>
                      ))}
                    </select>
                    {paymentErrors.account_id && (
                      <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {paymentErrors.account_id}
                      </div>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text font-bold text-gray-700">Payment Amount *</span>
                    </label>

                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={setHalfPayment}
                        className="btn btn-sm btn-outline flex-1"
                        disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={setFullPayment}
                        className="btn btn-sm btn-outline btn-primary flex-1"
                        disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                      >
                        Full
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={getDisplayAmounts(selectedPurchase).due}
                        value={paymentForm.payment_amount}
                        onChange={(e) => handlePaymentFormChange("payment_amount", e.target.value)}
                        className="input input-bordered w-full pl-8 font-mono"
                        disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                        required
                      />
                    </div>

                    {paymentErrors.payment_amount && (
                      <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {paymentErrors.payment_amount}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-1">
                      Maximum: {formatCurrency(getDisplayAmounts(selectedPurchase).due)}
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text font-bold text-gray-700">Notes (Optional)</span>
                    </label>
                    <textarea
                      name="notes"
                      value={paymentForm.notes}
                      onChange={(e) => handlePaymentFormChange("notes", e.target.value)}
                      className="textarea textarea-bordered w-full"
                      rows="2"
                      placeholder="Payment reference or notes..."
                      disabled={processingPayment}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={closePaymentModal} className="btn btn-ghost flex-1" disabled={processingPayment}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={processingPayment || getDisplayAmounts(selectedPurchase).due <= 0}
                    >
                      {processingPayment ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Complete Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Barcode Modal ===================== */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mt-16 border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Barcode size={20} className="text-primary" />
                    Bulk Barcode Print
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">
                    Selected: <span className="text-gray-900">{selectedPurchaseIds.size}</span> purchase(s)
                  </p>
                </div>
                <button onClick={closeBarcodeModal} className="btn btn-ghost btn-circle btn-sm">
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                  <Layers size={14} />
                  Label Content
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={barcodeConfig.showProductName}
                      onChange={(e) => updateBarcodeConfig("showProductName", e.target.checked)}
                      className="checkbox checkbox-sm"
                    />
                    <span className="font-black text-sm flex items-center gap-2">
                      <Tag size={14} className="text-gray-500" />
                      Product Name
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={barcodeConfig.showBatchNo}
                      onChange={(e) => updateBarcodeConfig("showBatchNo", e.target.checked)}
                      className="checkbox checkbox-sm"
                    />
                    <span className="font-black text-sm">Batch No</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={barcodeConfig.showSalePrice}
                      onChange={(e) => updateBarcodeConfig("showSalePrice", e.target.checked)}
                      className="checkbox checkbox-sm"
                    />
                    <span className="font-black text-sm">Sale Price</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                    <AlignLeft size={14} />
                    Print Alignment
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateBarcodeConfig("align", "left")}
                      className={`btn btn-sm flex-1 ${barcodeConfig.align === "left" ? "btn-primary" : "btn-outline"}`}
                    >
                      <AlignLeft size={16} /> Left
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBarcodeConfig("align", "right")}
                      className={`btn btn-sm flex-1 ${barcodeConfig.align === "right" ? "btn-primary" : "btn-outline"}`}
                    >
                      <AlignRight size={16} /> Right
                    </button>
                  </div>
                  <div className="text-[11px] font-bold text-gray-500 mt-2">
                    Current: <span className="text-gray-900">{barcodeConfig.align.toUpperCase()}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                    <Copy size={14} />
                    Copies
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 font-black text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="copiesMode"
                        checked={barcodeConfig.copiesMode === "one"}
                        onChange={() => updateBarcodeConfig("copiesMode", "one")}
                      />
                      One label per item
                    </label>

                    <label className="flex items-center gap-2 font-black text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="copiesMode"
                        checked={barcodeConfig.copiesMode === "byQty"}
                        onChange={() => updateBarcodeConfig("copiesMode", "byQty")}
                      />
                      Print by item quantity
                    </label>

                    <label className="flex items-center gap-2 font-black text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="copiesMode"
                        checked={barcodeConfig.copiesMode === "fixed"}
                        onChange={() => updateBarcodeConfig("copiesMode", "fixed")}
                      />
                      Fixed copies
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={barcodeConfig.fixedCopies}
                      onChange={(e) => updateBarcodeConfig("fixedCopies", e.target.value)}
                      disabled={barcodeConfig.copiesMode !== "fixed"}
                      className="input input-sm input-bordered font-mono"
                      placeholder="Copies"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Label W (mm)</div>
                  <input
                    type="number"
                    min="20"
                    step="1"
                    value={barcodeConfig.labelWidthMm}
                    onChange={(e) => updateBarcodeConfig("labelWidthMm", e.target.value)}
                    className="input input-sm input-bordered font-mono w-full"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Label H (mm)</div>
                  <input
                    type="number"
                    min="15"
                    step="1"
                    value={barcodeConfig.labelHeightMm}
                    onChange={(e) => updateBarcodeConfig("labelHeightMm", e.target.value)}
                    className="input input-sm input-bordered font-mono w-full"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Gap (mm)</div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={barcodeConfig.gapMm}
                    onChange={(e) => updateBarcodeConfig("gapMm", e.target.value)}
                    className="input input-sm input-bordered font-mono w-full"
                  />
                </div>
              </div>


              <div className="mt-4 flex gap-2">
                <button type="button" onClick={closeBarcodeModal} className="btn btn-ghost flex-1">
                  Cancel
                </button>
                <button type="button" onClick={handleBarcodePrint} className="btn btn-primary flex-1">
                  <Printer size={18} />
                  Print Barcodes
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <div className="font-bold">Note:</div>
                <div>Uses tec-it.com barcode service. Make sure your browser allows images from external sources.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Header ===================== */}
      <PageHeader title={t("purchase.purchase_management", "Purchase Archive")} subtitle={t("purchase.manage_purchases", "Inbound inventory tracking index")}>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              onChange={(e) => handleFilter("search", e.target.value)}
              value={localFilters.search}
              placeholder="ID or Number..."
              className="input input-sm input-bordered rounded-lg pl-8 font-bold"
            />
          </div>

          <select onChange={(e) => handleFilter("status", e.target.value)} value={localFilters.status} className="select select-sm select-bordered rounded-lg font-bold">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button type="button" onClick={clearFilters} className="btn btn-sm btn-ghost" title="Clear Filters">
            <X size={16} />
          </button>

          <button
            type="button"
            onClick={openBarcodeModal}
            className={`btn btn-sm border-none font-black uppercase tracking-widest text-[10px] ${selectedPurchaseIds.size > 0 ? "bg-gray-900 text-white hover:bg-black" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            disabled={selectedPurchaseIds.size === 0}
            title="Print selected barcodes"
          >
            <Barcode size={15} /> Print Barcodes
          </button>

          {selectedPurchaseIds.size > 0 && (
            <button type="button" onClick={clearSelection} className="btn btn-sm btn-outline font-black" title="Clear selection">
              <X size={16} /> Clear ({selectedPurchaseIds.size})
            </button>
          )}

          <Link
            href={route("purchase.create")}
            className={`btn btn-sm border-none font-black uppercase tracking-widest text-[10px] ${isShadowUser ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-primary text-white hover:bg-primary"
              }`}
          >
            <Plus size={15} /> {t("purchase.new_purchase", "New Entry")}
          </Link>
        </div>
      </PageHeader>

      {/* ===================== Table ===================== */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {safePurchases.length > 0 ? (
          <table className="table w-full">
            <thead className={`text-white uppercase text-[10px] tracking-widest ${isShadowUser ? "bg-amber-500" : "bg-primary"}`}>
              <tr>
                <th className="py-4 w-[40px]">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="btn btn-ghost btn-xs text-white hover:bg-white/10"
                    title={isAllSelected ? "Unselect all" : "Select all"}
                  >
                    {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="py-4">#</th>
                <th>Details</th>
                <th>Supplier & Warehouse</th>
                <th>Financial Status</th>
                <th className="text-right">Command</th>
              </tr>
            </thead>

            <tbody className="font-bold text-sm text-gray-700 italic-last-child">
              {safePurchases.map((purchase, index) => {
                const amounts = getDisplayAmounts(purchase);
                const isSelected = selectedPurchaseIds.has(purchase.id);

                const displayTotal = amounts.total;
                const displayPaid = amounts.paid;
                const displayDue = amounts.due;
                const displayPaymentStatus = amounts.payment_status;

                const isPaid = displayPaymentStatus === "paid";
                const isPartial = displayPaymentStatus === "partial";

                return (
                  <tr key={purchase.id} className={`hover:bg-gray-50 border-b border-gray-50 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                    <td>
                      <button type="button" onClick={() => toggleSelectOne(purchase.id)} className="btn btn-ghost btn-xs" title={isSelected ? "Unselect" : "Select"}>
                        {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-gray-400" />}
                      </button>
                    </td>

                    <td className="text-gray-400 font-mono text-xs">{index + 1}</td>

                    <td>
                      <p className="font-black text-gray-900 font-mono uppercase tracking-tighter leading-none mb-1">#{purchase.purchase_no}</p>
                      <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                        <Calendar size={10} /> {formatDate(purchase.purchase_date)}
                      </span>
                    </td>

                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-900 uppercase text-xs">
                          <User size={12} className="text-red-600" />
                          {purchase.supplier?.name || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] font-black">
                          <Warehouse size={12} className="text-gray-400" />
                          {purchase.warehouse?.name || "N/A"}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total:</span>
                          <span className="font-mono text-xs font-black text-gray-900">{formatCurrency(displayTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Paid:</span>
                          <span className={`font-mono text-xs font-black ${displayPaid > 0 ? "text-green-600" : "text-gray-500"}`}>{formatCurrency(displayPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Due:</span>
                          <span className={`font-mono text-xs font-black ${displayDue > 0 ? "text-red-600" : "text-primary"}`}>{formatCurrency(displayDue)}</span>
                        </div>

                        <div className="flex gap-1 items-center mt-1">
                          <span
                            className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${isPaid ? "bg-green-100 text-green-700" : isPartial ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"
                              }`}
                          >
                            {displayPaymentStatus}
                          </span>
                          <span
                            className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${purchase.status === "completed" ? "bg-blue-100 text-blue-700" : purchase.status === "pending" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-400"
                              }`}
                          >
                            {purchase.status}
                          </span>
                        </div>

                        {displayDue > 0 && purchase.status === "completed" && (
                          <div className="mt-2">
                            <button onClick={() => openPaymentModal(purchase)} className="btn btn-xs btn-primary w-full flex items-center justify-center gap-1">
                              <CreditCard size={12} />
                              Pay Now
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={route("purchase.show", purchase.id)}
                          className="btn btn-ghost btn-square btn-xs hover:bg-gray-900 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>

                        {purchase.status === "completed" && (
                          <button
                            onClick={() => router.visit(route("purchase-return.create", { purchase_id: purchase.id }))}
                            className="btn btn-ghost btn-square btn-xs text-red-600 hover:bg-red-600 hover:text-white"
                            title="Create Return"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => copyText(purchase?.purchase_no)}
                          className="btn btn-ghost btn-square btn-xs hover:bg-gray-200"
                          title="Copy Purchase No"
                        >
                          <Copy size={16} />
                        </button>

                        <Link
                          href={route("purchase.edit", purchase.id)}
                          className="btn btn-ghost btn-square btn-xs hover:bg-blue-600 hover:text-white text-blue-600"
                          title="Edit Purchase"
                        >
                          <Edit size={16} />
                        </Link>

                        {auth?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className="btn btn-ghost btn-square btn-xs text-red-400 hover:bg-red-600 hover:text-white"
                            title="Delete Purchase"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
            <Frown size={40} className="text-gray-200" />
            <span className="font-black uppercase tracking-widest text-xs">No records found</span>
          </div>
        )}
      </div>

      <Pagination data={purchases} />
    </div>
  );
}
