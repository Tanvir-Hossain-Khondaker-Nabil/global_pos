import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";


export default function AddSale({ customers, productstocks }) {
    const [selectedItems, setSelectedItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);

    console.log("Customers:", customers);
    console.log("Product Stocks:", productstocks);

    const form = useForm({
        customer_id: "",
        sale_date: new Date().toISOString().split('T')[0],
        notes: "",
        items: [],
    });

    const getVariantDisplayName = (variant) => {
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
        return parts.join(', ') || 'Default Variant';
    };

    // Filter products based on search
    useEffect(() => {
        if (productSearch) {
            const filtered = productstocks.filter(productstock =>
                productstock.product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                productstock.product.product_no?.toLowerCase().includes(productSearch.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(productstocks.slice(0, 10));
        }
    }, [productSearch, productstocks]);

    const addItem = (productstock, variant) => {
        const variantId = variant?.id || 0;

        const existingItem = selectedItems.find(
            item => item.product_id === productstock.product.id && item.variant_id === variantId
        );

        if (existingItem) {
            setSelectedItems(selectedItems.map(item =>
                item.product_id === productstock.product.id && item.variant_id === variantId
                    ? { ...item, quantity: item.quantity }
                    : item
            ));
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    product_id: productstock.product.id,
                    variant_id: variantId,
                    product_name: productstock.product.name,
                    product_code : productstock.product.product_no || '',
                    variant_name:  variant ? getVariantDisplayName(variant) : 'Default Variant',
                    quantity: productstock.quantity,
                    stockQuantity : productstock.quantity || 0,
                    unit_price: 0,
                    sell_price: productstock.sale_price || 0,
                    total_price: 0,
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


    console.log("Selected Items:", selectedItems);
    const calculateTotal = () => {
        return selectedItems.reduce((total, item) => total + (item.total_price || 0), 0);
    };

    const submit = (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            alert("Please add at least one product to the sale");
            return;
        }

        form.setData('items', selectedItems);

        form.post(route("sales.store"), {
            onSuccess: () => router.visit(route("sales.index")),
            onError: (errors) => {
                console.error("Error occurred:", errors);
                alert( errors.error || "Failed to create sale. Please check the console for details.");
            }
        });
    };


    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Create New (Sale/Order)"
                subtitle="Add products to sale"
            >
                <button
                    onClick={() => router.visit(route("sales.index"))}
                    className="btn btn-sm btn-ghost"
                >
                    <ArrowLeft size={15} /> Back to List
                </button>
            </PageHeader>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Customer *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={form.data.customer_id}
                                onChange={(e) => form.setData("customer_id", e.target.value)}
                                required
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                                ))}
                            </select>
                            {form.errors.customer_id && (
                                <div className="text-error text-sm mt-1">{form.errors.customer_id}</div>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Sale Date *</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered"
                                value={form.data.sale_date}
                                onChange={(e) => form.setData("sale_date", e.target.value)}
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
                        <div className="form-control mb-4 relative">
                            <label className="label">
                                <span className="label-text">Add Products</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full pr-10"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Search products by name or SKU..."
                            />

                            {/* Product Search Results */}
                            {productSearch && filteredProducts.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProducts.map(filteredProduct => (
                                        <div
                                            key={filteredProduct.product.id}
                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                            onClick={() => addItem(filteredProduct, filteredProduct.variant)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{filteredProduct.product.name} ({filteredProduct.variant.size} size + {filteredProduct.variant.color} color)</span>
                                                <Plus size={14} className="text-primary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedItems.length > 0 ? (

                            <div className="space-y-3">
                                <h3 className="font-semibold">Selected Items ({selectedItems.length})</h3>
                                {selectedItems.map((item, index) => (
                                    <div key={index} className="border border-gray-300 rounded-box p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product_name} ({item.product_code})</h4>
                                                <p className="text-sm text-gray-600"><strong>Variant: </strong> {item.variant_name}</p>
                                                <p className="text-sm text-gray-600"> <strong>Total Quantity:</strong> {item.stockQuantity} ||  <strong>Unit Price:</strong> {item.sell_price}</p>
                                            </div>
                                            <input type="hidden" name="warehouse_id" value={item.warehouse_id} />
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
                                                <label className="label"><span className="label-text">Quantity</span></label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="input input-bordered input-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label"><span className="label-text">Unit Price (৳)</span></label>
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
                                                <label className="label"><span className="label-text">Total Price (৳)</span></label>
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
                                        <span>৳{calculateTotal().toFixed(2)}</span>
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
                        {form.processing ? "Creating Sale..." : "Create Sale"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.visit(route("sales.index"))}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
