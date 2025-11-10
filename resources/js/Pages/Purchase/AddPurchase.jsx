import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2, Search, Shield, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

export default function AddPurchase({ suppliers, warehouses, products, isShadowUser }) {
    const [selectedItems, setSelectedItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState('unpaid'); // unpaid, partial, paid
    const [paidAmount, setPaidAmount] = useState(0);

    const form = useForm({
        supplier_id: "",
        warehouse_id: "",
        purchase_date: new Date().toISOString().split('T')[0],
        notes: "",
        paid_amount: 0,
        payment_status: 'unpaid',
        items: [],
    });

    // Sync selectedItems with form data
    useEffect(() => {
        form.setData('items', selectedItems);
    }, [selectedItems]);

    // Sync payment data with form
    useEffect(() => {
        form.setData({
            ...form.data,
            paid_amount: paidAmount,
            payment_status: paymentStatus
        });
    }, [paidAmount, paymentStatus]);

    // Helper function to get variant display name
    const getVariantDisplayName = (variant) => {
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
        if (variant.material) parts.push(`Material: ${variant.material}`);
        return parts.join(', ') || 'Default Variant';
    };

    // Filter products based on search
    useEffect(() => {
        if (productSearch) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                product.product_no.toLowerCase().includes(productSearch.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products.slice(0, 10));
        }
    }, [productSearch, products]);

    const addItem = (product, variant) => {
    const existingItem = selectedItems.find(
        item => item.product_id === product.id && item.variant_id === variant.id
    );

    if (existingItem) {
        setSelectedItems(selectedItems.map(item =>
            item.product_id === product.id && item.variant_id === variant.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    total_price: (item.quantity + 1) * item.unit_price,
                    shadow_total_price: (item.quantity + 1) * item.shadow_unit_price
                }
                : item
        ));
    } else {
        // FIX: Set proper default sale prices
        const defaultUnitPrice = 1;
        const defaultSalePrice = 1; // Make sure sale price is also 1, not 0
        const defaultShadowUnitPrice = 1;
        const defaultShadowSalePrice = 1;

        setSelectedItems([
            ...selectedItems,
            {
                product_id: product.id,
                variant_id: variant.id,
                product_name: product.name,
                variant_name: getVariantDisplayName(variant),
                quantity: 1,
                unit_price: defaultUnitPrice,
                sale_price: defaultSalePrice, // This was probably missing or 0
                shadow_unit_price: defaultShadowUnitPrice,
                shadow_sale_price: defaultShadowSalePrice, // This was probably missing or 0
                total_price: defaultUnitPrice * 1,
                shadow_total_price: defaultShadowUnitPrice * 1
            }
        ]);
    }
    setProductSearch("");
    setFilteredProducts([]);
};

    const removeItem = (index) => {
        const updated = [...selectedItems];
        updated.splice(index, 1);
        setSelectedItems(updated);
    };

    const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    const numericValue = parseFloat(value) || 0;
    
    updated[index][field] = numericValue;

    // Recalculate totals when relevant fields change
    if (field === 'quantity' || field === 'unit_price' || field === 'shadow_unit_price') {
        const quantity = updated[index].quantity;
        const unitPrice = updated[index].unit_price;
        const shadowUnitPrice = updated[index].shadow_unit_price;

        updated[index].total_price = quantity * unitPrice;
        updated[index].shadow_total_price = quantity * shadowUnitPrice;
    }

    // Also update sale prices immediately when changed
    if (field === 'sale_price' || field === 'shadow_sale_price') {
        // Ensure sale prices are properly set
        updated[index][field] = numericValue;
    }

    setSelectedItems(updated);
};

    const calculateTotal = () => {
        return selectedItems.reduce((total, item) => total + (item.total_price || 0), 0);
    };

    const calculateShadowTotal = () => {
        return selectedItems.reduce((total, item) => total + (item.shadow_total_price || 0), 0);
    };

    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        if (status === 'paid') {
            setPaidAmount(isShadowUser ? calculateShadowTotal() : calculateTotal());
        } else if (status === 'unpaid') {
            setPaidAmount(0);
        }
    };

    const handlePaidAmountChange = (amount) => {
        const totalAmount = isShadowUser ? calculateShadowTotal() : calculateTotal();
        const paid = parseFloat(amount) || 0;

        setPaidAmount(paid);

        if (paid === 0) {
            setPaymentStatus('unpaid');
        } else if (paid >= totalAmount) {
            setPaymentStatus('paid');
        } else {
            setPaymentStatus('partial');
        }
    };

    const getDueAmount = () => {
        const totalAmount = isShadowUser ? calculateShadowTotal() : calculateTotal();
        return Math.max(0, totalAmount - paidAmount);
    };

    const validateItems = () => {
    for (let item of selectedItems) {
        // Validate quantity
        if (!item.quantity || item.quantity <= 0) {
            alert(`Please enter valid quantity for ${item.product_name}`);
            return false;
        }

        if (isShadowUser) {
            // Validate shadow prices for shadow users
            if (!item.shadow_unit_price || item.shadow_unit_price <= 0) {
                alert(`Please enter unit price for ${item.product_name}`);
                return false;
            }
            if (!item.shadow_sale_price || item.shadow_sale_price <= 0) {
                alert(`Please enter sale price for ${item.product_name}`);
                return false;
            }
        } else {
            // Validate real prices for general users
            if (!item.unit_price || item.unit_price <= 0) {
                alert(`Please enter unit price for ${item.product_name}`);
                return false;
            }
            if (!item.sale_price || item.sale_price <= 0) {
                alert(`Please enter sale price for ${item.product_name}`);
                return false;
            }
            
            // Also validate shadow prices for general users
            if (!item.shadow_unit_price || item.shadow_unit_price <= 0) {
                alert(`Please enter unit price for ${item.product_name}`);
                return false;
            }
            if (!item.shadow_sale_price || item.shadow_sale_price <= 0) {
                alert(`Please enter sale price for ${item.product_name}`);
                return false;
            }
        }
    }
    return true;
};

    const submit = (e) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            alert("Please add at least one item to the purchase");
            return;
        }

        if (!form.data.supplier_id) {
            alert("Please select a supplier");
            return;
        }

        if (!form.data.warehouse_id) {
            alert("Please select a warehouse");
            return;
        }

        // Validate all items
        if (!validateItems()) {
            return;
        }

        // Items are already synced via useEffect, so just submit
        form.post(route("purchase.store"), {
            onSuccess: () => {
                router.visit(route("purchase.list"));
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
                alert("There was an error creating the purchase. Please check all fields and try again.");
            }
        });
    };

    const totalAmount = isShadowUser ? calculateShadowTotal() : calculateTotal();
    const shadowTotalAmount = calculateShadowTotal();
    const dueAmount = getDueAmount();

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={isShadowUser ? "Create Purchase" : "Create New Purchase"}
                subtitle={isShadowUser ? "Add products to purchase order with pricing" : "Add products to purchase order"}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route("purchase.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={15} /> Back to List
                    </button>
                </div>
            </PageHeader>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Supplier *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={form.data.supplier_id}
                                onChange={(e) => form.setData("supplier_id", e.target.value)}
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name} - {supplier.company}
                                    </option>
                                ))}
                            </select>
                            {form.errors.supplier_id && (
                                <div className="text-error text-sm mt-1">{form.errors.supplier_id}</div>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Warehouse *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={form.data.warehouse_id}
                                onChange={(e) => form.setData("warehouse_id", e.target.value)}
                                required
                            >
                                <option value="">Select Warehouse</option>
                                {warehouses.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} ({warehouse.code})
                                    </option>
                                ))}
                            </select>
                            {form.errors.warehouse_id && (
                                <div className="text-error text-sm mt-1">{form.errors.warehouse_id}</div>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Purchase Date *</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered"
                                value={form.data.purchase_date}
                                onChange={(e) => form.setData("purchase_date", e.target.value)}
                                required
                            />
                        </div>

                        {/* Payment Section */}
                        <div className="card bg-base-200 p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <DollarSign size={16} /> Payment Information
                            </h3>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Payment Status</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={paymentStatus}
                                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Paid Amount</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max={totalAmount}
                                    className="input input-bordered"
                                    value={paidAmount}
                                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                                />
                            </div>

                            <div className="mt-2 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Total Amount:</span>
                                    <span className="font-semibold">৳{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Paid Amount:</span>
                                    <span className="text-green-600">৳{paidAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Due Amount:</span>
                                    <span className={`font-semibold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                        ৳{dueAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Notes</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                rows="3"
                                value={form.data.notes}
                                onChange={(e) => form.setData("notes", e.target.value)}
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="lg:col-span-2">
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Add Products</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="input input-bordered w-full pr-10"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Search products by name or code..."
                                />
                                <Search size={16} className="absolute right-3 top-3 text-gray-400" />
                            </div>

                            {/* Product Search Results */}
                            {productSearch && filteredProducts.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProducts.map(product => (
                                        <div key={product.id} className="border-b last:border-b-0">
                                            <div className="p-3 font-medium bg-gray-50">
                                                {product.name} ({product.product_no})
                                            </div>
                                            {product.variants && product.variants.map(variant => (
                                                <div
                                                    key={variant.id}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-t"
                                                    onClick={() => addItem(product, variant)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm">
                                                            {getVariantDisplayName(variant)}
                                                        </span>
                                                        <Plus size={14} className="text-primary" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Items */}
                        {selectedItems.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    Selected Items ({selectedItems.length})
                                </h3>
                                {selectedItems.map((item, index) => (
                                    <div key={index} className="border border-gray-300 rounded-box p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product_name}</h4>
                                                <p className="text-sm text-gray-600">{item.variant_name}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="btn btn-xs btn-error"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        {/* Item Input Fields */}
                                        <div className="space-y-3">
                                            {/* First Row: Quantity and Unit Prices */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                {/* Quantity */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">Quantity *</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="input input-bordered input-sm"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        required
                                                    />
                                                </div>

                                                {/* Real Unit Price - Hidden for shadow users */}
                                                {!isShadowUser && (
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Unit Price *</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            className="input input-bordered input-sm"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>
                                                )}

                                                {/* Shadow Unit Price */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text flex items-center gap-1">
                                                            {isShadowUser ? 'Unit Price *' : 'Shadow Unit Price *'}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        className={`input input-bordered input-sm ${isShadowUser ? 'border-warning' : ''}`}
                                                        value={item.shadow_unit_price}
                                                        onChange={(e) => updateItem(index, 'shadow_unit_price', parseFloat(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>

                                                {/* Total Price Display */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">
                                                            {isShadowUser ? 'Total Price' : 'Real Total'}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className={`input input-bordered input-sm bg-gray-100 ${isShadowUser ? 'bg-warning/10' : ''}`}
                                                        value={isShadowUser ? item.shadow_total_price : item.total_price}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>

                                            {/* Second Row: Sale Prices */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {/* Real Sale Price - Hidden for shadow users */}
                                                {!isShadowUser && (
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Sale Price *</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            className="input input-bordered input-sm"
                                                            value={item.sale_price}
                                                            onChange={(e) => updateItem(index, 'sale_price', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>
                                                )}

                                                {/* Shadow Sale Price */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text flex items-center gap-1">
                                                            {isShadowUser ? 'Sale Price *' : 'Shadow Sale Price *'}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        className={`input input-bordered input-sm ${isShadowUser ? 'border-warning' : ''}`}
                                                        value={item.shadow_sale_price}
                                                        onChange={(e) => updateItem(index, 'shadow_sale_price', parseFloat(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Price Summary for the item */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                                                {!isShadowUser && (
                                                    <div className="text-xs text-gray-600">
                                                        <div className="flex justify-between">
                                                            <span>Real Total:</span>
                                                            <span className="font-medium">৳{item.total_price?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Real Sale Price:</span>
                                                            <span className="font-medium">৳{item.sale_price?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`text-xs ${isShadowUser ? 'text-warning' : 'text-blue-600'}`}>
                                                    <div className="flex justify-between">
                                                        <span>{isShadowUser ? 'Active Total' : 'Shadow Total'}:</span>
                                                        <span className="font-medium">৳{item.shadow_total_price?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{isShadowUser ? 'Active Sale Price' : 'Shadow Sale Price'}:</span>
                                                        <span className="font-medium">৳{item.shadow_sale_price?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total Amounts Summary */}
                                <div className="border-t pt-4 mt-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-box ${isShadowUser ? 'bg-warning/10 border border-warning' : 'bg-base-200'}`}>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                {isShadowUser ? 'Active Amounts' : 'Real Amounts'}
                                                {isShadowUser && <span className="badge badge-warning badge-sm">Active</span>}
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Total Amount:</span>
                                                    <span className="font-semibold">
                                                        ৳{isShadowUser ? shadowTotalAmount.toFixed(2) : totalAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Paid Amount:</span>
                                                    <span className="text-green-600">৳{paidAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Due Amount:</span>
                                                    <span className={`font-semibold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        ৳{dueAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isShadowUser && (
                                            <div className="p-4 rounded-box bg-blue-50 border border-blue-200">
                                                <h4 className="font-semibold mb-2 text-blue-700">Shadow Amounts</h4>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Shadow Total:</span>
                                                        <span className="font-semibold text-blue-700">
                                                            ৳{shadowTotalAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Paid Amount:</span>
                                                        <span className="text-green-600">৳{paidAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Due Amount:</span>
                                                        <span className={`font-semibold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                            ৳{dueAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                                <p className="text-gray-500">No items added yet</p>
                                <p className="text-sm text-gray-400 mt-1">Search and add products above</p>
                                {isShadowUser && (
                                    <p className="text-sm text-warning mt-2">
                                        Remember to enter prices for all items
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        className={`btn ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                        disabled={form.processing || selectedItems.length === 0}
                    >
                        {form.processing ? (
                            "Creating Purchase..."
                        ) : isShadowUser ? (
                            <>
                                <Shield size={16} />
                                Create Purchase
                            </>
                        ) : (
                            "Create Purchase"
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.visit(route("purchase.list"))}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}