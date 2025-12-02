import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2, Search, Shield, DollarSign } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddPurchase({ suppliers, warehouses, products, isShadowUser }) {
    const { t, locale } = useTranslation();
    const [selectedItems, setSelectedItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState('unpaid');
    const [shadowPaymentStatus, setShadowPaymentStatus] = useState('unpaid');
    const [paidAmount, setPaidAmount] = useState(0);
    const [shadowPaidAmount, setShadowPaidAmount] = useState(0);
    
    const searchRef = useRef(null);

    const form = useForm({
        supplier_id: "",
        warehouse_id: "",
        purchase_date: new Date().toISOString().split('T')[0],
        notes: "",
        paid_amount: 0,
        shadow_paid_amount: 0,
        payment_status: 'unpaid',
        shadow_payment_status: 'unpaid',
        items: [],
    });

    // Sync selectedItems with form data
    useEffect(() => {
        form.setData('items', selectedItems);
    }, [selectedItems]);

    // Sync payment data with form
    useEffect(() => {
        if (isShadowUser) {
            form.setData({
                ...form.data,
                paid_amount: 0,
                shadow_paid_amount: shadowPaidAmount,
                payment_status: 'unpaid',
                shadow_payment_status: shadowPaymentStatus
            });
        } else {
            form.setData({
                ...form.data,
                paid_amount: paidAmount,
                shadow_paid_amount: shadowPaidAmount,
                payment_status: paymentStatus,
                shadow_payment_status: shadowPaymentStatus
            });
        }
    }, [paidAmount, shadowPaidAmount, paymentStatus, shadowPaymentStatus, isShadowUser]);

    // Helper function to get variant display name
    const getVariantDisplayName = (variant) => {
        if (variant.attribute_values && Object.keys(variant.attribute_values).length > 0) {
            const parts = [];
            for (const [attribute, value] of Object.entries(variant.attribute_values)) {
                parts.push(`${attribute}: ${value}`);
            }
            return parts.join(', ');
        }

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
            setFilteredProducts([]);
        }
    }, [productSearch, products]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setFilteredProducts([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            const defaultUnitPrice = variant.unit_cost || 1;
            const defaultSalePrice = variant.selling_price || 1;
            const defaultShadowUnitPrice = variant.shadow_unit_cost || 1;
            const defaultShadowSalePrice = variant.shadow_selling_price || 1;

            setSelectedItems([
                ...selectedItems,
                {
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    variant_name: getVariantDisplayName(variant),
                    quantity: 1,
                    unit_price: defaultUnitPrice,
                    sale_price: defaultSalePrice,
                    shadow_unit_price: defaultShadowUnitPrice,
                    shadow_sale_price: defaultShadowSalePrice,
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
        const numericValue = field === 'quantity' ? parseInt(value) || 1 : parseFloat(value) || 0;

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
        if (isShadowUser) {
            setShadowPaymentStatus(status);
            if (status === 'paid') {
                setShadowPaidAmount(calculateShadowTotal());
            } else if (status === 'unpaid') {
                setShadowPaidAmount(0);
            }
        } else {
            setPaymentStatus(status);
            if (status === 'paid') {
                setPaidAmount(calculateTotal());
            } else if (status === 'unpaid') {
                setPaidAmount(0);
            }
        }
    };

    const handleShadowPaymentStatusChange = (status) => {
        setShadowPaymentStatus(status);
        if (status === 'paid') {
            setShadowPaidAmount(calculateShadowTotal());
        } else if (status === 'unpaid') {
            setShadowPaidAmount(0);
        }
    };

    const handlePaidAmountChange = (amount) => {
        const totalAmount = calculateTotal();
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

    const handleShadowPaidAmountChange = (amount) => {
        const shadowTotalAmount = calculateShadowTotal();
        const paid = parseFloat(amount) || 0;

        setShadowPaidAmount(paid);
        
        if (paid === 0) {
            setShadowPaymentStatus('unpaid');
        } else if (paid >= shadowTotalAmount) {
            setShadowPaymentStatus('paid');
        } else {
            setShadowPaymentStatus('partial');
        }
    };

    const getDueAmount = () => {
        const totalAmount = calculateTotal();
        return Math.max(0, totalAmount - paidAmount);
    };

    const getShadowDueAmount = () => {
        const shadowTotalAmount = calculateShadowTotal();
        return Math.max(0, shadowTotalAmount - shadowPaidAmount);
    };

    const submit = (e) => {
        e.preventDefault();

        // Validation
        if (!form.data.supplier_id) {
            alert(t('purchase.select_supplier', 'Please select a supplier'));
            return;
        }

        if (!form.data.warehouse_id) {
            alert(t('purchase.select_warehouse', 'Please select a warehouse'));
            return;
        }

        if (selectedItems.length === 0) {
            alert(t('purchase.add_products_validation', 'Please add at least one product'));
            return;
        }

        // Check if all items have valid prices
        const invalidItems = selectedItems.filter(item => 
            item.quantity <= 0 || 
            item.unit_price <= 0 || 
            item.shadow_unit_price <= 0
        );

        if (invalidItems.length > 0) {
            alert(t('purchase.valid_prices_validation', 'Please ensure all items have valid quantities and prices greater than 0'));
            return;
        }

        // Calculate final amounts for submission
        const finalData = {
            ...form.data,
            total_amount: calculateTotal(),
            shadow_total_amount: calculateShadowTotal(),
            due_amount: getDueAmount(),
            shadow_due_amount: getShadowDueAmount(),
        };

        // For shadow users, ensure real payment data is reset
        if (isShadowUser) {
            finalData.paid_amount = 0;
            finalData.payment_status = 'unpaid';
            finalData.due_amount = finalData.total_amount;
        }

        console.log('Submitting form with data:', finalData);

    

        form.post(route("purchase.store"), {
            onSuccess: () => {
                console.log("Purchase created successfully");
                router.visit(route("purchase.list"));
            },
            onError: (errors) => {
                console.error("Error occurred:", errors);
                if (errors.items) {
                    alert("Please check the product items: " + errors.items);
                } else {
                    console.error("Error occurred:", errors);
                    alert(errors.error || "There was an error creating the purchase. Please check all fields and try again.");
                }
            }
        });

    };

    const totalAmount = calculateTotal();
    const shadowTotalAmount = calculateShadowTotal();
    const dueAmount = getDueAmount();
    const shadowDueAmount = getShadowDueAmount();

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={isShadowUser ? t('purchase.create_shadow_purchase', 'Create Purchase (Shadow Mode)') : t('purchase.create_purchase', 'Create New Purchase')}
                subtitle={isShadowUser ? t('purchase.create_shadow_subtitle', 'Add products to purchase order with shadow pricing') : t('purchase.create_subtitle', 'Add products to purchase order with real and shadow pricing')}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route("purchase.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={15} /> {t('purchase.back_to_list', 'Back to List')}
                    </button>
                </div>
            </PageHeader>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left Column - Basic Information */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('purchase.supplier', 'Supplier')} *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={form.data.supplier_id}
                                onChange={(e) => form.setData("supplier_id", e.target.value)}
                                required
                            >
                                <option value="">{t('purchase.select_supplier', 'Select Supplier')}</option>
                                {suppliers?.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name} - {supplier.company}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('purchase.warehouse', 'Warehouse')} *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={form.data.warehouse_id}
                                onChange={(e) => form.setData("warehouse_id", e.target.value)}
                                required
                            >
                                <option value="">{t('purchase.select_warehouse', 'Select Warehouse')}</option>
                                {warehouses?.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} ({warehouse.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('purchase.purchase_date', 'Purchase Date')} *</span>
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
                        {isShadowUser ? (
                            <div className="card bg-warning/10 border border-warning p-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
                                    <Shield size={16} /> 
                                    {t('purchase.shadow_payment_information', 'Shadow Payment Information')}
                                </h3>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">{t('purchase.payment_status', 'Payment Status')}</span>
                                    </label>
                                    <select
                                        className="select select-bordered border-warning"
                                        value={shadowPaymentStatus}
                                        onChange={(e) => handleShadowPaymentStatusChange(e.target.value)}
                                    >
                                        <option value="unpaid">{t('purchase.unpaid', 'Unpaid')}</option>
                                        <option value="partial">{t('purchase.partial', 'Partial')}</option>
                                        <option value="paid">{t('purchase.paid', 'Paid')}</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">{t('purchase.paid_amount', 'Paid Amount')}</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="input input-bordered border-warning"
                                        value={shadowPaidAmount}
                                        onChange={(e) => handleShadowPaidAmountChange(e.target.value)}
                                    />
                                </div>

                                <div className="mt-2 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>{t('purchase.total_amount', 'Total Amount')}:</span>
                                        <span className="font-semibold text-warning">
                                            {t('purchase.currency', '৳')}{shadowTotalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('purchase.paid_amount', 'Paid Amount')}:</span>
                                        <span className="text-green-600">{t('purchase.currency', '৳')}{shadowPaidAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('purchase.due_amount', 'Due Amount')}:</span>
                                        <span className={`font-semibold ${shadowDueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {t('purchase.currency', '৳')}{shadowDueAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="card bg-base-200 p-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <DollarSign size={16} /> 
                                        {t('purchase.payment_information', 'Payment Information')}
                                    </h3>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">{t('purchase.payment_status', 'Payment Status')}</span>
                                        </label>
                                        <select
                                            className="select select-bordered"
                                            value={paymentStatus}
                                            onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                        >
                                            <option value="unpaid">{t('purchase.unpaid', 'Unpaid')}</option>
                                            <option value="partial">{t('purchase.partial', 'Partial')}</option>
                                            <option value="paid">{t('purchase.paid', 'Paid')}</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">{t('purchase.paid_amount', 'Paid Amount')}</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input input-bordered"
                                            value={paidAmount}
                                            onChange={(e) => handlePaidAmountChange(e.target.value)}
                                        />
                                    </div>

                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t('purchase.total_amount', 'Total Amount')}:</span>
                                            <span className="font-semibold">
                                                {t('purchase.currency', '৳')}{totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('purchase.paid_amount', 'Paid Amount')}:</span>
                                            <span className="text-green-600">{t('purchase.currency', '৳')}{paidAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('purchase.due_amount', 'Due Amount')}:</span>
                                            <span className={`font-semibold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {t('purchase.currency', '৳')}{dueAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card bg-blue-50 border border-blue-200 p-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                                        <Shield size={16} /> 
                                        {t('purchase.shadow_payment_information', 'Shadow Payment Information')}
                                    </h3>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">{t('purchase.payment_status', 'Payment Status')}</span>
                                        </label>
                                        <select
                                            className="select select-bordered border-blue-300"
                                            value={shadowPaymentStatus}
                                            onChange={(e) => handleShadowPaymentStatusChange(e.target.value)}
                                        >
                                            <option value="unpaid">{t('purchase.unpaid', 'Unpaid')}</option>
                                            <option value="partial">{t('purchase.partial', 'Partial')}</option>
                                            <option value="paid">{t('purchase.paid', 'Paid')}</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">{t('purchase.paid_amount', 'Paid Amount')}</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="input input-bordered border-blue-300"
                                            value={shadowPaidAmount}
                                            onChange={(e) => handleShadowPaidAmountChange(e.target.value)}
                                        />
                                    </div>

                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t('purchase.shadow_total', 'Shadow Total')}:</span>
                                            <span className="font-semibold text-blue-700">
                                                {t('purchase.currency', '৳')}{shadowTotalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('purchase.shadow_paid', 'Shadow Paid')}:</span>
                                            <span className="text-green-600">{t('purchase.currency', '৳')}{shadowPaidAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('purchase.shadow_due', 'Shadow Due')}:</span>
                                            <span className={`font-semibold ${shadowDueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {t('purchase.currency', '৳')}{shadowDueAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('purchase.notes', 'Notes')}</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                rows="3"
                                value={form.data.notes}
                                onChange={(e) => form.setData("notes", e.target.value)}
                                placeholder={t('purchase.additional_notes', 'Additional notes...')}
                            />
                        </div>
                    </div>

                    {/* Right Column - Product Selection */}
                    <div className="lg:col-span-2">
                        <div className="form-control mb-4" ref={searchRef}>
                            <label className="label">
                                <span className="label-text">{t('purchase.add_products', 'Add Products')} *</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="input input-bordered w-full pr-10"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder={t('purchase.search_products', 'Search products by name or code...')}
                                />
                                <Search size={16} className="absolute right-3 top-3 text-gray-400" />
                            </div>

                            {/* Product Search Dropdown - FIXED POSITIONING */}
                            {productSearch && filteredProducts.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-96 overflow-y-auto">
                                    {filteredProducts.map(product => (
                                        <div key={product.id} className="border-b last:border-b-0">
                                            <div className="p-3 font-medium bg-gray-50 flex justify-between items-center sticky top-0 bg-white border-b">
                                                <span className="font-semibold">
                                                    {product.name} ({product.product_no})
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                    {product.variants?.length || 0} {t('purchase.items', 'variants')}
                                                </span>
                                            </div>
                                            {product.variants && product.variants.map(variant => (
                                                <div
                                                    key={variant.id}
                                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                                                    onClick={() => addItem(product, variant)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm mb-1">
                                                                {getVariantDisplayName(variant)}
                                                            </div>
                                                            {variant.sku && (
                                                                <div className="text-xs text-gray-500 font-mono mb-1">
                                                                    SKU: {variant.sku}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-600 space-y-1">
                                                                <div>
                                                                    <span className="font-medium">{t('purchase.unit_price', 'Cost')}:</span> 
                                                                    {t('purchase.currency', '৳')}{variant.unit_cost || '0.00'} | 
                                                                    <span className="font-medium ml-2">{t('purchase.shadow_unit_price', 'Shadow')}:</span> 
                                                                    {t('purchase.currency', '৳')}{variant.shadow_unit_cost || '0.00'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Plus size={16} className="text-primary flex-shrink-0 ml-2 mt-1" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {productSearch && filteredProducts.length === 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg p-4 text-center text-gray-500">
                                    {t('purchase.no_products_found', 'No products found matching')} "{productSearch}"
                                </div>
                            )}
                        </div>

                        {selectedItems.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    {t('purchase.selected_items', 'Selected Items')} ({selectedItems.length})
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
                                                {t('purchase.remove', 'Remove')}
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">{t('purchase.quantity', 'Quantity')} *</span>
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

                                                {!isShadowUser && (
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">{t('purchase.unit_price', 'Unit Price')} *</span>
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

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text flex items-center gap-1">
                                                            {isShadowUser ? t('purchase.unit_price', 'Unit Price') : t('purchase.shadow_unit_price', 'Shadow Unit Price')} *
                                                            {isShadowUser && <Shield size={12} className="text-warning" />}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        className={`input input-bordered input-sm ${isShadowUser ? 'border-warning' : 'border-blue-300'}`}
                                                        value={item.shadow_unit_price}
                                                        onChange={(e) => updateItem(index, 'shadow_unit_price', parseFloat(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">
                                                            {isShadowUser ? t('purchase.total_price', 'Total Price') : t('purchase.real_total', 'Real Total')}
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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {!isShadowUser && (
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">{t('purchase.sale_price', 'Sale Price')} *</span>
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

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text flex items-center gap-1">
                                                            {isShadowUser ? t('purchase.sale_price', 'Sale Price') : t('purchase.shadow_sale_price', 'Shadow Sale Price')} *
                                                            {isShadowUser && <Shield size={12} className="text-warning" />}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        className={`input input-bordered input-sm ${isShadowUser ? 'border-warning' : 'border-blue-300'}`}
                                                        value={item.shadow_sale_price}
                                                        onChange={(e) => updateItem(index, 'shadow_sale_price', parseFloat(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                                                {!isShadowUser && (
                                                    <div className="text-xs text-gray-600">
                                                        <div className="flex justify-between">
                                                            <span>{t('purchase.real_total', 'Real Total')}:</span>
                                                            <span className="font-medium">{t('purchase.currency', '৳')}{item.total_price?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>{t('purchase.real_sale_price', 'Real Sale Price')}:</span>
                                                            <span className="font-medium">{t('purchase.currency', '৳')}{item.sale_price?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`text-xs ${isShadowUser ? 'text-warning' : 'text-blue-600'}`}>
                                                    <div className="flex justify-between">
                                                        <span>{isShadowUser ? t('purchase.active_total', 'Active Total') : t('purchase.shadow_total', 'Shadow Total')}:</span>
                                                        <span className="font-medium">{t('purchase.currency', '৳')}{item.shadow_total_price?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{isShadowUser ? t('purchase.active_sale_price', 'Active Sale Price') : t('purchase.shadow_sale_price', 'Shadow Sale Price')}:</span>
                                                        <span className="font-medium">{t('purchase.currency', '৳')}{item.shadow_sale_price?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Totals Section */}
                                <div className="border-t pt-4 mt-4 space-y-3">
                                    <div className={`grid ${isShadowUser ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                                        {!isShadowUser && (
                                            <div className="p-4 rounded-box bg-base-200">
                                                <h4 className="font-semibold mb-2">{t('purchase.real_amounts', 'Real Amounts')}</h4>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>{t('purchase.total_amount', 'Total Amount')}:</span>
                                                        <span className="font-semibold">
                                                            {t('purchase.currency', '৳')}{totalAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{t('purchase.paid_amount', 'Paid Amount')}:</span>
                                                        <span className="text-green-600">
                                                            {t('purchase.currency', '৳')}{paidAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{t('purchase.due_amount', 'Due Amount')}:</span>
                                                        <span className={`font-semibold ${dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                            {t('purchase.currency', '৳')}{dueAmount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t">
                                                        <div className="flex justify-between">
                                                            <span>{t('purchase.payment_status', 'Payment Status')}:</span>
                                                            <span className={`badge badge-${paymentStatus === 'paid' ? 'success' : paymentStatus === 'partial' ? 'warning' : 'error'} badge-sm`}>
                                                                {t(`purchase.${paymentStatus}`, paymentStatus)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`p-4 rounded-box ${isShadowUser ? 'bg-warning/10 border border-warning' : 'bg-blue-50 border border-blue-200'}`}>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                {isShadowUser ? t('purchase.active_amounts', 'Active Amounts') : t('purchase.shadow_amounts', 'Shadow Amounts')}
                                                {isShadowUser && <span className="badge badge-warning badge-sm">{t('purchase.active', 'Active')}</span>}
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>{isShadowUser ? t('purchase.total_amount', 'Total Amount') : t('purchase.shadow_total', 'Shadow Total')}:</span>
                                                    <span className={`font-semibold ${isShadowUser ? 'text-warning' : 'text-blue-700'}`}>
                                                        {t('purchase.currency', '৳')}{shadowTotalAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{isShadowUser ? t('purchase.paid_amount', 'Paid Amount') : t('purchase.shadow_paid', 'Shadow Paid')}:</span>
                                                    <span className="text-green-600">{t('purchase.currency', '৳')}{shadowPaidAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{isShadowUser ? t('purchase.due_amount', 'Due Amount') : t('purchase.shadow_due', 'Shadow Due')}:</span>
                                                    <span className={`font-semibold ${shadowDueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {t('purchase.currency', '৳')}{shadowDueAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 pt-2 border-t">
                                                    <div className="flex justify-between">
                                                        <span>{t('purchase.payment_status', 'Payment Status')}:</span>
                                                        <span className={`badge badge-${shadowPaymentStatus === 'paid' ? 'success' : shadowPaymentStatus === 'partial' ? 'warning' : 'error'} badge-sm`}>
                                                            {t(`purchase.${shadowPaymentStatus}`, shadowPaymentStatus)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                                <p className="text-gray-500">{t('purchase.no_items_added', 'No items added yet')}</p>
                                <p className="text-sm text-gray-400 mt-1">{t('purchase.search_add_products', 'Search and add products above')}</p>
                                {isShadowUser && (
                                    <p className="text-sm text-warning mt-2">
                                        {t('purchase.enter_shadow_prices', 'Remember to enter shadow prices for all items')}
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
                            <span className="flex items-center gap-2">
                                <div className="loading loading-spinner loading-sm"></div>
                                {t('purchase.creating_purchase', 'Creating Purchase...')}
                            </span>
                        ) : isShadowUser ? (
                            <>
                                <Shield size={16} />
                                {t('purchase.create_shadow_purchase_btn', 'Create Shadow Purchase')}
                            </>
                        ) : (
                            t('purchase.create_purchase_btn', 'Create Purchase')
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.visit(route("purchase.list"))}
                        className="btn btn-ghost"
                    >
                        {t('purchase.cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}