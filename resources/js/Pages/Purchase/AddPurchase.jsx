import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, router } from "@inertiajs/react";
import { 
  ArrowLeft, 
  Package, 
  Building, 
  User, 
  DollarSign, 
  Search, 
  Plus, 
  Trash, 
  Ruler,
  Filter,
  X,
  ChevronDown,
  Calculator,
  FileText
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddPurchase({ 
  suppliers, 
  warehouses, 
  products, 
  accounts, 
  isShadowUser,
  unitConversions = {
    weight: { ton: 1000, kg: 1, gram: 0.001, pound: 0.453592 },
    volume: { liter: 1, ml: 0.001 },
    piece: { piece: 1, dozen: 12, box: 1 },
    length: { meter: 1, cm: 0.01, mm: 0.001 },
  },
}) {
  const { t, locale } = useTranslation();
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [availableAdvance, setAvailableAdvance] = useState(0);
  const [adjustFromAdvance, setAdjustFromAdvance] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paidAmount, setPaidAmount] = useState(0);
  const [manualPaymentOverride, setManualPaymentOverride] = useState(false);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const form = useForm({
    supplier_id: "",
    warehouse_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
    paid_amount: 0,
    payment_status: "unpaid",
    items: [],
    adjust_from_advance: false,
    account_id: "",
    use_partial_payment: false,
  });

  // Filter products based on search
  useEffect(() => {
    if (productSearch.trim()) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.product_no.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.brand?.name && product.brand.name.toLowerCase().includes(productSearch.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setShowProductDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowProductDropdown(false);
    }
  }, [productSearch, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle supplier change
  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    form.setData("supplier_id", supplierId);
    
    const supplier = suppliers?.find(s => s.id == supplierId);
    setSelectedSupplier(supplier);
    
    if (supplier) {
      let advance = 0;
      if (supplier.advance_amount !== undefined) {
        advance = parseFloat(supplier.advance_amount) || 0;
      } else {
        const supplierAdvance = parseFloat(supplier.advance || 0);
        const supplierDue = parseFloat(supplier.due || 0);
        advance = Math.max(0, supplierAdvance - supplierDue);
      }
      setAvailableAdvance(advance);
    } else {
      setAvailableAdvance(0);
    }
    
    setAdjustFromAdvance(false);
    setPaidAmount(0);
    setPaymentStatus("unpaid");
    form.setData("account_id", "");
  };

  // Calculate totals
  const calculateTotal = useCallback(() => {
    return selectedItems.reduce((total, item) => total + (item.total_price || 0), 0);
  }, [selectedItems]);

  const getDueAmount = useCallback(() => {
    const totalAmount = calculateTotal();
    return Math.max(0, totalAmount - paidAmount);
  }, [calculateTotal, paidAmount]);

  // Add item to purchase
  const addItem = (product, variant) => {
    const existingItemIndex = selectedItems.findIndex(
      item => item.product_id === product.id && item.variant_id === variant.id
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total_price = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;
      setSelectedItems(updatedItems);
    } else {
      const unitCost = variant.unit_cost || 0;
      const salePrice = variant.selling_price || unitCost * 1.2;
      
      setSelectedItems([
        ...selectedItems,
        {
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          variant_name: variant.attribute_values ? 
            Object.values(variant.attribute_values).join(", ") : "Default",
          brand_name: product.brand?.name || "Unknown",
          quantity: 1,
          unit: product.default_unit || "piece",
          unit_price: unitCost,
          sale_price: salePrice,
          total_price: unitCost,
          attributes: variant.attribute_values || {},
        }
      ]);
    }

    setProductSearch("");
    setShowProductDropdown(false);
  };

  // Remove item
  const removeItem = (index) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  // Update item quantity or price
  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    const numericValue = parseFloat(value) || 0;
    
    if (field === "quantity") {
      updated[index].quantity = numericValue;
      updated[index].total_price = numericValue * updated[index].unit_price;
    } else if (field === "unit_price") {
      updated[index].unit_price = numericValue;
      updated[index].total_price = numericValue * updated[index].quantity;
    } else if (field === "sale_price") {
      updated[index].sale_price = numericValue;
    }
    
    setSelectedItems(updated);
  };

  // Handle payment status change
  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);
    const totalAmount = calculateTotal();

    if (status === "paid") {
      setPaidAmount(totalAmount);
      setManualPaymentOverride(false);
      setAdjustFromAdvance(false);
    } else if (status === "unpaid") {
      setPaidAmount(0);
      setManualPaymentOverride(false);
      setAdjustFromAdvance(false);
      form.setData("account_id", "");
    } else if (status === "partial") {
      setManualPaymentOverride(true);
      setAdjustFromAdvance(false);
    }
  };

  // Update form data when selected items change
  useEffect(() => {
    const itemsWithUnits = selectedItems.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      unit: item.unit || "piece",
      unit_quantity: item.quantity || 1,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      total_price: item.total_price,
      sale_price: item.sale_price,
    }));

    form.setData("items", itemsWithUnits);
  }, [selectedItems]);

  // Format currency
  const formatCurrency = (value) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  // Form submission
  const submit = (e) => {
    e.preventDefault();

    // Validation
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (!form.data.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (!form.data.warehouse_id) {
      toast.error("Please select a warehouse");
      return;
    }

    // Prepare data
    const submitData = {
      ...form.data,
      paid_amount: paidAmount,
      payment_status: paymentStatus,
      adjust_from_advance: adjustFromAdvance,
    };

    form.post(route("purchase.store"), {
      data: submitData,
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Purchase created successfully!");
        router.visit(route("purchase.list"));
      },
      onError: (errors) => {
        console.error("Form submission errors:", errors);
        toast.error("Error creating purchase");
      },
    });
  };

  const totalAmount = calculateTotal();
  const dueAmount = getDueAmount();

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 ${locale === "bn" ? "bangla-font" : ""}`}>
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b mb-6 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white shadow-md shadow-primary/20">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">
                {isShadowUser ? t("Create Shadow Purchase") : t("Create Purchase")}
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                {isShadowUser ? "shadow mode" : "regular mode"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => window.history.back()} 
              className="btn btn-sm btn-ghost font-bold"
            >
              {t("Cancel")}
            </button>
            <button 
              form="purchase-form" 
              className="btn btn-sm btn-primary px-8 shadow-lg shadow-primary/20"
              disabled={form.processing}
            >
              {form.processing ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                t("Save Purchase")
              )}
            </button>
          </div>
        </div>
      </div>

      <form 
        id="purchase-form" 
        onSubmit={submit} 
        className="max-w-[1400px] mx-auto px-4 grid grid-cols-12 gap-6"
      >
        {/* LEFT COLUMN: Supplier & Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Supplier Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
              <Building size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {t("Supplier Details")}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold">
                    {t("Supplier")}*
                  </span>
                </label>
                <select 
                  className="select select-bordered select-sm w-full" 
                  value={form.data.supplier_id}
                  onChange={handleSupplierChange}
                  required
                >
                  <option value="">{t("Select Supplier")}</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.company || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSupplier && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="text-primary" />
                    <span className="text-xs font-bold">{selectedSupplier.name}</span>
                  </div>
                  {selectedSupplier.company && (
                    <p className="text-xs text-slate-600">{selectedSupplier.company}</p>
                  )}
                  {selectedSupplier.phone && (
                    <p className="text-xs text-slate-500">{selectedSupplier.phone}</p>
                  )}
                  {availableAdvance > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Available Advance:</span>
                        <span className="text-xs font-bold text-green-600">
                          ৳{formatCurrency(availableAdvance)}
                        </span>
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="checkbox checkbox-xs checkbox-primary"
                          checked={adjustFromAdvance}
                          onChange={(e) => setAdjustFromAdvance(e.target.checked)}
                        />
                        <span className="text-xs font-bold text-slate-600">
                          {t("Adjust from advance")}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold">
                    {t("Warehouse")}*
                  </span>
                </label>
                <select 
                  className="select select-bordered select-sm w-full" 
                  value={form.data.warehouse_id}
                  onChange={(e) => form.setData("warehouse_id", e.target.value)}
                  required
                >
                  <option value="">{t("Select Warehouse")}</option>
                  {warehouses?.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold">
                    {t("Purchase Date")}*
                  </span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered input-sm w-full"
                  value={form.data.purchase_date}
                  onChange={(e) => form.setData("purchase_date", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Card */}
          {!isShadowUser && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
                <DollarSign size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  {t("Payment")}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-bold">
                      {t("Payment Status")}
                    </span>
                  </label>
                  <select 
                    className="select select-bordered select-sm w-full"
                    value={paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  >
                    <option value="unpaid">{t("Unpaid")}</option>
                    <option value="partial">{t("Partial")}</option>
                    <option value="paid">{t("Paid")}</option>
                  </select>
                </div>

                {paymentStatus !== "unpaid" && (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs font-bold">
                        {t("Payment Account")}*
                      </span>
                    </label>
                    <select 
                      className="select select-bordered select-sm w-full"
                      value={form.data.account_id}
                      onChange={(e) => form.setData("account_id", e.target.value)}
                      required={paymentStatus !== "unpaid"}
                    >
                      <option value="">{t("Select Account")}</option>
                      {accounts?.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} (৳{formatCurrency(account.current_balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-bold">
                      {t("Paid Amount")}
                    </span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input input-bordered input-sm w-full"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    disabled={!manualPaymentOverride && adjustFromAdvance}
                  />
                  {manualPaymentOverride && (
                    <button 
                      type="button"
                      onClick={() => setManualPaymentOverride(false)}
                      className="btn btn-xs btn-ghost mt-1 text-error"
                    >
                      <X size={12} /> Cancel Manual
                    </button>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total:</span>
                      <span className="font-bold">৳{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paid:</span>
                      <span className="font-bold text-green-600">৳{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="text-slate-500">Due:</span>
                      <span className="font-bold text-error">৳{formatCurrency(dueAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: Products */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Product Search Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
              <Search size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {t("Add Products")}
              </span>
            </div>
            <div className="p-5" ref={searchRef}>
              <div className="relative">
                <input 
                  type="text" 
                  className="input input-bordered input-sm w-full pr-10"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product name, code or brand..."
                />
                <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
              </div>

              {/* Product Dropdown */}
              {showProductDropdown && filteredProducts.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-50 w-full max-w-md mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  {filteredProducts.map(product => (
                    <div key={product.id} className="border-b border-slate-100 last:border-0">
                      <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600">
                        {product.name} ({product.product_no})
                        {product.brand?.name && (
                          <span className="ml-2 text-primary">Brand: {product.brand.name}</span>
                        )}
                      </div>
                      {product.variants?.map(variant => (
                        <div 
                          key={variant.id}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          onClick={() => addItem(product, variant)}
                        >
                          <div>
                            <span className="text-xs font-medium">
                              {variant.attribute_values ? 
                                Object.values(variant.attribute_values).join(", ") : "Default"
                              }
                            </span>
                            {variant.sku && (
                              <span className="text-[10px] text-slate-500 ml-2">SKU: {variant.sku}</span>
                            )}
                          </div>
                          <div className="text-xs font-bold">
                            ৳{formatCurrency(variant.unit_cost || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="bg-slate-50 px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  {t("Selected Items")} ({selectedItems.length})
                </span>
              </div>
              <div className="text-xs font-bold text-primary">
                Total: ৳{formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold">{item.product_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                            {item.brand_name}
                          </span>
                          {item.variant_name !== "Default" && (
                            <span className="text-xs text-slate-600">{item.variant_name}</span>
                          )}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text text-[10px] font-bold text-slate-500">Qty</span>
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          step="0.001"
                          className="input input-bordered input-xs w-full"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text text-[10px] font-bold text-slate-500">Cost</span>
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="input input-bordered input-xs w-full"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text text-[10px] font-bold text-slate-500">Sale Price</span>
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="input input-bordered input-xs w-full"
                          value={item.sale_price}
                          onChange={(e) => updateItem(index, "sale_price", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500">
                        {item.quantity} × ৳{formatCurrency(item.unit_price)}
                      </span>
                      <span className="text-sm font-bold">
                        ৳{formatCurrency(item.total_price)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <Package size={48} className="text-slate-300 mb-3" />
                  <p className="text-slate-400 text-sm font-bold">No items added</p>
                  <p className="text-slate-300 text-xs mt-1">Search and add products above</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Notes & Summary */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Notes Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {t("Notes")}
              </span>
            </div>
            <div className="p-5">
              <textarea 
                className="textarea textarea-bordered textarea-sm w-full h-40"
                value={form.data.notes}
                onChange={(e) => form.setData("notes", e.target.value)}
                placeholder="Additional notes or instructions..."
              />
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
              <Calculator size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                {t("Summary")}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-sm font-bold">৳{formatCurrency(totalAmount)}</span>
              </div>
              
              {!isShadowUser && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Paid Amount</span>
                    <span className="text-sm font-bold text-green-600">
                      ৳{formatCurrency(paidAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Due Amount</span>
                    <span className="text-sm font-bold text-error">
                      ৳{formatCurrency(dueAmount)}
                    </span>
                  </div>
                </>
              )}

              {isShadowUser && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">
                      <Filter size={14} />
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      Shadow Mode Active
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    This purchase will use shadow pricing and won't affect real inventory.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <div className="text-center text-xs text-slate-500 mb-2">
                  {selectedItems.length} items selected
                </div>
                <button 
                  type="submit" 
                  className={`btn w-full font-bold ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                  disabled={form.processing || selectedItems.length === 0}
                >
                  {form.processing ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : isShadowUser ? (
                    "Execute Shadow Purchase"
                  ) : (
                    "Finalize Purchase"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}