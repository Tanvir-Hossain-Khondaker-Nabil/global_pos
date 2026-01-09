import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  DollarSign,
  ShoppingBag,
  X,
  CreditCard,
  Landmark,
  Smartphone,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { Html5QrcodeScanner } from "html5-qrcode";

/**
 * Camera Scanner Modal (Barcode/QR both)
 */
function CameraBarcodeScanner({ open, onClose, onResult }) {
  useEffect(() => {
    if (!open) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 280, height: 180 } },
      false
    );

    scanner.render(
      (decodedText) => {
        onResult(decodedText);
        scanner.clear().catch(() => {});
        onClose();
      },
      () => {
        // ignore continuous scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [open, onClose, onResult]);

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Scan Barcode (Camera)</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          Camera permission allow করুন। Barcode/QR ক্যামেরার সামনে ধরুন।
        </div>

        <div id="reader" className="w-full" />

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddSale({ customers, productstocks, suppliers, accounts }) {
  const { t, locale } = useTranslation();

  const [selectedItems, setSelectedItems] = useState([]);
  const [pickupItems, setPickupItems] = useState([]);

  // Search & dropdown flow (existing)
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableVariants, setAvailableVariants] = useState([]);

  // totals
  const [vatRate, setVatRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [shadowPaidAmount, setShadowPaidAmount] = useState(0);

  // payment & customer
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [manualPaymentOverride, setManualPaymentOverride] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [usePartialPayment, setUsePartialPayment] = useState(false);
  const [adjustFromAdvance, setAdjustFromAdvance] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [availableAdvance, setAvailableAdvance] = useState(0);

  // pickup modal + supplier modal
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

  // ✅ Barcode Scan (camera + manual)
  const [showCameraScan, setShowCameraScan] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanLoading, setScanLoading] = useState(false);

  const form = useForm({
    customer_id: "",
    customer_name: "",
    phone: "",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
    vat_rate: 0,
    discount_rate: 0,
    paid_amount: 0,
    grand_amount: 0,
    due_amount: 0,
    sub_amount: 0,
    type: "inventory",
    use_partial_payment: false,
    adjust_from_advance: false,
    advance_adjustment: 0,
    pickup_items: [],
    supplier_id: null,
    payment_status: "unpaid",
    account_id: 0,
  });

  // ---------- helpers ----------
  const formatCurrency = (value) => {
    const numValue = Number(value) || 0;
    return numValue.toFixed(2);
  };

  const formatWithSymbol = (value) => `৳${formatCurrency(value)}`;

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

  // ---------- totals ----------
  const calculateRealSubTotal = useCallback(() => {
    if (!selectedItems?.length) return 0;
    return selectedItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  }, [selectedItems]);

  const calculatePickupSubTotal = useCallback(() => {
    if (!pickupItems?.length) return 0;
    return pickupItems.reduce((total, item) => total + (Number(item.quantity) * Number(item.sale_price)), 0);
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
    return subtotal + calculateVatAmount() - calculateDiscountAmount();
  }, [calculateTotalSubTotal, calculateVatAmount, calculateDiscountAmount]);

  const calculateDueAmount = useCallback(() => {
    const grandTotal = calculateGrandTotal();
    const paid = Number(paidAmount) || 0;
    return Math.max(0, grandTotal - paid);
  }, [calculateGrandTotal, paidAmount]);

  // ---------- products from stocks ----------
  const allProducts = useMemo(() => {
    if (!productstocks?.length) return [];
    const productMap = new Map();

    productstocks.forEach((stock) => {
      if (!stock.product) return;
      const productId = stock.product.id;

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          ...stock.product,
          totalStock: Number(stock.quantity) || 0,
          variantsCount: 1,
          stocks: [stock],
        });
      } else {
        const existing = productMap.get(productId);
        existing.totalStock += Number(stock.quantity) || 0;
        existing.variantsCount += 1;
        existing.stocks.push(stock);
      }
    });

    return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [productstocks]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setFilteredProducts(allProducts);
      return;
    }
    const searchTerm = productSearch.toLowerCase();
    const filtered = allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.product_no?.toLowerCase().includes(searchTerm) ||
        product.code?.toLowerCase().includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [productSearch, allProducts]);

  const getBrandsForProduct = (productId) => {
    if (!productstocks || !productId) return [];
    const brandSet = new Set();

    productstocks
      .filter((stock) => stock.product?.id === productId && stock.quantity > 0)
      .forEach((stock) => {
        const variant = stock.variant;
        if (variant?.attribute_values && typeof variant.attribute_values === "object") {
          Object.keys(variant.attribute_values).forEach((key) => brandSet.add(key));
        }
      });

    return Array.from(brandSet).sort();
  };

  const getVariantsForBrand = (productId, brandName) => {
    if (!productstocks || !productId) return [];
    const variants = [];

    productstocks
      .filter((stock) => stock.product?.id === productId && stock.quantity > 0)
      .forEach((stock) => {
        const variant = stock.variant;
        if (variant?.attribute_values && typeof variant.attribute_values === "object") {
          if (!brandName || variant.attribute_values[brandName]) {
            const existingVariant = variants.find((v) => v.variant?.id === variant.id);
            if (!existingVariant) {
              variants.push({
                variant,
                stocks: [stock],
                totalQuantity: Number(stock.quantity) || 0,
                batch_no: stock.batch_no,
                sale_price: stock.sale_price,
                shadow_sale_price: stock.shadow_sale_price,
              });
            } else {
              existingVariant.stocks.push(stock);
              existingVariant.totalQuantity += Number(stock.quantity) || 0;
            }
          }
        }
      });

    return variants.sort((a, b) => b.totalQuantity - a.totalQuantity);
  };

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

  const goBackToBrands = () => {
    setSelectedBrand(null);
    setAvailableVariants([]);
    setShowVariantDropdown(false);
    setShowBrandDropdown(true);
  };

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
      const variants = getVariantsForBrand(product.id, "");
      setAvailableVariants(variants);
      setShowVariantDropdown(true);
      setShowProductDropdown(false);
    }
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    const variants = getVariantsForBrand(selectedProduct.id, brand);
    setAvailableVariants(variants);
    setShowBrandDropdown(false);
    setShowVariantDropdown(true);
    setProductSearch(`${selectedProduct.name} - ${brand}`);
  };

  const handleVariantSelect = (variantWithStocks) => {
    const { variant, stocks, totalQuantity, sale_price, shadow_sale_price } = variantWithStocks;
    const availableStock = stocks.find((s) => s.quantity > 0) || stocks[0];
    if (!availableStock) return;

    const salePrice = Number(sale_price) || Number(availableStock.sale_price) || 0;
    const shadowSalePrice = Number(shadow_sale_price) || Number(availableStock.shadow_sale_price) || 0;

    const itemKey = `${selectedProduct.id}-${variant.id}-${availableStock.batch_no || "default"}`;

    const existingItem = selectedItems.find((item) => item.uniqueKey === itemKey);

    if (existingItem) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.uniqueKey === itemKey
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          uniqueKey: itemKey,
          product_id: selectedProduct.id,
          variant_id: variant.id,
          batch_no: availableStock.batch_no,
          product_name: selectedProduct.name,
          variant_attribute: selectedBrand || Object.keys(variant.attribute_values || {})[0] || "Default",
          product_code: selectedProduct.product_no || "",
          variant_value: selectedBrand
            ? variant.attribute_values?.[selectedBrand] || "Default"
            : Object.values(variant.attribute_values || {})[0] || "Default",
          quantity: 1,
          sku: variant.sku || "Default SKU",
          stockQuantity: totalQuantity,
          stockId: availableStock.id,
          unit_price: salePrice,
          sell_price: salePrice,
          total_price: salePrice,
          shadow_sell_price: shadowSalePrice,
        },
      ]);
    }

    resetSelectionFlow();
  };

  // ---------- customer ----------
  const handleCustomerSelect = (customerId) => {
    if (customerId === "new") {
      setSelectedCustomer(null);
      setCustomerNameInput("");
      setCustomerPhoneInput("");
      setAvailableAdvance(0);
      form.setData({
        ...form.data,
        customer_id: "",
        customer_name: "",
        phone: "",
      });
      setPaymentStatus("unpaid");
      setPaidAmount(0);
      setAdjustFromAdvance(false);
      setManualPaymentOverride(false);
    } else {
      form.setData("customer_id", customerId);
      const customer = customers.find((c) => c.id === parseInt(customerId));
      setSelectedCustomer(customer || null);

      if (customer) {
        setCustomerNameInput(customer.customer_name);
        setCustomerPhoneInput(customer.phone);
        const advance = parseFloat(customer.advance_amount) || 0;
        const due = parseFloat(customer.due_amount) || 0;
        setAvailableAdvance(advance - due);
        form.setData({
          ...form.data,
          customer_id: customer.id,
          customer_name: customer.customer_name,
          phone: customer.phone,
        });
      }

      if (!customerId) {
        setPaymentStatus("unpaid");
        setPaidAmount(0);
        setAdjustFromAdvance(false);
        setManualPaymentOverride(false);
      }
    }
  };

  const handleCustomerNameChange = (value) => {
    setCustomerNameInput(value);
    form.setData("customer_name", value);
    if (value && selectedCustomer && value !== selectedCustomer.customer_name) {
      setSelectedCustomer(null);
      form.setData("customer_id", "");
      setAvailableAdvance(0);
    }
  };

  const handleCustomerPhoneChange = (value) => {
    setCustomerPhoneInput(value);
    form.setData("phone", value);
    if (value && selectedCustomer && value !== selectedCustomer.phone) {
      setSelectedCustomer(null);
      form.setData("customer_id", "");
      setAvailableAdvance(0);
    }
  };

  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);
    const grandTotal = calculateGrandTotal();

    if (status === "paid") {
      setPaidAmount(grandTotal);
      setManualPaymentOverride(false);
      setAdjustFromAdvance(false);
    } else if (status === "unpaid") {
      setPaidAmount(0);
      setManualPaymentOverride(false);
      setAdjustFromAdvance(false);
    } else if (status === "partial") {
      setManualPaymentOverride(true);
      setAdjustFromAdvance(false);
    }
  };

  const handleManualPaymentInput = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const grandTotal = calculateGrandTotal();
    setPaidAmount(value);
    if (value === 0) setPaymentStatus("unpaid");
    else if (value >= grandTotal) setPaymentStatus("paid");
    else setPaymentStatus("partial");
  };

  const enableManualPaymentOverride = () => {
    setManualPaymentOverride(true);
    setAdjustFromAdvance(false);
  };

  const disableManualPaymentOverride = () => {
    setManualPaymentOverride(false);
    const grandTotal = calculateGrandTotal();
    setPaidAmount(grandTotal);
    setPaymentStatus("paid");
  };

  useEffect(() => {
    if (!usePartialPayment) {
      const grandTotal = calculateGrandTotal();
      setPaidAmount(grandTotal);
    }
  }, [usePartialPayment, calculateGrandTotal]);

  // adjust from advance auto
  useEffect(() => {
    if (adjustFromAdvance && availableAdvance > 0 && !manualPaymentOverride) {
      const grandTotal = calculateGrandTotal();
      const maxAdjustable = Math.min(availableAdvance, grandTotal);

      if (paidAmount === 0 || paidAmount > grandTotal) {
        const autoPaidAmount = Math.min(maxAdjustable, grandTotal);
        setPaidAmount(autoPaidAmount);
        if (autoPaidAmount >= grandTotal) setPaymentStatus("paid");
        else if (autoPaidAmount > 0) setPaymentStatus("partial");
        else setPaymentStatus("unpaid");
      }
    }
  }, [adjustFromAdvance, availableAdvance, calculateGrandTotal, manualPaymentOverride, paidAmount]);

  // ---------- account ----------
  const handleAccountSelect = (accountId) => {
    const id = accountId ? parseInt(accountId) : "";
    setSelectedAccount(id);
    form.setData("account_id", id);
  };

  // ---------- pickup ----------
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
    const numValue = field === "quantity" ? parseInt(value) || 0 : parseFloat(value) || 0;

    updated[index][field] = numValue;

    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? numValue : updated[index].quantity;
      const unitPrice = field === "unit_price" ? numValue : updated[index].unit_price;
      updated[index].total_price = quantity * unitPrice;
    }

    setSelectedItems(updated);
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    form.setData("supplier_id", supplier.id);
    setShowSupplierModal(false);
  };

  const createNewSupplier = async () => {
    if (!newSupplierName || !newSupplierPhone) {
      alert("Supplier name and phone are required");
      return;
    }

    try {
      const response = await fetch(route("supplier.store"), {
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
          is_active: true,
          _token: document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedSupplier(data.supplier || data.data);
        form.setData("supplier_id", data.supplier?.id || data.data?.id);
        setShowSupplierModal(false);
        setNewSupplierName("");
        setNewSupplierCompany("");
        setNewSupplierPhone("");
        window.location.reload();
      } else {
        alert(data.message || "Error creating supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("Network error creating supplier");
    }
  };

  // ---------- ✅ barcode scan -> add to cart ----------
  /**
   * backend return should include:
   *  - product_id, variant_id, stock_id, batch_no, sku, product_name, product_no, sale_price, shadow_sale_price, available_qty
   *
   * example JSON:
   * { success:true, data:{ product_id:1, variant_id:2, stock_id:9, batch_no:"B-001", sku:"SKU1", product_name:"Soap", product_no:"P-01", sale_price:50, shadow_sale_price:45, available_qty:10, variant_attribute:"Color", variant_value:"Red" } }
   */
  const addScannedStockToCart = (payload) => {
    if (!payload?.product_id || !payload?.variant_id || !payload?.stock_id) {
      alert("Invalid scan response. product/variant/stock missing.");
      return;
    }

    const itemKey = `${payload.product_id}-${payload.variant_id}-${payload.batch_no || payload.stock_id || "default"}`;

    const existingItem = selectedItems.find((i) => i.uniqueKey === itemKey);

    const unitPrice = Number(payload.sale_price) || 0;
    const shPrice = Number(payload.shadow_sale_price) || unitPrice;

    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.uniqueKey === itemKey
            ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
            : i
        )
      );
      return;
    }

    setSelectedItems([
      ...selectedItems,
      {
        uniqueKey: itemKey,
        product_id: payload.product_id,
        variant_id: payload.variant_id,
        batch_no: payload.batch_no || "N/A",
        product_name: payload.product_name || "N/A",
        variant_attribute: payload.variant_attribute || "Attribute",
        product_code: payload.product_no || "",
        variant_value: payload.variant_value || "Default",
        quantity: 1,
        sku: payload.sku || "N/A",
        stockQuantity: Number(payload.available_qty) || 0,
        stockId: payload.stock_id,
        unit_price: unitPrice,
        sell_price: unitPrice,
        total_price: unitPrice,
        shadow_sell_price: shPrice,
      },
    ]);
  };

  const scanByBarcode = async (code) => {
    const barcode = String(code || "").trim();
    if (!barcode) return;

    setScanLoading(true);
    try {
      // ✅ route name: sales.scan.barcode
      const res = await fetch(route("sales.scan.barcode", barcode), {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        alert(json?.message || "Barcode not found!");
        return;
      }

      addScannedStockToCart(json.data);
      setBarcodeInput("");
    } catch (e) {
      console.error(e);
      alert("Scan failed. Check console / route conflict.");
    } finally {
      setScanLoading(false);
    }
  };

  // ---------- sync form data ----------
  useEffect(() => {
    const realSubTotal = calculateRealSubTotal();
    const pickupSubTotal = calculatePickupSubTotal();
    const totalSubTotal = calculateTotalSubTotal();
    const grandTotal = calculateGrandTotal();
    const dueAmount = calculateDueAmount();

    let advanceAdjustment = 0;
    if (adjustFromAdvance && availableAdvance > 0) {
      const maxAdjustable = Math.min(availableAdvance, grandTotal);
      const paidWithAdvance = Math.min(parseFloat(paidAmount) || 0, maxAdjustable);
      advanceAdjustment = Math.min(paidWithAdvance, maxAdjustable);
    }

    const formattedItems = selectedItems.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      stock_id: item.stockId,
      batch_no: item.batch_no,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      shadow_sell_price: item.shadow_sell_price,
    }));

    const formattedPickupItems = pickupItems.map((item) => ({
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
      type: "inventory",
      use_partial_payment: usePartialPayment,
      adjust_from_advance: adjustFromAdvance,
      advance_adjustment: advanceAdjustment,
      supplier_id: selectedSupplier ? selectedSupplier.id : null,
      payment_status: paymentStatus,
      account_id: selectedAccount,
      customer_name: customerNameInput,
      phone: customerPhoneInput,
    });
  }, [
    selectedItems,
    pickupItems,
    vatRate,
    discountRate,
    paidAmount,
    shadowPaidAmount,
    usePartialPayment,
    adjustFromAdvance,
    availableAdvance,
    selectedSupplier,
    selectedAccount,
    paymentStatus,
    customerNameInput,
    customerPhoneInput,
    calculateRealSubTotal,
    calculatePickupSubTotal,
    calculateTotalSubTotal,
    calculateGrandTotal,
    calculateDueAmount,
  ]);

  // ---------- submit ----------
  const submit = (e) => {
    e.preventDefault();

    if (selectedItems.length === 0 && pickupItems.length === 0) {
      alert("Please add at least one product to the sale");
      return;
    }

    if (!form.data.customer_name || !form.data.phone) {
      alert("Please provide customer name and phone number");
      return;
    }

    if (!selectedAccount) {
      alert("Please select a payment account");
      return;
    }

    if (pickupItems.length > 0 && !selectedSupplier) {
      alert("Please select a supplier for pickup items");
      return;
    }

    form.post(route("sales.store"), {
      onSuccess: () => router.visit(route("sales.index")),
      onError: (errors) => {
        console.error(errors);
        alert(errors?.error || "Failed to create sale. Please check the form data.");
      },
    });
  };

  // totals computed
  const realSubTotal = calculateRealSubTotal();
  const pickupSubTotal = calculatePickupSubTotal();
  const totalSubTotal = calculateTotalSubTotal();
  const grandTotal = calculateGrandTotal();
  const dueAmount = calculateDueAmount();
  const vatAmount = calculateVatAmount();
  const discountAmount = calculateDiscountAmount();

  return (
    <div className="bg-white rounded-box p-5">
      <PageHeader title="Create New (Sale/Order)" subtitle="Add products to sale (Inventory System)">
        <button onClick={() => router.visit(route("sales.index"))} className="btn btn-sm btn-ghost">
          <ArrowLeft size={15} /> Back to List
        </button>
      </PageHeader>

      {/* ✅ Barcode Scan Bar */}
      <div className="border border-gray-200 rounded-box p-4 mb-5 bg-gray-50">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <div className="font-bold text-gray-800">Scan (Batch/Barcode) to auto add product</div>
            <div className="text-xs text-gray-500">
              Barcode value = batch_no (backend এ batch_no দিয়ে stock খুঁজে add হবে)
            </div>
          </div>

          <div className="flex gap-2">
            <input
              className="input input-bordered input-sm w-full md:w-64"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Type / paste barcode then Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  scanByBarcode(barcodeInput);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={scanLoading}
              onClick={() => scanByBarcode(barcodeInput)}
            >
              {scanLoading ? "Scanning..." : "Add"}
            </button>
            <button type="button" className="btn btn-sm bg-[#1e4d2b] text-white" onClick={() => setShowCameraScan(true)}>
              Camera Scan
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Camera Modal */}
      <CameraBarcodeScanner
        open={showCameraScan}
        onClose={() => setShowCameraScan(false)}
        onResult={(decoded) => scanByBarcode(decoded)}
      />

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* LEFT */}
          <div className="lg:col-span-1 space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Customer *</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedCustomer ? selectedCustomer.id : ""}
                onChange={(e) => handleCustomerSelect(e.target.value)}
              >
                <option value="">Select Existing Customer</option>
                <option value="new">+ New Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

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

                  {availableAdvance > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={12} className="text-green-500" />
                      <span>
                        <span className="font-medium">Available Advance:</span>
                        <span className="ml-1 font-bold text-green-600">৳{formatCurrency(availableAdvance)}</span>
                      </span>
                    </div>
                  )}
                </div>

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

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm">Manual Payment:</span>
                    <button
                      type="button"
                      onClick={manualPaymentOverride ? disableManualPaymentOverride : enableManualPaymentOverride}
                      className="btn btn-xs btn-outline"
                    >
                      {manualPaymentOverride ? "Disable" : "Enable"}
                    </button>
                  </div>

                  {adjustFromAdvance && availableAdvance > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-box">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> ৳{formatCurrency(Math.min(availableAdvance, calculateGrandTotal()))} will be
                        deducted from customer's advance balance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text">Customer Name *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={customerNameInput}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                required
              />
              {form.errors.customer_name && <div className="text-error text-sm mt-1">{form.errors.customer_name}</div>}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Customer Phone *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={customerPhoneInput}
                onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                required
              />
              {form.errors.phone && <div className="text-error text-sm mt-1">{form.errors.phone}</div>}
            </div>

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
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (Balance: {formatWithSymbol(account.current_balance)})
                  </option>
                ))}
              </select>

              {selectedAccount && (
                <div className="mt-2 text-xs">
                  {(() => {
                    const account = accounts.find((a) => a.id == selectedAccount);
                    if (!account) return null;
                    return (
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-box">
                        {getAccountIcon(account.type)}
                        <span className="font-bold">{account.name}</span>
                        <span className="ml-auto font-mono">{formatWithSymbol(account.current_balance)}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

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
                      const supplier = suppliers.find((s) => s.id == e.target.value);
                      if (supplier) handleSupplierSelect(supplier);
                    }}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.company ? `(${s.company})` : ""}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowSupplierModal(true)} className="btn btn-sm btn-outline">
                    <Plus size={14} />
                  </button>
                </div>
                {selectedSupplier && (
                  <div className="mt-2 text-sm bg-blue-50 p-2 rounded-box">
                    <span className="font-bold">{selectedSupplier.name}</span>
                    {selectedSupplier.company && <span className="text-gray-600"> ({selectedSupplier.company})</span>}
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

          {/* RIGHT */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Add Products to Sale</h3>
              <div className="text-sm text-gray-500">
                Stock Items: {selectedItems.length} | Pickup Items: {pickupItems.length}
              </div>
            </div>

            {/* Stock Products */}
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

              <div className="form-control mb-4 relative">
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full pr-10"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      if (e.target.value.trim() || allProducts.length > 0) setShowProductDropdown(true);
                    }}
                    onClick={() => {
                      if (allProducts.length > 0) setShowProductDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                    placeholder="Search products by name or SKU..."
                  />
                  <Search size={18} className="absolute right-3 top-3.5 text-gray-400" />
                  {productSearch && (
                    <button type="button" onClick={resetSelectionFlow} className="absolute right-10 top-3 text-gray-400 hover:text-error">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Product Dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                    <div className="bg-gray-100 p-2 sticky top-0 z-10">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Select Product ({filteredProducts.length})</h3>
                        <button type="button" onClick={() => setShowProductDropdown(false)} className="btn btn-ghost btn-xs">
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
                                <span>Code: {product.product_no || "N/A"}</span>
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
                        <button type="button" onClick={goBackToProducts} className="btn btn-ghost btn-xs">
                          <ArrowLeft size={12} />
                        </button>
                        <h3 className="text-sm font-semibold text-gray-700 flex-1">Select Brand for {selectedProduct?.name}</h3>
                        <button type="button" onClick={() => setShowBrandDropdown(false)} className="btn btn-ghost btn-xs">
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
                            <div className="text-xs text-gray-500">Click to view variants</div>
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
                        <button type="button" onClick={selectedBrand ? goBackToBrands : goBackToProducts} className="btn btn-ghost btn-xs">
                          <ArrowLeft size={12} />
                        </button>
                        <h3 className="text-sm font-semibold text-gray-700 flex-1">
                          {selectedBrand ? `Select ${selectedBrand} Variant` : `Select Variant for ${selectedProduct?.name}`}
                        </h3>
                        <button type="button" onClick={() => setShowVariantDropdown(false)} className="btn btn-ghost btn-xs">
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    {availableVariants.map((variantWithStocks) => {
                      const { variant, totalQuantity, sale_price, shadow_sale_price } = variantWithStocks;

                      const displayName = selectedBrand
                        ? variant.attribute_values?.[selectedBrand] || "Default"
                        : Object.values(variant.attribute_values || {})[0] || "Default";

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
                                  <span>SKU: {variant.sku || "N/A"}</span>
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

              {/* Selected stock items */}
              {selectedItems.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Stock Items ({selectedItems.length})</h3>

                  {selectedItems.map((item, index) => (
                    <div key={item.uniqueKey || index} className="border border-gray-300 rounded-box p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.product_name} ({item.product_code})
                          </h4>
                          <p className="text-sm text-gray-600">
                            <strong>Variant: </strong> Attribute: {item.variant_attribute} | Value: {item.variant_value}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Batch No: </strong> {item.batch_no} || <strong>Sku: </strong> {item.sku}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Available Stock: </strong> {item.stockQuantity} | <strong>Sale Price:</strong> ৳{formatCurrency(item.sell_price)}
                          </p>
                        </div>
                        <button type="button" onClick={() => removeItem(index)} className="btn btn-xs btn-error">
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Quantity *</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.stockQuantity}
                            className="input input-bordered input-sm"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            required
                          />
                          {item.quantity > item.stockQuantity && <div className="text-error text-xs mt-1">Exceeds available stock!</div>}
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Unit Price (৳)</span>
                          </label>
                          <input type="number" className="input input-bordered input-sm bg-gray-100" value={item.sell_price} readOnly />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Total Price (৳)</span>
                          </label>
                          <input type="number" className="input input-bordered input-sm bg-gray-100" value={formatCurrency(item.total_price)} readOnly />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-box">
                  <p className="text-gray-500">No stock items added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Scan barcode above OR search and add stock products</p>
                </div>
              )}
            </div>

            {/* Pickup Products */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  <ShoppingBag size={16} /> Pickup Products
                </h4>
                <button type="button" onClick={() => setShowPickupModal(true)} className="btn btn-sm btn-outline">
                  <Plus size={14} className="mr-1" /> Add Pickup Item
                </button>
              </div>

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
                                <strong>Brand:</strong> {item.brand || "N/A"} | Variant: {item.variant || "N/A"}
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
                          <button type="button" onClick={() => removePickupItem(index)} className="btn btn-xs btn-ghost text-red-600">
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
                </div>
              )}
            </div>

            {/* totals */}
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

                <div className="bg-gray-50 p-3 rounded-box border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Payment Details</h4>

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
                      />
                    </div>
                    <span>{formatWithSymbol(paidAmount)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Due Amount:</span>
                  <span className={calculateDueAmount() > 0 ? "text-error" : "text-success"}>{formatWithSymbol(dueAmount)}</span>
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
          <button type="button" onClick={() => router.visit(route("sales.index"))} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>

      {/* Pickup Modal */}
      {showPickupModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Pickup Item</h3>
              <button onClick={() => setShowPickupModal(false)} className="btn btn-sm btn-circle btn-ghost">
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
                  <input type="text" className="input input-bordered" value={pickupBrand} onChange={(e) => setPickupBrand(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Variant</span>
                  </label>
                  <input type="text" className="input input-bordered" value={pickupVariant} onChange={(e) => setPickupVariant(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Quantity *</span>
                  </label>
                  <input type="number" className="input input-bordered" value={pickupQuantity} onChange={(e) => setPickupQuantity(e.target.value)} min="1" />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Cost Price *</span>
                  </label>
                  <input type="number" className="input input-bordered" value={pickupUnitPrice} onChange={(e) => setPickupUnitPrice(e.target.value)} min="0" step="0.01" />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Sale Price *</span>
                  </label>
                  <input type="number" className="input input-bordered" value={pickupSalePrice} onChange={(e) => setPickupSalePrice(e.target.value)} min="0" step="0.01" />
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowPickupModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={addPickupItem} className="btn bg-[#1e4d2b] text-white">
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
              <button onClick={() => setShowSupplierModal(false)} className="btn btn-sm btn-circle btn-ghost">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Supplier Name *</span>
                </label>
                <input type="text" className="input input-bordered" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Company</span>
                </label>
                <input type="text" className="input input-bordered" value={newSupplierCompany} onChange={(e) => setNewSupplierCompany(e.target.value)} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone *</span>
                </label>
                <input type="text" className="input input-bordered" value={newSupplierPhone} onChange={(e) => setNewSupplierPhone(e.target.value)} />
              </div>
            </div>

            <div className="modal-action">
              <button onClick={() => setShowSupplierModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={createNewSupplier} className="btn bg-[#1e4d2b] text-white">
                Create Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
