import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import {
    Eye,
    Frown,
    Pen,
    Plus,
    Trash2,
    Package,
    ChevronDown,
    ChevronRight,
    Tag,
    Barcode,
    Printer,
    Copy,
    Grid
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Product({ product, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();

    const [expandedProducts, setExpandedProducts] = useState({});
    const [selectedBarcode, setSelectedBarcode] = useState(null);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });

    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};
        router.get(route("product.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // Toggle variant expansion
    const toggleExpand = (productId) => {
        setExpandedProducts((prev) => ({
            ...prev,
            [productId]: !prev[productId],
        }));
    };

    // Format variant display for attribute-based variants
    const formatVariantDisplay = (variant) => {
        if (!variant?.attribute_values || Object.keys(variant.attribute_values).length === 0) {
            return t("product.default_variant", "Default Variant");
        }

        const parts = [];
        for (const [attributeCode, value] of Object.entries(variant.attribute_values)) {
            parts.push(`${attributeCode}: ${value}`);
        }

        return parts.join(" | ");
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "BDT",
        }).format(amount || 0);
    };

    // Calculate total stock for a product
    const calculateTotalStock = (productItem) => {
        if (!productItem?.variants || productItem.variants.length === 0) return 0;

        return productItem.variants.reduce((total, variant) => {
            return total + (variant?.stock?.quantity || 0);
        }, 0);
    };

    // Get average price
    const getAveragePrice = (productItem) => {
        if (!productItem?.variants || productItem.variants.length === 0) return 0;

        const variantsWithPrice = productItem.variants.filter((variant) => {
            return (variant?.stock?.sale_price || 0) > 0;
        });

        if (variantsWithPrice.length === 0) return 0;

        const totalPrice = variantsWithPrice.reduce((sum, variant) => {
            return sum + (variant?.stock?.sale_price || 0);
        }, 0);

        return totalPrice / variantsWithPrice.length;
    };

    // Get unique attributes count for a product
    const getUniqueAttributesCount = (productItem) => {
        if (!productItem?.variants || productItem.variants.length === 0) return 0;

        const allAttributes = new Set();

        productItem.variants.forEach((variant) => {
            if (variant?.attribute_values && Object.keys(variant.attribute_values).length > 0) {
                Object.keys(variant.attribute_values).forEach((attributeCode) => {
                    allAttributes.add(attributeCode);
                });
            }
        });

        return allAttributes.size;
    };

    /**
     * ✅ FIXED: Get barcodes for a variant (support multiple backend structures)
     * Supports:
     * - variant.stock.barcode (single)
     * - variant.barcode (single)
     * - variant.stocks[] (multiple)
     * - productItem.stocks[] (multiple) optional, matched by variant_id if present
     */
    const getVariantBarcodes = (variant, productItem = null) => {
        const result = [];

        // 1) variant.stock.barcode (single)
        if (variant?.stock?.barcode) {
            result.push({
                barcode: variant.stock.barcode,
                batch_no: variant.stock.batch_no,
                quantity: variant.stock.quantity,
                purchase_price: variant.stock.purchase_price,
                sale_price: variant.stock.sale_price,
                warehouse_id: variant.stock.warehouse_id,
                variant_id: variant.id,
            });
        }

        // 2) variant.barcode (single) if no stock.barcode already
        if (!result.length && variant?.barcode) {
            result.push({
                barcode: variant.barcode,
                batch_no: variant?.batch_no,
                quantity: variant?.quantity,
                purchase_price: variant?.purchase_price,
                sale_price: variant?.sale_price,
                warehouse_id: variant?.warehouse_id,
                variant_id: variant.id,
            });
        }

        // 3) variant.stocks[] (multiple)
        if (Array.isArray(variant?.stocks) && variant.stocks.length > 0) {
            variant.stocks.forEach((s) => {
                if (s?.barcode) {
                    result.push({
                        barcode: s.barcode,
                        batch_no: s.batch_no,
                        quantity: s.quantity,
                        purchase_price: s.purchase_price,
                        sale_price: s.sale_price,
                        warehouse_id: s.warehouse_id,
                        variant_id: variant.id,
                    });
                }
            });
        }

        // 4) productItem.stocks[] fallback (multiple) - match variant_id if possible
        if (productItem && Array.isArray(productItem?.stocks) && productItem.stocks.length > 0) {
            const matched = productItem.stocks.filter((s) => {
                if (!s?.barcode) return false;
                // If backend provides variant_id, match it
                if (s.variant_id && variant?.id) return String(s.variant_id) === String(variant.id);
                // Otherwise, allow as fallback only for single-variant products
                return true;
            });

            matched.forEach((s) => {
                // avoid duplicate barcode
                if (!result.some((x) => x.barcode === s.barcode)) {
                    result.push({
                        barcode: s.barcode,
                        batch_no: s.batch_no,
                        quantity: s.quantity,
                        purchase_price: s.purchase_price,
                        sale_price: s.sale_price,
                        warehouse_id: s.warehouse_id,
                        variant_id: s.variant_id || variant?.id,
                    });
                }
            });
        }

        // clean: ensure unique barcodes
        const uniq = [];
        const seen = new Set();
        for (const row of result) {
            if (row?.barcode && !seen.has(row.barcode)) {
                seen.add(row.barcode);
                uniq.push(row);
            }
        }
        return uniq;
    };

    // Copy barcode to clipboard
    const copyBarcode = (barcode) => {
        navigator.clipboard.writeText(barcode).then(() => {
            alert("Barcode copied to clipboard!");
        });
    };

    // Generate barcode image URL
    const generateBarcodeImage = (barcode) => {
        return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcode)}&code=Code128&dpi=96`;
    };

    // Print barcode
    const printBarcode = (barcode, productName, variantName) => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcode - ${productName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                    .barcode-container { margin: 20px 0; }
                    .barcode-text { font-family: monospace; font-size: 14px; margin-top: 10px; }
                    .product-info { margin-bottom: 20px; }
                    .product-name { font-weight: bold; font-size: 16px; }
                    .variant-name { font-size: 14px; color: #666; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="product-info">
                    <div class="product-name">${productName}</div>
                    <div class="variant-name">${variantName}</div>
                </div>
                <div class="barcode-container">
                    <img src="${generateBarcodeImage(barcode)}" alt="Barcode ${barcode}" style="max-width: 100%; height: auto;" />
                    <div class="barcode-text">${barcode}</div>
                </div>
                <div class="no-print" style="margin-top: 30px;">
                    <button onclick="window.print()">Print Barcode</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // View barcode details
    const viewBarcodeDetails = (barcode, productName, variantName, stockDetails) => {
        setSelectedBarcode({
            barcode,
            productName,
            variantName,
            ...stockDetails,
        });
        setShowBarcodeModal(true);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
            {/* Barcode Modal */}
            {showBarcodeModal && selectedBarcode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Barcode className="text-blue-600" size={20} />
                                    Barcode Details
                                </h3>
                                <button onClick={() => setShowBarcodeModal(false)} className="btn btn-ghost btn-circle btn-sm">
                                    &times;
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="mb-4">
                                        <div className="text-sm text-gray-600 mb-1">Product</div>
                                        <div className="font-bold text-lg">{selectedBarcode.productName}</div>
                                        <div className="text-sm text-gray-500">{selectedBarcode.variantName}</div>
                                    </div>

                                    <div className="barcode-container bg-white p-4 rounded-lg border border-gray-200">
                                        <img
                                            src={generateBarcodeImage(selectedBarcode.barcode)}
                                            alt={`Barcode ${selectedBarcode.barcode}`}
                                            className="mx-auto max-w-full h-32"
                                        />
                                        <div className="font-mono text-sm mt-2">{selectedBarcode.barcode}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Batch No</div>
                                        <div className="font-mono text-sm font-bold">{selectedBarcode.batch_no || "N/A"}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Quantity</div>
                                        <div className="text-sm font-bold">{selectedBarcode.quantity || 0}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Purchase Price</div>
                                        <div className="text-sm font-bold">{formatCurrency(selectedBarcode.purchase_price)}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Sale Price</div>
                                        <div className="text-sm font-bold">{formatCurrency(selectedBarcode.sale_price)}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                                    <button onClick={() => copyBarcode(selectedBarcode.barcode)} className="btn btn-outline flex-1">
                                        <Copy size={16} className="mr-2" />
                                        Copy Barcode
                                    </button>
                                    <button
                                        onClick={() => printBarcode(selectedBarcode.barcode, selectedBarcode.productName, selectedBarcode.variantName)}
                                        className="btn bg-blue-600 text-white flex-1"
                                    >
                                        <Printer size={16} className="mr-2" />
                                        Print Barcode
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PageHeader title={t("product.product_list", "Product List")} subtitle={t("product.subtitle", "Manage your all products from here.")}>
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t("product.search_placeholder", "Search products...")}
                        className="input input-sm"
                    />
                    <button onClick={() => router.visit(route("product.add"))} className="btn bg-[#1e4d2b] text-white btn-sm">
                        <Plus size={15} /> {t("product.add_new", "Add New")}
                    </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {product?.data?.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white">
                            <tr>
                                <th></th>
                                <th>{t("product.product_code", "Product Code")}</th>
                                <th>{t("product.product_name", "Product Name")}</th>
                                <th>{t("product.category", "Category")}</th>
                                <th>{t("product.attributes", "Attributes")}</th>
                                <th>{t("product.total_stock", "Total Stock")}</th>
                                <th>{t("product.variants", "Variants")}</th>
                                <th>{t("product.barcodes", "Barcodes")}</th>
                                <th>{t("product.actions", "Actions")}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {product.data.map((productItem) => {
                                const totalStock = calculateTotalStock(productItem);
                                const attributesCount = getUniqueAttributesCount(productItem);
                                const variantsCount = productItem?.variants?.length || 0;
                                const isExpanded = !!expandedProducts[productItem.id];

                                // ✅ total barcodes computed from variants (fixed)
                                const totalBarcodes =
                                    productItem?.variants?.reduce((total, v) => total + getVariantBarcodes(v, productItem).length, 0) || 0;

                                return (
                                    <>
                                        <tr key={productItem.id} className="hover:bg-gray-50">
                                            <th>
                                                {variantsCount > 1 && (
                                                    <button
                                                        onClick={() => toggleExpand(productItem.id)}
                                                        className="btn btn-ghost btn-xs"
                                                        title={isExpanded ? "Hide variants" : "Show variants"}
                                                    >
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                )}
                                            </th>

                                            <td className="font-mono">{productItem.product_no}</td>

                                            <td>
                                                <div>
                                                    <div className="font-medium">{productItem.name}</div>
                                                    {productItem.description && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {productItem.description.length > 50
                                                                ? `${productItem.description.substring(0, 50)}...`
                                                                : productItem.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="badge badge-outline">{productItem.category?.name || t("product.not_available", "N/A")}</span>
                                            </td>

                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-purple-600" />
                                                    <span className="text-sm">
                                                        {attributesCount}{" "}
                                                        {attributesCount === 1 ? t("product.attribute", "attribute") : t("product.attributes_plural", "attributes")}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-blue-600" />
                                                    <div>
                                                        <div
                                                            className={`font-bold text-lg ${
                                                                totalStock === 0 ? "text-error" : totalStock < 10 ? "text-warning" : "text-success"
                                                            }`}
                                                        >
                                                            {totalStock}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{t("product.units", "units")}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Variants */}
                                            <td className="max-w-[300px]">
                                                <div className="flex flex-col gap-2">
                                                    {!isExpanded && variantsCount > 1 && (
                                                        <button onClick={() => toggleExpand(productItem.id)} className="btn btn-ghost btn-xs w-full text-primary">
                                                            <ChevronDown size={12} className="mr-1" />
                                                            Show {variantsCount} variants
                                                        </button>
                                                    )}

                                                    {(isExpanded || variantsCount <= 1) &&
                                                        productItem?.variants?.map((variant) => {
                                                            const hasAttributes =
                                                                variant?.attribute_values && Object.keys(variant.attribute_values).length > 0;
                                                            const variantStock = variant?.stock?.quantity || 0;
                                                            const variantPrice = variant?.stock?.sale_price || 0;
                                                            const barcodes = getVariantBarcodes(variant, productItem);

                                                            return (
                                                                <div
                                                                    key={variant.id}
                                                                    className={`border p-2 rounded text-xs ${
                                                                        hasAttributes ? "border-primary bg-[#1e4d2b] text-white" : "border-dashed border-neutral"
                                                                    }`}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium">{formatVariantDisplay(variant)}</div>

                                                                            <div className="flex gap-4 mt-1 text-xs">
                                                                                <span>
                                                                                    {t("product.stock", "Stock")}: {variantStock}
                                                                                </span>
                                                                                {variantPrice > 0 && (
                                                                                    <span>
                                                                                        {t("product.price", "Price")}: {formatCurrency(variantPrice)}
                                                                                    </span>
                                                                                )}
                                                                                {barcodes.length > 0 && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Barcode size={10} />
                                                                                        {barcodes.length} barcode(s)
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                    {isExpanded && variantsCount > 1 && (
                                                        <button onClick={() => toggleExpand(productItem.id)} className="btn btn-ghost btn-xs w-full text-primary mt-2">
                                                            <ChevronRight size={12} className="mr-1" />
                                                            Hide variants
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* ✅ Barcodes column (Fixed + grouped by Variant) */}
                                            <td>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Barcode size={14} className="text-blue-600" />
                                                        <span className="text-sm font-bold">
                                                            {totalBarcodes} {totalBarcodes === 1 ? "barcode" : "barcodes"}
                                                        </span>
                                                    </div>

                                                    {totalBarcodes > 0 ? (
                                                        <div className="space-y-2">
                                                            {productItem?.variants?.map((variant) => {
                                                                const barcodes = getVariantBarcodes(variant, productItem);
                                                                if (!barcodes.length) return null;

                                                                return (
                                                                    <div key={variant.id} className="border rounded-lg p-2 bg-white">
                                                                        <div className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                                                            <Grid size={12} className="text-[#1e4d2b]" />
                                                                            <span className="truncate">{formatVariantDisplay(variant)}</span>
                                                                        </div>

                                                                        <div className="space-y-1">
                                                                            {barcodes.map((b, idx) => (
                                                                                <div
                                                                                    key={`${variant.id}-${b.barcode}-${idx}`}
                                                                                    className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs"
                                                                                >
                                                                                    <span className="font-mono truncate max-w-[120px]">{b.barcode}</span>
                                                                                    <div className="flex gap-1">
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                viewBarcodeDetails(b.barcode, productItem.name, formatVariantDisplay(variant), b)
                                                                                            }
                                                                                            className="btn btn-xs btn-ghost"
                                                                                            title="View Barcode"
                                                                                        >
                                                                                            <Eye size={10} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => copyBarcode(b.barcode)}
                                                                                            className="btn btn-xs btn-ghost"
                                                                                            title="Copy Barcode"
                                                                                        >
                                                                                            <Copy size={10} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">No barcodes assigned</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route("product.add", { id: productItem.id })}
                                                        className="btn btn-xs btn-warning"
                                                        title={t("product.edit", "Edit Product")}
                                                    >
                                                        <Pen size={10} /> {t("product.edit", "Edit")}
                                                    </Link>

                                                    <Link
                                                        href={route("product.del", { id: productItem.id })}
                                                        onClick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    t(
                                                                        "product.delete_confirmation",
                                                                        "Are you sure you want to delete this product? This action cannot be undone."
                                                                    )
                                                                )
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                        title={t("product.delete", "Delete Product")}
                                                    >
                                                        <Trash2 size={10} /> {t("product.delete", "Delete")}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded variants row for better mobile view */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="9" className="bg-gray-50 p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {productItem?.variants?.map((variant) => {
                                                            const barcodes = getVariantBarcodes(variant, productItem);
                                                            const variantStock = variant?.stock?.quantity || 0;
                                                            const variantPrice = variant?.stock?.sale_price || 0;

                                                            return (
                                                                <div key={variant.id} className="border rounded-lg p-3 bg-white">
                                                                    <div className="font-medium mb-2">{formatVariantDisplay(variant)}</div>

                                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                                        <div className="text-sm">
                                                                            <div className="text-gray-600">Stock</div>
                                                                            <div className="font-bold">{variantStock}</div>
                                                                        </div>
                                                                        <div className="text-sm">
                                                                            <div className="text-gray-600">Price</div>
                                                                            <div className="font-bold">{formatCurrency(variantPrice)}</div>
                                                                        </div>
                                                                    </div>

                                                                    {barcodes.length > 0 ? (
                                                                        <div>
                                                                            <div className="text-sm font-medium mb-2 flex items-center gap-2">
                                                                                <Barcode size={12} />
                                                                                Barcodes ({barcodes.length})
                                                                            </div>

                                                                            <div className="space-y-1">
                                                                                {barcodes.map((barcodeData, index) => (
                                                                                    <div
                                                                                        key={`${variant.id}-${barcodeData.barcode}-${index}`}
                                                                                        className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs"
                                                                                    >
                                                                                        <div>
                                                                                            <div className="font-mono">{barcodeData.barcode}</div>
                                                                                            <div className="text-gray-500">Batch: {barcodeData.batch_no || "N/A"}</div>
                                                                                        </div>
                                                                                        <div className="flex gap-1">
                                                                                            <button
                                                                                                onClick={() =>
                                                                                                    viewBarcodeDetails(
                                                                                                        barcodeData.barcode,
                                                                                                        productItem.name,
                                                                                                        formatVariantDisplay(variant),
                                                                                                        barcodeData
                                                                                                    )
                                                                                                }
                                                                                                className="btn btn-xs btn-ghost"
                                                                                            >
                                                                                                <Eye size={10} />
                                                                                            </button>
                                                                                            <button onClick={() => copyBarcode(barcodeData.barcode)} className="btn btn-xs btn-ghost">
                                                                                                <Copy size={10} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-gray-500 italic">No barcodes for this variant</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">{t("product.no_products_found", "No products found!")}</h1>
                        <button onClick={() => router.visit(route("product.add"))} className="btn bg-[#1e4d2b] text-white btn-sm">
                            <Plus size={15} /> {t("product.add_new_product", "Add new product")}
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={product} />
        </div>
    );
}
