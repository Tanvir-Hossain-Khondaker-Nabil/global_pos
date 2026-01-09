import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, usePage } from "@inertiajs/react";
import {
  Eye, Plus, Trash2, Frown, Calendar, User, Warehouse,
  Edit, DollarSign, Search, X, RefreshCw,
  CreditCard, AlertCircle, Barcode,
  Printer, Copy, Check, FileBarChart, Hash
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function PurchaseList({ purchases, filters, isShadowUser, accounts }) {
  const { auth } = usePage().props;
  const { t, locale } = useTranslation();

  const [localFilters, setLocalFilters] = useState({
    search: filters?.search || "",
    status: filters?.status || "",
    date: filters?.date || "",
  });

  // Payment modal (kept)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Barcode modal
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedPurchaseForBarcode, setSelectedPurchaseForBarcode] = useState(null);

  const handleFilter = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);

    const queryString = {};
    if (newFilters.search) queryString.search = newFilters.search;
    if (newFilters.status) queryString.status = newFilters.status;
    if (newFilters.date) queryString.date = newFilters.date;

    router.get(route("purchase.list"), queryString, {
      preserveScroll: true,
      preserveState: true,
      replace: true
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

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  const calculatePaymentStatus = (total, paid) => {
    if (paid <= 0) return "unpaid";
    if (paid >= total) return "paid";
    return "partial";
  };

  const printBarcodeForPurchase = (purchaseId) => {
    window.open(route("purchase.print-barcodes", purchaseId), "_blank");
  };

  const printItemBarcode = (purchaseId, itemId) => {
    window.open(route("purchase.print-item-barcode", { purchase: purchaseId, item: itemId }), "_blank");
  };

  const copyBarcode = (barcode) => {
    navigator.clipboard.writeText(barcode).then(() => {
      alert("Barcode copied to clipboard!");
    });
  };

  const viewBarcodeDetails = (purchase) => {
    setSelectedPurchaseForBarcode(purchase);
    setShowBarcodeModal(true);
  };

  const getBarcodeStats = (purchase) => {
    if (!purchase.items) return { total: 0, withBarcode: 0, withoutBarcode: 0 };
    const itemsWithBarcode = purchase.items.filter(item => item.stock && item.stock.barcode).length;
    return {
      total: purchase.items.length,
      withBarcode: itemsWithBarcode,
      withoutBarcode: purchase.items.length - itemsWithBarcode
    };
  };

  const safePurchases = purchases?.data || [];

  return (
    <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>

      {/* Barcode Modal */}
      {showBarcodeModal && selectedPurchaseForBarcode && (
        <div className="fixed inset-0 bg-[#3333333d] bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mt-20">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Barcode className="text-blue-600" size={20} />
                  Barcode Details - #{selectedPurchaseForBarcode.purchase_no}
                </h3>
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm text-blue-700 font-bold mb-1">Total Items</div>
                  <div className="text-2xl font-black text-blue-900">
                    {getBarcodeStats(selectedPurchaseForBarcode).total}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-sm text-green-700 font-bold mb-1">With Barcode</div>
                  <div className="text-2xl font-black text-green-900">
                    {getBarcodeStats(selectedPurchaseForBarcode).withBarcode}
                  </div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-sm text-amber-700 font-bold mb-1">Without Barcode</div>
                  <div className="text-2xl font-black text-amber-900">
                    {getBarcodeStats(selectedPurchaseForBarcode).withoutBarcode}
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedPurchaseForBarcode.items?.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {item.product?.name || "N/A"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price || 0)}
                        </p>
                      </div>
                      <span className="badge badge-sm bg-gray-100 text-gray-600">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.stock?.barcode ? (
                          <>
                            <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.stock.barcode}
                            </div>
                            <button
                              onClick={() => copyBarcode(item.stock.barcode)}
                              className="btn btn-xs btn-ghost"
                              title="Copy Barcode"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={() => printItemBarcode(selectedPurchaseForBarcode.id, item.id)}
                              className="btn btn-xs btn-ghost text-green-600"
                              title="Print Barcode"
                            >
                              <Printer size={12} />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-amber-600 font-bold">
                            No barcode
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Batch: {item.stock?.batch_no || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={() => printBarcodeForPurchase(selectedPurchaseForBarcode.id)}
                  className="btn bg-green-600 text-white flex-1"
                >
                  <Printer size={18} />
                  Print All Barcodes
                </button>
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  className="btn btn-ghost flex-1"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={t("purchase.purchase_management", "Purchase Archive")}
        subtitle={t("purchase.manage_purchases", "Inbound inventory tracking with barcodes")}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              onChange={(e) => handleFilter("search", e.target.value)}
              value={localFilters.search}
              placeholder="Search barcode, batch, product..."
              className="input input-sm input-bordered rounded-lg pl-8 font-bold"
            />
          </div>

          <select
            onChange={(e) => handleFilter("status", e.target.value)}
            value={localFilters.status}
            className="select select-sm select-bordered rounded-lg font-bold"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Link
            href={route("purchase.create")}
            className={`btn btn-sm border-none font-black uppercase tracking-widest text-[10px] ${
              isShadowUser ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            <Plus size={15} /> {t("purchase.new_purchase", "New Entry")}
          </Link>
        </div>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="card card-compact bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Purchases</h3>
                <p className="text-xl font-black text-blue-900 mt-1">{safePurchases.length}</p>
              </div>
              <FileBarChart className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="card card-compact bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider">With Barcodes</h3>
                <p className="text-xl font-black text-green-900 mt-1">
                  {safePurchases.filter(p => p.has_barcode).length}
                </p>
              </div>
              <Check className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="card card-compact bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Barcode Items</h3>
                <p className="text-xl font-black text-amber-900 mt-1">
                  {safePurchases.reduce((total, p) => total + (p.barcode_count || 0), 0)}
                </p>
              </div>
              <Barcode className="text-amber-600" size={20} />
            </div>
          </div>
        </div>

        <div className="card card-compact bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider">Total Value</h3>
                <p className="text-xl font-black text-purple-900 mt-1">
                  {formatCurrency(safePurchases.reduce((total, p) => total + parseFloat(p.grand_total || 0), 0))}
                </p>
              </div>
              <DollarSign className="text-purple-600" size={20} />
            </div>
          </div>
        </div>

        <div className="card card-compact bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Total Due</h3>
                <p className="text-xl font-black text-red-900 mt-1">
                  {formatCurrency(safePurchases.reduce((total, p) => total + parseFloat(p.due_amount || 0), 0))}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {safePurchases.length > 0 ? (
          <table className="table w-full">
            <thead className={`text-white uppercase text-[10px] tracking-widest ${isShadowUser ? "bg-amber-500" : "bg-[#1e4d2b]"}`}>
              <tr>
                <th className="py-4">#</th>
                <th>Details</th>
                <th>Supplier & Warehouse</th>
                <th>Barcode Info</th>
                <th>Financial Status</th>
                <th className="text-right">Command</th>
              </tr>
            </thead>

            <tbody className="font-bold text-sm text-gray-700">
              {safePurchases.map((purchase, index) => {
                const displayTotal = parseFloat(purchase.grand_total) || 0;
                const displayPaid = parseFloat(purchase.paid_amount) || 0;
                const displayDue = Math.max(0, displayTotal - displayPaid);
                const displayPaymentStatus = calculatePaymentStatus(displayTotal, displayPaid);

                const barcodeStats = getBarcodeStats(purchase);
                const hasBarcodes = purchase.has_barcode || barcodeStats.withBarcode > 0;

                return (
                  <tr key={purchase.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="text-gray-400 font-mono text-xs">{index + 1}</td>

                    <td>
                      <p className="font-black text-gray-900 font-mono uppercase tracking-tighter leading-none mb-1">
                        #{purchase.purchase_no}
                      </p>
                      <span className="text-[10px] flex items-center gap-1 text-gray-400 font-black uppercase tracking-widest">
                        <Calendar size={10} /> {formatDate(purchase.purchase_date)}
                      </span>
                      <div className="mt-1">
                        <span className="badge badge-xs bg-gray-100 text-gray-600 border-none font-bold">
                          Items: {purchase.items?.length || 0}
                        </span>
                      </div>
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
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {hasBarcodes ? (
                            <>
                              <Barcode size={14} className="text-green-600" />
                              <div className="text-xs font-bold text-green-700">
                                {barcodeStats.withBarcode}/{barcodeStats.total} items
                              </div>
                            </>
                          ) : (
                            <>
                              <Barcode size={14} className="text-amber-600" />
                              <div className="text-xs font-bold text-amber-700">
                                No barcodes
                              </div>
                            </>
                          )}
                        </div>

                        {hasBarcodes && purchase.barcodes?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {purchase.barcodes.slice(0, 2).map((b, idx) => (
                              <div key={idx} className="flex items-center gap-1 mb-1">
                                <Hash size={10} />
                                <span className="font-mono truncate max-w-[120px]">
                                  {b.barcode}
                                </span>
                              </div>
                            ))}
                            {purchase.barcodes.length > 2 && (
                              <div className="text-[10px] text-gray-400">
                                +{purchase.barcodes.length - 2} more
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1">
                          <button
                            onClick={() => viewBarcodeDetails(purchase)}
                            className="btn btn-xs btn-ghost text-blue-600"
                          >
                            <Eye size={12} /> View
                          </button>

                          {hasBarcodes && (
                            <button
                              onClick={() => printBarcodeForPurchase(purchase.id)}
                              className="btn btn-xs btn-ghost text-green-600"
                            >
                              <Printer size={12} /> Print
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total:</span>
                          <span className="font-mono text-xs font-black text-gray-900">
                            {formatCurrency(displayTotal)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Paid:</span>
                          <span className={`font-mono text-xs font-black ${displayPaid > 0 ? "text-green-600" : "text-gray-500"}`}>
                            {formatCurrency(displayPaid)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Due:</span>
                          <span className={`font-mono text-xs font-black ${displayDue > 0 ? "text-red-600" : "text-gray-500"}`}>
                            {formatCurrency(displayDue)}
                          </span>
                        </div>

                        <div className="flex gap-1 items-center mt-1">
                          <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${
                            displayPaymentStatus === "paid" ? "bg-green-100 text-green-700"
                            : displayPaymentStatus === "partial" ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                          }`}>
                            {displayPaymentStatus}
                          </span>
                          <span className={`badge border-none font-black text-[9px] uppercase py-1.5 px-2 ${
                            purchase.status === "completed" ? "bg-blue-100 text-blue-700"
                            : purchase.status === "pending" ? "bg-gray-100 text-gray-600"
                            : "bg-red-100 text-red-400"
                          }`}>
                            {purchase.status}
                          </span>
                        </div>

                        {displayDue > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowPaymentModal(true);
                              }}
                              className="btn btn-xs bg-[#1e4d2b] text-white w-full flex items-center justify-center gap-1"
                            >
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
                          className="btn btn-ghost btn-square btn-xs hover:bg-[#1e4d2b] text-white hover:text-white"
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
