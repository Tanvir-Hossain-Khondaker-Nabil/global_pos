import PageHeader from "../../components/PageHeader";
import { router, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Wallet,
    CreditCard,
    X,
    ShoppingBag,
    Landmark,
    Smartphone,
    Edit,
    User,
    Phone,
    Store,
    Package,
    Truck,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

export default function AddSale({ customers = [], productstocks = [], suppliers = [], accounts = [] }) {
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const formatCurrency = (v) => n(v).toFixed(2);
    const money = (v) => `৳${formatCurrency(v)}`;

    // ---------------- State ----------------
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [brandFilter, setBrandFilter] = useState("All Brands");
    const [page, setPage] = useState(1);
    const pageSize = 8;

    // Customer state
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [showManualCustomerFields, setShowManualCustomerFields] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Payment state
    const [selectedAccount, setSelectedAccount] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("unpaid"); // Changed default to "unpaid"
    const [partialPayment, setPartialPayment] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);
    const [manualPaymentOverride, setManualPaymentOverride] = useState(false);

    // Cart state
    const [cart, setCart] = useState([]);
    const cartCount = cart.reduce((a, i) => a + n(i.qty), 0);

    // Tax/Discount state
    const [taxRate, setTaxRate] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);
    const [shippingValue, setShippingValue] = useState(0);
    const [points, setPoints] = useState(0);

    // Pickup state
    const [pickupItems, setPickupItems] = useState([]);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierCompany, setNewSupplierCompany] = useState("");
    const [newSupplierPhone, setNewSupplierPhone] = useState("");
    const [newSupplierAddress, setNewSupplierAddress] = useState("");

    // Pickup item form
    const [pickupProductName, setPickupProductName] = useState("");
    const [pickupBrand, setPickupBrand] = useState("");
    const [pickupVariant, setPickupVariant] = useState("");
    const [pickupQuantity, setPickupQuantity] = useState(1);
    const [pickupUnitPrice, setPickupUnitPrice] = useState(0);
    const [pickupSalePrice, setPickupSalePrice] = useState(0);

    // Form state
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");

    // ---------------- Calculations ----------------
    const catalog = useMemo(() => {
        const map = new Map();

        for (const s of productstocks || []) {
            if (!s?.product || n(s?.quantity) <= 0) continue;

            const p = s.product;
            const pid = p.id;

            if (!map.has(pid)) {
                const img = p.photo ? `/storage/${p.photo}` : null;

                map.set(pid, {
                    id: pid,
                    name: p.name || "Unnamed Product",
                    product_no: p.product_no || "",
                    category_name: p.category?.name || "Uncategorized",
                    brand_name: p.brand?.name || "No Brand",
                    image: img,
                    totalStock: 0,
                    minPrice: null,
                    variants: [],
                });
            }

            const item = map.get(pid);
            item.totalStock += n(s.quantity);

            const sp = n(s.sale_price);
            item.minPrice = item.minPrice === null ? sp : Math.min(item.minPrice, sp);

            const variantLabel = (() => {
                const v = s.variant;
                if (!v) return "Default";
                if (typeof v.attribute_values === "object" && v.attribute_values) {
                    const vals = Object.values(v.attribute_values).filter(Boolean);
                    return vals.length ? vals.join(", ") : (v.sku || "Default");
                }
                return v.attribute_values || v.sku || "Default";
            })();

            item.variants.push({
                stock_id: s.id,
                batch_no: s.batch_no || null,
                quantity: n(s.quantity),
                sale_price: n(s.sale_price),
                shadow_sale_price: n(s.shadow_sale_price),
                variant_id: s.variant?.id || null,
                variant_label: variantLabel,
            });
        }

        return Array.from(map.values())
            .map((p) => ({
                ...p,
                variants: p.variants.sort((a, b) => {
                    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
                    return (a.batch_no || "").localeCompare(b.batch_no || "");
                }),
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [productstocks]);

    const categories = useMemo(() => {
        const set = new Set();
        for (const p of catalog) set.add(p.category_name || "Uncategorized");
        return ["All Categories", ...Array.from(set).sort()];
    }, [catalog]);

    const brands = useMemo(() => {
        const set = new Set();
        for (const p of catalog) set.add(p.brand_name || "No Brand");
        return ["All Brands", ...Array.from(set).sort()];
    }, [catalog]);

    const filteredCatalog = useMemo(() => {
        const q = search.trim().toLowerCase();
        return catalog.filter((p) => {
            const okCategory = categoryFilter === "All Categories" ? true : p.category_name === categoryFilter;
            const okBrand = brandFilter === "All Brands" ? true : p.brand_name === brandFilter;
            const okSearch = !q
                ? true
                : (p.name || "").toLowerCase().includes(q) ||
                (p.product_no || "").toLowerCase().includes(q);
            return okCategory && okBrand && okSearch;
        });
    }, [catalog, search, categoryFilter, brandFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / pageSize));
    useEffect(() => setPage((p) => Math.min(Math.max(1, p), totalPages)), [totalPages]);

    const pagedCatalog = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCatalog.slice(start, start + pageSize);
    }, [filteredCatalog, page, pageSize]);

    // Update selected customer when customerId changes
    useEffect(() => {
        if (customerId && customerId !== "01") {
            const customer = customers.find((c) => String(c.id) === String(customerId));
            setSelectedCustomer(customer || null);
            if (customer) {
                setCustomerName(customer.customer_name || "");
                setCustomerPhone(customer.phone || "");
            }
        } else {
            setSelectedCustomer(null);
        }
    }, [customerId, customers]);

    // ---------------- Cart Operations ----------------
    const subTotal = useMemo(() => cart.reduce((sum, i) => sum + n(i.qty) * n(i.unit_price), 0), [cart]);
    const pickupSubTotal = useMemo(() => pickupItems.reduce((sum, i) => sum + n(i.quantity) * n(i.sale_price), 0), [pickupItems]);
    const totalSubTotal = useMemo(() => subTotal + pickupSubTotal, [subTotal, pickupSubTotal]);
    const taxAmount = useMemo(() => (totalSubTotal * n(taxRate)) / 100, [totalSubTotal, taxRate]);
    const grandTotal = useMemo(
        () => totalSubTotal + taxAmount - n(discountValue) + n(shippingValue),
        [totalSubTotal, taxAmount, discountValue, shippingValue]
    );

    // Effect to handle payment status and account enable/disable logic
    useEffect(() => {
        if (!manualPaymentOverride) {
            if (paymentStatus === "paid") {
                setPaidAmount(grandTotal);
                setPartialPayment(false);
            } else if (paymentStatus === "unpaid") {
                setPaidAmount(0);
                setPartialPayment(false);
                setSelectedAccount(""); // Clear account selection for unpaid
            } else if (paymentStatus === "partial") {
                setPartialPayment(true);
                if (paidAmount === 0 || paidAmount >= grandTotal) {
                    setPaidAmount(grandTotal * 0.5);
                }
            }
        }
    }, [grandTotal, paymentStatus, manualPaymentOverride]);

    // Effect to sync payment status with paid amount when manual override is active
    useEffect(() => {
        if (manualPaymentOverride) {
            if (paidAmount === 0) {
                setPaymentStatus("unpaid");
                setPartialPayment(false);
            } else if (paidAmount >= grandTotal) {
                setPaymentStatus("paid");
                setPartialPayment(false);
            } else {
                setPaymentStatus("partial");
                setPartialPayment(true);
            }
        }
    }, [paidAmount, grandTotal, manualPaymentOverride]);

    const dueAmount = useMemo(() => Math.max(0, grandTotal - n(paidAmount)), [grandTotal, paidAmount]);

    const addToCart = useCallback((product) => {
        if (!product?.variants?.length) return;

        const v = product.variants[0];
        const key = `${product.id}-${v.variant_id || "0"}-${v.stock_id}`;

        setCart((prev) => {
            const exists = prev.find((x) => x.key === key);
            if (exists) {
                const nextQty = Math.min(n(exists.qty) + 1, n(exists.maxQty));
                return prev.map((x) => (x.key === key ? { ...x, qty: nextQty } : x));
            }

            return [
                ...prev,
                {
                    key,
                    product_id: product.id,
                    variant_id: v.variant_id,
                    stock_id: v.stock_id,
                    name: product.name,
                    code: product.product_no,
                    variant_label: v.variant_label,
                    batch_no: v.batch_no,
                    qty: 1,
                    unit_price: n(v.sale_price),
                    shadow_unit_price: n(v.shadow_sale_price) || n(v.sale_price),
                    maxQty: n(v.quantity),
                },
            ];
        });
    }, []);

    const removeCartItem = (key) => setCart((prev) => prev.filter((x) => x.key !== key));

    const changeQty = (key, nextQty) => {
        setCart((prev) =>
            prev.map((x) => {
                if (x.key !== key) return x;
                const q = Math.min(Math.max(1, n(nextQty)), n(x.maxQty));
                return { ...x, qty: q };
            })
        );
    };

    // ---------------- Pickup Functions ----------------
    const addPickupItem = () => {
        if (!pickupProductName || pickupQuantity <= 0 || pickupSalePrice <= 0) {
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
        setShowPickupModal(false);
    };

    const removePickupItem = (index) => {
        const updated = [...pickupItems];
        updated.splice(index, 1);
        setPickupItems(updated);
    };

    const handleSupplierSelect = (supplier) => {
        setSelectedSupplier(supplier);
        setShowSupplierModal(false);
    };

    const createNewSupplier = async () => {
        if (!newSupplierName || !newSupplierPhone) {
            alert("Supplier name and phone are required");
            return;
        }

        try {
            const response = await fetch(route("suppliers.store"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    name: newSupplierName,
                    company: newSupplierCompany,
                    phone: newSupplierPhone,
                    address: newSupplierAddress,
                    is_active: true,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSelectedSupplier(data.supplier || data.data);
                setShowSupplierModal(false);
                setNewSupplierName("");
                setNewSupplierCompany("");
                setNewSupplierPhone("");
                setNewSupplierAddress("");
            } else {
                alert(data.message || "Error creating supplier");
            }
        } catch (error) {
            console.error("Error creating supplier:", error);
            alert("Network error creating supplier");
        }
    };

    // ---------------- Payment Functions ----------------
    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        setManualPaymentOverride(false);

        if (status === "paid") {
            setPaidAmount(grandTotal);
            setPartialPayment(false);
        } else if (status === "unpaid") {
            setPaidAmount(0);
            setPartialPayment(false);
            setSelectedAccount(""); // Clear account selection for unpaid
        } else if (status === "partial") {
            setPartialPayment(true);
            if (paidAmount === 0 || paidAmount >= grandTotal) {
                setPaidAmount(grandTotal * 0.5);
            }
        }
    };

    const handlePaidAmountChange = (value) => {
        setPaidAmount(n(value));
        setManualPaymentOverride(true);

        if (value === 0) {
            setPaymentStatus("unpaid");
            setPartialPayment(false);
        } else if (value >= grandTotal) {
            setPaymentStatus("paid");
            setPartialPayment(false);
        } else {
            setPaymentStatus("partial");
            setPartialPayment(true);
        }
    };

    const enableManualPaymentOverride = () => {
        setManualPaymentOverride(true);
    };

    const disableManualPaymentOverride = () => {
        setManualPaymentOverride(false);
        // Reset to the logic based on payment status
        if (paymentStatus === "paid") {
            setPaidAmount(grandTotal);
        } else if (paymentStatus === "unpaid") {
            setPaidAmount(0);
            setSelectedAccount(""); // Clear account for unpaid
        } else if (paymentStatus === "partial") {
            // Keep current paid amount but ensure it's not 0 or >= grandTotal
            if (paidAmount === 0 || paidAmount >= grandTotal) {
                setPaidAmount(grandTotal * 0.5);
            }
        }
    };

    const getAccountIcon = (type) => {
        switch (type) {
            case "cash":
                return <Wallet size={14} className="text-green-600" />;
            case "bank":
                return <Landmark size={14} className="text-blue-600" />;
            case "mobile_banking":
                return <Smartphone size={14} className="text-purple-600" />;
            default:
                return <CreditCard size={14} />;
        }
    };

    // Check if account selection should be disabled
    const isAccountDisabled = paymentStatus === "unpaid";

    // ---------------- Form Handling ----------------
    const form = useForm({
        customer_id: null,
        customer_name: null,
        phone: null,
        sale_date: saleDate,
        notes: notes,
        items: [],
        vat_rate: 0,
        discount_rate: 0,
        paid_amount: 0,
        grand_amount: 0,
        due_amount: 0,
        sub_amount: 0,
        type: "pos",
        pickup_items: [],
        supplier_id: null,
        account_id: "",
        adjust_from_advance: false,
        advance_adjustment: 0,
        payment_status: "unpaid", // Default to unpaid
    });

    useEffect(() => {
        const formattedItems = cart.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            stock_id: i.stock_id,
            batch_no: i.batch_no,
            quantity: n(i.qty),
            unit_price: n(i.unit_price),
            total_price: n(i.qty) * n(i.unit_price),
            shadow_sell_price: n(i.shadow_unit_price),
        }));

        const formattedPickupItems = pickupItems.map((i) => ({
            product_name: i.product_name,
            brand: i.brand,
            variant: i.variant,
            quantity: i.quantity,
            unit_price: i.unit_price,
            sale_price: i.sale_price,
            total_price: i.total_price,
            supplier_id: selectedSupplier?.id || null,
        }));

        const walkIn = !customerId && !customerName.trim() && !customerPhone.trim();

        form.setData({
            ...form.data,
            customer_id: customerId && customerId !== "01" ? customerId : null,
            customer_name: walkIn ? null : (customerId && customerId !== "01" ? null : (customerName.trim() || null)),
            phone: walkIn ? null : (customerId && customerId !== "01" ? null : (customerPhone.trim() || null)),
            items: formattedItems,
            pickup_items: formattedPickupItems,
            vat_rate: n(taxRate),
            discount_rate: 0,
            paid_amount: n(paidAmount),
            grand_amount: n(grandTotal),
            due_amount: n(dueAmount),
            sub_amount: n(totalSubTotal),
            type: "pos",
            account_id: selectedAccount || "",
            payment_status: paymentStatus,
            supplier_id: selectedSupplier?.id || null,
            sale_date: saleDate,
            notes: notes,
        });
    }, [cart, pickupItems, customerId, customerName, customerPhone, taxRate, totalSubTotal, grandTotal, paidAmount, dueAmount, selectedAccount, paymentStatus, selectedSupplier, saleDate, notes]);

    const submit = (e) => {
        e.preventDefault();

        if (!cart.length && !pickupItems.length) return alert("Add at least 1 product");
        if (paymentStatus !== "unpaid" && !selectedAccount) return alert("Select a payment account for payment");

        // If they typed one of name/phone, require both (not for walk-in)
        const hasOne = (!!customerName.trim() && !customerPhone.trim()) || (!customerName.trim() && !!customerPhone.trim());
        if (!customerId && hasOne) return alert("If you type customer info, provide both Name and Phone. Otherwise keep walk-in empty.");

        // Validate pickup items have supplier if any pickup items exist
        // if (pickupItems.length > 0 && !selectedSupplier) {
        //     return alert("Please select a supplier for pickup items");
        // }

        form.post(route("sales.store"), {
            onSuccess: () => router.visit(route("sales.index")),
            onError: (errors) => {
                console.error(errors);
                alert(errors?.error || "Sale create failed. Check fields.");
            },
        });
    };

    const selectedAccountObj = selectedAccount
        ? accounts.find((acc) => String(acc.id) === String(selectedAccount))
        : null;

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader title="POS Checkout" subtitle="Create sale with modern POS layout">
                <button onClick={() => router.visit(route("sales.index"))} className="btn btn-sm btn-ghost">
                    <ArrowLeft size={15} /> Back
                </button>
            </PageHeader>

            <form onSubmit={submit} className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN - Product Catalog (8 columns) */}
                    <div className="lg:col-span-4">
                        <div className="space-y-6">
                            {/* Customer Information Card */}
                            <div className="card border border-gray-200 rounded-2xl shadow-sm">
                                <div className="card-body p-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <User size={20} /> Customer Information
                                    </h2>

                                    <div className="space-y-4">
                                        <select
                                            className="select select-bordered w-full"
                                            value={customerId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomerId(val);
                                                setShowManualCustomerFields(val === "01");
                                            }}
                                        >
                                            <option value="">Walk In Customer</option>
                                            <option value="01">+ Add Customer Manual</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.customer_name} ({c.phone})
                                                </option>
                                            ))}
                                        </select>

                                        {/* Manual Customer Fields */}
                                        {showManualCustomerFields && (
                                            <div className="space-y-3">
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">Customer Name *</span>
                                                    </label>
                                                    <input
                                                        className="input input-bordered"
                                                        placeholder="Enter customer name"
                                                        value={customerName}
                                                        onChange={(e) => setCustomerName(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">Phone Number *</span>
                                                    </label>
                                                    <input
                                                        className="input input-bordered"
                                                        placeholder="Enter phone number"
                                                        value={customerPhone}
                                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Selected Customer Info */}
                                        {selectedCustomer && (
                                            <div className="bg-gray-50 p-3 rounded-lg border">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{selectedCustomer.customer_name}</div>
                                                        <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomerId("");
                                                            setSelectedCustomer(null);
                                                            setCustomerName("");
                                                            setCustomerPhone("");
                                                        }}
                                                        className="btn btn-xs btn-ghost"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cart Summary Card */}
                            <div className="card border border-gray-200 rounded-2xl shadow-sm">
                                <div className="card-body p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold">Checkout Summary</h2>
                                        <span className="text-xs text-gray-500">Items: {cartCount + pickupItems.length}</span>
                                    </div>

                                    {/* Cart Items */}
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        {!cart.length && !pickupItems.length ? (
                                            <div className="py-12 text-center bg-white">
                                                <Package size={40} className="mx-auto text-gray-300 mb-3" />
                                                <div className="font-medium text-gray-500">No items added</div>
                                                <div className="text-sm text-gray-400 mt-1">Select products from the catalog</div>
                                            </div>
                                        ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                                {/* Stock Items */}
                                                {cart.map((i) => (
                                                    <div key={i.key} className="p-3 border-b hover:bg-gray-50">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold truncate text-gray-900">{i.name}</div>
                                                                <div className="text-xs text-gray-600 truncate">
                                                                    {i.code ? `#${i.code} • ` : ""} {i.variant_label}
                                                                    {i.batch_no ? ` • Batch: ${i.batch_no}` : ""}
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline border-gray-300 hover:bg-gray-100"
                                                                        onClick={() => changeQty(i.key, n(i.qty) - 1)}
                                                                    >
                                                                        <Minus size={12} className="text-gray-700" />
                                                                    </button>

                                                                    <input
                                                                        className="input input-bordered input-xs  text-center  font-medium  focus:border-gray-400 focus:outline-none"
                                                                        type="number"
                                                                        min={1}
                                                                        max={i.maxQty}
                                                                        value={i.qty ?? 1}
                                                                        onChange={(e) => changeQty(i.key, Number(e.target.value))}
                                                                        style={{ width: '100px' }}
                                                                    />


                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline border-gray-300 hover:bg-gray-100"
                                                                        onClick={() => changeQty(i.key, n(i.qty) + 1)}
                                                                    >
                                                                        <Plus size={12} className="text-gray-700" />
                                                                    </button>

                                                                    <span className="text-xs text-gray-600 ml-1">max {i.maxQty}</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right min-w-[100px]">
                                                                <div className="font-semibold text-gray-900">{money(n(i.unit_price) * n(i.qty))}</div>
                                                                <div className="text-xs text-gray-600">{money(i.unit_price)} each</div>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                                                                    onClick={() => removeCartItem(i.key)}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Pickup Items */}
                                                {pickupItems.map((item, index) => (
                                                    <div key={item.id} className="p-3 border-b bg-yellow-50 hover:bg-yellow-100">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold truncate text-gray-900 flex items-center gap-1">
                                                                    <ShoppingBag size={12} className="text-orange-500" />
                                                                    {item.product_name}
                                                                </div>
                                                                <div className="text-xs text-gray-600 truncate">
                                                                    {item.brand ? `Brand: ${item.brand}` : ""}
                                                                    {item.variant ? ` • Variant: ${item.variant}` : ""}
                                                                </div>
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    Qty: <span className="font-medium">{item.quantity}</span> × <span className="font-medium">{money(item.sale_price)}</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right min-w-[100px]">
                                                                <div className="font-semibold text-gray-900">{money(item.total_price)}</div>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                                                                    onClick={() => removePickupItem(index)}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Pickup Item Button */}
                                    <div className="mt-4">
                                        <button type="button" onClick={() => setShowPickupModal(true)} className="btn btn-outline w-full">
                                            <Plus size={16} className="mr-2" /> Add Pickup Item
                                        </button>
                                    </div>

                                    {/* Pickup Items Summary */}
                                    {pickupItems.length > 0 && (
                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">Pickup Items Summary</span>
                                                <span className="font-bold">{money(pickupSubTotal)}</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {pickupItems.length} item{pickupItems.length !== 1 ? 's' : ''} • {selectedSupplier ? `Supplier: ${selectedSupplier.name}` : 'No supplier selected'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Totals Section */}
                                    <div className="mt-6 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Stock Subtotal:</span>
                                            <span className="font-medium">{money(subTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Pickup Subtotal:</span>
                                            <span className="font-medium">{money(pickupSubTotal)}</span>
                                        </div>
                                        <div className="border-t pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700">Subtotal:</span>
                                                <span className="font-semibold">{money(totalSubTotal)}</span>
                                            </div>
                                        </div>

                                        {/* Tax, Discount, Shipping */}
                                        <div className="space-y-2 border-t pt-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">TAX:</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="input input-bordered input-xs w-20 text-right"
                                                        value={taxRate}
                                                        onChange={(e) => setTaxRate(n(e.target.value))}
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.1"
                                                    />
                                                    <span className="text-xs text-gray-500">%</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">DISCOUNT:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">৳</span>
                                                    <input
                                                        type="number"
                                                        className="input input-bordered input-xs w-20 text-right"
                                                        value={discountValue}
                                                        onChange={(e) => setDiscountValue(n(e.target.value))}
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">SHIPPING:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">৳</span>
                                                    <input
                                                        type="number"
                                                        className="input input-bordered input-xs w-20 text-right"
                                                        value={shippingValue}
                                                        onChange={(e) => setShippingValue(n(e.target.value))}
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grand Total */}
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-center text-lg font-bold">
                                                <span>GRAND TOTAL:</span>
                                                <span>{money(grandTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Card */}
                            <div className="card border border-gray-800 bg-[#1e4d2b] text-white rounded-2xl shadow-lg">
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <CreditCard size={20} /> Payment Details
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={manualPaymentOverride ? disableManualPaymentOverride : enableManualPaymentOverride}
                                            className="btn btn-xs bg-red-600 hover:bg-red-700 border-none text-white font-bold"
                                        >
                                            {manualPaymentOverride ? <X size={12} /> : <Edit size={12} />}
                                            {manualPaymentOverride ? "Cancel" : "Edit"}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Payment Status Dropdown */}
                                        <div className="form-control">
                                            <label className="label py-0">
                                                <span className="label-text text-sm text-gray-300">Payment Status *</span>
                                            </label>
                                            <select
                                                className="select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white"
                                                value={paymentStatus}
                                                onChange={(e) => handlePaymentStatusChange(e.target.value)}
                                            >
                                                <option value="unpaid">Unpaid</option>
                                                <option value="partial">Partial</option>
                                                <option value="paid">Paid</option>
                                            </select>
                                        </div>

                                        {/* Account Selection */}
                                        <div className="form-control">
                                            <label className="label py-0">
                                                <span className="label-text text-sm text-gray-300">Payment Account *</span>
                                            </label>
                                            <select
                                                className="select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white"
                                                value={selectedAccount}
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                                required={paymentStatus !== "unpaid"}
                                                disabled={isAccountDisabled}
                                            >
                                                <option value="">Select Account</option>
                                                {accounts.map((account) => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name} — ৳{formatCurrency(account.current_balance)}
                                                    </option>
                                                ))}
                                            </select>
                                            {isAccountDisabled && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Account selection is disabled for unpaid status
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Account Info */}
                                        {selectedAccountObj && !isAccountDisabled && (
                                            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {getAccountIcon(selectedAccountObj.type)}
                                                        <span className="font-medium">{selectedAccountObj.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-400">Balance</div>
                                                        <div className="text-sm font-bold">
                                                            ৳{formatCurrency(selectedAccountObj.current_balance)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Paid Amount Input */}
                                        <div className="form-control">
                                            <label className="label py-0">
                                                <span className="label-text text-sm text-gray-300">Paid Amount</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input input-bordered w-full bg-gray-800 border-gray-700"
                                                value={paidAmount}
                                                onChange={(e) => handlePaidAmountChange(e.target.value)}
                                                disabled={!manualPaymentOverride && paymentStatus === "unpaid"}
                                                min={0}
                                                max={grandTotal}
                                            />
                                        </div>

                                        {/* Payment Summary */}
                                        <div className="space-y-2 pt-3 border-t border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300">Grand Total:</span>
                                                <span className="font-bold">৳{formatCurrency(grandTotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300">Paid Amount:</span>
                                                <span className="font-bold text-green-400">৳{formatCurrency(paidAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300">Due Amount:</span>
                                                <span className="font-bold text-red-400">৳{formatCurrency(dueAmount)}</span>
                                            </div>
                                        </div>

                                        {/* Partial Payment Indicator */}
                                        {paymentStatus === "partial" && (
                                            <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                                                <div className="flex items-center justify-center">
                                                    <span className="text-yellow-300 text-sm font-medium">Partial Payment Active</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Unpaid Status Indicator */}
                                        {paymentStatus === "unpaid" && (
                                            <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded-lg">
                                                <div className="flex items-center justify-center">
                                                    <span className="text-red-300 text-sm font-medium">Unpaid - No Account Required</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    className="btn text-white w-full btn-lg"
                                    style={{ backgroundColor: "#1e4d2b" }}
                                    disabled={form.processing || (!cart.length && !pickupItems.length)}
                                >
                                    {form.processing ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        "Complete Sale"
                                    )}
                                </button>

                                <button type="button" className="btn btn-outline w-full" onClick={() => router.visit(route("sales.index"))}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* RIGHT COLUMN - Checkout Sections (4 columns) */}

                    <div className="lg:col-span-8">
                        <div className="card border border-gray-200 rounded-2xl shadow-sm">
                            <div className="card-body p-4">
                                <div className="flex flex-col md:flex-row  justify-between gap-2 mb-4">
                                    <h2 className="text-lg font-bold">Product Catalog</h2>
                                    <div className=" items-right text-right gap-2">
                                        <div className="join mb-2">
                                            <select
                                                className="select select-bordered join-item"
                                                value={categoryFilter}
                                                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                                            >
                                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>

                                            <select
                                                className="select select-bordered join-item"
                                                value={brandFilter}
                                                onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
                                            >
                                                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>

                                            <button
                                                type="button"
                                                className="btn btn-outline ml-4"
                                                onClick={() => { setSearch(""); setCategoryFilter("All Categories"); setBrandFilter("All Brands"); setPage(1); }}
                                                title="Reset"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>

                                        <div className="relative flex-1 md:flex-none">
                                            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                className="input input-bordered w-full md:w-64 pl-10"
                                                placeholder="Search products..."
                                                value={search}
                                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                            />

                                        
                                        </div>


                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                                    {pagedCatalog.map((p) => (
                                        <div key={p.id} className="card card-compact border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                            <figure className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {p.image ? (
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        className="h-full w-full object-contain p-3"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = "/media/uploads/logo.png";
                                                        }}
                                                    />
                                                ) : (
                                                     <img
                                                        src= "/media/uploads/logo.png"
                                                        alt={p.name}
                                                        className="h-full w-full object-contain p-3"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = "/media/uploads/logo.png";
                                                        }}
                                                    />
                                                )}
                                            </figure>
                                            <div className="card-body p-4">
                                                <h3 className="card-title text-sm font-semibold line-clamp-2 h-12">{p.name}</h3>
                                                <div className="text-xs text-gray-500 mb-2">
                                                    {p.product_no || "—"} • {p.category_name}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div>
                                                        <div className="text-lg font-bold text-primary">{money(p.minPrice ?? 0)}</div>
                                                        <div className="text-xs text-success font-medium">
                                                            Stock: {formatCurrency(p.totalStock)} pc
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-circle btn-primary btn-sm"
                                                        onClick={() => addToCart(p)}
                                                        title="Add to cart"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredCatalog.length)} of {filteredCatalog.length} products
                                    </div>
                                    <div className="join">
                                        <button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                            <ChevronLeft size={16} /> Prev
                                        </button>
                                        <button className="join-item btn btn-sm btn-active">{page}</button>
                                        <button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {Object.keys(form.errors || {}).length > 0 && (
                    <div className="mt-4 alert alert-error">
                        <div>
                            <div className="font-bold">Validation error</div>
                            <div className="text-sm opacity-90">{Object.values(form.errors).slice(0, 3).join(" | ")}</div>
                        </div>
                    </div>
                )}
            </form>

            {/* Pickup Modal */}
            {showPickupModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingBag size={20} /> Add Pickup Item
                            </h3>
                            <button onClick={() => setShowPickupModal(false)} className="btn btn-sm btn-circle btn-ghost">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        required
                                    />
                                </div>

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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Cost Price (৳)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupUnitPrice}
                                        onChange={(e) => setPickupUnitPrice(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Sale Price (৳) *</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={pickupSalePrice}
                                        onChange={(e) => setPickupSalePrice(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Total Amount</span>
                                </label>
                                <div className="input input-bordered bg-gray-100">
                                    ৳{formatCurrency(pickupQuantity * pickupSalePrice)}
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button onClick={() => setShowPickupModal(false)} className="btn btn-ghost">
                                Cancel
                            </button>
                            <button onClick={addPickupItem} className="btn btn-primary">
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
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Store size={20} /> Add New Supplier
                            </h3>
                            <button onClick={() => setShowSupplierModal(false)} className="btn btn-sm btn-circle btn-ghost">
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
                                    required
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Address</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered"
                                    value={newSupplierAddress}
                                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                                    placeholder="Enter supplier address"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button onClick={() => setShowSupplierModal(false)} className="btn btn-ghost">
                                Cancel
                            </button>
                            <button onClick={createNewSupplier} className="btn btn-primary">
                                Create Supplier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}