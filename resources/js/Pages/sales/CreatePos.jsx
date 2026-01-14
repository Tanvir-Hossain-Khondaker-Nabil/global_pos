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
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

export default function AddSale({ customers = [], productstocks = [], suppliers = [], accounts = [] }) {
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const formatCurrency = (v) => n(v).toFixed(2);
    const money = (v) => `৳${formatCurrency(v)}`;

    // ✅ catalog from stocks (FIX IMAGE HERE)
    const catalog = useMemo(() => {
        const map = new Map();

        for (const s of productstocks || []) {
            if (!s?.product || n(s?.quantity) <= 0) continue;

            const p = s.product;
            const pid = p.id;

            if (!map.has(pid)) {
                const img =
                    p.photo ? `/storage/${p.photo}` :
                        p.photo_url ? p.photo_url :
                            p.image_url ? p.image_url :
                                p.image ? p.image :
                                    null;

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

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Categories");
    const [brandFilter, setBrandFilter] = useState("All Brands");

    const [page, setPage] = useState(1);
    const pageSize = 8;

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

    // cart
    const [cart, setCart] = useState([]);
    const cartCount = cart.reduce((a, i) => a + n(i.qty), 0);

    const [taxRate, setTaxRate] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);
    const [shippingValue, setShippingValue] = useState(0);
    const [points, setPoints] = useState(0);

    const [selectedAccount, setSelectedAccount] = useState("");

    // ✅ Walk-in: customerId empty string
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    const selectedCustomer = useMemo(() => {
        if (!customerId) return null;
        return customers.find((c) => String(c.id) === String(customerId)) || null;
    }, [customers, customerId]);

    useEffect(() => {
        if (!selectedCustomer) return;
        setCustomerName(selectedCustomer.customer_name || "");
        setCustomerPhone(selectedCustomer.phone || "");
    }, [selectedCustomer]);

    const subTotal = useMemo(() => cart.reduce((sum, i) => sum + n(i.qty) * n(i.unit_price), 0), [cart]);
    const taxAmount = useMemo(() => (subTotal * n(taxRate)) / 100, [subTotal, taxRate]);
    const grandTotal = useMemo(
        () => subTotal + taxAmount - n(discountValue) + n(shippingValue),
        [subTotal, taxAmount, discountValue, shippingValue]
    );

    const paidAmount = useMemo(() => grandTotal, [grandTotal]);
    const dueAmount = useMemo(() => Math.max(0, grandTotal - paidAmount), [grandTotal, paidAmount]);

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

    const form = useForm({
        customer_id: null,
        customer_name: null,
        phone: null,
        sale_date: new Date().toISOString().split("T")[0],
        notes: "",
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

        // ✅ Walk-in: if no customerId AND no typed name/phone => send nulls
        const walkIn = !customerId && !customerName.trim() && !customerPhone.trim();

        form.setData({
            ...form.data,
            customer_id: customerId ? customerId : null,
            customer_name: walkIn ? null : (customerId ? null : (customerName.trim() || null)),
            phone: walkIn ? null : (customerId ? null : (customerPhone.trim() || null)),
            items: formattedItems,
            vat_rate: n(taxRate),
            discount_rate: 0,
            paid_amount: n(paidAmount),
            grand_amount: n(grandTotal),
            due_amount: n(dueAmount),
            sub_amount: n(subTotal),
            type: "pos",
            account_id: selectedAccount || "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, customerId, customerName, customerPhone, taxRate, subTotal, grandTotal, paidAmount, dueAmount, selectedAccount]);

    const submit = (e) => {
        e.preventDefault();

        if (!cart.length) return alert("Add at least 1 product");
        if (!selectedAccount) return alert("Select a payment account");

        // ✅ If they typed one of name/phone, require both (not for walk-in)
        const hasOne = (!!customerName.trim() && !customerPhone.trim()) || (!customerName.trim() && !!customerPhone.trim());
        if (!customerId && hasOne) return alert("If you type customer info, provide both Name and Phone. Otherwise keep walk-in empty.");

        form.post(route("sales.store"), {
            onSuccess: () => router.visit(route("sales.index")),
            onError: (errors) => {
                console.error(errors);
                alert(errors?.error || "Sale create failed. Check fields.");
            },
        });
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader title="POS Checkout" subtitle="Create sale with modern POS layout">
                <button onClick={() => router.visit(route("sales.index"))} className="btn btn-sm btn-ghost">
                    <ArrowLeft size={15} /> Back
                </button>
            </PageHeader>

            <form onSubmit={submit} className="mt-4">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* LEFT */}
                    <div className="xl:col-span-4">
                        <div className="card border border-gray-200 rounded-2xl shadow-sm">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold">Checkout</h2>
                                    <span className="text-xs text-gray-500">Items: {cartCount}</span>
                                </div>

                                <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden">
                                    {!cart.length ? (
                                        <div className="py-12 text-center bg-white">
                                            <div className="font-medium text-gray-500">No items added</div>
                                            <div className="text-sm text-gray-400 mt-1">Select products from the right panel</div>
                                        </div>
                                    ) : (
                                        <div className="max-h-[260px] overflow-y-auto">
                                            {cart.map((i) => (
                                                <div key={i.key} className="p-3 border-b last:border-b-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="font-semibold truncate">{i.name}</div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {i.code ? `#${i.code} • ` : ""} {i.variant_label}
                                                                {i.batch_no ? ` • Batch: ${i.batch_no}` : ""}
                                                            </div>

                                                            <div className="mt-2 flex items-center gap-2">
                                                                <button type="button" className="btn btn-xs btn-outline" onClick={() => changeQty(i.key, n(i.qty) - 1)}>
                                                                    <Minus size={14} />
                                                                </button>

                                                                <input
                                                                    className="input input-bordered input-xs w-14 text-center"
                                                                    type="number"
                                                                    min={1}
                                                                    max={i.maxQty}
                                                                    value={i.qty}
                                                                    onChange={(e) => changeQty(i.key, e.target.value)}
                                                                />

                                                                <button type="button" className="btn btn-xs btn-outline" onClick={() => changeQty(i.key, n(i.qty) + 1)}>
                                                                    <Plus size={14} />
                                                                </button>

                                                                <span className="text-xs text-gray-500 ml-1">max {i.maxQty}</span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <div className="font-semibold">{money(n(i.unit_price) * n(i.qty))}</div>
                                                            <div className="text-xs text-gray-500">{money(i.unit_price)} each</div>

                                                            <button type="button" className="btn btn-ghost btn-xs text-red-600 mt-2" onClick={() => removeCartItem(i.key)}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden">
                                    <RowNumber label="TAX" rightUnit="%" value={taxRate} onChange={setTaxRate} placeholder="0" />
                                    <RowNumber label="DISCOUNT" rightUnit="৳" value={discountValue} onChange={setDiscountValue} placeholder="0" />
                                    <RowNumber label="SHIPPING" rightUnit="৳" value={shippingValue} onChange={setShippingValue} placeholder="0" />
                                </div>

                                <div className="mt-4 border border-gray-200 rounded-2xl p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">Available Points</div>
                                        <div className="font-bold">{n(points)}</div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <input className="input input-bordered w-full" type="number" min={0} value={points} onChange={(e) => setPoints(n(e.target.value))} />
                                        <button type="button" className="btn btn-outline">Convert</button>
                                    </div>
                                </div>

                                <div className="mt-4 border-t pt-4 space-y-2 text-sm">
                                    <Line label="SUBTOTAL" value={money(subTotal)} />
                                    <Line label="TAX" value={money(taxAmount)} />
                                    <Line label="DISCOUNT" value={`-${money(discountValue)}`} danger />
                                    <Line label="SHIPPING" value={money(shippingValue)} />
                                    <div className="pt-2 border-t flex items-center justify-between text-base font-bold">
                                        <span>TOTAL</span>
                                        <span>{money(grandTotal)}</span>
                                    </div>
                                </div>

                                {/* ✅ Walk-in customer */}
                                <div className="mt-4 grid grid-cols-1 gap-3">
                                    <select
                                        className="select select-bordered"
                                        value={customerId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomerId(val);

                                            if (!val) {
                                                // walk-in: keep fields empty by default
                                                setCustomerName("");
                                                setCustomerPhone("");
                                            }
                                        }}
                                    >
                                        <option value="">Walk In Customer</option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.customer_name} ({c.phone})
                                            </option>
                                        ))}
                                    </select>

                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            className="input input-bordered"
                                            placeholder="Customer name (optional for walk-in)"
                                            value={customerName}
                                            onChange={(e) => {
                                                setCustomerName(e.target.value);
                                                if (customerId) setCustomerId("");
                                            }}
                                        />
                                        <input
                                            className="input input-bordered"
                                            placeholder="Phone (optional for walk-in)"
                                            value={customerPhone}
                                            onChange={(e) => {
                                                setCustomerPhone(e.target.value);
                                                if (customerId) setCustomerId("");
                                            }}
                                        />
                                    </div>

                                    <select className="select select-bordered" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} required>
                                        <option value="">Select Payment Account</option>
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} ({a.type}) - Bal: ৳{formatCurrency(a.current_balance)}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="submit"
                                        className="btn text-white w-full"
                                        style={{ backgroundColor: "#1e4d2b" }}
                                        disabled={form.processing || !cart.length}
                                    >
                                        {form.processing ? "Processing..." : "Complete Sale"}
                                    </button>

                                    <button type="button" className="btn btn-ghost w-full" onClick={() => router.visit(route("sales.index"))}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="xl:col-span-8">
                        <div className="card border border-gray-200 rounded-2xl shadow-sm">
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <h2 className="text-lg font-bold">Available Products</h2>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="join">
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
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => { setSearch(""); setCategoryFilter("All Categories"); setBrandFilter("All Brands"); setPage(1); }}
                                            title="Reset"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            className="input input-bordered w-full pl-10"
                                            placeholder="Search products..."
                                            value={search}
                                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pagedCatalog.map((p) => (
                                        <div key={p.id} className="border border-gray-500 rounded-2xl overflow-hidden bg-white">
                                            <div className="h-24  flex items-center justify-center overflow-hidden">
                                                {p.image ? (
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        className="h-full w-full object-contain p-2"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = "/images/placeholder.png";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-gray-300 text-xs">No Image</div>
                                                )}
                                            </div>

                                            <div className="p-3">
                                                <div className="font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{p.product_no || "—"}</div>

                                                <div className="text-sm mt-2 text-emerald-600 font-medium">
                                                    {formatCurrency(p.totalStock)} pc
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="text-lg font-bold text-indigo-600">{money(p.minPrice ?? 0)}</div>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-circle"
                                                        style={{ backgroundColor: "rgba(99,102,241,0.12)" }}
                                                        onClick={() => addToCart(p)}
                                                        title="Add"
                                                    >
                                                        <Plus size={18} className="text-indigo-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-4">
                                    <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                        <ChevronLeft size={16} />
                                    </button>

                                    <div className="text-center">
                                        <div className="font-semibold">Page {page}</div>
                                        <div className="text-xs text-gray-500">{filteredCatalog.length} products</div>
                                    </div>

                                    <button type="button" className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                <div className="mt-2 text-center text-xs text-gray-400">
                                    Tip: add products with the <span className="font-semibold">+</span> button
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
        </div>
    );
}

function Line({ label, value, danger }) {
    return (
        <div className={`flex items-center justify-between ${danger ? "text-red-600" : ""}`}>
            <span className="tracking-wide text-gray-600">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function RowNumber({ label, value, onChange, rightUnit, placeholder }) {
    return (
        <div className="flex items-center justify-between p-3 border-b last:border-b-0">
            <div className="text-sm font-semibold text-gray-600 tracking-wide">{label}</div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="number"
                        className="input input-bordered input-sm w-24 text-right pr-8"
                        value={Number.isFinite(Number(value)) ? value : 0}
                        onChange={(e) => onChange(Number(e.target.value) || 0)}
                        placeholder={placeholder || "0"}
                        min={0}
                        step="0.01"
                    />
                    <div className="absolute right-2 top-[7px] text-xs text-gray-400">{rightUnit}</div>
                </div>
            </div>
        </div>
    );
}
