import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Frown, Pen, Plus, Trash2, Package, DollarSign, BarChart3, Tag } from "lucide-react";
import { useEffect } from "react";

export default function Product({ product, filters }) {
    const { auth } = usePage().props;

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

    // Format variant display for attribute-based variants
    const formatVariantDisplay = (variant) => {
        if (!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) {
            return 'Default Variant';
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
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Product list"
                subtitle="Manage your all product from here."
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder="Search.."
                        className="input input-sm"
                    />
                    {auth.role === "admin" && (
                        <button
                            onClick={() => router.visit(route("product.add"))}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add new
                        </button>
                    )}
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {product.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th></th>
                                <th>Product Code</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Attributes</th>
                                <th>Total Stock</th>
                                <th>Variants</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.data.map((productItem, index) => {
                                const totalStock = calculateTotalStock(productItem);
                                const avgPrice = getAveragePrice(productItem);
                                const attributesCount = getUniqueAttributesCount(productItem);
                                
                                return (
                                    <tr key={productItem.id}>
                                        <th>{index + 1}</th>
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
                                                {productItem.category?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Tag size={14} className="text-purple-600" />
                                                <span className="text-sm">
                                                    {attributesCount} {attributesCount === 1 ? 'attribute' : 'attributes'}
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
                                                    <div className="text-xs text-gray-500">units</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="max-w-[300px]">
                                            <div className="flex flex-col gap-2">
                                                {productItem.variants?.map((variant, i) => {
                                                    const hasAttributes = variant.attribute_values && Object.keys(variant.attribute_values).length > 0;
                                                    const variantStock = variant.stock?.quantity || 0;
                                                    const variantPrice = variant.stock?.sale_price || 0;
                                                    
                                                    return (
                                                        <div
                                                            key={variant.id}
                                                            className={`border p-2 rounded text-xs ${
                                                                hasAttributes 
                                                                    ? 'border-primary bg-primary/5' 
                                                                    : 'border-dashed border-neutral'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">
                                                                        {formatVariantDisplay(variant)}
                                                                    </div>
                                                                    
                                                                    <div className="flex gap-4 mt-1 text-xs text-gray-600">
                                                                        <span>Stock: {variantStock}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {auth.role === "admin" && (
                                                    <>
                                                        <Link
                                                            href={route(
                                                                "product.add",
                                                                { id: productItem.id }
                                                            )}
                                                            className="btn btn-xs btn-warning"
                                                            title="Edit Product"
                                                        >
                                                            <Pen size={10} /> Edit
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
                                                                        "Are you sure you want to delete this product? This action cannot be undone."
                                                                    )
                                                                ) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className="btn btn-xs btn-error"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={10} /> Delete
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            No products found!
                        </h1>
                        <button
                            onClick={() => router.visit(route("product.add"))}
                            className="btn btn-primary btn-sm"
                        >
                            <Plus size={15} /> Add new product
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={product} />
        </div>
    );
}