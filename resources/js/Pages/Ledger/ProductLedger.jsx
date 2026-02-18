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
    
    // URL থেকে পৃষ্ঠা নম্বর নেওয়া
    const [currentPage, setCurrentPage] = useState(() => {
        // প্রথমে URL থেকে page প্যারামিটার চেক করুন
        const urlParams = new URLSearchParams(window.location.search);
        const pageFromUrl = urlParams.get('page');
        
        // যদি URL-এ page থাকে, সেটা ব্যবহার করুন
        if (pageFromUrl) {
            return parseInt(pageFromUrl);
        }
        
        // না থাকলে transactions থেকে নিন
        return transactions?.pagination?.current_page || 1;
    });

    // লোকাল স্টোরেজ থেকে পৃষ্ঠা নম্বর লোড করা (প্রতিটি প্রোডাক্টের জন্য)
    useEffect(() => {
        if (selectedProductId) {
            const savedPage = localStorage.getItem(`product_page_${selectedProductId}`);
            
            // URL-এ page প্যারামিটার চেক করুন
            const urlParams = new URLSearchParams(window.location.search);
            const pageFromUrl = urlParams.get('page');
            
            // যদি URL-এ page থাকে, সেটা ব্যবহার করুন
            if (pageFromUrl) {
                setCurrentPage(parseInt(pageFromUrl));
            }
            // না থাকলে এবং সংরক্ষিত পৃষ্ঠা থাকে, সেটা ব্যবহার করুন
            else if (savedPage) {
                setCurrentPage(parseInt(savedPage));
            }
            // না থাকলে 1 ব্যবহার করুন
            else {
                setCurrentPage(1);
            }
        }
    }, [selectedProductId]);

    // transactions থেকে পৃষ্ঠা তথ্য আপডেট করা
    useEffect(() => {
        if (selectedProductId && transactions?.pagination?.current_page) {
            const newPage = transactions.pagination.current_page;
            setCurrentPage(newPage);
            
            // লোকাল স্টোরেজে সংরক্ষণ করুন
            localStorage.setItem(`product_page_${selectedProductId}`, newPage.toString());
            
            // URL আপডেট করুন (ইউজারকে দেখানোর জন্য)
            const url = new URL(window.location.href);
            url.searchParams.set('page', newPage.toString());
            window.history.replaceState({}, '', url);
        }
    }, [transactions?.pagination?.current_page, selectedProductId]);

    // কম্পোনেন্ট লোড হওয়ার সময় URL চেক করুন
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pageFromUrl = urlParams.get('page');
        const productIdFromUrl = urlParams.get('product_id');
        
        // যদি URL-এ product_id এবং page থাকে
        if (productIdFromUrl && pageFromUrl) {
            setSelectedProductId(parseInt(productIdFromUrl));
            setCurrentPage(parseInt(pageFromUrl));
            
            // লোকাল স্টোরেজে সংরক্ষণ করুন
            localStorage.setItem(`product_page_${productIdFromUrl}`, pageFromUrl);
        }
    }, []);

    const summary = transactions?.summary || {
        sold_qty: 0,
        purchased_qty: 0,
        stock_est: 0,
    };
    
    const saleTotal = transactions?.rows
        ?.filter((t) => t.type === "sale")
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0) || 0;

    const purchaseTotal = transactions?.rows
        ?.filter((t) => t.type === "purchase")
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0) || 0;

    const rows = transactions?.rows || [];
    const pagination = transactions?.pagination || null;

    // ডিবাউন্সড সার্চ ইফেক্ট
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = {
                search: search || null,
                product_id: selectedProductId,
                tx_type: txType !== 'all' ? txType : null,
                page: currentPage,
            };

            // undefined/null ভ্যালুগুলো সরান
            Object.keys(params).forEach(key => 
                params[key] === null || params[key] === undefined || params[key] === '' ? delete params[key] : {}
            );

            router.get(
                route("product-ledger.index"),
                params,
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        // সফলভাবে ডাটা লোড হলে URL আপডেট করুন
                        if (selectedProductId) {
                            localStorage.setItem(`product_page_${selectedProductId}`, currentPage.toString());
                        }
                    },
                },
            );
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [search, txType, selectedProductId, currentPage]);

    // হ্যান্ডলার
    const handleProductSelect = (id) => {
        // আগের প্রোডাক্টের পৃষ্ঠা সংরক্ষণ করুন
        if (selectedProductId) {
            localStorage.setItem(`product_page_${selectedProductId}`, currentPage.toString());
        }
        
        // নতুন প্রোডাক্ট সিলেক্ট করুন
        setSelectedProductId(id === selectedProductId ? null : id);
        
        // নতুন প্রোডাক্টের জন্য পৃষ্ঠা নম্বর সেট করুন
        const savedPage = localStorage.getItem(`product_page_${id}`);
        if (savedPage) {
            setCurrentPage(parseInt(savedPage));
        } else {
            setCurrentPage(1);
        }
    };

    const handleRefresh = () => {
        const params = {
            search: search || null,
            product_id: selectedProductId,
            tx_type: txType !== 'all' ? txType : null,
            page: currentPage,
        };

        Object.keys(params).forEach(key => 
            params[key] === null || params[key] === undefined || params[key] === '' ? delete params[key] : {}
        );

        router.get(
            route("product-ledger.index"),
            params,
            { 
                preserveState: true, 
                preserveScroll: true,
                onSuccess: () => {
                    if (selectedProductId) {
                        localStorage.setItem(`product_page_${selectedProductId}`, currentPage.toString());
                    }
                },
            },
        );
    };

    const handleTxTypeChange = (type) => {
        setTxType(type);
        setCurrentPage(1); // ফিল্টার পরিবর্তন হলে প্রথম পৃষ্ঠায় যান
    };

    const resetFilters = () => {
        setSearch("");
        setTxType("all");
        setSelectedProductId(null);
        setCurrentPage(1);
        
        // সব সংরক্ষিত পৃষ্ঠা মুছুন
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('product_page_')) {
                localStorage.removeItem(key);
            }
        });
        
        // URL থেকে page প্যারামিটার সরান
        const url = new URL(window.location.href);
        url.searchParams.delete('page');
        url.searchParams.delete('product_id');
        window.history.replaceState({}, '', url);
    };

    // পৃষ্ঠা পরিবর্তন হ্যান্ডলার
    const handlePageChange = (page) => {
        setCurrentPage(page);
        
        // নির্বাচিত প্রোডাক্টের জন্য পৃষ্ঠা সংরক্ষণ করুন
        if (selectedProductId) {
            localStorage.setItem(`product_page_${selectedProductId}`, page.toString());
        }
        
        // URL আপডেট করুন
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        if (selectedProductId) {
            url.searchParams.set('product_id', selectedProductId.toString());
        }
        window.history.replaceState({}, '', url);
    };

    const handleFirstPage = () => {
        handlePageChange(1);
    };

    const handleLastPage = () => {
        if (pagination) {
            handlePageChange(pagination.last_page);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination && currentPage < pagination.last_page) {
            handlePageChange(currentPage + 1);
        }
    };

    // পৃষ্ঠা নম্বর জেনারেট করুন
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

    // ফরম্যাটিং হেল্পার
    const formatCurrency = (value) => {
        return Number(value || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString();
    };

    // ফিল্টার পিলস
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
        <div className="min-h-screen">
            {/* হেডার */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
                {/* প্রোডাক্ট লিস্ট প্যানেল */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-xl border shadow-sm">
                        {/* প্যানেল হেডার */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-gray-900">
                                    Products
                                </h2>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {formatNumber(products?.total || 0)} total
                                </span>
                            </div>

                            {/* সার্চ বার */}
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

                            {/* ট্রানজেকশন টাইপ ফিল্টার */}
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

                        {/* প্রোডাক্ট লিস্ট */}
                        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                            <div className="p-2">
                                {products?.data?.map((product) => {
                                    // এই প্রোডাক্টের জন্য সংরক্ষিত পৃষ্ঠা নম্বর
                                    const savedPage = localStorage.getItem(`product_page_${product.id}`);
                                    
                                    return (
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
                                                    {savedPage && savedPage !== '1' && selectedProductId !== product.id && (
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            Page {savedPage}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <ChevronRight
                                                        className={`w-4 h-4 text-gray-400 transition-transform ${selectedProductId === product.id ? "rotate-90" : ""}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!products?.data?.length && (
                                    <div className="text-center py-8 text-gray-500">
                                        No products found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* প্রোডাক্ট প্যাজিনেশন */}
                        {products?.links?.length > 3 && (
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

                {/* ট্রানজেকশন ডিটেইলস প্যানেল */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-xl border shadow-sm h-full">
                        {/* প্যানেল হেডার */}
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
                                        {currentPage > 1 && (
                                            <p className="text-sm text-blue-600 mt-1">
                                                Page {currentPage} of {pagination?.last_page || '?'}
                                            </p>
                                        )}
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
                                                {formatCurrency(saleTotal)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500">
                                                Purchase Total
                                            </div>
                                            <div className="font-bold text-lg text-green-600">
                                                {formatCurrency(purchaseTotal)}
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

                        {/* ট্রানজেকশন টেবিল */}
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

                                {/* ট্রানজেকশন প্যাজিনেশন */}
                                {pagination && pagination.total > 0 && (
                                    <div className="p-4 border-t bg-gray-50">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            {/* রেজাল্ট তথ্য */}
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

                                            {/* প্যাজিনেশন কন্ট্রোল */}
                                            <div className="flex items-center gap-1">
                                                {/* প্রথম পৃষ্ঠা বাটন */}
                                                <button
                                                    onClick={handleFirstPage}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="First page"
                                                >
                                                    <ChevronsLeft className="w-4 h-4" />
                                                </button>

                                                {/* আগের পৃষ্ঠা বাটন */}
                                                <button
                                                    onClick={handlePreviousPage}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    title="Previous page"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>

                                                {/* পৃষ্ঠা নম্বর */}
                                                {getPageNumbers().map(
                                                    (pageNum) => (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() =>
                                                                handlePageChange(
                                                                    pageNum,
                                                                )
                                                            }
                                                            className={`min-w-[40px] px-3 py-2 rounded text-sm font-medium transition-colors ${currentPage ===
                                                                    pageNum
                                                                    ? "bg-blue-600 text-white border-blue-600"
                                                                    : "bg-white border text-gray-700 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    ),
                                                )}

                                                {/* পরবর্তী পৃষ্ঠা বাটন */}
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

                                                {/* শেষ পৃষ্ঠা বাটন */}
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

                                            {/* পৃষ্ঠা তথ্য */}
                                            <div className="text-sm text-gray-600">
                                                Page {currentPage} of{" "}
                                                {pagination.last_page}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* প্যাজিনেশন না থাকলে তথ্য */}
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

            {/* সামারি কার্ড */}
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