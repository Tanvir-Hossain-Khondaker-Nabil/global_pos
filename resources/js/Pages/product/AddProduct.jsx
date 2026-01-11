import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm } from "@inertiajs/react";
import { Trash, X, Plus, Factory, Package, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddProduct({ category, update, brand, attributes }) {
  const { t, locale } = useTranslation();

  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [productType, setProductType] = useState("regular");
  const [variantAttributeSelector, setVariantAttributeSelector] = useState(null);

  // ✅ photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const existingPhotoUrl = useMemo(() => {
    if (!update?.photo) return null;
    // update.photo is like "products/xxx.webp"
    return `/storage/${update.photo}`;
  }, [update]);

  const productForm = useForm({
    id: update ? update.id : "",
    product_name: update ? update.name : "",
    brand_id: update ? update.brand_id : "",
    category_id: update ? update.category_id : "",
    product_no: update ? update.product_no : "",
    description: update ? update.description : "",
    product_type: update ? update.product_type : "regular",
    in_house_cost: update ? update.in_house_cost || 0 : 0,
    in_house_shadow_cost: update ? update.in_house_shadow_cost || 0 : 0,
    in_house_sale_price: update ? update.in_house_sale_price || 0 : 0,
    in_house_shadow_sale_price: update ? update.in_house_shadow_sale_price || 0 : 0,
    in_house_initial_stock: update ? update.in_house_initial_stock || 0 : 0,
    variants: [],
    photo: null, // ✅ will hold File
  });

  useEffect(() => {
    // categories
    if (Array.isArray(category)) setCategories(category);
    else if (category && typeof category === "object") {
      if (category.data && Array.isArray(category.data)) setCategories(category.data);
      else {
        setCategories(Object.entries(category).map(([id, name]) => ({ id, name })));
      }
    } else setCategories([]);

    // brands
    if (Array.isArray(brand)) setBrands(brand);
    else if (brand && typeof brand === "object") {
      if (brand.data && Array.isArray(brand.data)) setBrands(brand.data);
      else {
        setBrands(Object.entries(brand).map(([id, name]) => ({ id, name })));
      }
    } else setBrands([]);

    if (attributes && Array.isArray(attributes)) setAvailableAttributes(attributes);

    if (update?.product_type) setProductType(update.product_type);
  }, [category, brand, attributes, update]);

  // ✅ photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    productForm.setData("photo", file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleVariantAttributeSelect = (variantIndex, attributeCode, value, checked) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = updated[variantIndex];
      if (!variant.attribute_values) variant.attribute_values = {};

      if (checked) variant.attribute_values[attributeCode] = value;
      else delete variant.attribute_values[attributeCode];

      return updated;
    });
  };

  const openVariantAttributeSelector = (variantIndex) => setVariantAttributeSelector(variantIndex);
  const closeVariantAttributeSelector = () => setVariantAttributeSelector(null);

  const handleProductTypeChange = (type) => {
    setProductType(type);
    productForm.setData("product_type", type);

    if (type === "regular") {
      productForm.setData({
        in_house_cost: 0,
        in_house_shadow_cost: 0,
        in_house_sale_price: 0,
        in_house_shadow_sale_price: 0,
        in_house_initial_stock: 0,
      });

      setErrors((prev) => {
        const ne = { ...prev };
        delete ne.in_house_cost;
        delete ne.in_house_shadow_cost;
        delete ne.in_house_sale_price;
        delete ne.in_house_shadow_sale_price;
        delete ne.in_house_initial_stock;
        return ne;
      });
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: null,
        attribute_values: {},
      },
    ]);
  };

  const handleDeleteVariant = (index) => {
    if (variants.length > 1) {
      const updated = [...variants];
      updated.splice(index, 1);
      setVariants(updated);
    }
  };

  const handleClearVariantAttributes = (index) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index].attribute_values = {};
      return updated;
    });
  };

  const validateForm = () => {
    let hasError = false;
    let newErrors = {};

    if (!productForm.data.product_name?.trim()) {
      hasError = true;
      newErrors.product_name = t("product.product_name_required", "Product name is required");
    }

    if (!productForm.data.category_id) {
      hasError = true;
      newErrors.category_id = t("product.category_required", "Category is required");
    }

    if (!productForm.data.product_no?.trim()) {
      hasError = true;
      newErrors.product_no = t("product.product_code_required", "Product code is required");
    }

    // ✅ photo required only when creating
    const isCreating = !update;
    if (isCreating && !productForm.data.photo) {
      hasError = true;
      newErrors.photo = t("product.photo_required", "Product photo is required");
    }

    if (productType === "in_house") {
      if (!productForm.data.in_house_cost || productForm.data.in_house_cost <= 0) {
        hasError = true;
        newErrors.in_house_cost = t("product.production_cost_required", "Production cost is required");
      }
      if (!productForm.data.in_house_shadow_cost || productForm.data.in_house_shadow_cost <= 0) {
        hasError = true;
        newErrors.in_house_shadow_cost = t("product.shadow_cost_required", "Shadow production cost is required");
      }
      if (!productForm.data.in_house_sale_price || productForm.data.in_house_sale_price <= 0) {
        hasError = true;
        newErrors.in_house_sale_price = t("product.sale_price_required", "Sale price is required");
      }
      if (!productForm.data.in_house_shadow_sale_price || productForm.data.in_house_shadow_sale_price <= 0) {
        hasError = true;
        newErrors.in_house_shadow_sale_price = t("product.shadow_sale_price_required", "Shadow sale price is required");
      }
      if (productForm.data.in_house_initial_stock < 0) {
        hasError = true;
        newErrors.in_house_initial_stock = t("product.initial_stock_invalid", "Initial stock cannot be negative");
      }
    }

    // duplicate variants check
    const attributeCombinations = variants.map((variant) =>
      JSON.stringify(Object.entries(variant.attribute_values || {}).sort())
    );
    const hasDuplicates = attributeCombinations.some(
      (combination, index) => attributeCombinations.indexOf(combination) !== index
    );
    if (hasDuplicates) {
      hasError = true;
      newErrors.variants = t("product.duplicate_variants", "Duplicate attribute combinations found");
    }

    setErrors(newErrors);
    return hasError;
  };

  const formSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      toast.error(t("product.fix_validation_errors", "Please fix the validation errors"));
      return;
    }

    const url = update ? route("product.update.post") : route("product.add.post");

    // ✅ Put variants into form state
    productForm.setData("variants", variants.map((v) => ({
      id: v.id,
      attribute_values: v.attribute_values || {},
    })));

    // ✅ Submit as FormData automatically (photo is File)
    productForm.post(url, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        toast.success(update
          ? t("product.product_updated_success", "Product updated successfully!")
          : t("product.product_added_success", "Product added successfully!")
        );

        if (!update) {
          productForm.reset();
          setVariants([{ attribute_values: {} }]);
          setProductType("regular");
          setPhotoFile(null);
          setPhotoPreview(null);
        }
      },
      onError: (serverErrors) => {
        // server side validation errors (optional)
        toast.error(t("product.something_went_wrong", "Something went wrong. Please try again!"));
        console.error("Form errors:", serverErrors);
      },
    });
  };

  // keep variants in sync
  useEffect(() => {
    productForm.setData("variants", variants);
  }, [variants]);

  // Load editing data
  useEffect(() => {
    if (update) {
      productForm.setData({
        id: update.id || "",
        product_name: update.name || "",
        brand_id: update.brand_id || "",
        category_id: update.category_id || "",
        product_no: update.product_no || "",
        description: update.description || "",
        product_type: update.product_type || "regular",
        in_house_cost: update.in_house_cost || 0,
        in_house_shadow_cost: update.in_house_shadow_cost || 0,
        in_house_sale_price: update.in_house_sale_price || 0,
        in_house_shadow_sale_price: update.in_house_shadow_sale_price || 0,
        in_house_initial_stock: update.in_house_initial_stock || 0,
        photo: null,
      });

      if (update.variants?.length > 0) {
        setVariants(update.variants.map((v) => ({
          id: v.id || null,
          attribute_values: v.attribute_values || {},
        })));
      } else {
        setVariants([{ attribute_values: {} }]);
      }

      // reset new preview when opening edit
      setPhotoFile(null);
      setPhotoPreview(null);

      if (update.product_type) setProductType(update.product_type);
    } else {
      setVariants([{ attribute_values: {} }]);
    }
  }, [update]);

  const previewSrc = photoPreview || existingPhotoUrl;

  return (
    <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
      <PageHeader
        title={update ? t("product.update_title", "Update Product") : t("product.from_title", "Add New Product")}
        subtitle={t("product.subtitle", "Add or update product with variants")}
      />

      <form onSubmit={formSubmit}>
        {/* ✅ PHOTO SECTION */}
        <div className="mb-6 border border-base-300 rounded-box p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon size={18} />
            <h3 className="font-semibold">{t("product.photo", "Product Photo")}{!update ? " *" : ""}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className={`file-input file-input-bordered w-full ${errors.photo ? "file-input-error" : ""}`}
                onChange={handlePhotoChange}
              />
              {errors.photo && <p className="text-sm text-error mt-1">{errors.photo}</p>}

              <p className="text-xs text-gray-500 mt-2">
                {t("product.photo_tip", "PNG/JPG/WEBP, max 5MB")}
              </p>
            </div>

            <div className="border border-base-300 rounded-box p-3 bg-base-100">
              <div className="text-sm font-medium mb-2">{t("product.preview", "Preview")}</div>
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="preview"
                  className="w-full max-h-56 object-contain rounded"
                />
              ) : (
                <div className="text-sm text-gray-500 italic">
                  {t("product.no_photo_selected", "No photo selected")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Type Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {t("product.product_type", "Product Type")} *
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`card cursor-pointer border-2 ${
                productType === "regular"
                  ? "border-primary bg-[#1e4d2b] text-white"
                  : "border-base-300 hover:border-primary/50"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="product_type"
                    value="regular"
                    checked={productType === "regular"}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className="radio radio-primary mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Package size={20} className="text-primary" />
                      <h4 className="font-semibold">{t("product.regular_product", "Regular Product")}</h4>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      {t("product.regular_desc", "Purchase from supplier, needs stock management through purchase orders")}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            <label
              className={`card cursor-pointer border-2 ${
                productType === "in_house"
                  ? "border-warning bg-warning/5"
                  : "border-base-300 hover:border-warning/50"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="product_type"
                    value="in_house"
                    checked={productType === "in_house"}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className="radio radio-warning mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Factory size={20} className="text-warning" />
                      <h4 className="font-semibold text-warning">
                        {t("product.in_house_product", "In-House Production")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {t("product.in_house_desc", "Internally produced, auto-stock management in In-House warehouse")}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Product Basic Information */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              {t("product.from_product_name", "Product Name")}*
            </legend>
            <input
              type="text"
              className={`input ${errors.product_name ? "input-error" : ""}`}
              value={productForm.data.product_name}
              onChange={(e) => productForm.setData("product_name", e.target.value)}
              placeholder={t("product.enter_product_name", "Enter product name")}
            />
            {errors.product_name && <p className="text-sm text-error mt-1">{errors.product_name}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              {t("product.from_product_code", "Product Code")}*
            </legend>
            <input
              type="text"
              className={`input ${errors.product_no ? "input-error" : ""}`}
              value={productForm.data.product_no}
              onChange={(e) => productForm.setData("product_no", e.target.value)}
              placeholder={t("product.enter_product_code", "Enter product code")}
            />
            {errors.product_no && <p className="text-sm text-error mt-1">{errors.product_no}</p>}
          </fieldset>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("product.from_category", "Category")}*</legend>
              <select
                value={productForm.data.category_id}
                className={`select ${errors.category_id ? "select-error" : ""}`}
                onChange={(e) => productForm.setData("category_id", e.target.value)}
              >
                <option value="">{t("product.pick_category", "--Pick a category--")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-sm text-error mt-1">{errors.category_id}</p>}
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("product.from_brand", "Brand")}</legend>
              <select
                value={productForm.data.brand_id}
                className="select"
                onChange={(e) => productForm.setData("brand_id", e.target.value)}
              >
                <option value="">{t("product.pick_brand", "--Pick a brand--")}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>

          <fieldset className="fieldset col-span-2">
            <legend className="fieldset-legend">{t("product.from_description", "Description")}</legend>
            <textarea
              className="textarea"
              rows="3"
              value={productForm.data.description}
              onChange={(e) => productForm.setData("description", e.target.value)}
              placeholder={t("product.enter_description", "Enter product description")}
            />
          </fieldset>
        </div>

        {/* In-House settings (same as your code) */}
        {productType === "in_house" && (
          <div className="border border-warning rounded-box p-4 mb-6 bg-warning/5">
            {/* keep your existing in-house UI here (no change needed) */}
            <h3 className="text-lg font-semibold text-warning mb-4 flex items-center gap-2">
              <Factory size={20} />
              {t("product.in_house_settings", "In-House Production Settings")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.production_cost", "Production Cost")} *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${errors.in_house_cost ? "input-error" : ""}`}
                  value={productForm.data.in_house_cost}
                  onChange={(e) => productForm.setData("in_house_cost", parseFloat(e.target.value) || 0)}
                  required
                />
                {errors.in_house_cost && <p className="text-sm text-error mt-1">{errors.in_house_cost}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.shadow_production_cost", "Shadow Production Cost")} *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${errors.in_house_shadow_cost ? "input-error" : ""}`}
                  value={productForm.data.in_house_shadow_cost}
                  onChange={(e) => productForm.setData("in_house_shadow_cost", parseFloat(e.target.value) || 0)}
                  required
                />
                {errors.in_house_shadow_cost && (
                  <p className="text-sm text-error mt-1">{errors.in_house_shadow_cost}</p>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.sale_price", "Sale Price")} *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${errors.in_house_sale_price ? "input-error" : ""}`}
                  value={productForm.data.in_house_sale_price}
                  onChange={(e) => productForm.setData("in_house_sale_price", parseFloat(e.target.value) || 0)}
                  required
                />
                {errors.in_house_sale_price && <p className="text-sm text-error mt-1">{errors.in_house_sale_price}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.shadow_sale_price", "Shadow Sale Price")} *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${errors.in_house_shadow_sale_price ? "input-error" : ""}`}
                  value={productForm.data.in_house_shadow_sale_price}
                  onChange={(e) =>
                    productForm.setData("in_house_shadow_sale_price", parseFloat(e.target.value) || 0)
                  }
                  required
                />
                {errors.in_house_shadow_sale_price && (
                  <p className="text-sm text-error mt-1">{errors.in_house_shadow_sale_price}</p>
                )}
              </div>

              <div className="form-control md:col-span-2 lg:col-span-1">
                <label className="label">
                  <span className="label-text">{t("product.initial_stock", "Initial Stock Quantity")} *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`input input-bordered ${errors.in_house_initial_stock ? "input-error" : ""}`}
                  value={productForm.data.in_house_initial_stock}
                  onChange={(e) => productForm.setData("in_house_initial_stock", parseInt(e.target.value) || 0)}
                  required
                />
                {errors.in_house_initial_stock && (
                  <p className="text-sm text-error mt-1">{errors.in_house_initial_stock}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Variants Section (same as your code, unchanged logic) */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {t("product.product_variants", "Product Variants")}
              <span className="badge badge-primary badge-sm ml-2">{variants.length}</span>
            </h3>

            <button type="button" className="btn btn-sm btn-outline" onClick={handleAddVariant}>
              <Plus size={14} />
              {t("product.add_variant", "Add Variant")}
            </button>
          </div>

          {errors.variants && (
            <div className="alert alert-error mb-4">
              <span>{errors.variants}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {variants.map((variant, index) => (
              <div key={index} className="border border-gray-300 p-4 rounded-box bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-700">
                      {t("product.variant", "Variant")} #{index + 1}
                    </h4>
                    {variant.id && <span className="badge badge-sm badge-outline">ID: {variant.id}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {Object.keys(variant.attribute_values || {}).length > 0 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-warning btn-outline"
                        onClick={() => handleClearVariantAttributes(index)}
                        title={t("product.clear_attributes", "Clear attributes")}
                      >
                        <X size={12} />
                      </button>
                    )}

                    {variants.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-error btn-outline"
                        onClick={() => handleDeleteVariant(index)}
                        title={t("product.delete_variant", "Delete variant")}
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="label py-1">
                    <span className="label-text font-medium">{t("product.variant_attributes", "Variant Attributes")}</span>
                  </label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {variant.attribute_values &&
                      Object.entries(variant.attribute_values).map(([attribute, value]) => (
                        <span key={attribute} className="badge badge-outline badge-primary">
                          <span className="font-medium">{attribute}:</span> {value}
                        </span>
                      ))}

                    {(!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) && (
                      <div className="text-sm text-gray-500 italic">
                        {t("product.no_attributes_selected", "No attributes selected")}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn bg-[#1e4d2b] text-white btn-sm"
                    onClick={() => openVariantAttributeSelector(index)}
                  >
                    {variant.attribute_values && Object.keys(variant.attribute_values).length > 0
                      ? t("product.edit_attributes", "Edit Attributes")
                      : t("product.select_attributes", "Select Attributes")}
                  </button>
                </div>

                {variantAttributeSelector === index && (
                  <div className="border border-gray-300 p-4 rounded-box bg-gray-50 mb-4 mt-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">
                        {t("product.select_attributes_for", "Select Attributes for")} Variant #{index + 1}
                      </h4>
                      <button type="button" className="btn btn-xs btn-circle" onClick={closeVariantAttributeSelector}>
                        <X size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableAttributes.map((attribute) => (
                        <div key={attribute.code} className="border rounded-box p-3">
                          <h5 className="font-medium mb-2">{attribute.name}</h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {attribute.active_values?.map((value) => (
                              <label
                                key={value.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={variant.attribute_values && variant.attribute_values[attribute.code] === value.value}
                                  onChange={(e) =>
                                    handleVariantAttributeSelect(index, attribute.code, value.value, e.target.checked)
                                  }
                                  className="checkbox checkbox-sm checkbox-primary"
                                />
                                <span className="text-sm">{value.value}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end items-center mt-4">
                      <button type="button" className="btn bg-[#1e4d2b] text-white btn-sm" onClick={closeVariantAttributeSelector}>
                        {t("product.done", "Done")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="border-t pt-6 mt-6">
          <div className="flex justify-end">
            <button
              className={`btn ${productType === "in_house" ? "btn-warning" : "bg-[#1e4d2b] text-white"}`}
              type="submit"
              disabled={productForm.processing}
            >
              {productForm.processing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t("product.saving", "Saving...")}
                </>
              ) : (
                <>
                  {update ? t("product.update_product", "Update Product") : t("product.save_product", "Save Product")}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
