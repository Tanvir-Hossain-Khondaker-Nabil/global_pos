import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { Trash, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
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

    const productForm = useForm({
        id: update ? update.id : "",
        product_name: update ? update.name : "",
        category_id: update ? update.category_id : "",
        product_no: update ? update.product_no : "",
        description: update ? update.description : "",
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
    }, [category, attributes]);

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

    // Form submission
    const formSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            toast.error(t('product.fix_validation_errors', 'Please fix the validation errors'));
            return;
        }

        const submitData = {
            id: productForm.data.id,
            product_name: productForm.data.product_name,
            category_id: productForm.data.category_id,
            product_no: productForm.data.product_no,
            description: productForm.data.description,
            variants: variants.map(variant => ({
                id: variant.id,
                attribute_values: variant.attribute_values,
            }))
        };

        console.log('Submitting data:', submitData);

        const url = update ? route("product.add.post") : route("product.add.post");
        
        productForm.post(url, {
            data: submitData,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(update 
                    ? t('product.product_updated_success', 'Product updated successfully!')
                    : t('product.product_added_success', 'Product added successfully!')
                );
                if (!update) {
                    productForm.reset();
                    setVariants([{ attribute_values: {}}]);
                    setSelectedAttributes({});
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
                {/* Product Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">
                            {t('product.from_product_name', 'Product Name')}*
                        </legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_name}
                            onChange={(e) =>
                                productForm.setData("product_name", e.target.value)
                            }
                            placeholder={t('product.enter_product_name', 'Enter product name')}
                        />
                        {errors.product_name && (
                            <p className="text-sm text-error">{errors.product_name}</p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('product.from_category', 'Category')}*
                        </legend>
                        <select
                            value={productForm.data.category_id}
                            className="select"
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
                            <p className="text-sm text-error">{errors.category_id}</p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('product.from_product_code', 'Product Code')}*
                        </legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_no}
                            onChange={(e) =>
                                productForm.setData("product_no", e.target.value)
                            }
                            placeholder={t('product.enter_product_code', 'Enter product code')}
                        />
                        {errors.product_no && (
                            <p className="text-sm text-error">{errors.product_no}</p>
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
                                                <label key={value.id} className="flex items-center space-x-2">
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
                                                        className="checkbox checkbox-sm"
                                                    />
                                                    <span className="text-sm">{value.value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end mt-4">
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
                                    <div key={attributeCode} className="badge badge-primary">
                                        {attributeCode}: {values.map(v => v.value).join(', ')}
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
                            {t('product.product_variants', 'Product Variants')} ({variants.length})
                        </h3>
                    </div>

                    {errors.variants && (
                        <p className="text-red-500 text-sm mb-4">{errors.variants}</p>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {variants.map((variant, index) => (
                            <div
                                key={index}
                                className="border border-gray-300 p-4 rounded-box bg-gray-50"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-gray-700">
                                        {t('product.variant', 'Variant')} #{index + 1}
                                        {variant.id && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                (ID: {variant.id})
                                            </span>
                                        )}
                                    </h4>
                                </div>

                                {/* Display selected attributes for this variant */}
                                <div className="mb-3">
                                    <div className="flex flex-wrap gap-2">
                                        {variant.attribute_values && Object.entries(variant.attribute_values).map(([attribute, value]) => (
                                            <span key={attribute} className="badge badge-outline">
                                                {attribute}: {value}
                                            </span>
                                        ))}
                                        {(!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) && (
                                            <span className="text-sm text-gray-500">
                                                {t('product.no_attributes_selected', 'No attributes selected')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {errors[`variant-${index}`] && (
                                    <p className="text-red-500 text-sm mt-2">
                                        {errors[`variant-${index}`]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    className="btn btn-primary mt-6" 
                    type="submit"
                    disabled={productForm.processing}
                >
                    {productForm.processing 
                        ? t('product.saving', 'Saving...')
                        : (update 
                            ? t('product.update_product', 'Update Product') 
                            : t('product.save_product', 'Save Product')
                          )
                    }
                </button>
            </form>
        </div>
    );
}