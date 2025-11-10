import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { Trash, X, Plus } from "lucide-react";
import { toast } from "react-toastify";

export default function AddProduct({ category, update }) {
    const [variants, setVariants] = useState([]);
    const [errors, setErrors] = useState({});
    const [categories, setCategories] = useState([]);

    // Initialize form
    const productForm = useForm({
        id: update ? update.id : "",
        product_name: update ? update.name : "",
        category_id: update ? update.category_id : "",
        product_no: update ? update.product_no : "",
        description: update ? update.description : "",
        variants: [],
    });

    // Process categories data - FIXED: Handle different data formats
    useEffect(() => {
        console.log('Raw category data:', category);
        
        if (Array.isArray(category)) {
            // If category is already an array
            setCategories(category);
        } else if (category && typeof category === 'object') {
            // If category is an object, convert to array
            if (category.data && Array.isArray(category.data)) {
                // If it's a paginated response
                setCategories(category.data);
            } else {
                // If it's a plain object, convert to array of objects
                const categoriesArray = Object.entries(category).map(([id, name]) => ({
                    id: id,
                    name: name
                }));
                setCategories(categoriesArray);
            }
        } else {
            // Fallback to empty array
            setCategories([]);
        }
    }, [category]);

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

        if (!productForm.data.category_id) {
            hasError = true;
            newErrors.category_id = "Category is required";
        }

        if (!productForm.data.product_no?.trim()) {
            hasError = true;
            newErrors.product_no = "Product code is required";
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

        // Prepare the data for submission with correct field names
        const submitData = {
            id: productForm.data.id,
            product_name: productForm.data.product_name,
            category_id: productForm.data.category_id,
            product_no: productForm.data.product_no,
            description: productForm.data.description,
            variants: variants.map(variant => ({
                id: variant.id,
                size: variant.size || null,
                color: variant.color || null,
            }))
        };

        console.log('Submitting data:', submitData);

        const url = update ? route("product.add.post") : route("product.add.post");
        
        productForm.post(url, {
            data: submitData,
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
            
            // Set form data with correct field names
            productForm.setData({
                id: update.id || "",
                product_name: update.name || "",
                category_id: update.category_id || "",
                product_no: update.product_no || "",
                description: update.description || "",
            });

            // Load variants
            if (update.variants && update.variants.length > 0) {
                const mappedVariants = update.variants.map(variant => ({
                    id: variant.id || null,
                    size: variant.size || "",
                    color: variant.color || "",
                }));
                console.log('Mapped variants:', mappedVariants);
                setVariants(mappedVariants);
            } else {
                // Add one empty variant if no variants exist
                setVariants([{
                    id: null,
                    size: "",
                    color: "",
                }]);
            }
        } else {
            // Add one empty variant for new products
            setVariants([{
                id: null,
                size: "",
                color: "",
            }]);
        }
    }, [update]);

    // Debug: Check processed categories
    useEffect(() => {
        console.log('Processed categories:', categories);
    }, [categories]);

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
                            value={productForm.data.category_id}
                            className="select"
                            onChange={(e) =>
                                productForm.setData("category_id", e.target.value)
                            }
                        >
                            <option value="">--Pick a category--</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="text-sm text-error">
                                {errors.category_id}
                            </p>
                        )}
                        {categories.length === 0 && (
                            <p className="text-sm text-warning mt-1">
                                No categories available. Please add categories first.
                            </p>
                        )}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Product Code*</legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_no}
                            onChange={(e) =>
                                productForm.setData("product_no", e.target.value)
                            }
                            placeholder="Enter product code"
                        />
                        {errors.product_no && (
                            <p className="text-sm text-error">
                                {errors.product_no}
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
                                        {variant.id && <span className="text-xs text-gray-500 ml-2">(ID: {variant.id})</span>}
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