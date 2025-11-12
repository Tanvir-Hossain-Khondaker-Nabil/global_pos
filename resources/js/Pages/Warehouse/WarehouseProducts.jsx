import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Warehouse, Package, Search, Filter, Shield } from "lucide-react";
import { useState } from "react";

export default function WarehouseProducts({ warehouse, products, isShadowUser }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterOutOfStock, setFilterOutOfStock] = useState(false);

    // Helper function to safely format numbers
    const formatNumber = (value) => {
        const num = Number(value) || 0;
        return num.toFixed(2);
    };

    // Helper function to safely get number value
    const getNumber = (value) => {
        return Number(value) || 0;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount || 0);
    };

    // Format variant display name from attribute_values
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

    // Filter products based on search and stock filter
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.product_no.toLowerCase().includes(searchTerm.toLowerCase());
        
        const hasStock = filterOutOfStock ? getNumber(product.total_stock) > 0 : true;
        
        return matchesSearch && hasStock;
    });

    // Calculate warehouse statistics
    const totalProducts = filteredProducts.length;
    const totalItems = filteredProducts.reduce((sum, product) => sum + getNumber(product.total_stock), 0);
    const totalValue = filteredProducts.reduce((sum, product) => {
        return sum + product.variants.reduce((variantSum, variant) => {
            return variantSum + getNumber(variant.stock_value);
        }, 0);
    }, 0);

    // Debug: Check what data we're receiving
    console.log('Warehouse products data:', products);
    console.log('Filtered products:', filteredProducts);

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={`Warehouse: ${warehouse.name}`}
                subtitle={`Stock overview for ${warehouse.name} (${warehouse.code})`}
            >
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <button
                        onClick={() => router.visit(route("warehouse.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={15} /> Back to Warehouses
                    </button>
                    {isShadowUser && (
                        <span className="badge badge-warning badge-lg">
                            <Shield size={12} className="mr-1" />
                            Shadow Warehouse
                        </span>
                    )}
                </div>
            </PageHeader>

            {/* Warehouse Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`stat rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-base-200'}`}>
                    <div className="stat-figure text-primary">
                        <Package size={24} />
                    </div>
                    <div className="stat-title">Total Products</div>
                    <div className="stat-value text-primary">{totalProducts}</div>
                    <div className="stat-desc">Different products</div>
                </div>

                <div className={`stat rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-base-200'}`}>
                    <div className="stat-figure text-secondary">
                        <Warehouse size={24} />
                    </div>
                    <div className="stat-title">Total Items</div>
                    <div className="stat-value text-secondary">{totalItems}</div>
                    <div className="stat-desc">Units in stock</div>
                </div>

                <div className={`stat rounded-box ${isShadowUser ? 'bg-warning/10' : 'bg-base-200'}`}>
                    <div className="stat-figure text-accent">
                        <span className="text-2xl">৳</span>
                    </div>
                    <div className="stat-title">
                        {isShadowUser ? 'Stock Value' : 'Total Stock Value'}
                    </div>
                    <div className="stat-value text-accent">
                        {formatCurrency(totalValue)}
                    </div>
                    <div className="stat-desc">
                        {isShadowUser ? 'Shadow value' : 'Current stock value'}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-base-200 rounded-box">
                <div className="flex-1">
                    <label className="input input-bordered flex items-center gap-2">
                        <Search size={16} />
                        <input
                            type="text"
                            className="grow"
                            placeholder="Search products by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} />
                    <label className="cursor-pointer label">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={filterOutOfStock}
                            onChange={(e) => setFilterOutOfStock(e.target.checked)}
                        />
                        <span className="label-text ml-2">Hide out of stock</span>
                    </label>
                </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
                {filteredProducts.length > 0 ? (
                    <div className="space-y-4">
                        {filteredProducts.map((product) => {
                            const productTotalStock = getNumber(product.total_stock);
                            const productTotalValue = product.variants.reduce((sum, variant) => sum + getNumber(variant.stock_value), 0);
                            
                            return (
                                <div key={product.id} className="border border-gray-200 rounded-box">
                                    {/* Product Header */}
                                    <div className="bg-gray-50 p-4 rounded-t-box border-b">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Code: {product.product_no} | 
                                                    Category: {product.category?.name || 'N/A'} |
                                                    Total Stock: <span className={`font-bold ${productTotalStock === 0 ? 'text-error' : 'text-success'}`}>
                                                        {productTotalStock}
                                                    </span>
                                                </p>
                                                {product.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className={`badge ${isShadowUser ? 'badge-warning' : 'badge-primary'}`}>
                                                    Product
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {product.variants.length} variant(s)
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variants Table */}
                                    <div className="p-4">
                                        <table className="table table-auto w-full">
                                            <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                                                <tr>
                                                    <th className="bg-opacity-20">Variant</th>
                                                    <th className="bg-opacity-20">SKU</th>
                                                    <th className="bg-opacity-20 text-right">Stock</th>
                                                    <th className="bg-opacity-20 text-right">
                                                        {isShadowUser ? 'Price' : 'Purchase Price'}
                                                    </th>
                                                    <th className="bg-opacity-20 text-right">
                                                        {isShadowUser ? 'Sale Price' : 'Sale Price'}
                                                    </th>
                                                    <th className="bg-opacity-20 text-right">
                                                        {isShadowUser ? 'Value' : 'Stock Value'}
                                                    </th>
                                                    <th className="bg-opacity-20">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.variants.map((variant) => {
                                                    const stockQuantity = getNumber(variant.stock_quantity);
                                                    const purchasePrice = getNumber(variant.purchase_price);
                                                    const salePrice = getNumber(variant.sale_price);
                                                    const stockValue = getNumber(variant.stock_value);
                                                    
                                                    return (
                                                        <tr key={variant.id} className="hover:bg-base-100">
                                                            <td>
                                                                <div className="font-medium">
                                                                    {formatVariantDisplay(variant)}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <code className="text-xs bg-base-200 px-1 rounded">
                                                                    {variant.sku || 'N/A'}
                                                                </code>
                                                            </td>
                                                            <td className="text-right">
                                                                <span className={`font-bold ${stockQuantity === 0 ? 'text-error' : 'text-success'}`}>
                                                                    {stockQuantity}
                                                                </span>
                                                            </td>
                                                            <td className="text-right font-mono">
                                                                {formatCurrency(purchasePrice)}
                                                            </td>
                                                            <td className="text-right font-mono">
                                                                {formatCurrency(salePrice)}
                                                            </td>
                                                            <td className="text-right font-mono font-semibold">
                                                                {formatCurrency(stockValue)}
                                                            </td>
                                                            <td>
                                                                <span className={`badge badge-${stockQuantity === 0 ? 'error' : stockQuantity < 10 ? 'warning' : 'success'}`}>
                                                                    {stockQuantity === 0 ? 'Out of Stock' : 
                                                                     stockQuantity < 10 ? 'Low Stock' : 'In Stock'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Product Summary */}
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold">Product Summary:</span>
                                                <div className="flex gap-4">
                                                    <span>Variants: {product.variants.length}</span>
                                                    <span>Total Stock: {productTotalStock}</span>
                                                    <span className="font-semibold">
                                                        Total Value: {formatCurrency(productTotalValue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-500">
                            {searchTerm || filterOutOfStock 
                                ? "No products match your search criteria" 
                                : "No products in stock"}
                        </h3>
                        <p className="text-gray-400 mt-2">
                            {searchTerm || filterOutOfStock 
                                ? "Try adjusting your search or filter criteria" 
                                : "This warehouse currently has no products in stock"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}