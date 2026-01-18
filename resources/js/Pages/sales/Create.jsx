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
  CreditCard,
  Landmark,
  Smartphone,
  ShoppingBag,
  X,
  ChevronRight,
  Warehouse,
  Edit,
  DollarSign,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddSale({ customers, productstocks, suppliers, accounts }) {
  const { t, locale } = useTranslation();

  const [selectedItems, setSelectedItems] = useState([]);
  const [pickupItems, setPickupItems] = useState([]);

  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [vatRate, setVatRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0); // percentage discount
  const [flatDiscount, setFlatDiscount] = useState(0); // flat discount
  const [discountType, setDiscountType] = useState("percentage"); // 'percentage' or 'flat'

  const [paidAmount, setPaidAmount] = useState(0);
  const [shadowPaidAmount, setShadowPaidAmount] = useState(0);

  const [selectedAccount, setSelectedAccount] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [manualPaymentOverride, setManualPaymentOverride] = useState(false);

  // ✅ Customer selection state (FIXED)
  const [customerSelectValue, setCustomerSelectValue] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [usePartialPayment, setUsePartialPayment] = useState(false);
  const [adjustFromAdvance, setAdjustFromAdvance] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [customerDueAmountInput, setCustomerDueAmountInput] = useState(0); // New state for due amount
  const [availableAdvance, setAvailableAdvance] = useState(0);

  // NEW: State to control customer fields visibility
  const [showCustomerFields, setShowCustomerFields] = useState(false);

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

  // Product selection flow states
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableVariants, setAvailableVariants] = useState([]);

  const form = useForm({
    customer_id: "",
    customer_name: "",
    customer_due_amount: 0,
    phone: "",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
    vat_rate: 0,
    discount_rate: 0,
    flat_discount: 0,
    discount_type: "percentage",
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

  // ---------------- Calculations ----------------
  const calculateRealSubTotal = useCallback(() => {
    if (!selectedItems || selectedItems.length === 0) return 0;
    return selectedItems.reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  }, [selectedItems]);

  const calculatePickupSubTotal = useCallback(() => {
    if (!pickupItems || pickupItems.length === 0) return 0;
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
    if (discountType === "percentage") {
      return (subtotal * (Number(discountRate) || 0)) / 100;
    } else {
      // flat discount
      return Math.min(subtotal, Number(flatDiscount) || 0);
    }
  }, [calculateTotalSubTotal, discountRate, flatDiscount, discountType]);

  const calculateGrandTotal = useCallback(() => {
    const subtotal = calculateTotalSubTotal();
    return subtotal + calculateVatAmount() - calculateDiscountAmount();
  }, [calculateTotalSubTotal, calculateVatAmount, calculateDiscountAmount]);

  const calculateDueAmount = useCallback(() => {
    const grandTotal = calculateGrandTotal();
    const paid = Number(paidAmount) || 0;
    return Math.max(0, grandTotal - paid);
  }, [calculateGrandTotal, paidAmount]);

  // ---------------- Helpers ----------------
  const formatCurrency = (value) => (Number(value) || 0).toFixed(2);
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

  const allProducts = useMemo(() => {
    if (!productstocks || productstocks.length === 0) return [];
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

  // ---------------- Customer (FIXED) ----------------
  const handleCustomerSelect = (value) => {
    setCustomerSelectValue(value);

    if (value === "new") {
      setSelectedCustomer(null);
      setCustomerNameInput("");
      setCustomerPhoneInput("");
      setCustomerDueAmountInput(0);
      setAvailableAdvance(0);

      form.setData({
        ...form.data,
        customer_id: "",
        customer_name: "",
        phone: "",
        customer_due_amount: 0
      });

      setPaymentStatus("unpaid");
      setPaidAmount(0);
      setAdjustFromAdvance(false);
      setManualPaymentOverride(false);
      return;
    }

    if (!value) {
      setSelectedCustomer(null);
      setCustomerNameInput("");
      setCustomerPhoneInput("");
      setCustomerDueAmountInput(0);
      setAvailableAdvance(0);

      form.setData({
        ...form.data,
        customer_id: "",
        customer_name: "",
        phone: "",
        customer_due_amount: 0
      });
      return;
    }

    const id = parseInt(value);
    const customer = customers.find((c) => c.id === id);
    setSelectedCustomer(customer || null);

    if (customer) {
      setCustomerNameInput(customer.customer_name || "");
      setCustomerPhoneInput(customer.phone || "");
      setCustomerDueAmountInput(parseFloat(customer.due_amount) || 0);

      const advance = parseFloat(customer.advance_amount) || 0;
      const due = parseFloat(customer.due_amount) || 0;
      setAvailableAdvance(advance - due);

      form.setData({
        ...form.data,
        customer_id: customer.id,
        customer_name: customer.customer_name,
        phone: customer.phone,
        customer_due_amount: parseFloat(customer.due_amount) || 0
      });
    }
  };

  const handleCustomerNameChange = (value) => {
    setCustomerNameInput(value);
    form.setData("customer_name", value);

    if (value && selectedCustomer && value !== selectedCustomer.customer_name) {
      setSelectedCustomer(null);
      setCustomerSelectValue("new");
      form.setData("customer_id", "");
      setAvailableAdvance(0);
      setCustomerDueAmountInput(0);
    }
  };

  const handleCustomerPhoneChange = (value) => {
    setCustomerPhoneInput(value);
    form.setData("phone", value);

    if (value && selectedCustomer && value !== selectedCustomer.phone) {
      setSelectedCustomer(null);
      setCustomerSelectValue("new");
      form.setData("customer_id", "");
      setAvailableAdvance(0);
      setCustomerDueAmountInput(0);
    }
  };

  const handleCustomerDueAmountChange = (value) => {
    const dueAmount = parseFloat(value) || 0;
    setCustomerDueAmountInput(dueAmount);
    form.setData("customer_due_amount", dueAmount);
  };

  // ---------------- Payment status logic ----------------
  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);
    const grandTotal = calculateGrandTotal();

    if (status === "paid") {
      setPaidAmount(grandTotal);
      setManualPaymentOverride(false);
      setAdjustFromAdvance(false);
      // Enable account_id when paid is selected
      if (grandTotal > 0 && !selectedAccount) {
        // Auto-select first account if available
        if (accounts && accounts.length > 0) {
          handleAccountSelect(accounts[0].id);
        }
      }
      // Hide customer fields initially when paid/partial
      setShowCustomerFields(false);
    } else if (status === "unpaid") {
      setPaidAmount(0);
      setManualPaymentOverride(false);
      setAdjustFromAdvance(false);
      // Reset account when unpaid
      handleAccountSelect("");
    } else if (status === "partial") {
      setManualPaymentOverride(true);
      setAdjustFromAdvance(false);
      // Enable account_id when partial is selected
      if (!selectedAccount) {
        if (accounts && accounts.length > 0) {
          handleAccountSelect(accounts[0].id);
        }
      }
      // Hide customer fields initially when paid/partial
      setShowCustomerFields(false);
    }
  };

  const handleManualPaymentInput = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const grandTotal = calculateGrandTotal();
    setPaidAmount(value);

    if (value === 0) {
      setPaymentStatus("unpaid");
      handleAccountSelect("");
    } else if (value >= grandTotal) {
      setPaymentStatus("paid");
      // Enable account selection if not already selected
      if (!selectedAccount && accounts && accounts.length > 0) {
        handleAccountSelect(accounts[0].id);
      }
    } else {
      setPaymentStatus("partial");
      // Enable account selection if not already selected
      if (!selectedAccount && accounts && accounts.length > 0) {
        handleAccountSelect(accounts[0].id);
      }
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
    setPaymentStatus("paid");
    // Enable account selection
    if (!selectedAccount && accounts && accounts.length > 0) {
      handleAccountSelect(accounts[0].id);
    }
  };

  // Handle new customer button click
  const handleNewCustomerClick = () => {
    setShowCustomerFields(true);
    setCustomerSelectValue("new");
    setSelectedCustomer(null);
    setCustomerNameInput("");
    setCustomerPhoneInput("");
    setCustomerDueAmountInput(0);
    setAvailableAdvance(0);
    
    form.setData({
      ...form.data,
      customer_id: "",
      customer_name: "",
      phone: "",
      customer_due_amount: 0
    });
  };

  useEffect(() => {
    if (adjustFromAdvance && availableAdvance > 0 && !manualPaymentOverride) {
      const grandTotal = calculateGrandTotal();
      const maxAdjustable = Math.min(availableAdvance, grandTotal);

      if (paidAmount == 0 || paidAmount > grandTotal) {
        const autoPaidAmount = Math.min(maxAdjustable, grandTotal);
        setPaidAmount(autoPaidAmount);

        if (autoPaidAmount >= grandTotal) {
          setPaymentStatus("paid");
          // Enable account when paid
          if (!selectedAccount && accounts && accounts.length > 0) {
            handleAccountSelect(accounts[0].id);
          }
        }
        else if (autoPaidAmount > 0) {
          setPaymentStatus("partial");
          // Enable account when partial
          if (!selectedAccount && accounts && accounts.length > 0) {
            handleAccountSelect(accounts[0].id);
          }
        }
        else setPaymentStatus("unpaid");
      }
    }
  }, [adjustFromAdvance, availableAdvance, calculateGrandTotal, manualPaymentOverride, paidAmount]);

  // ---------------- Account ----------------
  const handleAccountSelect = (accountId) => {
    const id = accountId ? parseInt(accountId) : "";
    setSelectedAccount(id);
    form.setData("account_id", id);
  };

  // ---------------- Search products ----------------
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
        if (variant && variant.attribute_values && typeof variant.attribute_values === "object") {
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
        if (variant && variant.attribute_values && typeof variant.attribute_values === "object") {
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

  // ✅ Sync form data
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
      flat_discount: Number(flatDiscount) || 0,
      discount_type: discountType,
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
      customer_due_amount: Number(customerDueAmountInput) || 0,
    });
  }, [
    selectedItems,
    pickupItems,
    vatRate,
    discountRate,
    flatDiscount,
    discountType,
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
    customerDueAmountInput,
    calculateRealSubTotal,
    calculatePickupSubTotal,
    calculateTotalSubTotal,
    calculateGrandTotal,
    calculateDueAmount,
  ]);

  // ---------------- Submit ----------------
  const submit = (e) => {
    e.preventDefault();

    if (selectedItems.length === 0 && pickupItems.length === 0) {
      alert("Please add at least one product to the sale");
      return;
    }

    const invalidItems = selectedItems.filter((item) => !item.quantity || item.quantity <= 0 || !item.unit_price || item.unit_price <= 0);
    if (invalidItems.length > 0) {
      alert("Please ensure all items have valid quantity and unit price");
      return;
    }

    const outOfStockItems = selectedItems.filter((item) => item.quantity > item.stockQuantity);
    if (outOfStockItems.length > 0) {
      alert("Some items exceed available stock. Please adjust quantities.");
      return;
    }

    // ✅ Inventory: must provide name + phone when customer fields are shown
    if (showCustomerFields && (!form.data.customer_name || !form.data.phone)) {
      alert("Please provide customer name and phone number");
      return;
    }

    // Require account selection when paid amount > 0
    if (paidAmount > 0 && !selectedAccount) {
      alert("Please select a payment account");
      return;
    }

    // if (pickupItems.length > 0 && !selectedSupplier) {
    //   alert("Please select a supplier for pickup items");
    //   return;
    // }

    form.post(route("sales.store"), {
      onSuccess: () => router.visit(route("sales.index")),
      onError: (errors) => {
        console.error(errors);
        alert(errors.error || "Failed to create sale. Please check the form data.");
      },
    });
  };

  const realSubTotal = calculateRealSubTotal();
  const pickupSubTotal = calculatePickupSubTotal();
  const totalSubTotal = calculateTotalSubTotal();
  const grandTotal = calculateGrandTotal();
  const dueAmount = calculateDueAmount();
  const vatAmount = calculateVatAmount();
  const discountAmount = calculateDiscountAmount();

  // ✅ Selected account object (for design box)
  const selectedAccountObj = selectedAccount
    ? accounts?.find((acc) => String(acc.id) === String(selectedAccount))
    : null;

  return (
    <div className="bg-white rounded-box p-5">
      <PageHeader title="Create New (Sale/Order)" subtitle="Add products to sale (Inventory System)">
        <button onClick={() => router.visit(route("sales.index"))} className="btn btn-sm btn-ghost">
          <ArrowLeft size={15} /> Back to List
        </button>
      </PageHeader>

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* LEFT */}
          <div className="lg:col-span-1 space-y-4">
            {/* ✅ CUSTOMER SELECT */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Customer *</span>
              </label>
              <select
                className="select select-bordered"
                value={customerSelectValue}
                onChange={(e) => handleCustomerSelect(e.target.value)}
              >
                <option value="">Walk In Customer</option>
                <option value="new">+ New Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
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

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={12} className="text-gray-500" />
                    <span>Due Amount: ৳{formatCurrency(selectedCustomer.due_amount || 0)}</span>
                  </div>

                  {availableAdvance > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Available Advance:</span>
                      <span className="ml-1 font-bold text-green-600">৳{formatCurrency(availableAdvance)}</span>
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
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NEW CUSTOMER BUTTON - Show only when payment is partial or paid */}
            {/* {(paymentStatus === "partial" || paymentStatus === "paid") && !showCustomerFields && !selectedCustomer && (
              <div className="border border-dashed border-gray-300 rounded-box p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">Customer information required for paid/partial payments</p>
                <button
                  type="button"
                  onClick={handleNewCustomerClick}
                  className="btn btn-sm btn-outline btn-primary"
                >
                  <Plus size={14} className="mr-1" />
                  New Customer
                </button>
              </div>
            )} */}

            {/* Customer Name Field - Conditionally shown */}
            {(showCustomerFields || selectedCustomer || customerSelectValue === "new") && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Customer Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={customerNameInput}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  required={showCustomerFields || customerSelectValue === "new"}
                />
              </div>
            )}

            {/* Customer Phone Field - Conditionally shown */}
            {(showCustomerFields || selectedCustomer || customerSelectValue === "new") && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Customer Phone *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={customerPhoneInput}
                  onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                  required={showCustomerFields || customerSelectValue === "new"}
                />
              </div>
            )}

            {/* Customer Due Amount Field - Conditionally shown for new customers */}
            {(showCustomerFields || customerSelectValue === "new") && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Customer Due Amount</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered"
                  value={customerDueAmountInput}
                  onChange={(e) => handleCustomerDueAmountChange(e.target.value)}
                  placeholder="Enter due amount if any"
                />
              </div>
            )}

            {/* ✅✅ PAYMENT CARD — SAME DESIGN AS PURCHASE (DESIGN ONLY) */}
            <div className="card card-compact bg-[#1e4d2b] text-white border border-gray-800 rounded-2xl shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="card-title text-sm font-black uppercase text-red-500 flex items-center gap-2">
                    <CreditCard size={16} /> Payment
                  </h3>

                  <button
                    type="button"
                    onClick={manualPaymentOverride ? disableManualPaymentOverride : enableManualPaymentOverride}
                    className="btn btn-xs bg-red-600 hover:bg-red-700 border-none text-white font-black text-[10px] uppercase"
                  >
                    {manualPaymentOverride ? <X size={10} /> : <Edit size={10} />}
                    {manualPaymentOverride ? "Cancel" : "Manual"}
                  </button>
                </div>

                {/* Account Selection */}
                <div className="form-control mb-3">
                  <label className="label py-0">
                    <span className="label-text text-[10px] text-gray-400 uppercase font-black tracking-widest">
                      Payment Account {paidAmount > 0 && "*"}
                    </span>
                  </label>

                  <select
                    className="select select-bordered select-sm w-full bg-gray-800 border-gray-700 text-white"
                    value={selectedAccount}
                    onChange={(e) => handleAccountSelect(e.target.value)}
                    required={paidAmount > 0}
                    disabled={paymentStatus === "unpaid"}
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} — ৳{formatCurrency(account.current_balance)}
                      </option>
                    ))}
                  </select>

                  {paidAmount > 0 && !selectedAccount && (
                    <div className="text-red-400 text-xs mt-1">Please select a payment account</div>
                  )}

                  {paymentStatus === "unpaid" && (
                    <div className="text-gray-400 text-xs mt-1">Account selection disabled for unpaid status</div>
                  )}

                  {/* Selected Account Info */}
                  {selectedAccountObj && (
                    <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getAccountIcon(selectedAccountObj.type)}
                          <span className="text-xs font-bold">{selectedAccountObj.name}</span>
                          <span className="text-xs text-gray-400 capitalize">({selectedAccountObj.type})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">Balance</div>
                          <div className="text-xs font-mono font-bold">
                            ৳{formatCurrency(selectedAccountObj.current_balance)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment status */}
                <div className="form-control mb-3">
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

                {/* Paid amount */}
                <div className="form-control mb-3">
                  <label className="label py-1">
                    <span className="label-text text-[10px] text-gray-400 uppercase font-black tracking-widest">
                      Paid Amount
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered input-sm w-full bg-gray-800 border-gray-700 font-mono"
                    value={paidAmount}
                    onChange={handleManualPaymentInput}
                    disabled={!manualPaymentOverride && adjustFromAdvance}
                  />
                </div>

                {/* Totals */}
                <div className="space-y-1 text-xs pt-2 border-t border-gray-800 mt-2 font-bold uppercase tracking-tighter">
                  <div className="flex justify-between">
                    <span>Gross:</span>
                    <span>৳{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-500 font-black">
                    <span>Due:</span>
                    <span>৳{formatCurrency(dueAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier for pickup */}
            {/* {pickupItems.length > 0 && (
              <div className="form-control ">
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
              </div>
            )} */}

            {/* Sale date */}
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

            {/* notes */}
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

            {/* Stock products */}
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
                      setShowProductDropdown(true);
                    }}
                    onClick={() => setShowProductDropdown(true)}
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

                {/* Product dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                    <div className="bg-gray-100 p-2 sticky top-0 z-10">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Select Product ({filteredProducts.length})
                        </h3>
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
                              Code: {product.product_no || "N/A"} • Stock: {product.totalStock} • Variants: {product.variantsCount}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Brand dropdown */}
                {showBrandDropdown && availableBrands.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-box shadow-lg max-h-60 overflow-y-auto">
                    <div className="bg-gray-100 p-2 sticky top-0 z-10">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={goBackToProducts} className="btn btn-ghost btn-xs">
                          <ArrowLeft size={12} />
                        </button>
                        <h3 className="text-sm font-semibold text-gray-700 flex-1">
                          Select Brand for {selectedProduct?.name}
                        </h3>
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

                {/* Variant dropdown */}
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
                                Stock: {totalQuantity} • SKU: {variant.sku || "N/A"} • Price: {formatWithSymbol(Number(sale_price) || 0)}
                                {Number(shadow_sale_price) > 0 ? ` • Shadow: ${formatWithSymbol(Number(shadow_sale_price))}` : ""}
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
                    <div key={item.uniqueKey || index} className="border border-gray-300 rounded-box p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.product_name} ({item.product_code})
                          </h4>
                          <p className="text-sm text-gray-600">
                            <strong>Variant:</strong> Attribute: {item.variant_attribute} | Value: {item.variant_value}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Batch No:</strong> {item?.batch_no} || <strong>Sku:</strong> {item?.sku}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Available Stock:</strong> {item.stockQuantity} | <strong>Sale Price:</strong> ৳{formatCurrency(item.sell_price)}
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
                          {item.quantity > item.stockQuantity && (
                            <div className="text-error text-xs mt-1">Exceeds available stock!</div>
                          )}
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
                  <p className="text-sm text-gray-400 mt-1">Search and add stock products above</p>
                </div>
              )}
            </div>

            {/* Pickup section */}
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
                  <p className="text-sm text-gray-400 mt-1">Click "Add Pickup Item" to add products not in stock</p>
                </div>
              )}
            </div>

            {/* Summary */}
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
                    />
                    <span>%</span>
                  </div>
                  <span>{formatWithSymbol(vatAmount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>Discount:</span>
                    <div className="flex items-center gap-2">
                      <select
                        className="select select-bordered select-sm"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="flat">Flat</option>
                      </select>
                      
                      {discountType === "percentage" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            className="input input-bordered input-sm w-20"
                            value={discountRate}
                            onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>৳</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input input-bordered input-sm w-20"
                            value={flatDiscount}
                            onChange={(e) => setFlatDiscount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <span>{formatWithSymbol(discountAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Grand Total:</span>
                  <span>{formatWithSymbol(grandTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Due Amount:</span>
                  <span className={dueAmount > 0 ? "text-error" : "text-success"}>{formatWithSymbol(dueAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="btn bg-[#1e4d2b] text-white"
            disabled={form.processing || (selectedItems.length === 0 && pickupItems.length === 0) || (paidAmount > 0 && !selectedAccount)}
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