import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft, Plus, Trash2, Search, User, Phone, Mail, MapPin, Wallet, DollarSign, ShoppingBag, Store, X, CreditCard, Landmark, Smartphone, Package, Tag, ChevronRight, Calendar, CheckCircle, AlertCircle, Building, Filter, Hash, Box, Layers, Warehouse } from "lucide-react";
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
    const [paymentStatus, setPaymentStatus] = useState('unpaid'); // Added from second file
    const [manualPaymentOverride, setManualPaymentOverride] = useState(false); // Added from second file

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

    // Product selection states from second file
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showVariantDropdown, setShowVariantDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [availableBrands, setAvailableBrands] = useState([]);
    const [availableVariants, setAvailableVariants] = useState([]);

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

    // Get account icon from second file
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
        
        // Reset payment status when customer changes
        if (!customerId) {
            setPaymentStatus('unpaid');
            setPaidAmount(0);
            setAdjustFromAdvance(false);
            setManualPaymentOverride(false);
        }
    };

    // Handle payment status change from second file
    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        const grandTotal = calculateGrandTotal();

        if (status === 'paid') {
            setPaidAmount(grandTotal);
            setManualPaymentOverride(false);
            setAdjustFromAdvance(false);
        } else if (status === 'unpaid') {
            setPaidAmount(0);
            setManualPaymentOverride(false);
            setAdjustFromAdvance(false);
        } else if (status === 'partial') {
            setManualPaymentOverride(true);
            setAdjustFromAdvance(false);
        }
    };

    // Handle adjust from advance checkbox
    useEffect(() => {
        if (adjustFromAdvance && availableAdvance > 0 && !manualPaymentOverride) {
            const grandTotal = calculateGrandTotal();
            const maxAdjustable = Math.min(availableAdvance, grandTotal);

            if (paidAmount == 0 || paidAmount > grandTotal) {
                const autoPaidAmount = Math.min(maxAdjustable, grandTotal);
                setPaidAmount(autoPaidAmount);
                if (autoPaidAmount >= grandTotal) {
                    setPaymentStatus('paid');
                } else if (autoPaidAmount > 0) {
                    setPaymentStatus('partial');
                } else {
                    setPaymentStatus('unpaid');
                }
            }
        }
    }, [adjustFromAdvance, availableAdvance, calculateGrandTotal, manualPaymentOverride, paidAmount]);

    // Handle manual payment input from second file
    const handleManualPaymentInput = (e) => {
        const value = parseFloat(e.target.value) || 0;
        const grandTotal = calculateGrandTotal();
        setPaidAmount(value);
        if (value === 0) {
            setPaymentStatus('unpaid');
        } else if (value >= grandTotal) {
            setPaymentStatus('paid');
        } else {
            setPaymentStatus('partial');
        }
    };

    const enableManualPaymentOverride = () => {
        setManualPaymentOverride(true);
        setAdjustFromAdvance(false);
    };

    const disableManualPaymentOverride = () => {
        setManualPaymentOverride(false);
        const grandTotal = calculateGrandTotal();
        setPaidAmount(grandTotal);
        setPaymentStatus('paid');
    };

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
        payment_status: 'unpaid', // Added from second file
        account_id: 0, // Added from second file
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
            payment_status: paymentStatus, // Added from second file
            account_id: selectedAccount, // Added from second file
        });
    }, [selectedItems, pickupItems, vatRate, discountRate, paidAmount, shadowPaidAmount, usePartialPayment, adjustFromAdvance, availableAdvance, selectedSupplier, selectedAccount, paymentStatus, calculateRealSubTotal, calculatePickupSubTotal, calculateTotalSubTotal, calculateGrandTotal, calculateDueAmount]);


    const getVariantDisplayName = (variant) => {
        const parts = [];

        if (variant.attribute_values) {
            if (typeof variant.attribute_values === 'object') {
                const attrs = Object.entries(variant.attribute_values)
                    .map(([key, value]) => ` ${key}`)
                    .join(', ');
                parts.push(` ${attrs}`);
            } else {
                parts.push(`Attribute: ${variant.attribute_values}`);
            }
        }

        if (variant.sku) parts.push(`Sku: ${variant.sku}`);
        return parts.join(', ') || 'Default Variant';
    };

    const getVariant = (variant) => {
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
        if (!productSearch.trim()) {
            setFilteredProducts(allProducts);
            return;
        }

        const searchTerm = productSearch.toLowerCase();
        const filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.product_no?.toLowerCase().includes(searchTerm) ||
            product.code?.toLowerCase().includes(searchTerm)
        );

        setFilteredProducts(filtered);
    }, [productSearch, allProducts]);

    // Get brands for selected product from second file
    const getBrandsForProduct = (productId) => {
        if (!productstocks || !productId) return [];

        const brandSet = new Set();

        productstocks
            .filter(stock => stock.product?.id === productId && stock.quantity > 0)
            .forEach(stock => {
                const variant = stock.variant;
                if (variant && variant.attribute_values) {
                    if (typeof variant.attribute_values === 'object') {
                        Object.keys(variant.attribute_values).forEach(key => {
                            brandSet.add(key);
                        });
                    }
                }
            });

        return Array.from(brandSet).sort();
    };

    // Get variants for selected brand from second file
    const getVariantsForBrand = (productId, brandName) => {
        if (!productstocks || !productId) return [];

        const variants = [];

        productstocks
            .filter(stock => stock.product?.id === productId && stock.quantity > 0)
            .forEach(stock => {
                const variant = stock.variant;
                if (variant && variant.attribute_values) {
                    if (typeof variant.attribute_values === 'object') {
                        if (!brandName || variant.attribute_values[brandName]) {
                            const existingVariant = variants.find(v => v.variant?.id === variant.id);
                            if (!existingVariant) {
                                variants.push({
                                    variant: variant,
                                    stocks: [stock],
                                    totalQuantity: Number(stock.quantity) || 0,
                                    batch_no: stock.batch_no,
                                    sale_price: stock.sale_price,
                                    shadow_sale_price: stock.shadow_sale_price // Added shadow price
                                });
                            } else {
                                existingVariant.stocks.push(stock);
                                existingVariant.totalQuantity += Number(stock.quantity) || 0;
                            }
                        }
                    }
                }
            });

        return variants.sort((a, b) => b.totalQuantity - a.totalQuantity);
    };

    // Handle product selection from second file
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSelectedBrand(null);
        setAvailableVariants([]);

        const brands = getBrandsForProduct(product.id);
        setAvailableBrands(brands);

        if (brands.length > 0) {
            setShowBrandDropdown(true);
            setShowProductDropdown(false);
            setProductSearch(product.name);
        } else {
            const variants = getVariantsForBrand(product.id, '');
            setAvailableVariants(variants);
            setShowVariantDropdown(true);
            setShowProductDropdown(false);
        }
    };

    // Handle brand selection from second file
    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);

        const variants = getVariantsForBrand(selectedProduct.id, brand);
        setAvailableVariants(variants);

        setShowBrandDropdown(false);
        setShowVariantDropdown(true);
        setProductSearch(`${selectedProduct.name} - ${brand}`);
    };

    // Handle variant selection and add to cart from second file
    const handleVariantSelect = (variantWithStocks) => {
        const { variant, stocks, totalQuantity, batch_no, sale_price, shadow_sale_price } = variantWithStocks;

        const availableStock = stocks.find(s => s.quantity > 0) || stocks[0];

        if (!availableStock) return;

        const salePrice = Number(sale_price) || Number(availableStock.sale_price) || 0;
        const shadowSalePrice = Number(shadow_sale_price) || Number(availableStock.shadow_sale_price) || 0;

        const itemKey = `${selectedProduct.id}-${variant.id}-${availableStock.batch_no || 'default'}`;

        const existingItem = selectedItems.find(
            item => item.uniqueKey === itemKey
        );

        if (existingItem) {
            setSelectedItems(selectedItems.map(item =>
                item.uniqueKey === itemKey
                    ? {
                        ...item,
                        quantity: item.quantity + 1,
                        total_price: (item.quantity + 1) * item.unit_price
                    }
                    : item
            ));
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    uniqueKey: itemKey,
                    product_id: selectedProduct.id,
                    variant_id: variant.id,
                    batch_no: availableStock.batch_no,
                    product_name: selectedProduct.name,
                    variant_attribute: selectedBrand || Object.keys(variant.attribute_values || {})[0] || 'Default',
                    product_code: selectedProduct.product_no || '',
                    variant_value: selectedBrand
                        ? variant.attribute_values?.[selectedBrand] || 'Default'
                        : Object.values(variant.attribute_values || {})[0] || 'Default',
                    quantity: 1,
                    sku: variant.sku || 'Default SKU',
                    stockQuantity: totalQuantity,
                    stockId: availableStock.id,
                    unit_price: salePrice,
                    sell_price: salePrice,
                    total_price: salePrice,
                    shadow_sell_price: shadowSalePrice, 
                }
            ]);
        }

        resetSelectionFlow();
    };

    // Reset the selection flow from second file
    const resetSelectionFlow = () => {
        setSelectedProduct(null);
        setSelectedBrand(null);
        setAvailableBrands([]);
        setAvailableVariants([]);
        setShowProductDropdown(false);
        setShowBrandDropdown(false);
        setShowVariantDropdown(false);
        setProductSearch("");
    };

    // Go back to product selection from second file
    const goBackToProducts = () => {
        setSelectedProduct(null);
        setSelectedBrand(null);
        setAvailableBrands([]);
        setAvailableVariants([]);
        setShowBrandDropdown(false);
        setShowVariantDropdown(false);
        setShowProductDropdown(true);
        setProductSearch("");
    };

    // Go back to brand selection from second file
    const goBackToBrands = () => {
        setSelectedBrand(null);
        setAvailableVariants([]);
        setShowVariantDropdown(false);
        setShowBrandDropdown(true);
    };

    // Original addItem function (kept for compatibility)
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
                    variant_name: variant ? getVariant(variant) : 'Default Brand',
                    product_code: productstock.product.product_no || '',
                    modal_name: variant ? getVariantDisplayName(variant) : 'Default Variant',
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

        const newItem = {
            id: Date.now(),
            product_name: pickupProductName,
            brand: pickupBrand,
            variant: pickupVariant,
            quantity: Number(pickupQuantity),
            unit_price: Number(pickupUnitPrice),
            sale_price: Number(pickupSalePrice),
            total_price: Number(pickupQuantity) * Number(pickupSalePrice),
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

        // Validate account selection
        if (!selectedAccount) {
            alert("Please select a payment account");
            return;
        }

        // Validate pickup sale supplier (only if pickup items exist)
        if (pickupItems.length > 0 && !selectedSupplier) {
            alert("Please select a supplier for pickup items");
            return;
        }

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

                                {/* Payment Options - UPDATED with second file features */}
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

                                    {/* Payment Status Selector from second file */}
                                    <div className="mt-3">
                                        <label className="label py-0">
                                            <span className="label-text font-medium">Payment Status</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-sm w-full"
                                            value={paymentStatus}
                                            onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                        >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="partial">Partial</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>

                                    {/* Manual Payment Override from second file */}
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-sm">Manual Payment:</span>
                                        <button
                                            type="button"
                                            onClick={manualPaymentOverride ? disableManualPaymentOverride : enableManualPaymentOverride}
                                            className="btn btn-xs btn-outline"
                                        >
                                            {manualPaymentOverride ? 'Disable' : 'Enable'}
                                        </button>
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

                        {/* Payment Account Selection from second file */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">Payment Account *</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedAccount}
                                onChange={(e) => handleAccountSelect(e.target.value)}
                                required
                            >
                                <option value="">Select Account</option>
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
                                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-box">
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

                    {/* Product Selection - UPDATED with second file features */}
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

                        {/* Stock Products Section - UPDATED with second file dropdowns */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Warehouse size={16} /> Stock Products
                                </h4>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-outline"
                                    onClick={() => {
                                        setProductSearch("");
                                        setShowProductDropdown(!showProductDropdown);
                                    }}
                                >
                                    <Search size={12} className="mr-1" /> Search Stock
                                </button>
                            </div>

                            {/* Product Search with Enhanced Dropdowns */}
                            <div className="form-control mb-4 relative">
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input input-bordered w-full pr-10"
                                        value={productSearch}
                                        onChange={(e) => {
                                            setProductSearch(e.target.value);
                                            if (e.target.value.trim() || allProducts.length > 0) {
                                                setShowProductDropdown(true);
                                            }
                                        }}
                                        onClick={() => {
                                            if (allProducts.length > 0) {
                                                setShowProductDropdown(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => {
                                                setShowProductDropdown(false);
                                            }, 200);
                                        }}
                                        placeholder="Search products by name or SKU..."
                                    />
                                    <Search size={18} className="absolute right-3 top-3.5 text-gray-400" />

                                    {productSearch && (
                                        <button
                                            type="button"
                                            onClick={resetSelectionFlow}
                                            className="absolute right-10 top-3 text-gray-400 hover:text-error"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Product Dropdown */}
                                {showProductDropdown && filteredProducts.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                                        <div className="bg-gray-100 p-2 sticky top-0 z-10">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-semibold text-gray-700">
                                                    Select Product ({filteredProducts.length})
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProductDropdown(false)}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        {filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => handleProductSelect(product)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{product.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            <div className="flex items-center gap-2">
                                                                <span>Code: {product.product_no || 'N/A'}</span>
                                                                <span>•</span>
                                                                <span>Stock: {product.totalStock}</span>
                                                                <span>•</span>
                                                                <span>Variants: {product.variantsCount}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Brand Dropdown */}
                                {showBrandDropdown && availableBrands.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                                        <div className="bg-gray-100 p-2 sticky top-0 z-10">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={goBackToProducts}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    <ArrowLeft size={12} />
                                                </button>
                                                <h3 className="text-sm font-semibold text-gray-700 flex-1">
                                                    Select Brand for {selectedProduct?.name}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBrandDropdown(false)}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        {availableBrands.map((brand, index) => (
                                            <div
                                                key={index}
                                                className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => handleBrandSelect(brand)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{brand}</div>
                                                        <div className="text-xs text-gray-500">
                                                            Click to view variants
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Variant Dropdown */}
                                {showVariantDropdown && availableVariants.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                                        <div className="bg-gray-100 p-2 sticky top-0 z-10">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={selectedBrand ? goBackToBrands : goBackToProducts}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    <ArrowLeft size={12} />
                                                </button>
                                                <h3 className="text-sm font-semibold text-gray-700 flex-1">
                                                    {selectedBrand
                                                        ? `Select ${selectedBrand} Variant`
                                                        : `Select Variant for ${selectedProduct?.name}`}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowVariantDropdown(false)}
                                                    className="btn btn-ghost btn-xs"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        {availableVariants.map((variantWithStocks, index) => {
                                            const { variant, stocks, totalQuantity, sale_price, shadow_sale_price } = variantWithStocks;

                                            const displayName = selectedBrand
                                                ? variant.attribute_values?.[selectedBrand] || 'Default'
                                                : Object.values(variant.attribute_values || {})[0] || 'Default';

                                            const salePrice = Number(sale_price) || 0;
                                            const shadowPrice = Number(shadow_sale_price) || 0;

                                            return (
                                                <div
                                                    key={variant.id}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleVariantSelect(variantWithStocks)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1">
                                                            <div className="font-medium">{displayName}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span>Stock: {totalQuantity}</span>
                                                                    <span>•</span>
                                                                    <span>SKU: {variant.sku || 'N/A'}</span>
                                                                    <span>•</span>
                                                                    <span>Price: {formatWithSymbol(salePrice)}</span>
                                                                    {shadowPrice > 0 && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>Shadow: {formatWithSymbol(shadowPrice)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Plus size={16} className="text-primary" />
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
                                                    <p className="text-sm text-gray-600"><strong>Variant: </strong> Attribute:  {item.variant_attribute} |  Value: {item.variant_value} </p>
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Batch No: </strong> {item?.batch_no} ||  <strong>Sku: </strong> {item?.sku}
                                                    </p>
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
                                                <div className="form-control hidden">
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
                                                <div className="form-control hidden">
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
                                                              <strong>Brand:</strong>   {item.brand || 'N/A'} | Variant: {item.variant || 'N/A'}
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

                                {/* Payment Information - UPDATED with manual payment override */}
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

                                    {/* Paid Amount with manual override */}
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
                                                onChange={handleManualPaymentInput}
                                                disabled={!manualPaymentOverride && !usePartialPayment && !adjustFromAdvance}
                                            />
                                        </div>
                                        <span>{formatWithSymbol(paidAmount)}</span>
                                    </div>

                                    <div className="flex justify-between items-center hidden">
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
                        className="btn bg-[#1e4d2b] text-white"
                        disabled={form.processing || (selectedItems.length === 0 && pickupItems.length === 0) || !selectedAccount}
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
                                className="btn bg-[#1e4d2b] text-white"
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
                                className="btn bg-[#1e4d2b] text-white"
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