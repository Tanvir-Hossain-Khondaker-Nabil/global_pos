import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Search, Filter, Frown, ChevronDown, ChevronUp, Calendar, Plus } from "lucide-react";
import { toast } from "react-toastify";

export default function AllSalesItems({ salesItems }) {
    const { flash, isShadowUser } = usePage().props;
    const [expandedRow, setExpandedRow] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Handle search and filters
    const filterForm = useForm({
        search: "",
        customer: "",
        product: "",
        warehouse: "",
    });

    // Handle search and filtering
    const handleFilter = () => {
        const queryParams = {};
        
        if (filterForm.data.search.trim()) queryParams.search = filterForm.data.search.trim();
        if (filterForm.data.customer) queryParams.customer_id = filterForm.data.customer;
        if (filterForm.data.product) queryParams.product_id = filterForm.data.product;
        if (filterForm.data.warehouse) queryParams.warehouse_id = filterForm.data.warehouse;
        
        router.get(route("salesItems.list"), queryParams, { 
            preserveScroll: true, 
            preserveState: true, 
            replace: true 
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const clearFilters = () => {
        filterForm.setData({
            search: "",
            customer: "",
            product: "",
            warehouse: "",
        });
        setTimeout(() => {
            router.get(route("salesItems.list"), {}, { 
                replace: true 
            });
        }, 0);
    };

    // Toggle row expansion
    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    // Calculate item total
    const calculateItemTotal = (item) => {
        const price = parseFloat(item.unit_price) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        const discount = parseFloat(item.sale?.discount) || 0;

        const subtotal = price * quantity;
        const discountAmount = (subtotal * discount) / 100;
        return (subtotal - discountAmount).toFixed(2);
    };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const safeSalesItems = salesItems?.data || [];
    const hasActiveFilters = filterForm.data.search || filterForm.data.customer || filterForm.data.product || filterForm.data.warehouse;

    return (
        <div className="bg-white rounded-box p-3 md:p-4">
            <PageHeader
                title="All Sales Items"
                description="Comprehensive list of all sold items with detailed information"
            >
                {/* Responsive Filter Section */}
                <div className="mb-4">
                    {/* Desktop/Tablet View (md and up) */}
                    <div className="hidden md:flex flex-col lg:flex-row items-start lg:items-center gap-3">
                        {/* Main filter row */}
                        <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center gap-2">
                            {/* Search Input */}
                            <div className="flex-1 min-w-[200px] max-w-[300px]">
                                <div className="join w-full">
                                    <input
                                        type="search"
                                        value={filterForm.data.search}
                                        onChange={(e) => filterForm.setData("search", e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search product name, code..."
                                        className="input input-sm input-bordered join-item w-full"
                                    />
                                    <button
                                        onClick={handleFilter}
                                        className="btn btn-sm bg-[#1e4d2b] text-white join-item"
                                        title="Search"
                                    >
                                        <Search size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Customer Filter */}
                            <div className="w-40">
                                <input
                                    type="text"
                                    value={filterForm.data.customer}
                                    onChange={(e) => filterForm.setData("customer", e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="input input-sm input-bordered w-full"
                                    placeholder="Customer name..."
                                />
                            </div>

                            {/* Product Filter */}
                            <div className="w-40">
                                <input
                                    type="text"
                                    value={filterForm.data.product}
                                    onChange={(e) => filterForm.setData("product", e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="input input-sm input-bordered w-full"
                                    placeholder="Product name..."
                                />
                            </div>

                            {/* Warehouse Filter */}
                            <div className="w-40">
                                <input
                                    type="text"
                                    value={filterForm.data.warehouse}
                                    onChange={(e) => filterForm.setData("warehouse", e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="input input-sm input-bordered w-full"
                                    placeholder="Warehouse..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="btn btn-sm btn-ghost text-xs"
                                        title="Clear Filters"
                                    >
                                        Clear
                                    </button>
                                )}
                                
                                <button
                                    onClick={handleFilter}
                                    className="btn btn-sm btn-primary"
                                    title="Apply Filters"
                                >
                                    <Filter size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View (below md) */}
                    <div className="md:hidden space-y-2">
                        {/* Top Row: Search and Filter Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <div className="join w-full">
                                    <input
                                        type="search"
                                        value={filterForm.data.search}
                                        onChange={(e) => filterForm.setData("search", e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Search..."
                                        className="input input-sm input-bordered join-item w-full"
                                    />
                                    <button
                                        onClick={handleFilter}
                                        className="btn btn-sm bg-[#1e4d2b] text-white join-item"
                                    >
                                        <Search size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn btn-sm btn-ghost"
                                title="Toggle Filters"
                            >
                                <Filter size={16} />
                            </button>
                        </div>

                        {/* Collapsible Mobile Filters */}
                        {showFilters && (
                            <div className="bg-gray-50 p-3 rounded-box space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">Customer</label>
                                        <input
                                            type="text"
                                            value={filterForm.data.customer}
                                            onChange={(e) => filterForm.setData("customer", e.target.value)}
                                            className="input input-sm input-bordered w-full"
                                            placeholder="Customer name..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">Product</label>
                                        <input
                                            type="text"
                                            value={filterForm.data.product}
                                            onChange={(e) => filterForm.setData("product", e.target.value)}
                                            className="input input-sm input-bordered w-full"
                                            placeholder="Product name..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium mb-1 block">Warehouse</label>
                                        <input
                                            type="text"
                                            value={filterForm.data.warehouse}
                                            onChange={(e) => filterForm.setData("warehouse", e.target.value)}
                                            className="input input-sm input-bordered w-full"
                                            placeholder="Warehouse..."
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleFilter}
                                        className="btn btn-sm bg-[#1e4d2b] text-white flex-1"
                                    >
                                        Apply Filters
                                    </button>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PageHeader>

            {/* Sales Items Table */}
            <div className="print:hidden">
                <div className="overflow-x-auto -mx-2">
                    {safeSalesItems.length > 0 ? (
                        <>
                            {/* Desktop/Tablet Table */}
                            <div className="hidden md:block">
                                <table className="table table-auto w-full text-sm">
                                    <thead className={`${isShadowUser ? 'bg-warning' : 'bg-[#1e4d2b] text-white'} text-white`}>
                                        <tr>
                                            <th className="py-2 px-3 w-8"></th>
                                            <th className="py-2 px-3">Product</th>
                                            <th className="py-2 px-3">Customer</th>
                                            <th className="py-2 px-3 text-right">Price</th>
                                            <th className="py-2 px-3 text-right">Qty</th>
                                            <th className="py-2 px-3 text-right">Discount</th>
                                            <th className="py-2 px-3">Type</th>
                                            <th className="py-2 px-3 text-right">Total</th>
                                            <th className="py-2 px-3">Warehouse</th>
                                            <th className="py-2 px-3">Date</th>
                                            <th className="py-2 px-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {safeSalesItems.map((item, index) => (
                                            <>
                                                <tr key={item.id} className="hover:bg-gray-50 border-b">
                                                    <td className="py-2 px-3">
                                                        <button
                                                            onClick={() => toggleRow(index)}
                                                            className="btn btn-ghost btn-xs p-1"
                                                        >
                                                            {expandedRow === index ? (
                                                                <ChevronUp size={10} />
                                                            ) : (
                                                                <ChevronDown size={10} />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="max-w-[150px]">
                                                            <div className="font-medium text-xs">
                                                                {item.product?.name ?? item.product_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {item.variant
                                                                    ? `Variant: ${item.variant.sku ?? ''}`
                                                                    : item.variant_name
                                                                }
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="max-w-[120px]">
                                                            <div className="text-xs">
                                                                {item.sale?.customer?.customer_name || 'Walk-in Customer'}
                                                            </div>
                                                            {item.sale?.customer?.phone && (
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {item.sale.customer.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="text-xs">
                                                            {parseFloat(item.unit_price).toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="text-xs">
                                                            {item.quantity}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="text-xs">
                                                            {item.sale?.discount || 0}%
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="badge badge-info badge-xs">
                                                            {item.sale?.type || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="font-semibold text-primary text-xs">
                                                            {calculateItemTotal(item)}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="text-xs">
                                                            {item.warehouse?.name || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                                            {new Date(item.created_at).toLocaleDateString("en-GB", {
                                                                timeZone: "Asia/Dhaka",
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-1">
                                                            <Link
                                                                href={route('sales.items.show', { id: item.id })}
                                                                className="btn btn-ghost btn-xs p-1"
                                                                title="View Sale"
                                                            >
                                                                <Eye size={10} />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Row Details */}
                                                {expandedRow === index && (
                                                    <tr className="bg-gray-50">
                                                        <td colSpan="11" className="py-3 px-3">
                                                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                                                <div>
                                                                    <strong className="text-sm mb-1 block">Product Details</strong>
                                                                    <div><strong>Name:</strong> {item.product?.name || item?.product_name}</div>
                                                                    {item.variant && (
                                                                        <div><strong>Brand:</strong>
                                                                            {(() => {
                                                                                const variant = item.variant;
                                                                                let attrsText = '';

                                                                                if (variant.attribute_values) {
                                                                                    if (typeof variant.attribute_values === 'object') {
                                                                                        attrsText = Object.entries(variant.attribute_values)
                                                                                            .map(([key, value]) => ` ${key}`)
                                                                                            .join(', ');
                                                                                    } else {
                                                                                        attrsText = variant.attribute_values;
                                                                                    }
                                                                                }

                                                                                return (
                                                                                    <>
                                                                                        {attrsText || 'N/A'}
                                                                                    </>
                                                                                );
                                                                            })()}<br />
                                                                        </div>
                                                                    )}
                                                                    <div><strong>Code:</strong> {item.product?.product_no || 'N/A'}</div>
                                                                </div>
                                                                <div>
                                                                    <strong className="text-sm mb-1 block">Sale Details</strong>
                                                                    <div><strong>Sale ID:</strong> {item.sale_id}</div>
                                                                    <div><strong>Invoice:</strong> {item.sale?.invoice_no || 'N/A'}</div>
                                                                    <div><strong>Status:</strong> {item.sale?.status || 'N/A'}</div>
                                                                </div>
                                                                <div>
                                                                    <strong className="text-sm mb-1 block">Pricing</strong>
                                                                    <div><strong>Unit Price:</strong> {parseFloat(item.unit_price).toFixed(2)}</div>
                                                                    <div><strong>Quantity:</strong> {item.quantity}</div>
                                                                    <div><strong>Discount:</strong> {item.sale?.discount || 0}%</div>
                                                                    <div><strong>VAT:</strong> {item.sale?.vat_tax || 0}%</div>
                                                                    <div><strong>Total:</strong> {calculateItemTotal(item)}</div>
                                                                </div>
                                                                <div>
                                                                    <strong className="text-sm mb-1 block">Additional Info</strong>
                                                                    <div><strong>Warehouse:</strong> {item.warehouse?.name || 'N/A'}</div>
                                                                    <div><strong>Sold By:</strong> System Admin</div>
                                                                    <div><strong>Date:</strong> {formatDate(item.created_at)}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {safeSalesItems.map((item, index) => (
                                    <div key={item.id} className="bg-white border rounded-lg p-3 shadow-sm">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-xs">{item.product?.name ?? item.product_name}</h3>
                                                        <p className="text-xs text-gray-600">
                                                            {item.sale?.customer?.customer_name || 'Walk-in Customer'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleRow(index)}
                                                        className="btn btn-ghost btn-xs p-1"
                                                    >
                                                        {expandedRow === index ? (
                                                            <ChevronUp size={12} />
                                                        ) : (
                                                            <ChevronDown size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                            <div>
                                                <span className="text-gray-500">Price:</span>
                                                <p className="font-medium">{parseFloat(item.unit_price).toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500">Qty:</span>
                                                <p className="font-medium">{item.quantity}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Discount:</span>
                                                <p className="font-medium">{item.sale?.discount || 0}%</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500">Type:</span>
                                                <p className="font-medium"><span className="badge badge-info badge-xs">{item.sale?.type || 'N/A'}</span></p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Total:</span>
                                                <p className="font-bold text-primary">{calculateItemTotal(item)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500">Warehouse:</span>
                                                <p className="font-medium">{item.warehouse?.name || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Card Footer - Actions */}
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <div className="text-xs text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString("en-GB", {
                                                    timeZone: "Asia/Dhaka",
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={route('sales.items.show', { id: item.id })}
                                                    className="btn btn-ghost btn-xs p-1"
                                                    title="View Sale"
                                                >
                                                    <Eye size={12} />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Expanded Details for Mobile */}
                                        {expandedRow === index && (
                                            <div className="mt-3 pt-3 border-t">
                                                <div className="grid grid-cols-1 gap-2 text-xs">
                                                    <div>
                                                        <strong className="text-xs mb-1 block">Product Details</strong>
                                                        <p><strong>Name:</strong> {item.product?.name || item?.product_name}</p>
                                                        <p><strong>Code:</strong> {item.product?.product_no || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <strong className="text-xs mb-1 block">Sale Details</strong>
                                                        <p><strong>Invoice:</strong> {item.sale?.invoice_no || 'N/A'}</p>
                                                        <p><strong>Status:</strong> {item.sale?.status || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <strong className="text-xs mb-1 block">Additional Info</strong>
                                                        <p><strong>Warehouse:</strong> {item.warehouse?.name || 'N/A'}</p>
                                                        <p><strong>Sold By:</strong> System Admin</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-4 py-12 flex flex-col justify-center items-center gap-3">
                            <Frown size={28} className="text-gray-400" />
                            <h1 className="text-gray-500 text-base font-medium text-center">
                                No sales items found!
                            </h1>
                            <p className="text-gray-400 text-sm text-center max-w-md">
                                {hasActiveFilters
                                    ? "Try adjusting your search filters to find what you're looking for."
                                    : "No sales items have been recorded yet."
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {safeSalesItems.length > 0 && salesItems.links && (
                    <div className="flex items-center justify-between mt-4 px-2 text-sm">
                        <div className="text-xs text-gray-600">
                            Showing {salesItems.from || 0} to {salesItems.to || 0} of {salesItems.total || 0} entries
                        </div>
                        <div className="join">
                            {salesItems.prev_page_url && (
                                <Link
                                    href={salesItems.prev_page_url}
                                    className="join-item btn btn-xs"
                                    preserveScroll
                                    preserveState
                                >
                                    Previous
                                </Link>
                            )}

                            {salesItems.links?.slice(1, -1).map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`join-item btn btn-xs ${link.active ? 'bg-[#1e4d2b] text-white' : ''
                                        }`}
                                    preserveScroll
                                    preserveState
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}

                            {salesItems.next_page_url && (
                                <Link
                                    href={salesItems.next_page_url}
                                    className="join-item btn btn-xs"
                                    preserveScroll
                                    preserveState
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Summary Stats - Responsive */}
                {safeSalesItems.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-4 p-3 bg-gray-50 rounded-box">
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Items</p>
                            <p className="text-base md:text-lg font-bold text-primary">
                                {salesItems.total || 0}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Quantity</p>
                            <p className="text-base md:text-lg font-bold text-success">
                                {safeSalesItems.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                            <p className="text-base md:text-lg font-bold text-warning">
                                {safeSalesItems.reduce((sum, item) => sum + parseFloat(calculateItemTotal(item) || 0), 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Avg. per Item</p>
                            <p className="text-base md:text-lg font-bold text-info">
                                {(safeSalesItems.reduce((sum, item) => sum + parseFloat(calculateItemTotal(item) || 0), 0) / safeSalesItems.length).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}