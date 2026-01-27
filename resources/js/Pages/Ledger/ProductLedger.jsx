import { router } from "@inertiajs/react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Database,
    Package,
    RefreshCw,
    Search,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function ProductLedger({
    products,
    selectedProduct,
    transactions,
    filters,
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const [txType, setTxType] = useState(filters?.tx_type || "all");
    const [selectedProductId, setSelectedProductId] = useState(
        filters?.product_id || null,
    );
    const [currentPage, setCurrentPage] = useState(
        transactions?.pagination?.current_page || 1,
    );

    const summary = transactions?.summary || {
        sold_qty: 0,
        purchased_qty: 0,
        stock_est: 0,
    };
    const saleTotal = transactions.rows
        .filter((t) => t.type === "sale")
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);

    const purchaseTotal = transactions.rows
        .filter((t) => t.type === "purchase")
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);

    const rows = transactions?.rows || [];
    const pagination = transactions?.pagination || null;

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(
                route("product-ledger.index"),
                {
                    search,
                    product_id: selectedProductId,
                    tx_type: txType,
                    page: currentPage,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                },
            );
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [search, txType, selectedProductId, currentPage]);

    // Handlers
    const handleProductSelect = (id) => {
        setSelectedProductId(id === selectedProductId ? null : id);
        setCurrentPage(1); // Reset to first page when product changes
    };

    const handleRefresh = () => {
        router.get(
            route("product-ledger.index"),
            {
                search,
                product_id: selectedProductId,
                tx_type: txType,
                page: currentPage,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleTxTypeChange = (type) => {
        setTxType(type);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const resetFilters = () => {
        setSearch("");
        setTxType("all");
        setSelectedProductId(null);
        setCurrentPage(1);
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleFirstPage = () => {
        setCurrentPage(1);
    };

    const handleLastPage = () => {
        if (pagination) {
            setCurrentPage(pagination.last_page);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination && currentPage < pagination.last_page) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        if (!pagination) return [];

        const pageNumbers = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(
            1,
            currentPage - Math.floor(maxPagesToShow / 2),
        );
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > pagination.last_page) {
            endPage = pagination.last_page;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    // Formatting helpers
    const formatCurrency = (value) => {
        return Number(value || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString();
    };

    // Filter pills for transaction type
    const txTypeFilters = [
        { value: "all", label: "All", color: "bg-gray-100 text-gray-800" },
        {
            value: "sale",
            label: "Sales",
            icon: <TrendingDown className="w-3 h-3" />,
            color: "bg-red-50 text-red-700",
        },
        {
            value: "purchase",
            label: "Purchase",
            icon: <TrendingUp className="w-3 h-3" />,
            color: "bg-green-50 text-green-700",
        },
    ];

    return (
        <div className="min-h-screen  ">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Product Ledger
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track product sales, purchases, and stock movements
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {(search || txType !== "all" || selectedProductId) && (
                        <button
                            onClick={resetFilters}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Product List Panel */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-xl border shadow-sm">
                        {/* Panel Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-gray-900">
                                    Products
                                </h2>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {formatNumber(products?.total || 0)} total
                                </span>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by product name or code..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>

                            {/* Transaction Type Filters */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {txTypeFilters.map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() =>
                                            handleTxTypeChange(filter.value)
                                        }
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${txType === filter.value ? filter.color : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                    >
                                        {filter.icon}
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                            <div className="p-2">
                                {products?.data?.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() =>
                                            handleProductSelect(product.id)
                                        }
                                        className={`p-3 rounded-lg mb-2 cursor-pointer transition-all hover:bg-gray-50 ${selectedProductId === product.id ? "bg-blue-50 border border-blue-200" : "border border-transparent"}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                    <h3 className="font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {product.product_no}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* <div className="text-right">
                          <div className="text-xs text-gray-500">Sold</div>
                          <div className="font-medium text-red-600">{formatNumber(product.sold_qty || 0)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Buy</div>
                          <div className="font-medium text-green-600">{formatNumber(product.purchased_qty || 0)}</div>
                        </div> */}
                                                <ChevronRight
                                                    className={`w-4 h-4 text-gray-400 transition-transform ${selectedProductId === product.id ? "rotate-90" : ""}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!products?.data?.length && (
                                    <div className="text-center py-8 text-gray-500">
                                        No products found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination */}
                        {products?.links?.length > 1 && (
                            <div className="p-4 border-t">
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {products.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                })
                                            }
                                            disabled={!link.url}
                                            className={`px-3 py-1.5 rounded text-sm ${link.active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction Details Panel */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-xl border shadow-sm h-full">
                        {/* Panel Header */}
                        <div className="p-4 border-b">
                            {selectedProduct ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-blue-500" />
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {selectedProduct.name}
                                            </h2>
                                        </div>
                                        <p className="text-gray-600 mt-1">
                                            Code: {selectedProduct.product_no}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">
                                                Purchased
                                            </div>
                                            <div className="font-bold text-lg text-green-600">
                                                {formatNumber(
                                                    summary.purchased_qty,
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">
                                                Sold
                                            </div>
                                            <div className="font-bold text-lg text-red-600">
                                                {formatNumber(summary.sold_qty)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">
                                                Stock
                                            </div>
                                            <div className="font-bold text-lg text-blue-600">
                                                {formatNumber(
                                                    summary.stock_est,
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">
                                                Sale Total
                                            </div>
                                            <div className="font-bold text-lg text-green-600">
                                                {saleTotal}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">
                                                Sale Purchase
                                            </div>
                                            <div className="font-bold text-lg text-green-600">
                                                {purchaseTotal}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                                        Select a Product
                                    </h3>
                                    <p className="text-gray-500">
                                        Choose a product from the list to view
                                        its transaction history
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Transaction Table */}
                        {selectedProduct && (
                            <div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Reference
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Party
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Variant
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Qty
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Unit Price
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {rows.map((transaction, index) => (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {transaction.date ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === "sale" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                                                        >
                                                            {transaction.type ===
                                                            "sale"
                                                                ? "SALE"
                                                                : "PURCHASE"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {transaction.ref_no ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {transaction.party}
                                                        </div>
                                                        {transaction.party_phone && (
                                                            <div className="text-xs text-gray-500">
                                                                {
                                                                    transaction.party_phone
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {transaction.variant ||
                                                            "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatNumber(
                                                            transaction.qty,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(
                                                            transaction.unit_price,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                                        {formatCurrency(
                                                            transaction.total,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}

                                            {rows.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan="8"
                                                        className="px-4 py-8 text-center text-gray-500"
                                                    >
                                                        No transactions found
                                                        for this product
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination for Transactions */}
                                {pagination && pagination.total > 0 && (
                                    <div className="p-4 border-t bg-gray-50">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            {/* Results info */}
                                            <div className="text-sm text-gray-600">
                                                Showing{" "}
                                                <span className="font-medium">
                                                    {pagination.from}
                                                </span>{" "}
                                                to{" "}
                                                <span className="font-medium">
                                                    {pagination.to}
                                                </span>{" "}
                                                of{" "}
                                                <span className="font-medium">
                                                    {formatNumber(
                                                        pagination.total,
                                                    )}
                                                </span>{" "}
                                                transactions
                                            </div>

                                            {/* Pagination controls */}
                                            <div className="flex items-center gap-1">
                                                {/* First page button */}
                                                <button
                                                    onClick={handleFirstPage}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="First page"
                                                >
                                                    <ChevronsLeft className="w-4 h-4" />
                                                </button>

                                                {/* Previous page button */}
                                                <button
                                                    onClick={handlePreviousPage}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="Previous page"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>

                                                {/* Page numbers */}
                                                {getPageNumbers().map(
                                                    (pageNum) => (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() =>
                                                                handlePageChange(
                                                                    pageNum,
                                                                )
                                                            }
                                                            className={`min-w-[40px] px-3 py-2 rounded text-sm font-medium transition-colors ${
                                                                currentPage ===
                                                                pageNum
                                                                    ? "bg-blue-600 text-white border-blue-600"
                                                                    : "bg-white border text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ),
                                                )}

                                                {/* Next page button */}
                                                <button
                                                    onClick={handleNextPage}
                                                    disabled={
                                                        currentPage ===
                                                        pagination.last_page
                                                    }
                                                    className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="Next page"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>

                                                {/* Last page button */}
                                                <button
                                                    onClick={handleLastPage}
                                                    disabled={
                                                        currentPage ===
                                                        pagination.last_page
                                                    }
                                                    className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="Last page"
                                                >
                                                    <ChevronsRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Page size selector (optional) */}
                                            <div className="text-sm text-gray-600">
                                                Page {currentPage} of{" "}
                                                {pagination.last_page}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Info message if no pagination */}
                                {rows.length > 0 && !pagination && (
                                    <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
                                        Showing {rows.length} recent
                                        transactions
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {selectedProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Purchased Quantity
                                </p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {formatNumber(summary.purchased_qty)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Sold Quantity
                                </p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {formatNumber(summary.sold_qty)}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Estimated Stock
                                </p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {formatNumber(summary.stock_est)}
                                </p>
                            </div>
                            <Database className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
