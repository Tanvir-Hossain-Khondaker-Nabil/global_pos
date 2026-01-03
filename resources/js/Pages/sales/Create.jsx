import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2, Search, User, Phone, Mail, MapPin, DollarSign, ShoppingBag, Store, X } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddSale({ customers, productstocks, suppliers, accounts }) {
    const { t, locale } = useTranslation();
    const [selectedItems, setSelectedItems] = useState([]);
    const [pickupItems, setPickupItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [vatRate, setVatRate] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [shadowPaidAmount, setShadowPaidAmount] = useState(0);
    const [selectedAccount, setSelectedAccount] = useState('');

    // New state variables for customer info and payment options
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [usePartialPayment, setUsePartialPayment] = useState(false);
    const [adjustFromAdvance, setAdjustFromAdvance] = useState(false);
    const [availableAdvance, setAvailableAdvance] = useState(0);

    // Pickup sale states
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [pickupProductName, setPickupProductName] = useState("");
    const [pickupBrand, setPickupBrand] = useState("");
    const [pickupVariant, setPickupVariant] = useState("");
    const [pickupQuantity, setPickupQuantity] = useState(1);
    const [pickupUnitPrice, setPickupUnitPrice] = useState(0);
    const [pickupSalePrice, setPickupSalePrice] = useState(0);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierCompany, setNewSupplierCompany] = useState("");
    const [newSupplierPhone, setNewSupplierPhone] = useState("");

    console.log("Customers:", customers);
    console.log("Product Stocks:", productstocks);

    // Define calculate functions
    const calculateRealSubTotal = useCallback(() => {
        if (!selectedItems || selectedItems.length === 0) return 0;
        return selectedItems.reduce((total, item) => {
            const itemTotal = Number(item.total_price) || 0;
            return total + itemTotal;
        }, 0);
    }, [selectedItems]);


    const calculatePickupSubTotal = useCallback(() => {
        if (!pickupItems || pickupItems.length === 0) return 0;
        return pickupItems.reduce((total, item) => {
            return total + (Number(item.quantity) * Number(item.sale_price));
        }, 0);
    }, [pickupItems]);


    const calculateTotalSubTotal = useCallback(() => {
        return calculateRealSubTotal() + calculatePickupSubTotal();
    }, [calculateRealSubTotal, calculatePickupSubTotal]);


    const calculateVatAmount = useCallback(() => {
        const subtotal = calculateTotalSubTotal();
        return (subtotal * (Number(vatRate) || 0)) / 100;
    }, [calculateTotalSubTotal, vatRate]);


    const calculateDiscountAmount = useCallback(() => {
        const subtotal = calculateTotalSubTotal();
        return (subtotal * (Number(discountRate) || 0)) / 100;
    }, [calculateTotalSubTotal, discountRate]);


    const calculateGrandTotal = useCallback(() => {
        const subtotal = calculateTotalSubTotal();
        const vatAmount = calculateVatAmount();
        const discountAmount = calculateDiscountAmount();
        return subtotal + vatAmount - discountAmount;
    }, [calculateTotalSubTotal, calculateVatAmount, calculateDiscountAmount]);

    
    const calculateDueAmount = useCallback(() => {
        const grandTotal = calculateGrandTotal();
        const paid = Number(paidAmount) || 0;
        return Math.max(0, grandTotal - paid);
    }, [calculateGrandTotal, paidAmount]);

        // Get account icon
    const getAccountIcon = (type) => {
        switch (type) {
            case 'cash': return <Wallet size={14} className="text-green-600" />;
            case 'bank': return <Landmark size={14} className="text-blue-600" />;
            case 'mobile_banking': return <Smartphone size={14} className="text-purple-600" />;
            default: return <CreditCard size={14} />;
        }
    };

    // Get all unique products from productstocks
    const allProducts = useMemo(() => {
        if (!productstocks || productstocks.length === 0) return [];

        const productMap = new Map();

        productstocks.forEach(stock => {
            if (stock.product) {
                const productId = stock.product.id;
                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        ...stock.product,
                        totalStock: Number(stock.quantity) || 0,
                        variantsCount: 1,
                        stocks: [stock]
                    });
                } else {
                    const existing = productMap.get(productId);
                    existing.totalStock += Number(stock.quantity) || 0;
                    existing.variantsCount += 1;
                    existing.stocks.push(stock);
                }
            }
        });

        return Array.from(productMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [productstocks]);

    // Calculate available advance when customer changes
    useEffect(() => {
        if (selectedCustomer) {
            const advance = parseFloat(selectedCustomer.advance_amount) || 0;
            const due = parseFloat(selectedCustomer.due_amount) || 0;
            setAvailableAdvance(advance - due);
        } else {
            setAvailableAdvance(0);
        }
    }, [selectedCustomer]);

    // Handle customer selection
    const handleCustomerSelect = (customerId) => {
        form.setData("customer_id", customerId);
        const customer = customers.find(c => c.id === parseInt(customerId));
        setSelectedCustomer(customer || null);
    };

    // Handle adjust from advance checkbox
    useEffect(() => {
        if (adjustFromAdvance && availableAdvance > 0) {
            const grandTotal = calculateGrandTotal();
            const maxAdjustable = Math.min(availableAdvance, grandTotal);

            // Set the paid amount to the adjustable amount
            setPaidAmount(prev => {
                const newPaid = Math.min(prev + maxAdjustable, grandTotal);
                return newPaid;
            });
        } else if (!adjustFromAdvance) {
            // Remove the advance adjustment
            const grandTotal = calculateGrandTotal();
            const currentPaid = parseFloat(paidAmount) || 0;
            const adjustedPaid = Math.max(0, currentPaid - Math.min(availableAdvance, grandTotal));
            setPaidAmount(adjustedPaid);
        }
    }, [adjustFromAdvance, availableAdvance, calculateGrandTotal]);

    // Handle partial payment checkbox
    useEffect(() => {
        if (!usePartialPayment) {
            const grandTotal = calculateGrandTotal();
            setPaidAmount(grandTotal);
        }
    }, [usePartialPayment, calculateGrandTotal]);

    const form = useForm({
        customer_id: "",
        sale_date: new Date().toISOString().split('T')[0],
        notes: "",
        items: [],
        vat_rate: 0,
        discount_rate: 0,
        paid_amount: 0,
        grand_amount: 0,
        due_amount: 0,
        sub_amount: 0,
        type: 'inventory',
        use_partial_payment: false,
        adjust_from_advance: false,
        advance_adjustment: 0,
        pickup_items: [],
        supplier_id: null,
    });


    // Update form data when any of the dependencies change
    useEffect(() => {
        const realSubTotal = calculateRealSubTotal();
        const pickupSubTotal = calculatePickupSubTotal();
        const totalSubTotal = calculateTotalSubTotal();
        const grandTotal = calculateGrandTotal();
        const dueAmount = calculateDueAmount();

        // Calculate advance adjustment amount
        let advanceAdjustment = 0;
        if (adjustFromAdvance && availableAdvance > 0) {
            const maxAdjustable = Math.min(availableAdvance, grandTotal);
            const paidWithAdvance = Math.min(parseFloat(paidAmount) || 0, maxAdjustable);
            advanceAdjustment = Math.min(paidWithAdvance, maxAdjustable);
        }

        // Prepare regular items array
        const formattedItems = selectedItems.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            stock_id: item.stockId,
            batch_no: item.batch_no,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            shadow_sell_price: item.shadow_sell_price,
        }));

        // Prepare pickup items array
        const formattedPickupItems = pickupItems.map(item => ({
            product_name: item.product_name,
            brand: item.brand,
            variant: item.variant,
            quantity: item.quantity,
            unit_price: item.unit_price,
            sale_price: item.sale_price,
            total_price: item.total_price,
            supplier_id: item.supplier_id,
            supplier_name: item.supplier_name,
            supplier_company: item.supplier_company,
        }));

        form.setData({
            ...form.data,
            items: formattedItems,
            pickup_items: formattedPickupItems,
            vat_rate: Number(vatRate) || 0,
            discount_rate: Number(discountRate) || 0,
            paid_amount: Number(paidAmount) || 0,
            shadow_paid_amount: Number(shadowPaidAmount) || 0,
            grand_amount: grandTotal,
            due_amount: dueAmount,
            sub_amount: totalSubTotal,
            type: 'inventory',
            use_partial_payment: usePartialPayment,
            adjust_from_advance: adjustFromAdvance,
            advance_adjustment: advanceAdjustment,
            supplier_id: selectedSupplier ? selectedSupplier.id : null,
        });
    }, [selectedItems, pickupItems, vatRate, discountRate, paidAmount, shadowPaidAmount, usePartialPayment, adjustFromAdvance, availableAdvance, selectedSupplier, calculateRealSubTotal, calculatePickupSubTotal, calculateTotalSubTotal, calculateGrandTotal, calculateDueAmount]);

    const getVariantDisplayName = (variant) => {
        const parts = [];

        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => ` ${value}`)
                    .join(', ');
                parts.push(` ${attrs}`);
            } else {
                parts.push(`Attribute: ${variant.attribute_values}`);
            }
        }

        if (variant.sku) parts.push(`Sku: ${variant.sku}`);
        return parts.join(', ') || 'Default Variant';
    };

    const getBrandName = (variant) => {
        const parts = [];

        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => `${key}`)
                    .join(', ');
                parts.push(` ${attrs}`);
            } else {
                parts.push(`Attribute: ${variant.attribute_values}`);
            }
        }

        return parts.join(', ') || 'Default Variant';
    };

    
    // Handle account selection
    const handleAccountSelect = (accountId) => {
        const id = accountId ? parseInt(accountId) : "";
        setSelectedAccount(id);
        form.setData("account_id", id);
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
            item => item.product_id === productstock.product.id && item.variant_id === variantId && item.stockId === productstock.id
        );

        if (existingItem) {
            setSelectedItems(selectedItems.map(item =>
                item.product_id === productstock.product.id && item.variant_id === variantId && item.stockId === productstock.id
                    ? { ...item, quantity: item.quantity }
                    : item
            ));
        } else {
            const salePrice = Number(productstock.sale_price) || 0;
            const shadowSalePrice = Number(productstock.shadow_sale_price) || 0;

            setSelectedItems([
                ...selectedItems,
                {
                    product_id: productstock.product.id,
                    variant_id: variantId,
                    product_name: productstock.product.name,
                    variant_name: variant ? getBrandName(variant) : 'Default Brand',
                    product_code: productstock.product.product_no || '',
                    model_name: variant ? getVariantDisplayName(variant) : 'Default Variant',
                    quantity: 1,
                    stockQuantity: Number(productstock.quantity) || 0,
                    stockId: productstock.id,
                    batch_no: productstock.batch_no ?? 'N/A',
                    unit_price: salePrice,
                    sell_price: salePrice,
                    total_price: salePrice,
                    shadow_sell_price: shadowSalePrice,
                }
            ]);
        }
        setProductSearch("");
        setFilteredProducts([]);
    };

    // Pickup sale functions
    const addPickupItem = () => {
        if (!pickupProductName || pickupQuantity <= 0 || pickupUnitPrice <= 0 || pickupSalePrice <= 0) {
            alert("Please fill all required fields for pickup item");
            return;
        }

        if (!selectedSupplier) {
            alert("Please select a supplier for pickup item");
            return;
        }

        const newItem = {
            id: Date.now(),
            product_name: pickupProductName,
            brand: pickupBrand,
            variant: pickupVariant,
            quantity: Number(pickupQuantity),
            unit_price: Number(pickupUnitPrice),
            sale_price: Number(pickupSalePrice),
            total_price: Number(pickupQuantity) * Number(pickupSalePrice),
            supplier_id: selectedSupplier.id,
            supplier_name: selectedSupplier.name,
            supplier_company: selectedSupplier.company,
        };

        setPickupItems([...pickupItems, newItem]);

        // Reset form
        setPickupProductName("");
        setPickupBrand("");
        setPickupVariant("");
        setPickupQuantity(1);
        setPickupUnitPrice(0);
        setPickupSalePrice(0);
        setSelectedSupplier(null);
        setShowPickupModal(false);
    };

    const removePickupItem = (index) => {
        const updated = [...pickupItems];
        updated.splice(index, 1);
        setPickupItems(updated);
    };

    const removeItem = (index) => {
        const updated = [...selectedItems];
        updated.splice(index, 1);
        setSelectedItems(updated);
    };

    const updateItem = (index, field, value) => {
        const updated = [...selectedItems];
        const numValue = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;

        updated[index][field] = numValue;

        if (field === 'quantity' || field === 'unit_price') {
            const quantity = field === 'quantity' ? numValue : updated[index].quantity;
            const unitPrice = field === 'unit_price' ? numValue : updated[index].unit_price;
            updated[index].total_price = quantity * unitPrice;
        }

        setSelectedItems(updated);
    };

    // Handle supplier selection
    const handleSupplierSelect = (supplier) => {
        setSelectedSupplier(supplier);
        form.setData("supplier_id", supplier.id);
        setShowSupplierModal(false);
    };

    // Supplier create function
    const createNewSupplier = async () => {
        if (!newSupplierName || !newSupplierPhone) {
            alert("Supplier name and phone are required");
            return;
        }

        try {
            const response = await fetch(route('supplier.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: newSupplierName,
                    company: newSupplierCompany,
                    phone: newSupplierPhone,
                    is_active: true,
                    _token: document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSelectedSupplier(data.supplier || data.data);
                form.setData("supplier_id", data.supplier?.id || data.data?.id);
                setShowSupplierModal(false);
                setNewSupplierName("");
                setNewSupplierCompany("");
                setNewSupplierPhone("");

                // Refresh suppliers list
                window.location.reload();
            } else {
                alert(data.message || "Error creating supplier");
            }
        } catch (error) {
            console.error("Error creating supplier:", error);
            alert("Network error creating supplier");
        }
    };

    console.log("Selected Items:", selectedItems);
    console.log("Pickup Items:", pickupItems);
    console.log("Form Data:", form.data);

    // Safe number formatting function
    const formatCurrency = (value) => {
        const numValue = Number(value) || 0;
        return numValue.toFixed(2);
    };

    const formatWithSymbol = (value) => {
        return `৳${formatCurrency(value)}`;
    };

    const submit = (e) => {
        e.preventDefault();

        if (selectedItems.length === 0 && pickupItems.length === 0) {
            alert("Please add at least one product to the sale");
            return;
        }

        // Validate that all items have quantity and unit price
        const invalidItems = selectedItems.filter(item =>
            !item.quantity || item.quantity <= 0 || !item.unit_price || item.unit_price <= 0
        );

        if (invalidItems.length > 0) {
            alert("Please ensure all items have valid quantity and unit price");
            return;
        }

        // Check for stock availability
        const outOfStockItems = selectedItems.filter(item =>
            item.quantity > item.stockQuantity
        );

        if (outOfStockItems.length > 0) {
            alert("Some items exceed available stock. Please adjust quantities.");
            return;
        }

        // Validate pickup items have suppliers
        if (pickupItems.length > 0) {
            const itemsWithoutSupplier = pickupItems.filter(item => !item.supplier_id);
            if (itemsWithoutSupplier.length > 0) {
                alert("Please ensure all pickup items have a supplier assigned");
                return;
            }
        }

        console.log("Submitting form data:", form.data);

        form.post(route("sales.store"), {
            onSuccess: () => {
                console.log("Sale created successfully");
                router.visit(route("sales.index"));
            },
            onError: (errors) => {
                console.error("Error occurred:", errors);
                if (errors.items) {
                    alert("Please check the product items: " + errors.items);
                } else {
                    console.error("Error occurred:", errors);
                    alert(errors.error || "Failed to create sale. Please check the form data.");
                }
            }
        });
    };

    // Calculate all totals
    const realSubTotal = calculateRealSubTotal();
    const pickupSubTotal = calculatePickupSubTotal();
    const totalSubTotal = calculateTotalSubTotal();
    const grandTotal = calculateGrandTotal();
    const dueAmount = calculateDueAmount();
    const vatAmount = calculateVatAmount();
    const discountAmount = calculateDiscountAmount();

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Create New (Sale/Order)"
                subtitle="Add products to sale (Inventory System)"
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
                                onChange={(e) => handleCustomerSelect(e.target.value)}
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

                        {/* Customer Information Display */}
                        {selectedCustomer && (
                            <div className="border border-gray-200 rounded-box p-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <User size={16} /> Customer Information
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User size={12} className="text-gray-500" />
                                        <span className="font-medium">{selectedCustomer.customer_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone size={12} className="text-gray-500" />
                                        <span>{selectedCustomer.phone}</span>
                                    </div>
                                    {selectedCustomer.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail size={12} className="text-gray-500" />
                                            <span>{selectedCustomer.email}</span>
                                        </div>
                                    )}
                                    {selectedCustomer.address && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{selectedCustomer.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign size={12} className="text-green-500" />
                                        <span>
                                            <span className="font-medium">Available Advance:</span>
                                            <span className="ml-1 font-bold text-green-600">
                                                ৳{formatCurrency(availableAdvance)}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Options */}
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <h4 className="font-medium text-gray-700 mb-2">Payment Options</h4>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={usePartialPayment}
                                                onChange={(e) => setUsePartialPayment(e.target.checked)}
                                                className="checkbox checkbox-sm checkbox-primary"
                                            />
                                            <span className="text-sm">Allow Partial Payment</span>
                                        </label>

                                        {availableAdvance > 0 && (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={adjustFromAdvance}
                                                    onChange={(e) => setAdjustFromAdvance(e.target.checked)}
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                />
                                                <span className="text-sm">Adjust from Customer Advance</span>
                                                <span className="text-xs text-gray-500">
                                                    (Up to ৳{formatCurrency(Math.min(availableAdvance, calculateGrandTotal()))})
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    {adjustFromAdvance && availableAdvance > 0 && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-box">
                                            <p className="text-sm text-blue-700">
                                                <strong>Note:</strong> ৳{formatCurrency(Math.min(availableAdvance, calculateGrandTotal()))}
                                                will be deducted from customer's advance balance.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Supplier Selection for Pickup Sale */}
                        {pickupItems.length > 0 && (
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold">Supplier for Pickup Items *</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedSupplier?.id || ""}
                                        onChange={(e) => {
                                            const supplier = suppliers.find(s => s.id == e.target.value);
                                            if (supplier) handleSupplierSelect(supplier);
                                        }}
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers && suppliers.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.company ? `(${s.company})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowSupplierModal(true)}
                                        className="btn btn-sm btn-outline"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {selectedSupplier && (
                                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded-box">
                                        <span className="font-bold">{selectedSupplier.name}</span>
                                        {selectedSupplier.company && (
                                            <span className="text-gray-600"> ({selectedSupplier.company})</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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

                        {/* Payment Account Selection */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-bold text-gray-600">
                                    {t('sales.payment_account', 'Payment Account')} *
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full rounded-xl focus:border-red-600"
                                value={selectedAccount}
                                onChange={(e) => handleAccountSelect(e.target.value)}
                                required
                            >
                                <option value="">{t('sales.select_account', 'Select Account')}</option>
                                {accounts && accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        <div className="flex items-center gap-2">
                                            {getAccountIcon(account.type)}
                                            <span>{account.name}</span>
                                            <span className="text-xs text-gray-500">
                                                (Balance: {formatWithSymbol(account.current_balance)})
                                            </span>
                                        </div>
                                    </option>
                                ))}
                            </select>
                            {selectedAccount && (
                                <div className="mt-2 text-xs">
                                    {(() => {
                                        const account = accounts.find(a => a.id == selectedAccount);
                                        if (account) {
                                            return (
                                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                                    {getAccountIcon(account.type)}
                                                    <span className="font-bold">{account.name}</span>
                                                    <span className="ml-auto font-mono">
                                                        {formatWithSymbol(account.current_balance)}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
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
                        {/* Header with both sale types */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">
                                Add Products to Sale
                            </h3>
                            <div className="text-sm text-gray-500">
                                Stock Items: {selectedItems.length} | Pickup Items: {pickupItems.length}
                            </div>
                        </div>

                        {/* Stock Products Section */}
                        <div className="mb-6">
                            <div className="form-control mb-4 relative">
                                <label className="label">
                                    <span className="label-text">Add Stock Products</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full pr-10"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Search products by name or SKU..."
                                />

                                {productSearch && filteredProducts.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                                        {filteredProducts.map(filteredProduct => {
                                            const brandName = filteredProduct.variant?.attribute_values
                                                ? Object.entries(filteredProduct.variant.attribute_values)
                                                    .map(([key, value]) => ` ${key}`)
                                                    .join(', ')
                                                : null;

                                            const attributes = filteredProduct.variant?.attribute_values
                                                ? Object.entries(filteredProduct.variant.attribute_values)
                                                    .map(([key, value]) => ` ${value}`)
                                                    .join(', ')
                                                : null;

                                            return (
                                                <div
                                                    key={filteredProduct.product.id}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                    onClick={() => addItem(filteredProduct, filteredProduct.variant)}
                                                >
                                                    <div className="flex flex-col">
                                                        <div className="flex justify-between items-center">
                                                            <span>{filteredProduct?.product?.name} ({filteredProduct.variant.sku})</span>
                                                            <Plus size={14} className="text-primary" />
                                                        </div>
                                                        {attributes && (
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                <span> <strong>Variant:</strong> {brandName} || </span>
                                                                <span><strong>Model:</strong> {attributes || 'N/A'} || </span>
                                                                <span><strong>Batch No:</strong> {filteredProduct.batch_no || 'N/A'} </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Stock Items List */}
                            {selectedItems.length > 0 ? (
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Stock Items ({selectedItems.length})</h3>
                                    {selectedItems.map((item, index) => (
                                        <div key={index} className="border border-gray-300 rounded-box p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{item.product_name} ({item.product_code})</h4>
                                                    <p className="text-sm text-gray-600"><strong>Variant: </strong> {item.variant_name} || <strong>Batch No: </strong> {item?.batch_no}</p>
                                                    <p className="text-sm text-gray-600"><strong>Model: </strong> {item.model_name}</p>
                                                    <p className="text-sm text-gray-600"> <strong>Available Stock: </strong> {item.stockQuantity} |
                                                        <strong> Sale Price:</strong> ৳{formatCurrency(item.sell_price)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={12} /><span className="sr-only">Remove</span>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text">Quantity *</span></label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.stockQuantity}
                                                        className="input input-bordered input-sm"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        required
                                                    />
                                                    {item.quantity > item.stockQuantity && (
                                                        <div className="text-error text-xs mt-1">Exceeds available stock!</div>
                                                    )}
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text">Unit Price (৳) *</span></label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="input input-bordered input-sm bg-gray-100"
                                                        value={item.sell_price}
                                                        onChange={(e) => updateItem(index, 'sell_price', e.target.value)}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text">Sh Unit Price (৳) *</span></label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="input input-bordered input-sm bg-gray-100"
                                                        value={item.shadow_sell_price}
                                                        onChange={(e) => updateItem(index, 'shadow_sell_price', e.target.value)}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text">Total Price (৳)</span></label>
                                                    <input
                                                        type="number"
                                                        className="input input-bordered input-sm bg-gray-100"
                                                        value={formatCurrency(item.total_price)}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text">Sh Total Price (৳)</span></label>
                                                    <input
                                                        type="number"
                                                        className="input input-bordered input-sm bg-gray-100"
                                                        value={formatCurrency(item.shadow_sell_price * item.quantity)}
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                                    <p className="text-gray-500">No stock items added yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Search and add stock products above</p>
                                </div>
                            )}
                        </div>

                        {/* Pickup Products Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <ShoppingBag size={16} /> Pickup Products
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => setShowPickupModal(true)}
                                    className="btn btn-sm btn-outline"
                                >
                                    <Plus size={14} className="mr-1" /> Add Pickup Item
                                </button>
                            </div>

                            {/* Pickup Items List */}
                            {pickupItems.length > 0 ? (
                                <div className="space-y-3">
                                    {pickupItems.map((item, index) => (
                                        <div key={item.id} className="card bg-gray-50 border border-gray-200 rounded-lg">
                                            <div className="card-body p-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900">{item.product_name}</h4>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            <div className="text-xs">
                                                                Brand: {item.brand || 'N/A'} | Variant: {item.variant || 'N/A'}
                                                            </div>
                                                            <div className="text-xs mt-1">
                                                                <strong>Supplier:</strong> {item.supplier_name}
                                                                {item.supplier_company && ` (${item.supplier_company})`}
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                                <div>
                                                                    <span className="text-xs text-gray-500">Qty:</span>
                                                                    <div className="font-bold">{item.quantity}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-gray-500">Cost:</span>
                                                                    <div className="font-bold">{formatWithSymbol(item.unit_price)}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-gray-500">Sale:</span>
                                                                    <div className="font-bold">{formatWithSymbol(item.sale_price)}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-gray-500">Total:</span>
                                                                    <div className="font-bold text-red-600">{formatWithSymbol(item.total_price)}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePickupItem(index)}
                                                        className="btn btn-xs btn-ghost text-red-600"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-200 rounded-box py-8 text-center">
                                    <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-gray-500">No pickup items added</p>
                                    <p className="text-sm text-gray-400 mt-1">Click "Add Pickup Item" to add products not in stock</p>
                                </div>
                            )}
                        </div>

                        {/* Calculation Summary */}
                        {(selectedItems.length > 0 || pickupItems.length > 0) && (
                            <div className="border-t pt-4 mt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span>Stock Items Total:</span>
                                    <span>{formatWithSymbol(realSubTotal)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Pickup Items Total:</span>
                                    <span>{formatWithSymbol(pickupSubTotal)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Sub Total:</span>
                                    <span>{formatWithSymbol(totalSubTotal)}</span>
                                </div>

                                {/* VAT Field */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>Vat / Tax:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="input input-bordered input-sm w-20"
                                            value={vatRate}
                                            onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                                            placeholder="Rate %"
                                        />
                                        <span>%</span>
                                    </div>
                                    <span>{formatWithSymbol(vatAmount)}</span>
                                </div>

                                {/* Discount Field */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span>Discount:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="input input-bordered input-sm w-20"
                                            value={discountRate}
                                            onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                            placeholder="Rate %"
                                        />
                                        <span>%</span>
                                    </div>
                                    <span>{formatWithSymbol(discountAmount)}</span>
                                </div>

                                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                                    <span>Grand Total:</span>
                                    <span>{formatWithSymbol(grandTotal)}</span>
                                </div>

                                {/* Payment Information */}
                                <div className="bg-gray-50 p-3 rounded-box border border-gray-200">
                                    <h4 className="font-medium text-gray-700 mb-2">Payment Details</h4>

                                    {adjustFromAdvance && availableAdvance > 0 && (
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span>Advance Adjustment:</span>
                                            </div>
                                            <span className="font-medium text-blue-600">
                                                ৳{formatCurrency(Math.min(availableAdvance, grandTotal))}
                                            </span>
                                        </div>
                                    )}

                                    {/* Paid Amount */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span>Paid Amount:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                max={calculateGrandTotal()}
                                                className="input input-bordered input-sm w-32"
                                                value={paidAmount}
                                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                                disabled={!usePartialPayment && !adjustFromAdvance}
                                            />
                                        </div>
                                        <span>{formatWithSymbol(paidAmount)}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span>Sh Paid Amount:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="input input-bordered input-sm w-32"
                                                value={shadowPaidAmount}
                                                onChange={(e) => setShadowPaidAmount(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <span>{formatWithSymbol(shadowPaidAmount)}</span>
                                    </div>
                                </div>

                                {/* Due Amount */}
                                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                                    <span>Due Amount:</span>
                                    <span className={calculateDueAmount() > 0 ? "text-error" : "text-success"}>
                                        {formatWithSymbol(calculateDueAmount())}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={form.processing || (selectedItems.length === 0 && pickupItems.length === 0)}
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

            {/* Pickup Item Modal */}
            {showPickupModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Pickup Item</h3>
                            <button
                                onClick={() => setShowPickupModal(false)}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Supplier Selection */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Supplier for this item *</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedSupplier?.id || ""}
                                        onChange={(e) => {
                                            const supplier = suppliers.find(s => s.id == e.target.value);
                                            if (supplier) setSelectedSupplier(supplier);
                                        }}
                                        required
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers && suppliers.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.company ? `(${s.company})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowSupplierModal(true)}
                                        className="btn btn-outline"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {selectedSupplier && (
                                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded-box">
                                        <span className="font-bold">{selectedSupplier.name}</span>
                                        {selectedSupplier.company && (
                                            <span className="text-gray-600"> ({selectedSupplier.company})</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Product Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={pickupProductName}
                                    onChange={(e) => setPickupProductName(e.target.value)}
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Brand</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={pickupBrand}
                                        onChange={(e) => setPickupBrand(e.target.value)}
                                        placeholder="Enter brand"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Variant</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={pickupVariant}
                                        onChange={(e) => setPickupVariant(e.target.value)}
                                        placeholder="Enter variant"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Quantity *</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupQuantity}
                                        onChange={(e) => setPickupQuantity(e.target.value)}
                                        min="1"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Cost Price *</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupUnitPrice}
                                        onChange={(e) => setPickupUnitPrice(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Sale Price *</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupSalePrice}
                                        onChange={(e) => setPickupSalePrice(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowPickupModal(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addPickupItem}
                                className="btn btn-primary"
                                disabled={!selectedSupplier}
                            >
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Modal */}
            {showSupplierModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add New Supplier</h3>
                            <button
                                onClick={() => setShowSupplierModal(false)}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Supplier Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    placeholder="Enter supplier name"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Company</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newSupplierCompany}
                                    onChange={(e) => setNewSupplierCompany(e.target.value)}
                                    placeholder="Enter company name"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newSupplierPhone}
                                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowSupplierModal(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createNewSupplier}
                                className="btn btn-primary"
                            >
                                Create Supplier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}