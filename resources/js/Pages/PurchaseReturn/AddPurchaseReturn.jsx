import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { 
    ArrowLeft, Plus, Trash2, Search, Shield, DollarSign, User, 
    Building, Phone, Mail, MapPin, Info, Edit, X, RefreshCw,
    Package, AlertCircle, CheckCircle, Clock, ShoppingBag
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddPurchaseReturn({ 
    purchase, 
    purchaseItems, 
    purchases,
    suppliers, 
    warehouses, 
    products, 
    isShadowUser 
}) {
    const { t, locale } = useTranslation();
    const [selectedItems, setSelectedItems] = useState([]);
    const [replacementProducts, setReplacementProducts] = useState([]);
    const [returnType, setReturnType] = useState('money_back');
    const [showReplacementSearch, setShowReplacementSearch] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [refundedAmount, setRefundedAmount] = useState(0);
    const [shadowRefundedAmount, setShadowRefundedAmount] = useState(0);
    const [paymentType, setPaymentType] = useState('cash');
    const [selectedPurchaseId, setSelectedPurchaseId] = useState(purchase?.id || '');
    
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    const form = useForm({
        purchase_id: purchase?.id || "",
        return_type: 'money_back',
        return_date: new Date().toISOString().split('T')[0],
        reason: "",
        notes: "",
        payment_type: 'cash',
        refunded_amount: 0,
        shadow_refunded_amount: 0,
        items: [],
        replacement_products: []
    });

    // Calculate totals
    const calculateTotalReturn = useCallback(() => {
        return selectedItems.reduce((total, item) => {
            const itemTotal = item.return_quantity * (item.unit_price || item.shadow_unit_price || 0);
            return total + (itemTotal || 0);
        }, 0);
    }, [selectedItems]);

    const calculateShadowTotalReturn = useCallback(() => {
        return selectedItems.reduce((total, item) => {
            const itemTotal = item.return_quantity * (item.shadow_unit_price || item.unit_price || 0);
            return total + (itemTotal || 0);
        }, 0);
    }, [selectedItems]);

    const calculateReplacementTotal = useCallback(() => {
        return replacementProducts.reduce((total, product) => total + (product.total_price || 0), 0);
    }, [replacementProducts]);

    const calculateShadowReplacementTotal = useCallback(() => {
        return replacementProducts.reduce((total, product) => total + (product.shadow_total_price || 0), 0);
    }, [replacementProducts]);

    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    const getVariantDisplayName = (variant) => {
        if (variant.attribute_values && Object.keys(variant.attribute_values).length > 0) {
            const parts = [];
            for (const [attribute, value] of Object.entries(variant.attribute_values)) {
                parts.push(`${attribute}: ${value}`);
            }
            return parts.join(', ');
        }
        
        if (variant.name) return variant.name;
        
        const parts = [];
        if (variant.size) parts.push(`Size: ${variant.size}`);
        if (variant.color) parts.push(`Color: ${variant.color}`);
        if (variant.material) parts.push(`Material: ${variant.material}`);
        return parts.join(', ') || 'Default Variant';
    };

    // Sync form data
    useEffect(() => {
        const formData = {
            ...form.data,
            return_type: returnType,
            payment_type: returnType === 'money_back' ? paymentType : null,
            refunded_amount: refundedAmount,
            shadow_refunded_amount: shadowRefundedAmount,
            items: selectedItems.filter(item => item.return_quantity > 0).map(item => ({
                purchase_item_id: item.purchase_item_id || item.id,
                return_quantity: item.return_quantity,
                reason: item.reason || 'Return requested'
            })),
            replacement_products: returnType === 'product_replacement' ? replacementProducts : []
        };

        form.setData(formData);
    }, [returnType, paymentType, refundedAmount, shadowRefundedAmount, selectedItems, replacementProducts]);

    // Initialize selected items from purchase items
    useEffect(() => {
        if (purchaseItems && purchaseItems.length > 0) {
            const initialItems = purchaseItems.map(item => ({
                purchase_item_id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                variant_id: item.variant_id,
                variant_name: item.variant_name,
                return_quantity: 0,
                max_quantity: item.max_quantity,
                unit_price: parseFloat(item.unit_price) || 0,
                shadow_unit_price: parseFloat(item.shadow_unit_price) || 0,
                sale_price: parseFloat(item.sale_price) || 0,
                shadow_sale_price: parseFloat(item.shadow_sale_price) || 0,
                purchase_quantity: item.purchase_quantity,
                reason: ""
            }));
            setSelectedItems(initialItems);
        }
    }, [purchaseItems]);

    // Filter products for replacement search
    useEffect(() => {
        if (productSearch.trim() && showReplacementSearch) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                (product.product_no && product.product_no.toLowerCase().includes(productSearch.toLowerCase()))
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts([]);
        }
    }, [productSearch, products, showReplacementSearch]);

    // Add return item
    const updateReturnItem = (index, field, value) => {
        const updated = [...selectedItems];
        
        if (field === 'return_quantity') {
            const quantity = parseInt(value) || 0;
            const maxQuantity = updated[index].max_quantity;
            
            if (quantity > maxQuantity) {
                alert(`Cannot return more than ${maxQuantity} items (available stock)`);
                return;
            }
            
            updated[index].return_quantity = quantity;
        } else {
            updated[index][field] = value;
        }
        
        setSelectedItems(updated);
        
        // Auto-set refund amount for money back returns
        if (returnType === 'money_back' && field === 'return_quantity') {
            const total = calculateTotalReturn();
            const shadowTotal = calculateShadowTotalReturn();
            setRefundedAmount(total);
            setShadowRefundedAmount(shadowTotal);
        }
    };

    // Add replacement product
    const addReplacementProduct = (product, variant) => {
        const existingProduct = replacementProducts.find(
            item => item.product_id === product.id && item.variant_id === variant.id
        );

        if (existingProduct) {
            setReplacementProducts(replacementProducts.map(item =>
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
            const defaultUnitPrice = variant.unit_cost || variant.purchase_price || 1;
            const defaultShadowUnitPrice = variant.shadow_unit_cost || variant.shadow_purchase_price || 1;
            const defaultSalePrice = variant.selling_price || variant.sale_price || 1;
            const defaultShadowSalePrice = variant.shadow_selling_price || variant.shadow_sale_price || 1;

            setReplacementProducts([
                ...replacementProducts,
                {
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    variant_name: getVariantDisplayName(variant),
                    quantity: 1,
                    unit_price: defaultUnitPrice,
                    shadow_unit_price: defaultShadowUnitPrice,
                    sale_price: defaultSalePrice,
                    shadow_sale_price: defaultShadowSalePrice,
                    total_price: defaultUnitPrice * 1,
                    shadow_total_price: defaultShadowUnitPrice * 1
                }
            ]);
        }
        
        setProductSearch("");
        setShowReplacementSearch(false);
    };

    const updateReplacementProduct = (index, field, value) => {
        const updated = [...replacementProducts];
        const numericValue = field === 'quantity' ? parseInt(value) || 1 : parseFloat(value) || 0;
        
        updated[index][field] = numericValue;
        
        if (field === 'quantity' || field === 'unit_price' || field === 'shadow_unit_price') {
            updated[index].total_price = updated[index].quantity * updated[index].unit_price;
            updated[index].shadow_total_price = updated[index].quantity * updated[index].shadow_unit_price;
        }
        
        setReplacementProducts(updated);
    };

    const removeReplacementProduct = (index) => {
        const updated = [...replacementProducts];
        updated.splice(index, 1);
        setReplacementProducts(updated);
    };

    // Handle return type change
    const handleReturnTypeChange = (type) => {
        setReturnType(type);
        if (type === 'money_back') {
            setReplacementProducts([]);
            // Set refund amounts
            setRefundedAmount(calculateTotalReturn());
            setShadowRefundedAmount(calculateShadowTotalReturn());
        } else {
            setRefundedAmount(0);
            setShadowRefundedAmount(0);
            setPaymentType('cash');
        }
    };

    // Handle purchase selection
    const handlePurchaseSelect = (e) => {
        const purchaseId = e.target.value;
        setSelectedPurchaseId(purchaseId);
        if (purchaseId) {
            router.visit(route('purchase-return.create', { purchase_id: purchaseId }), {
                preserveScroll: true,
                preserveState: true
            });
        }
    };

    // Validate form
    const validateForm = () => {
        if (!form.data.purchase_id) {
            alert('Please select a purchase');
            return false;
        }

        if (!form.data.reason.trim()) {
            alert('Please provide a reason for the return');
            return false;
        }

        const hasReturnItems = selectedItems.some(item => item.return_quantity > 0);
        if (!hasReturnItems) {
            alert('Please select at least one item to return');
            return false;
        }

        // Check if any item exceeds available quantity
        const invalidItems = selectedItems.filter(item => 
            item.return_quantity > item.max_quantity
        );
        
        if (invalidItems.length > 0) {
            alert(`Cannot return more than available stock for some items`);
            return false;
        }

        if (returnType === 'money_back') {
            if (!paymentType) {
                alert('Please select payment type for refund');
                return false;
            }
            if (refundedAmount < 0) {
                alert('Refund amount cannot be negative');
                return false;
            }
        } else if (returnType === 'product_replacement') {
            if (replacementProducts.length === 0) {
                alert('Please add replacement products');
                return false;
            }
        }

        return true;
    };

    // Submit form
    const submit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Prepare items for submission
        const itemsToSubmit = selectedItems
            .filter(item => item.return_quantity > 0)
            .map(item => ({
                purchase_item_id: item.purchase_item_id || item.id,
                return_quantity: item.return_quantity,
                reason: item.reason || 'Return requested'
            }));

        // Prepare replacement products for submission
        const replacementToSubmit = returnType === 'product_replacement' ? 
            replacementProducts.map(product => ({
                product_id: product.product_id,
                variant_id: product.variant_id,
                quantity: product.quantity,
                unit_price: product.unit_price,
                shadow_unit_price: product.shadow_unit_price,
                sale_price: product.sale_price,
                shadow_sale_price: product.shadow_sale_price
            })) : [];

        const submitData = {
            purchase_id: form.data.purchase_id,
            return_type: returnType,
            return_date: form.data.return_date,
            reason: form.data.reason,
            notes: form.data.notes,
            payment_type: returnType === 'money_back' ? paymentType : null,
            refunded_amount: refundedAmount,
            shadow_refunded_amount: shadowRefundedAmount,
            items: itemsToSubmit,
            replacement_products: replacementToSubmit
        };

        console.log('Submitting data:', submitData);

        form.post(route("purchase-return.store"), {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(route("purchase-return.list"));
            },
            onError: (errors) => {
                console.error("Form errors:", errors);
                
                let errorMessage = "There was an error creating the purchase return.";
                
                // Show specific error messages
                if (errors.payment_type) {
                    errorMessage = `Payment Type Error: ${errors.payment_type}`;
                } else if (errors.refunded_amount) {
                    errorMessage = `Refund Amount Error: ${errors.refunded_amount}`;
                } else if (errors.shadow_refunded_amount) {
                    errorMessage = `Shadow Refund Amount Error: ${errors.shadow_refunded_amount}`;
                } else if (errors.items) {
                    errorMessage = `Items Error: ${errors.items}`;
                } else if (errors.replacement_products) {
                    errorMessage = `Replacement Products Error: ${errors.replacement_products}`;
                } else if (errors.reason) {
                    errorMessage = `Reason Error: ${errors.reason}`;
                } else if (errors.error) {
                    errorMessage = errors.error;
                }
                
                alert(errorMessage);
            }
        });
    };

    const totalReturn = calculateTotalReturn();
    const shadowTotalReturn = calculateShadowTotalReturn();
    const replacementTotal = calculateReplacementTotal();
    const shadowReplacementTotal = calculateShadowReplacementTotal();

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('purchase_return.create_title', 'Create Purchase Return')}
                subtitle={t('purchase_return.create_subtitle', 'Process return for purchased items')}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route("purchase-return.list"))}
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowLeft size={15} /> {t('purchase_return.back_to_list', 'Back to List')}
                    </button>
                </div>
            </PageHeader>

            {/* Purchase Selection */}
            {!purchase && (
                <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                    <div className="card-body">
                        <h3 className="card-title text-sm font-semibold">
                            <ShoppingBag size={16} className="mr-2" />
                            {t('purchase_return.select_purchase', 'Select Purchase')}
                        </h3>
                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={selectedPurchaseId}
                                onChange={handlePurchaseSelect}
                            >
                                <option value="">{t('purchase_return.select_purchase_placeholder', 'Select a purchase to return')}</option>
                                {purchases?.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.purchase_no} - {p.supplier?.name} - {p.purchase_date} - ৳{formatCurrency(p.grand_total || p.total_amount)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {t('purchase_return.select_purchase_help', 'Select a purchase to view items available for return')}
                        </p>
                    </div>
                </div>
            )}

            {purchase && (
                <form onSubmit={submit}>
                    {/* Purchase Information */}
                    <div className="card card-compact bg-base-100 border border-base-300 mb-6">
                        <div className="card-body">
                            <h3 className="card-title text-sm font-semibold">
                                {t('purchase_return.purchase_info', 'Purchase Information')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Purchase No:</span>
                                    <span className="ml-2 font-mono">{purchase.purchase_no}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Supplier:</span>
                                    <span className="ml-2">{purchase.supplier?.name}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Warehouse:</span>
                                    <span className="ml-2">{purchase.warehouse?.name}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Date:</span>
                                    <span className="ml-2">{purchase.purchase_date}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Total:</span>
                                    <span className="ml-2 font-semibold">৳{formatCurrency(purchase.grand_total || purchase.total_amount)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Status:</span>
                                    <span className={`badge badge-sm ml-2 ${
                                        purchase.payment_status === 'paid' ? 'badge-success' :
                                        purchase.payment_status === 'partial' ? 'badge-warning' : 'badge-error'
                                    }`}>
                                        {purchase.payment_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Left Column - Return Details */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.return_type', 'Return Type')} *</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className={`card card-compact cursor-pointer ${
                                        returnType === 'money_back' 
                                            ? 'bg-primary/10 border border-primary' 
                                            : 'bg-base-100 border border-base-300'
                                    }`}>
                                        <div className="card-body p-3">
                                            <input
                                                type="radio"
                                                className="radio radio-primary"
                                                checked={returnType === 'money_back'}
                                                onChange={() => handleReturnTypeChange('money_back')}
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Money Back</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {t('purchase_return.money_back_desc', 'Refund amount to supplier')}
                                            </p>
                                        </div>
                                    </label>
                                    <label className={`card card-compact cursor-pointer ${
                                        returnType === 'product_replacement' 
                                            ? 'bg-warning/10 border border-warning' 
                                            : 'bg-base-100 border border-base-300'
                                    }`}>
                                        <div className="card-body p-3">
                                            <input
                                                type="radio"
                                                className="radio radio-warning"
                                                checked={returnType === 'product_replacement'}
                                                onChange={() => handleReturnTypeChange('product_replacement')}
                                            />
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={16} />
                                                <span className="font-medium">Product Replacement</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {t('purchase_return.replacement_desc', 'Replace with other products')}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.return_date', 'Return Date')} *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={form.data.return_date}
                                    onChange={(e) => form.setData("return_date", e.target.value)}
                                    required
                                />
                            </div>

                            {returnType === 'money_back' && (
                                <>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">{t('purchase_return.payment_type', 'Payment Type')} *</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={paymentType}
                                            onChange={(e) => setPaymentType(e.target.value)}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="mobile_banking">Mobile Banking</option>
                                            <option value="adjust_to_advance">Adjust to Supplier Advance</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">
                                                {t('purchase_return.refund_amount', 'Refund Amount')}
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalReturn}
                                            step="0.01"
                                            className="input input-bordered w-full"
                                            value={refundedAmount}
                                            onChange={(e) => setRefundedAmount(parseFloat(e.target.value) || 0)}
                                        />
                                        <div className="flex justify-between mt-1">
                                            <span className="text-xs text-gray-500">
                                                {t('purchase_return.total_returnable', 'Total Returnable')}: 
                                                <span className="font-semibold ml-1">৳{formatCurrency(totalReturn)}</span>
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-outline btn-primary"
                                                onClick={() => setRefundedAmount(totalReturn)}
                                            >
                                                {t('purchase_return.set_full_amount', 'Set Full Amount')}
                                            </button>
                                        </div>
                                    </div>

                                    {!isShadowUser && (
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text flex items-center gap-1">
                                                    <Shield size={14} />
                                                    {t('purchase_return.shadow_refund_amount', 'Shadow Refund Amount')}
                                                </span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={shadowTotalReturn}
                                                step="0.01"
                                                className="input input-bordered w-full border-warning"
                                                value={shadowRefundedAmount}
                                                onChange={(e) => setShadowRefundedAmount(parseFloat(e.target.value) || 0)}
                                            />
                                            <div className="flex justify-between mt-1">
                                                <span className="text-xs text-gray-500">
                                                    {t('purchase_return.shadow_total', 'Shadow Total')}: 
                                                    <span className="font-semibold ml-1">৳{formatCurrency(shadowTotalReturn)}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline btn-warning"
                                                    onClick={() => setShadowRefundedAmount(shadowTotalReturn)}
                                                >
                                                    {t('purchase_return.set_full_amount', 'Set Full Amount')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.reason', 'Reason for Return')} *</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows="3"
                                    value={form.data.reason}
                                    onChange={(e) => form.setData("reason", e.target.value)}
                                    placeholder={t('purchase_return.reason_placeholder', 'Explain why you are returning these items...')}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('purchase_return.notes', 'Additional Notes')}</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows="2"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData("notes", e.target.value)}
                                    placeholder={t('purchase_return.notes_placeholder', 'Any additional information...')}
                                />
                            </div>
                        </div>

                        {/* Right Column - Items & Replacement */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Items to Return */}
                            <div>
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    {t('purchase_return.items_to_return', 'Items to Return')}
                                    <span className="badge badge-primary badge-sm">
                                        {selectedItems.filter(item => item.return_quantity > 0).length}
                                    </span>
                                </h3>

                                {selectedItems.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {selectedItems.map((item, index) => (
                                            <div key={index} className="card card-compact bg-base-100 border border-base-300">
                                                <div className="card-body">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-base">{item.product_name}</h4>
                                                            <p className="text-sm text-gray-600">{item.variant_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {t('purchase_return.available', 'Available')}: {item.max_quantity} | 
                                                                {t('purchase_return.purchased', 'Purchased')}: {item.purchase_quantity}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">{t('purchase_return.quantity', 'Quantity')} *</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.max_quantity}
                                                                className="input input-bordered input-sm w-full"
                                                                value={item.return_quantity}
                                                                onChange={(e) => updateReturnItem(index, 'return_quantity', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">{t('purchase_return.unit_price', 'Unit Price')}</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full bg-base-200"
                                                                value={`৳${formatCurrency(item.unit_price)}`}
                                                                readOnly
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">{t('purchase_return.total', 'Total')}</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full bg-base-200"
                                                                value={`৳${formatCurrency(item.return_quantity * item.unit_price)}`}
                                                                readOnly
                                                            />
                                                        </div>

                                                        <div className="form-control">
                                                            <label className="label py-1">
                                                                <span className="label-text text-xs">{t('purchase_return.reason', 'Reason')}</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input input-bordered input-sm w-full"
                                                                value={item.reason}
                                                                onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                                                                placeholder={t('purchase_return.reason_short', 'Why return?')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card card-compact bg-base-100 border-2 border-dashed border-base-300">
                                        <div className="card-body text-center py-8">
                                            <p className="text-gray-500">{t('purchase_return.no_items_available', 'No items available for return')}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-base-100 border border-base-300 rounded-box">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{t('purchase_return.total_return_value', 'Total Return Value')}:</span>
                                        <div className="text-right">
                                            <div className="font-semibold text-lg">৳{formatCurrency(totalReturn)}</div>
                                            {!isShadowUser && (
                                                <div className="text-sm text-warning flex items-center gap-1">
                                                    <Shield size={12} />
                                                    {t('purchase_return.shadow_total', 'Shadow')}: ৳{formatCurrency(shadowTotalReturn)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Replacement Products (only for product_replacement type) */}
                            {returnType === 'product_replacement' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Package size={20} />
                                            {t('purchase_return.replacement_products', 'Replacement Products')}
                                            <span className="badge badge-warning badge-sm">
                                                {replacementProducts.length}
                                            </span>
                                        </h3>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline btn-warning"
                                            onClick={() => setShowReplacementSearch(!showReplacementSearch)}
                                        >
                                            <Plus size={14} />
                                            {t('purchase_return.add_replacement', 'Add Replacement')}
                                        </button>
                                    </div>

                                    {/* Replacement Product Search */}
                                    {showReplacementSearch && (
                                        <div className="mb-4 relative" ref={searchRef}>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="input input-bordered w-full pr-10"
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    placeholder={t('purchase_return.search_products', 'Search replacement products...')}
                                                />
                                                <Search size={16} className="absolute right-3 top-3 text-gray-400" />
                                            </div>

                                            {productSearch.trim() && filteredProducts.length > 0 && (
                                                <div 
                                                    ref={dropdownRef}
                                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                                                >
                                                    {filteredProducts.map(product => (
                                                        <div key={product.id} className="border-b last:border-b-0">
                                                            <div className="p-3 font-medium bg-base-200">
                                                                <div className="flex justify-between">
                                                                    <span>{product.name}</span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {product.product_no}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {product.variants && product.variants.map(variant => (
                                                                <div
                                                                    key={variant.id}
                                                                    className="p-3 hover:bg-base-100 cursor-pointer border-b last:border-b-0"
                                                                    onClick={() => addReplacementProduct(product, variant)}
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {getVariantDisplayName(variant)}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Cost: ৳{variant.unit_cost || '0.00'} | 
                                                                                Shadow: ৳{variant.shadow_unit_cost || '0.00'}
                                                                            </div>
                                                                        </div>
                                                                        <Plus size={16} className="text-warning" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Replacement Products List */}
                                    {replacementProducts.length > 0 ? (
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                            {replacementProducts.map((product, index) => (
                                                <div key={index} className="card card-compact bg-warning/5 border border-warning/20">
                                                    <div className="card-body">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-base">{product.product_name}</h4>
                                                                <p className="text-sm text-gray-600">{product.variant_name}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-error btn-outline"
                                                                onClick={() => removeReplacementProduct(index)}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs">{t('purchase_return.quantity', 'Quantity')}</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="input input-bordered input-sm w-full border-warning"
                                                                    value={product.quantity}
                                                                    onChange={(e) => updateReplacementProduct(index, 'quantity', e.target.value)}
                                                                />
                                                            </div>

                                                            {!isShadowUser && (
                                                                <div className="form-control">
                                                                    <label className="label py-1">
                                                                        <span className="label-text text-xs">{t('purchase_return.unit_price', 'Unit Price')}</span>
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        className="input input-bordered input-sm w-full"
                                                                        value={product.unit_price}
                                                                        onChange={(e) => updateReplacementProduct(index, 'unit_price', e.target.value)}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs flex items-center gap-1">
                                                                        {isShadowUser ? t('purchase.return.unit_price', 'Unit Price') : t('purchase.return.shadow_unit_price', 'Shadow Unit Price')}
                                                                        {isShadowUser && <Shield size={12} className="text-warning" />}
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    className="input input-bordered input-sm w-full border-warning"
                                                                    value={product.shadow_unit_price}
                                                                    onChange={(e) => updateReplacementProduct(index, 'shadow_unit_price', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="form-control">
                                                                <label className="label py-1">
                                                                    <span className="label-text text-xs">
                                                                        {t('purchase_return.total', 'Total')}
                                                                    </span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input input-bordered input-sm w-full bg-warning/10"
                                                                    value={`৳${formatCurrency(product.total_price)}`}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="card card-compact bg-warning/5 border-2 border-dashed border-warning/30">
                                            <div className="card-body text-center py-8">
                                                <Package size={32} className="mx-auto text-warning/50 mb-2" />
                                                <p className="text-gray-500">{t('purchase_return.no_replacement_added', 'No replacement products added')}</p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {t('purchase_return.click_add_replacement', 'Click "Add Replacement" to add products')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-box">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{t('purchase_return.total_replacement_value', 'Total Replacement Value')}:</span>
                                            <div className="text-right">
                                                <div className="font-semibold text-lg text-warning">৳{formatCurrency(replacementTotal)}</div>
                                                {!isShadowUser && (
                                                    <div className="text-sm text-warning flex items-center gap-1">
                                                        <Shield size={12} />
                                                        {t('purchase_return.shadow_total', 'Shadow')}: ৳{formatCurrency(shadowReplacementTotal)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary and Actions */}
                    <div className="border-t border-base-300 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="card card-compact bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h4 className="card-title text-sm font-semibold">
                                        {t('purchase_return.return_summary', 'Return Summary')}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t('purchase_return.total_items', 'Total Items to Return')}:</span>
                                            <span className="font-medium">
                                                {selectedItems.filter(item => item.return_quantity > 0).length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('purchase_return.total_return_value', 'Total Return Value')}:</span>
                                            <span className="font-semibold">৳{formatCurrency(totalReturn)}</span>
                                        </div>
                                        {returnType === 'money_back' && (
                                            <div className="flex justify-between pt-2 border-t border-base-300">
                                                <span>{t('purchase_return.refund_amount', 'Refund Amount')}:</span>
                                                <span className="font-semibold text-primary">৳{formatCurrency(refundedAmount)}</span>
                                            </div>
                                        )}
                                        {returnType === 'product_replacement' && (
                                            <div className="flex justify-between pt-2 border-t border-base-300">
                                                <span>{t('purchase_return.replacement_value', 'Replacement Value')}:</span>
                                                <span className="font-semibold text-warning">৳{formatCurrency(replacementTotal)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="card card-compact bg-base-100 border border-base-300">
                                <div className="card-body">
                                    <h4 className="card-title text-sm font-semibold">
                                        {t('purchase_return.difference', 'Value Difference')}
                                    </h4>
                                    {returnType === 'product_replacement' && (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>{t('purchase_return.return_value', 'Return Value')}:</span>
                                                <span className="text-gray-600">৳{formatCurrency(totalReturn)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>{t('purchase_return.replacement_value', 'Replacement Value')}:</span>
                                                <span className="text-gray-600">৳{formatCurrency(replacementTotal)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-base-300 font-semibold">
                                                <span>{t('purchase_return.net_difference', 'Net Difference')}:</span>
                                                <span className={`${replacementTotal > totalReturn ? 'text-error' : 'text-success'}`}>
                                                    ৳{formatCurrency(replacementTotal - totalReturn)}
                                                    {replacementTotal > totalReturn ? ' (Pay)' : ' (Receive)'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {returnType === 'money_back' && (
                                        <div className="text-center py-4">
                                            <DollarSign size={32} className="mx-auto text-primary/50 mb-2" />
                                            <p className="text-gray-600">
                                                {t('purchase_return.full_refund', 'Full refund of return value')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className={`btn ${returnType === 'product_replacement' ? 'btn-warning' : 'btn-primary'}`}
                                disabled={form.processing}
                            >
                                {form.processing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="loading loading-spinner loading-sm"></div>
                                        {t('purchase_return.creating', 'Creating Return...')}
                                    </span>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        {t('purchase_return.create_return', 'Create Purchase Return')}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit(route("purchase-return.list"))}
                                className="btn btn-ghost"
                            >
                                {t('purchase_return.cancel', 'Cancel')}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}