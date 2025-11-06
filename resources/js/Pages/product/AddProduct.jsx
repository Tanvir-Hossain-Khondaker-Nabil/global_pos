import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm } from "@inertiajs/react";
import { Trash, X, Plus } from "lucide-react";
import { toast } from "react-toastify";

export default function AddProduct({ category, update }) {
    const [variants, setVariants] = useState([]);
    const [errors, setErrors] = useState({});

    // Initialize form
    const productForm = useForm({
        id: update ? update.id : "",
        product_name: update ? update.name : "",
        category: update ? update.category_id : "",
        product_code: update ? update.product_no : "",
        description: update ? update.description : "",
        variants: [],
    });

    // Add new variant
    const handleAddVariant = () => {
        setVariants([
            ...variants,
            {
                id: null,
                size: "",
                color: "",
            },
        ]);
    };

    // Delete variant
    const handleDeleteVariant = (index) => {
        const updated = [...variants];
        updated.splice(index, 1);
        setVariants(updated);
    };

    // Update variant field
    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index][field] = value;
        setVariants(updated);
    };

    // Form validation
    const validateForm = () => {
        let hasError = false;
        let newErrors = {};

        // Validate main product fields
        if (!productForm.data.product_name?.trim()) {
            hasError = true;
            newErrors.product_name = "Product name is required";
        }

        if (!productForm.data.category) {
            hasError = true;
            newErrors.category = "Category is required";
        }

        if (!productForm.data.product_code?.trim()) {
            hasError = true;
            newErrors.product_code = "Product code is required";
        }

        // Validate variants
        variants.forEach((variant, index) => {
            // At least one of size or color must be provided
            if (!variant.size?.trim() && !variant.color?.trim()) {
                hasError = true;
                newErrors[`variant-${index}`] = "Either size or color is required";
            }
        });

        // Check if at least one variant exists
        if (variants.length === 0) {
            hasError = true;
            newErrors.variants = "At least one variant is required";
        }

        setErrors(newErrors);
        return hasError;
    };

    // Form submission
    const formSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            toast.error("Please fix the validation errors");
            return;
        }

        // Prepare the data for submission
        const submitData = {
            ...productForm.data,
            variants: variants.map(variant => ({
                ...variant,
            }))
        };

        productForm.data = submitData;

        const url = update ? route("product.update.post") : route("product.add.post");
        
        productForm.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Product ${update ? 'updated' : 'added'} successfully!`);
                if (!update) {
                    // Reset form for new products
                    productForm.reset();
                    setVariants([{
                        id: null,
                        size: "",
                        color: "",
                    }]);
                }
            },
            onError: (errors) => {
                toast.error("Something went wrong. Please try again!");
                console.error(errors);
            },
        });
    };

    // Sync variants with form data
    useEffect(() => {
        productForm.setData("variants", variants);
    }, [variants]);

    // Load existing data for editing
    useEffect(() => {
        if (update && update.variants?.length > 0) {
            const mappedVariants = update.variants.map(variant => ({
                id: variant.id,
                size: variant.size || "",
                color: variant.color || "",
            }));
            setVariants(mappedVariants);
        } else if (!update) {
            // Add one empty variant for new products
            handleAddVariant();
        }
    }, [update]);

    // Debug: Check if category data is received
    useEffect(() => {
        console.log('Category data:', category);
        console.log('Update data:', update);
    }, [category, update]);

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={update ? "Update Product" : "Add New Product"}
                subtitle="Add or update product with variants"
            />

            <form onSubmit={formSubmit}>
                {/* Product Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">Product Name*</legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_name}
                            onChange={(e) =>
                                productForm.setData("product_name", e.target.value)
                            }
                            placeholder="Enter product name"
                        />
                        {errors.product_name && (
                            <p className="text-sm text-error">
                                {errors.product_name}
                            </p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Category*</legend>
                        <select
                            value={productForm.data.category}
                            className="select"
                            onChange={(e) =>
                                productForm.setData("category", e.target.value)
                            }
                        >
                            <option value="">--Pick a category--</option>
                            {category && Object.entries(category).map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="text-sm text-error">
                                {errors.category}
                            </p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Product Code*</legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_code}
                            onChange={(e) =>
                                productForm.setData("product_code", e.target.value)
                            }
                            placeholder="Enter product code"
                        />
                        {errors.product_code && (
                            <p className="text-sm text-error">
                                {errors.product_code}
                            </p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">Description</legend>
                        <textarea
                            className="textarea"
                            rows="3"
                            value={productForm.data.description}
                            onChange={(e) =>
                                productForm.setData("description", e.target.value)
                            }
                            placeholder="Enter product description"
                        />
                    </fieldset>
                </div>

                {/* Variants Section */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Product Variants</h3>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleAddVariant}
                        >
                            <Plus size={16} className="mr-1" />
                            Add Variant
                        </button>
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
                                        Variant #{index + 1}
                                    </h4>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-circle btn-error"
                                        onClick={() => handleDeleteVariant(index)}
                                        disabled={variants.length === 1}
                                    >
                                        <Trash size={12} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Size Input */}
                                    <div>
                                        <label className="label">
                                            <span className="label-text">Size</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={variant.size}
                                            onChange={(e) =>
                                                handleVariantChange(index, "size", e.target.value)
                                            }
                                            placeholder="e.g., M, L, XL"
                                        />
                                    </div>

                                    {/* Color Input */}
                                    <div>
                                        <label className="label">
                                            <span className="label-text">Color</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={variant.color}
                                            onChange={(e) =>
                                                handleVariantChange(index, "color", e.target.value)
                                            }
                                            placeholder="e.g., Red, Blue"
                                        />
                                    </div>

                                </div>

                                {/* Variant Error */}
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
                    {productForm.processing ? "Saving..." : (update ? "Update Product" : "Save Product")}
                </button>
            </form>
        </div>
    );
}