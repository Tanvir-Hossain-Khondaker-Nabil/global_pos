import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { Trash, X, Plus, ChevronDown, ChevronUp, Factory, Package } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddProduct({ category, update, attributes }) {
    const { t, locale } = useTranslation();
    const [variants, setVariants] = useState([]);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [showAttributeSelector, setShowAttributeSelector] = useState(false);
    const [productType, setProductType] = useState('regular');

    const productForm = useForm({
        id: update ? update.id : "",
        product_name: update ? update.name : "",
        category_id: update ? update.category_id : "",
        product_no: update ? update.product_no : "",
        description: update ? update.description : "",
        product_type: update ? update.product_type : 'regular',
        in_house_cost: update ? update.in_house_cost || 0 : 0,
        in_house_shadow_cost: update ? update.in_house_shadow_cost || 0 : 0,
        in_house_sale_price: update ? update.in_house_sale_price || 0 : 0,
        in_house_shadow_sale_price: update ? update.in_house_shadow_sale_price || 0 : 0,
        in_house_initial_stock: update ? update.in_house_initial_stock || 0 : 0,
        variants: [],
    });

    // Process categories and attributes data
    useEffect(() => {
        if (Array.isArray(category)) {
            setCategories(category);
        } else if (category && typeof category === 'object') {
            if (category.data && Array.isArray(category.data)) {
                setCategories(category.data);
            } else {
                const categoriesArray = Object.entries(category).map(([id, name]) => ({
                    id: id,
                    name: name
                }));
                setCategories(categoriesArray);
            }
        } else {
            setCategories([]);
        }

        // Process attributes
        if (attributes && Array.isArray(attributes)) {
            setAvailableAttributes(attributes);
        }

        // Set product type if editing
        if (update && update.product_type) {
            setProductType(update.product_type);
        }
    }, [category, attributes, update]);

    // Generate variants based on selected attribute combinations
    const generateVariants = () => {
        const selectedValues = Object.values(selectedAttributes).filter(arr => arr.length > 0);

        if (selectedValues.length === 0) {
            // If no attributes selected, create one default variant
            setVariants([{
                id: null,
                attribute_values: {}
            }]);
            return;
        }

        // Generate all combinations of selected attribute values
        const combinations = selectedValues.reduce((acc, curr) => {
            if (acc.length === 0) return curr.map(val => [val]);
            return acc.flatMap(comb =>
                curr.map(val => [...comb, val])
            );
        }, []);

        const newVariants = combinations.map(combination => {
            const attributeValues = {};
            combination.forEach(item => {
                attributeValues[item.attribute_code] = item.value;
            });

            return {
                id: null,
                attribute_values: attributeValues,
            };
        });

        setVariants(newVariants);
    };

    // Handle attribute selection
    const handleAttributeSelect = (attributeCode, value, checked) => {
        setSelectedAttributes(prev => {
            const newSelection = { ...prev };

            if (checked) {
                if (!newSelection[attributeCode]) {
                    newSelection[attributeCode] = [];
                }
                newSelection[attributeCode].push(value);
            } else {
                newSelection[attributeCode] = newSelection[attributeCode]?.filter(
                    item => item.value !== value.value
                ) || [];

                if (newSelection[attributeCode].length === 0) {
                    delete newSelection[attributeCode];
                }
            }

            return newSelection;
        });
    };

    // Apply selected attributes to generate variants
    const applyAttributeSelection = () => {
        generateVariants();
        setShowAttributeSelector(false);
    };

    // Product type change handler
    const handleProductTypeChange = (type) => {
        setProductType(type);
        productForm.setData("product_type", type);

        // Reset in-house fields if switching to regular
        if (type === 'regular') {
            const resetData = {
                in_house_cost: 0,
                in_house_shadow_cost: 0,
                in_house_sale_price: 0,
                in_house_shadow_sale_price: 0,
                in_house_initial_stock: 0,
            };
            productForm.setData(resetData);

            // Also clear any related errors
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.in_house_cost;
                delete newErrors.in_house_shadow_cost;
                delete newErrors.in_house_sale_price;
                delete newErrors.in_house_shadow_sale_price;
                delete newErrors.in_house_initial_stock;
                return newErrors;
            });
        }
    };

    // Update variant field
    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    // Add empty variant manually
    const handleAddVariant = () => {
        setVariants([
            ...variants,
            {
                id: null,
                attribute_values: {},
            },
        ]);
    };

    // Delete variant
    const handleDeleteVariant = (index) => {
        if (variants.length > 1) {
            const updated = [...variants];
            updated.splice(index, 1);
            setVariants(updated);
        }
    };

    // Form validation
    const validateForm = () => {
        let hasError = false;
        let newErrors = {};

        if (!productForm.data.product_name?.trim()) {
            hasError = true;
            newErrors.product_name = t('product.product_name_required', 'Product name is required');
        }

        if (!productForm.data.category_id) {
            hasError = true;
            newErrors.category_id = t('product.category_required', 'Category is required');
        }

        if (!productForm.data.product_no?.trim()) {
            hasError = true;
            newErrors.product_no = t('product.product_code_required', 'Product code is required');
        }

        // Validate product type specific fields
        if (productType === 'in_house') {
            if (!productForm.data.in_house_cost || productForm.data.in_house_cost <= 0) {
                hasError = true;
                newErrors.in_house_cost = t('product.production_cost_required', 'Production cost is required');
            }

            if (!productForm.data.in_house_shadow_cost || productForm.data.in_house_shadow_cost <= 0) {
                hasError = true;
                newErrors.in_house_shadow_cost = t('product.shadow_cost_required', 'Shadow production cost is required');
            }

            if (!productForm.data.in_house_sale_price || productForm.data.in_house_sale_price <= 0) {
                hasError = true;
                newErrors.in_house_sale_price = t('product.sale_price_required', 'Sale price is required');
            }

            if (!productForm.data.in_house_shadow_sale_price || productForm.data.in_house_shadow_sale_price <= 0) {
                hasError = true;
                newErrors.in_house_shadow_sale_price = t('product.shadow_sale_price_required', 'Shadow sale price is required');
            }

            if (productForm.data.in_house_initial_stock < 0) {
                hasError = true;
                newErrors.in_house_initial_stock = t('product.initial_stock_invalid', 'Initial stock cannot be negative');
            }
        }

        // Validate variants - check if at least one variant has attributes
        const hasValidVariants = variants.some(variant =>
            variant.attribute_values && Object.keys(variant.attribute_values).length > 0
        );

        if (!hasValidVariants) {
            hasError = true;
            newErrors.variants = t('product.variants_required', 'At least one variant must have attributes selected');
        }

        // Check each variant
        variants.forEach((variant, index) => {
            if (!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) {
                hasError = true;
                newErrors[`variant-${index}`] = t('product.variant_attributes_required', 'Please select attributes for this variant');
            }
        });

        setErrors(newErrors);
        return hasError;
    };

    // Form submission - FIXED VERSION
    const formSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            toast.error(t('product.fix_validation_errors', 'Please fix the validation errors'));
            return;
        }

        // Prepare form data
        const formData = {
            id: productForm.data.id,
            product_name: productForm.data.product_name,
            category_id: productForm.data.category_id,
            product_no: productForm.data.product_no,
            description: productForm.data.description,
            product_type: productType,
            variants: variants.map(variant => ({
                id: variant.id,
                attribute_values: variant.attribute_values,
            }))
        };

        // Add in-house specific data
        if (productType === 'in_house') {
            formData.in_house_cost = productForm.data.in_house_cost;
            formData.in_house_shadow_cost = productForm.data.in_house_shadow_cost;
            formData.in_house_sale_price = productForm.data.in_house_sale_price;
            formData.in_house_shadow_sale_price = productForm.data.in_house_shadow_sale_price;
            formData.in_house_initial_stock = productForm.data.in_house_initial_stock;
        }

        console.log('Submitting data:', formData);

        const url = update ? route("product.update.post") : route("product.add.post");

        // FIXED: Send data directly, not wrapped in "data" key
        productForm.post(url, {
            ...formData,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(update
                    ? t('product.product_updated_success', 'Product updated successfully!')
                    : t('product.product_added_success', 'Product added successfully!')
                );
                if (!update) {
                    productForm.reset();
                    setVariants([{ attribute_values: {} }]);
                    setSelectedAttributes({});
                    setProductType('regular');
                }
            },
            onError: (errors) => {
                toast.error(t('product.something_went_wrong', 'Something went wrong. Please try again!'));
                console.error('Form errors:', errors);
            },
        });
    };

    // Sync variants with form data
    useEffect(() => {
        productForm.setData("variants", variants);
    }, [variants]);

    // Load existing data for editing
    useEffect(() => {
        if (update) {
            console.log('Update data received:', update);

            productForm.setData({
                id: update.id || "",
                product_name: update.name || "",
                category_id: update.category_id || "",
                product_no: update.product_no || "",
                description: update.description || "",
                product_type: update.product_type || 'regular',
                in_house_cost: update.in_house_cost || 0,
                in_house_shadow_cost: update.in_house_shadow_cost || 0,
                in_house_sale_price: update.in_house_sale_price || 0,
                in_house_shadow_sale_price: update.in_house_shadow_sale_price || 0,
                in_house_initial_stock: update.in_house_initial_stock || 0,
            });

            if (update.variants && update.variants.length > 0) {
                const mappedVariants = update.variants.map(variant => ({
                    id: variant.id || null,
                    attribute_values: variant.attribute_values || {},
                }));
                setVariants(mappedVariants);

                // Pre-select attributes for editing
                const selectedAttrs = {};
                mappedVariants.forEach(variant => {
                    Object.entries(variant.attribute_values || {}).forEach(([attrCode, value]) => {
                        if (!selectedAttrs[attrCode]) {
                            selectedAttrs[attrCode] = [];
                        }
                        if (!selectedAttrs[attrCode].some(item => item.value === value)) {
                            selectedAttrs[attrCode].push({
                                value: value,
                                attribute_code: attrCode
                            });
                        }
                    });
                });
                setSelectedAttributes(selectedAttrs);
            } else {
                setVariants([{ attribute_values: {} }]);
            }
        } else {
            setVariants([{ attribute_values: {} }]);
        }
    }, [update]);

    // Auto-generate variants when selectedAttributes changes
    useEffect(() => {
        if (Object.keys(selectedAttributes).length > 0) {
            generateVariants();
        }
    }, [selectedAttributes]);

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={update
                    ? t('product.update_title', 'Update Product')
                    : t('product.from_title', 'Add New Product')
                }
                subtitle={t('product.subtitle', 'Add or update product with variants')}
            />

            <form onSubmit={formSubmit}>
                {/* Product Type Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">
                        {t('product.product_type', 'Product Type')} *
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`card cursor-pointer border-2 ${productType === 'regular' ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'}`}>
                            <div className="card-body p-4">
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        name="product_type"
                                        value="regular"
                                        checked={productType === 'regular'}
                                        onChange={(e) => handleProductTypeChange(e.target.value)}
                                        className="radio radio-primary mt-1"
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Package size={20} className="text-primary" />
                                            <h4 className="font-semibold">{t('product.regular_product', 'Regular Product')}</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {t('product.regular_desc', 'Purchase from supplier, needs stock management through purchase orders')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </label>

                        <label className={`card cursor-pointer border-2 ${productType === 'in_house' ? 'border-warning bg-warning/5' : 'border-base-300 hover:border-warning/50'}`}>
                            <div className="card-body p-4">
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        name="product_type"
                                        value="in_house"
                                        checked={productType === 'in_house'}
                                        onChange={(e) => handleProductTypeChange(e.target.value)}
                                        className="radio radio-warning mt-1"
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Factory size={20} className="text-warning" />
                                            <h4 className="font-semibold text-warning">{t('product.in_house_product', 'In-House Production')}</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {t('product.in_house_desc', 'Internally produced, auto-stock management in In-House warehouse')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Product Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">
                            {t('product.from_product_name', 'Product Name')}*
                        </legend>
                        <input
                            type="text"
                            className={`input ${errors.product_name ? 'input-error' : ''}`}
                            value={productForm.data.product_name}
                            onChange={(e) =>
                                productForm.setData("product_name", e.target.value)
                            }
                            placeholder={t('product.enter_product_name', 'Enter product name')}
                        />
                        {errors.product_name && (
                            <p className="text-sm text-error mt-1">{errors.product_name}</p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('product.from_category', 'Category')}*
                        </legend>
                        <select
                            value={productForm.data.category_id}
                            className={`select ${errors.category_id ? 'select-error' : ''}`}
                            onChange={(e) =>
                                productForm.setData("category_id", e.target.value)
                            }
                        >
                            <option value="">
                                {t('product.pick_category', '--Pick a category--')}
                            </option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="text-sm text-error mt-1">{errors.category_id}</p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('product.from_product_code', 'Product Code')}*
                        </legend>
                        <input
                            type="text"
                            className={`input ${errors.product_no ? 'input-error' : ''}`}
                            value={productForm.data.product_no}
                            onChange={(e) =>
                                productForm.setData("product_no", e.target.value)
                            }
                            placeholder={t('product.enter_product_code', 'Enter product code')}
                        />
                        {errors.product_no && (
                            <p className="text-sm text-error mt-1">{errors.product_no}</p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">
                            {t('product.from_description', 'Description')}
                        </legend>
                        <textarea
                            className="textarea"
                            rows="3"
                            value={productForm.data.description}
                            onChange={(e) =>
                                productForm.setData("description", e.target.value)
                            }
                            placeholder={t('product.enter_description', 'Enter product description')}
                        />
                    </fieldset>
                </div>

                {/* In-House Product Settings */}
                {productType === 'in_house' && (
                    <div className="border border-warning rounded-box p-4 mb-6 bg-warning/5">
                        <h3 className="text-lg font-semibold text-warning mb-4 flex items-center gap-2">
                            <Factory size={20} />
                            {t('product.in_house_settings', 'In-House Production Settings')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('product.production_cost', 'Production Cost')} *</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={`input input-bordered ${errors.in_house_cost ? 'input-error' : ''}`}
                                    value={productForm.data.in_house_cost}
                                    onChange={(e) => productForm.setData("in_house_cost", parseFloat(e.target.value) || 0)}
                                    required
                                />
                                {errors.in_house_cost && (
                                    <p className="text-sm text-error mt-1">{errors.in_house_cost}</p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('product.shadow_production_cost', 'Shadow Production Cost')} *</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={`input input-bordered ${errors.in_house_shadow_cost ? 'input-error' : ''}`}
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
                                    <span className="label-text">{t('product.sale_price', 'Sale Price')} *</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={`input input-bordered ${errors.in_house_sale_price ? 'input-error' : ''}`}
                                    value={productForm.data.in_house_sale_price}
                                    onChange={(e) => productForm.setData("in_house_sale_price", parseFloat(e.target.value) || 0)}
                                    required
                                />
                                {errors.in_house_sale_price && (
                                    <p className="text-sm text-error mt-1">{errors.in_house_sale_price}</p>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{t('product.shadow_sale_price', 'Shadow Sale Price')} *</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={`input input-bordered ${errors.in_house_shadow_sale_price ? 'input-error' : ''}`}
                                    value={productForm.data.in_house_shadow_sale_price}
                                    onChange={(e) => productForm.setData("in_house_shadow_sale_price", parseFloat(e.target.value) || 0)}
                                    required
                                />
                                {errors.in_house_shadow_sale_price && (
                                    <p className="text-sm text-error mt-1">{errors.in_house_shadow_sale_price}</p>
                                )}
                            </div>

                            <div className="form-control md:col-span-2 lg:col-span-1">
                                <label className="label">
                                    <span className="label-text">{t('product.initial_stock', 'Initial Stock Quantity')} *</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className={`input input-bordered ${errors.in_house_initial_stock ? 'input-error' : ''}`}
                                    value={productForm.data.in_house_initial_stock}
                                    onChange={(e) => productForm.setData("in_house_initial_stock", parseInt(e.target.value) || 0)}
                                    required
                                />
                                {errors.in_house_initial_stock && (
                                    <p className="text-sm text-error mt-1">{errors.in_house_initial_stock}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-warning/10 rounded-box">
                            <p className="text-sm text-warning flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>
                                    {t('product.in_house_note', 'Note: This product will be automatically added to "In-House Production" warehouse with the specified initial stock quantity. No purchase order needed. Stock will be managed internally.')}
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Attribute Selection */}
                <div className="border-t pt-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            {t('product.product_attributes', 'Product Attributes')}
                        </h3>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowAttributeSelector(!showAttributeSelector)}
                        >
                            {showAttributeSelector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {showAttributeSelector
                                ? t('product.hide_attributes', 'Hide Attributes')
                                : t('product.select_attributes', 'Select Attributes')
                            }
                        </button>
                    </div>

                    {showAttributeSelector && (
                        <div className="border border-gray-300 p-4 rounded-box bg-gray-50 mb-4">
                            <h4 className="font-semibold mb-3">
                                {t('product.select_attribute_values', 'Select Attribute Values')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableAttributes.map((attribute) => (
                                    <div key={attribute.code} className="border rounded-box p-3">
                                        <h5 className="font-medium mb-2">{attribute.name}</h5>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {attribute.active_values?.map((value) => (
                                                <label key={value.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAttributes[attribute.code]?.some(
                                                            item => item.value === value.value
                                                        ) || false}
                                                        onChange={(e) =>
                                                            handleAttributeSelect(
                                                                attribute.code,
                                                                { value: value.value, attribute_code: attribute.code },
                                                                e.target.checked
                                                            )
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
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-gray-500">
                                    {t('product.selected_count', 'Selected')}: {Object.keys(selectedAttributes).length} {t('product.attributes', 'attributes')}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={applyAttributeSelection}
                                >
                                    {t('product.apply_attributes', 'Apply Attributes')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Selected Attributes Summary */}
                    {Object.keys(selectedAttributes).length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">
                                {t('product.selected_attributes', 'Selected Attributes')}:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(selectedAttributes).map(([attributeCode, values]) => (
                                    <div key={attributeCode} className="badge badge-primary gap-1">
                                        <span className="font-medium">{attributeCode}:</span>
                                        <span>{values.map(v => v.value).join(', ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Variants Section */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            {t('product.product_variants', 'Product Variants')}
                            <span className="badge badge-primary badge-sm ml-2">{variants.length}</span>
                        </h3>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={handleAddVariant}
                        >
                            <Plus size={14} />
                            {t('product.add_variant', 'Add Variant')}
                        </button>
                    </div>

                    {errors.variants && (
                        <div className="alert alert-error mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{errors.variants}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {variants.map((variant, index) => (
                            <div
                                key={index}
                                className="border border-gray-300 p-4 rounded-box bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-700">
                                            {t('product.variant', 'Variant')} #{index + 1}
                                        </h4>
                                        {variant.id && (
                                            <span className="badge badge-sm badge-outline">
                                                ID: {variant.id}
                                            </span>
                                        )}
                                    </div>
                                    {variants.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-error btn-outline"
                                            onClick={() => handleDeleteVariant(index)}
                                            title={t('product.delete_variant', 'Delete variant')}
                                        >
                                            <Trash size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Display selected attributes for this variant */}
                                <div className="mb-3">
                                    <label className="label py-1">
                                        <span className="label-text font-medium">
                                            {t('product.variant_attributes', 'Variant Attributes')}
                                        </span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {variant.attribute_values && Object.entries(variant.attribute_values).map(([attribute, value]) => (
                                            <span key={attribute} className="badge badge-outline badge-primary">
                                                <span className="font-medium">{attribute}:</span> {value}
                                            </span>
                                        ))}
                                        {(!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) && (
                                            <div className="text-sm text-gray-500 italic">
                                                {t('product.no_attributes_selected', 'No attributes selected')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {errors[`variant-${index}`] && (
                                    <div className="alert alert-warning mt-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <span>{errors[`variant-${index}`]}</span>
                                    </div>
                                )}

                                {/* Cost and Price information for in-house variants */}
                                {productType === 'in_house' && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <label className="label py-1">
                                            <span className="label-text font-medium text-warning">
                                                {t('product.variant_pricing', 'Variant Pricing')}
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="text-sm">
                                                <div className="flex justify-between mb-1">
                                                    <span>{t('product.production_cost', 'Production Cost')}:</span>
                                                    <span className="font-semibold">৳{parseFloat(productForm.data.in_house_cost || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between mb-1">
                                                    <span>{t('product.shadow_cost', 'Shadow Cost')}:</span>
                                                    <span className="font-semibold text-warning">৳{parseFloat(productForm.data.in_house_shadow_cost || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="text-sm">
                                                <div className="flex justify-between mb-1">
                                                    <span>{t('product.sale_price', 'Sale Price')}:</span>
                                                    <span className="font-semibold">৳{parseFloat(productForm.data.in_house_sale_price || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t('product.shadow_sale_price', 'Shadow Sale Price')}:</span>
                                                    <span className="font-semibold text-warning">৳{parseFloat(productForm.data.in_house_shadow_sale_price || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary and Submit Button */}
                <div className="border-t pt-6 mt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold">{t('product.summary', 'Summary')}</h4>
                            <p className="text-sm text-gray-500">
                                {variants.length} {t('product.variant_count', variants.length === 1 ? 'variant' : 'variants')}
                                {productType === 'in_house' && (
                                    <span className="ml-2 text-warning font-medium">
                                        • {t('product.in_house_product', 'In-House Product')}
                                    </span>
                                )}
                            </p>
                        </div>

                        <button
                            className={`btn ${productType === 'in_house' ? 'btn-warning' : 'btn-primary'}`}
                            type="submit"
                            disabled={productForm.processing}
                        >
                            {productForm.processing ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {t('product.saving', 'Saving...')}
                                </>
                            ) : (
                                <>
                                    {update
                                        ? t('product.update_product', 'Update Product')
                                        : t('product.save_product', 'Save Product')
                                    }
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}