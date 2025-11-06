import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";

export default function AddPurchase({ suppliers, warehouses, products }) {
    const [selectedItems, setSelectedItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);

    const form = useForm({
        supplier_id: "",
        warehouse_id: "",
        purchase_date: new Date().toISOString().split('T')[0],
        notes: "",
        items: [],
    });

    // Helper function to get variant display name
    const getVariantDisplayName = (variant) => {
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
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
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    variant_name: getVariantDisplayName(variant), // Use helper function
                    quantity: 1,
                    unit_price: 0,
                    total_price: 0
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
        updated[index][field] = value;
        
        if (field === 'quantity' || field === 'unit_price') {
            const quantity = field === 'quantity' ? value : updated[index].quantity;
            const unitPrice = field === 'unit_price' ? value : updated[index].unit_price;
            updated[index].total_price = quantity * unitPrice;
        }
        
        setSelectedItems(updated);
    };

    const calculateTotal = () => {
        return selectedItems.reduce((total, item) => total + (item.total_price || 0), 0);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (selectedItems.length === 0) {
            alert("Please add at least one item to the purchase");
            return;
        }

        form.setData('items', selectedItems);
        
        form.post(route("purchase.store"), {
            onSuccess: () => {
                router.visit(route("purchase.list"));
            },
        });
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Create New Purchase"
                subtitle="Add products to purchase order"
            >
                <button
                    onClick={() => router.visit(route("purchase.list"))}
                    className="btn btn-sm btn-ghost"
                >
                    <ArrowLeft size={15} /> Back to List
                </button>
            </PageHeader>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Purchase Details */}
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
                                <h3 className="font-semibold">Selected Items ({selectedItems.length})</h3>
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
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Quantity</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="input input-bordered input-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Unit Price (₹)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="input input-bordered input-sm"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text">Total Price (₹)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-sm bg-gray-100"
                                                    value={item.total_price || 0}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total Amount */}
                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total Amount:</span>
                                        <span>₹{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                                <p className="text-gray-500">No items added yet</p>
                                <p className="text-sm text-gray-400 mt-1">Search and add products above</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={form.processing || selectedItems.length === 0}
                    >
                        {form.processing ? "Creating Purchase..." : "Create Purchase"}
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