import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm } from "@inertiajs/react";
import { Trash, X } from "lucide-react";
import { toast } from "react-toastify";

export default function AddProduct({ category, update }) {
    const [sizes, setSizes] = useState([]);
    const [sizeInput, setSizeInput] = useState("");
    const [errors, setErrors] = useState({});

    // Add Size
    const handleSizeAdd = (e) => {
        if (e.key === "Enter" && sizeInput.trim() !== "") {
            e.preventDefault();
            setSizes([
                ...sizes,
                { size: sizeInput.trim(), colors: [], colorInput: "" },
            ]);
            setSizeInput("");
        }
    };

    // Delete Size
    const handleSizeDelete = (index) => {
        const updated = [...sizes];
        updated.splice(index, 1);
        setSizes(updated);
    };

    // Add Color
    const handleColorAdd = (e, index) => {
        if (e.key === "Enter" && sizes[index].colorInput.trim() !== "") {
            e.preventDefault();
            const updated = [...sizes];
            updated[index].colors.push({
                name: updated[index].colorInput.trim(),
                stock: 1,
            });
            updated[index].colorInput = "";
            setSizes(updated);
        }
    };

    // Delete Color
    const handleColorDelete = (sizeIndex, colorIndex) => {
        const updated = [...sizes];
        updated[sizeIndex].colors.splice(colorIndex, 1);
        setSizes(updated);
    };

    // Update Stock
    const handleStockChange = (sizeIndex, colorIndex, value) => {
        const updated = [...sizes];
        updated[sizeIndex].colors[colorIndex].stock = parseInt(value) || 0;
        setSizes(updated);
    };

    const productForm = useForm({
        id: update ? update[0]?.id : "",
        product_name: update ? update[0]?.name : "",
        category: update ? update[0]?.category_id : "",
        product_code: update ? update[0]?.product_no : "",
        gross_price: update ? update[0]?.gross_price : "",
        discount: update ? update[0]?.discount : "",
        sizes: [],
    });

    const formSubmit = (e) => {
        e.preventDefault();

        let hasError = false;
        let newErrors = {};

        sizes.forEach((s, sizeIndex) => {
            if (!s.size || s.size.trim() === "") {
                hasError = true;
                newErrors[`size-${sizeIndex}`] = "Size is required";
            }

            if (!s.colors || s.colors.length === 0) {
                hasError = true;
                newErrors[`colors-${sizeIndex}`] =
                    "At least one color is required";
            }
        });

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        productForm.post(route("product.add.post"), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (res) => {
                console.log(res);
            },
            onError: (error) => {
                console.log(error);

                toast.error("Somthing else try again!");
            },
        });
    };

    useEffect(() => {
        productForm.setData("sizes", sizes);
    }, [sizes]);

    // Load existing data as default state
    useEffect(() => {
        if (update && update[0]?.sizes?.length > 0) {
            const mapped = update[0]?.sizes?.map((size) => ({
                id: size.id,
                size: size.name,
                colorInput: "",
                colors: size.colors.map((c) => ({
                    id: c.id,
                    name: c.name,
                    stock: c.stock,
                })),
            }));
            setSizes(mapped);
        }
    }, [update]);
    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Add new product"
                subtitle="Add or update product."
            />

            <form onSubmit={formSubmit}>
                {/* product */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">
                            Product name*
                        </legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_name}
                            onChange={(e) =>
                                productForm.setData(
                                    "product_name",
                                    e.target.value
                                )
                            }
                        />
                        {productForm.errors.product_name && (
                            <p className="text-sm text-error">
                                {productForm.errors.product_name}
                            </p>
                        )}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Category*</legend>
                        <select
                            defaultValue={productForm.data.category}
                            className="select"
                            onChange={(e) =>
                                productForm.setData("category", e.target.value)
                            }
                        >
                            <option value='' selected>--Pick a category--</option>
                            {Object.entries(category).map(([key, value]) => (
                                <option key={value} value={value}>
                                    {key}
                                </option>
                            ))}
                        </select>
                        {productForm.errors.category && (
                            <p className="text-sm text-error">
                                {productForm.errors.category}
                            </p>
                        )}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Product code*
                        </legend>
                        <input
                            type="text"
                            className="input"
                            value={productForm.data.product_code}
                            onChange={(e) =>
                                productForm.setData(
                                    "product_code",
                                    e.target.value
                                )
                            }
                        />
                        {productForm.errors.product_code && (
                            <p className="text-sm text-error">
                                {productForm.errors.product_code}
                            </p>
                        )}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            Gross price*
                        </legend>
                        <input
                            type="number"
                            className="input"
                            value={productForm.data.gross_price}
                            onChange={(e) =>
                                productForm.setData(
                                    "gross_price",
                                    e.target.value
                                )
                            }
                        />
                        {productForm.errors.gross_price && (
                            <p className="text-sm text-error">
                                {productForm.errors.gross_price}
                            </p>
                        )}
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Discount(%)</legend>
                        <input
                            min={0}
                            max={100}
                            type="number"
                            className="input"
                            value={productForm.data.discount}
                            onChange={(e) =>
                                productForm.setData("discount", e.target.value)
                            }
                        />
                        {productForm.errors.discount && (
                            <p className="text-sm text-error">
                                {productForm.errors.discount}
                            </p>
                        )}
                    </fieldset>

                    {/* Size input */}
                    <fieldset className="fieldset col-span-2">
                        <legend className="fieldset-legend">Size*</legend>
                        <input
                            type="text"
                            className="input"
                            value={sizeInput}
                            onChange={(e) => setSizeInput(e.target.value)}
                            onKeyDown={handleSizeAdd}
                            placeholder="Enter size & press Enter"
                        />
                    </fieldset>
                </div>

                {/* Render Sizes */}
                {sizes.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {sizes.map((s, sizeIndex) => (
                            <div
                                key={sizeIndex}
                                className="border border-gray-300 p-3 rounded-box"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-gray-500">
                                        Size: {s.size}
                                    </h4>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-circle btn-error"
                                        onClick={() =>
                                            handleSizeDelete(sizeIndex)
                                        }
                                    >
                                        <Trash size={10} />
                                    </button>
                                </div>

                                {/* Show Size Error */}
                                {errors[`size-${sizeIndex}`] && (
                                    <p className="text-red-500 text-sm mb-1">
                                        {errors[`size-${sizeIndex}`]}
                                    </p>
                                )}

                                {/* Color Input */}
                                <input
                                    type="text"
                                    className="input input-sm mb-2"
                                    value={s.colorInput}
                                    onChange={(e) => {
                                        const updated = [...sizes];
                                        updated[sizeIndex].colorInput =
                                            e.target.value;
                                        setSizes(updated);
                                    }}
                                    onKeyDown={(e) =>
                                        handleColorAdd(e, sizeIndex)
                                    }
                                    placeholder="Enter color & press Enter"
                                />

                                {/* Show Colors Error */}
                                {errors[`colors-${sizeIndex}`] && (
                                    <p className="text-red-500 text-sm mb-1">
                                        {errors[`colors-${sizeIndex}`]}
                                    </p>
                                )}

                                {/* Colors with Stock */}
                                <div className="flex items-center flex-wrap gap-2">
                                    {s.colors.map((c, colorIndex) => (
                                        <div
                                            key={colorIndex}
                                            className="flex items-center gap-2 badge badge-soft badge-primary p-2"
                                        >
                                            <span>{c.name}</span>

                                            {/* Stock Input */}
                                            <input
                                                type="number"
                                                min="0"
                                                className="input input-xs w-20"
                                                value={c.stock}
                                                onChange={(e) =>
                                                    handleStockChange(
                                                        sizeIndex,
                                                        colorIndex,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Stock"
                                            />

                                            {/* Delete Color */}
                                            <button
                                                type="button"
                                                className="ml-2 text-red-600"
                                                onClick={() =>
                                                    handleColorDelete(
                                                        sizeIndex,
                                                        colorIndex
                                                    )
                                                }
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-primary mt-5" type="submit">
                    Save product
                </button>
            </form>
        </div>
    );
}
