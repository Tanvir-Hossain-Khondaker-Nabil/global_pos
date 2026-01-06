import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Frown, Pen, Plus, Trash2, Package, DollarSign, ChevronDown, ChevronRight, Tag, Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Product({ product, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [expandedProducts, setExpandedProducts] = useState({});

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
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    // Format variant display for attribute-based variants
    const formatVariantDisplay = (variant) => {
        if (!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) {
            return t('product.default_variant', 'Default Variant');
        }

        const parts = [];
        for (const [attributeCode, value] of Object.entries(variant.attribute_values)) {
            parts.push(`${attributeCode}: ${value}`);
        }

        return parts.join(' | ');
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    // Calculate total stock for a product
    const calculateTotalStock = (productItem) => {
        if (!productItem.variants || productItem.variants.length === 0) {
            return 0;
        }

        return productItem.variants.reduce((total, variant) => {
            return total + (variant.stock?.quantity || 0);
        }, 0);
    };

    // Get average price
    const getAveragePrice = (productItem) => {
        if (!productItem.variants || productItem.variants.length === 0) {
            return 0;
        }

        const variantsWithPrice = productItem.variants.filter(variant => {
            return (variant.stock?.sale_price || 0) > 0;
        });
        
        if (variantsWithPrice.length === 0) return 0;
        
        const totalPrice = variantsWithPrice.reduce((sum, variant) => {
            return sum + (variant.stock?.sale_price || 0);
        }, 0);
        
        return totalPrice / variantsWithPrice.length;
    };

    // Get unique attributes count for a product
    const getUniqueAttributesCount = (productItem) => {
        if (!productItem.variants || productItem.variants.length === 0) {
            return 0;
        }
        
        const allAttributes = new Set();
        
        productItem.variants.forEach((variant) => {
            if (variant.attribute_values && Object.keys(variant.attribute_values).length > 0) {
                Object.keys(variant.attribute_values).forEach((attributeCode) => {
                    allAttributes.add(attributeCode);
                });
            }
        });
        
        return allAttributes.size;
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('product.product_list', 'Product List')}
                subtitle={t('product.subtitle', 'Manage your all products from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('product.search_placeholder', 'Search products...')}
                        className="input input-sm"
                    />
                    <button
                        onClick={() => router.visit(route("product.add"))}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Plus size={15} /> {t('product.add_new', 'Add New')}
                    </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {product.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th></th>
                                <th>{t('product.product_code', 'Product Code')}</th>
                                <th>{t('product.product_name', 'Product Name')}</th>
                                <th>{t('product.category', 'Category')}</th>
                                <th>{t('product.attributes', 'Attributes')}</th>
                                <th>{t('product.total_stock', 'Total Stock')}</th>
                                <th>{t('product.variants', 'Variants')}</th>
                                <th>{t('product.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.data.map((productItem, index) => {
                                const totalStock = calculateTotalStock(productItem);
                                const avgPrice = getAveragePrice(productItem);
                                const attributesCount = getUniqueAttributesCount(productItem);
                                const isExpanded = expandedProducts[productItem.id];
                                const variantsCount = productItem.variants?.length || 0;
                                
                                return (
                                    <>
                                        <tr key={productItem.id}>
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
                                                                : productItem.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-outline">
                                                    {productItem.category?.name || t('product.not_available', 'N/A')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-purple-600" />
                                                    <span className="text-sm">
                                                        {attributesCount} {attributesCount === 1 
                                                            ? t('product.attribute', 'attribute') 
                                                            : t('product.attributes_plural', 'attributes')
                                                        }
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-blue-600" />
                                                    <div>
                                                        <div className={`font-bold text-lg ${totalStock === 0 ? 'text-error' : totalStock < 10 ? 'text-warning' : 'text-success'}`}>
                                                            {totalStock}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {t('product.units', 'units')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="max-w-[300px]">
                                                <div className="flex flex-col gap-2">
                                                    {!isExpanded && variantsCount > 1 && (
                                                        <button
                                                            onClick={() => toggleExpand(productItem.id)}
                                                            className="btn btn-ghost btn-xs w-full text-primary"
                                                        >
                                                            <ChevronDown size={12} className="mr-1" />
                                                            Show {variantsCount} variants
                                                        </button>
                                                    )}
                                                    
                                                    {(isExpanded || variantsCount <= 1) && productItem.variants?.map((variant, i) => {
                                                        const hasAttributes = variant.attribute_values && Object.keys(variant.attribute_values).length > 0;
                                                        const variantStock = variant.stock?.quantity || 0;
                                                        const variantPrice = variant.stock?.sale_price || 0;
                                                        
                                                        return (
                                                            <div
                                                                key={variant.id}
                                                                className={`border p-2 rounded text-xs ${
                                                                    hasAttributes 
                                                                        ? 'border-primary bg-[#1e4d2b] text-white/5' 
                                                                        : 'border-dashed border-neutral'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium">
                                                                            {formatVariantDisplay(variant)}
                                                                        </div>
                                                                        
                                                                        <div className="flex gap-4 mt-1 text-xs text-gray-600">
                                                                            <span>
                                                                                {t('product.stock', 'Stock')}: {variantStock}
                                                                            </span>
                                                                            {variantPrice > 0 && (
                                                                                <span>
                                                                                    {t('product.price', 'Price')}: {formatCurrency(variantPrice)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    
                                                    {isExpanded && variantsCount > 1 && (
                                                        <button
                                                            onClick={() => toggleExpand(productItem.id)}
                                                            className="btn btn-ghost btn-xs w-full text-primary mt-2"
                                                        >
                                                            <ChevronRight size={12} className="mr-1" />
                                                            Hide variants
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                        <>
                                                            <Link
                                                                href={route(
                                                                    "product.add",
                                                                    { id: productItem.id }
                                                                )}
                                                                className="btn btn-xs btn-warning"
                                                                title={t('product.edit', 'Edit Product')}
                                                            >
                                                                <Pen size={10} /> {t('product.edit', 'Edit')}
                                                            </Link>
                                                            <Link
                                                                href={route(
                                                                    "product.del",
                                                                    {
                                                                        id: productItem.id,
                                                                    }
                                                                )}
                                                                onClick={(e) => {
                                                                    if (
                                                                        !confirm(
                                                                            t('product.delete_confirmation', 'Are you sure you want to delete this product? This action cannot be undone.')
                                                                        )
                                                                    ) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                className="btn btn-xs btn-error"
                                                                title={t('product.delete', 'Delete Product')}
                                                            >
                                                                <Trash2 size={10} /> {t('product.delete', 'Delete')}
                                                            </Link>
                                                        </>
                                                </div>
                                            </td>
                                        </tr>
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            {t('product.no_products_found', 'No products found!')}
                        </h1>
                        <button
                            onClick={() => router.visit(route("product.add"))}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('product.add_new_product', 'Add new product')}
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={product} />
        </div>
    );
}