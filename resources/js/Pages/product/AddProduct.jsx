import React, { useEffect, useState, useCallback } from "react";
import { useForm, router } from "@inertiajs/react";
import { Trash, X, Plus, Factory, Package, Image as ImageIcon, Ruler, Hash, LayoutGrid, Settings2, Info } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddProduct({ category, update, brand, attributes, errors: serverErrors }) {
    const { t, locale } = useTranslation();

    const [variants, setVariants] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [productType, setProductType] = useState("regular");
    const [variantAttributeSelector, setVariantAttributeSelector] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [unitsByType] = useState({
        piece: ['piece', 'dozen', 'box'],
        weight: ['ton', 'kg', 'gram', 'pound'],
        volume: ['liter', 'ml'],
        length: ['meter', 'cm', 'mm']
    });

    const productForm = useForm({
        id: update?.id || "",
        type: update?.type || "global",
        product_name: update?.name || "",
        brand_id: update?.brand_id || "",
        category_id: update?.category_id || "",
        product_no: update?.product_no || "",
        description: update?.description || "",
        product_type: update?.product_type || "regular",
        in_house_cost: update?.in_house_cost || 0,
        in_house_shadow_cost: update?.in_house_shadow_cost || 0,
        in_house_sale_price: update?.in_house_sale_price || 0,
        in_house_shadow_sale_price: update?.in_house_shadow_sale_price || 0,
        in_house_initial_stock: update?.in_house_initial_stock || 0,
        unit_type: update?.unit_type || 'piece',
        default_unit: update?.default_unit || 'piece',
        is_fraction_allowed: update?.is_fraction_allowed || true,
        min_sale_unit: update?.min_sale_unit || '',
        variants: [],
        photo: null,
    });

    const generateProductCode = useCallback((productName) => {
        if (update || !productName) return '';
        const words = productName.trim().split(' ');
        let code = words.length === 1 ? words[0].substring(0, 6).toUpperCase() : words.slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
        return `${code}-${Date.now().toString().slice(-4)}`;
    }, [update]);

    useEffect(() => {
        if (serverErrors) setFormErrors(serverErrors);
        setCategories(Array.isArray(category) ? category : []);
        setBrands(Array.isArray(brand) ? brand : []);
        setAvailableAttributes(attributes || []);

        if (update) {
            setProductType(update.product_type || "regular");
            setVariants(update.variants?.map(v => ({
                id: v.id,
                attribute_values: v.attribute_values || {}
            })) || [{ attribute_values: {} }]);
        } else {
            setVariants([{ attribute_values: {} }]);
        }
    }, [category, brand, attributes, update, serverErrors]);

    const formSubmit = (e) => {
        e.preventDefault();

        console.log("Current variants:", variants); // Check if variants exist

        // If variants is empty, add one default variant
        let variantsToSend = variants;
        if (!variants || variants.length === 0) {
            variantsToSend = [{ id: null, attribute_values: {} }];
            setVariants(variantsToSend);
        }

        // Format variants properly
        const formattedVariants = variantsToSend.map(variant => ({
            id: variant.id || null,
            attribute_values: variant.attribute_values || {}
        }));

        console.log("Formatted variants to send:", formattedVariants);

        // Create a new FormData object to ensure variants are included
        const formData = new FormData();

        // Add all regular fields
        Object.keys(productForm.data).forEach(key => {
            if (key !== 'variants' && key !== 'photo') {
                formData.append(key, productForm.data[key] || '');
            }
        });

        // Add variants as JSON string
        formData.append('variants', JSON.stringify(formattedVariants));

        // Add photo if exists
        if (productForm.data.photo) {
            formData.append('photo', productForm.data.photo);
        }

        // Submit using Inertia's post method
        router.post(
            update ? route("product.update.post") : route("product.add.post"),
            formData,
            {
                preserveScroll: true,
                onSuccess: () => toast.success(t("Product Saved!")),
                onError: (errors) => {
                    console.error("Form errors:", errors);
                    setFormErrors(errors);
                    toast.error(t("Error saving product"));
                }
            }
        );

    };

    return (
        <div className={`min-h-screen bg-slate-50 pb-20 ${locale === "bn" ? "bangla-font" : ""}`}>

            {/* STICKY TOP BAR */}
            <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b mb-6 px-6 py-4">
                <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-lg text-white shadow-md shadow-primary/20"><LayoutGrid size={20} /></div>
                        <div>
                            <h1 className="text-lg font-bold leading-none">{update ? t("Update Product") : t("Create Product")}</h1>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">{productType} mode</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => window.history.back()} className="btn btn-sm btn-ghost font-bold">{t("Cancel")}</button>
                        <button form="product-form" className="btn btn-sm btn-primary px-8 shadow-lg shadow-primary/20" disabled={productForm.processing}>
                            {productForm.processing ? <span className="loading loading-spinner loading-xs"></span> : t("Save Changes")}
                        </button>
                    </div>
                </div>
            </div>

            <form id="product-form" onSubmit={formSubmit} className="max-w-[1400px] mx-auto px-4 grid grid-cols-12 gap-6">

                {/* LEFT COLUMN: Basic & Supply */}
                <div className="col-span-12 lg:col-span-4 space-y-6">

                    {/* Supply Type Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-3">{t("Supply Strategy")}</span>
                        <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                            {["regular", "in_house"].map(type => (
                                <button key={type} type="button" onClick={() => { setProductType(type); productForm.setData("product_type", type); }}
                                    className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${productType === type ? 'bg-white shadow-sm text-primary border border-slate-200' : 'text-slate-400 opacity-60'}`}>
                                    {type === 'regular' ? <Package size={16} /> : <Factory size={16} />}
                                    <span className="text-[10px] font-bold uppercase">{type.replace('_', ' ')}</span>
                                </button>
                            ))}
                        </div>
                        {formErrors.product_type && <span className="text-error text-xs mt-2 block">{formErrors.product_type}</span>}
                    </div>


                    {/* General Info Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
                            <Info size={16} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{t("Product Identity")}</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold">{t("Product Name")}*</span></label>
                                <input type="text" className="input input-bordered input-sm w-full" value={productForm.data.product_name} onChange={e => {
                                    productForm.setData("product_name", e.target.value);
                                    if (!update) productForm.setData("product_no", generateProductCode(e.target.value));
                                }} />
                                {formErrors.product_name && <span className="text-error text-xs mt-1">{formErrors.product_name}</span>}
                            </div>

                            {/* here add checkbox of  type */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs font-bold">
                                        {t("Select your Product Type")} *
                                    </span>
                                </label>

                                <div className="flex gap-4">
                                    {["local", "global"].map((type) => (
                                        <label
                                            key={type}
                                            className={`flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md border
                                                ${productForm.data.type === type
                                                    ? "border-primary text-primary bg-primary/5"
                                                    : "border-gray-300 text-slate-600"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={type}
                                                checked={productForm.data.type === type}
                                                onChange={() => productForm.setData("type", type)}
                                                className="radio radio-xs hidden"
                                            />
                                            <span className="text-sm font-medium">
                                                {type}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {formErrors.product_type && (
                                    <span className="text-error text-xs mt-1 block">
                                        {formErrors.product_type}
                                    </span>
                                )}
                            </div>


                            <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold">{t("Product Code")}*</span></label>
                                <div className="join w-full">
                                    <input type="text" className="input input-bordered input-sm join-item w-full bg-slate-50" value={productForm.data.product_no} onChange={e => productForm.setData("product_no", e.target.value)} />
                                    <span className="join-item btn btn-sm bg-slate-100 border-slate-200 px-2"><Hash size={14} /></span>
                                </div>
                                {formErrors.product_no && <span className="text-error text-xs mt-1">{formErrors.product_no}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-control">
                                    <label className="label py-1"><span className="label-text text-xs font-bold">{t("Category")}</span></label>
                                    <select className="select select-bordered select-sm" value={productForm.data.category_id} onChange={e => productForm.setData("category_id", e.target.value)}>
                                        <option value="">{t("Select")}</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.category_id && <span className="text-error text-xs mt-1">{formErrors.category_id}</span>}
                                </div>
                                <div className="form-control">
                                    <label className="label py-1"><span className="label-text text-xs font-bold">{t("Brand")}</span></label>
                                    <select className="select select-bordered select-sm" value={productForm.data.brand_id} onChange={e => productForm.setData("brand_id", e.target.value)}>
                                        <option value="">{t("Select")}</option>
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.brand_id && <span className="text-error text-xs mt-1">{formErrors.brand_id}</span>}
                                </div>
                            </div>
                            {/* Description field - add this */}
                            {/* <div className="form-control">
                                <label className="label py-1"><span className="label-text text-xs font-bold">{t("Description")}</span></label>
                                <textarea
                                    className="textarea textarea-bordered textarea-sm w-full"
                                    value={productForm.data.description}
                                    onChange={e => productForm.setData("description", e.target.value)}
                                    placeholder={t("Enter product description...")}
                                />
                                {formErrors.description && <span className="text-error text-xs mt-1">{formErrors.description}</span>}
                            </div> */}
                        </div>
                    </div>


                </div>

                {/* MIDDLE COLUMN: Measurement & Financial */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Units Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b flex items-center gap-2">
                            <Ruler size={16} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{t("Unit Management")}</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex flex-wrap gap-1">
                                {Object.keys(unitsByType).map(type => (
                                    <button key={type} type="button" onClick={() => productForm.setData({ ...productForm.data, unit_type: type, default_unit: unitsByType[type][0] })}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${productForm.data.unit_type === type ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{type}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="form-control">
                                    <label className="label py-1"><span className="label-text text-xs font-bold text-slate-500">{t("Purchase Unit")}</span></label>
                                    <select className="select select-bordered select-sm" value={productForm.data.default_unit} onChange={e => productForm.setData("default_unit", e.target.value)}>
                                        {unitsByType[productForm.data.unit_type]?.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                    </select>
                                    {formErrors.default_unit && <span className="text-error text-xs mt-1">{formErrors.default_unit}</span>}
                                </div>
                                <div className="form-control">
                                    <label className="label py-1"><span className="label-text text-xs font-bold text-slate-500">{t("Sales Unit")}</span></label>
                                    <select className="select select-bordered select-sm" value={productForm.data.min_sale_unit} onChange={e => productForm.setData("min_sale_unit", e.target.value)}>
                                        {unitsByType[productForm.data.unit_type]?.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                                    </select>
                                    {formErrors.min_sale_unit && <span className="text-error text-xs mt-1">{formErrors.min_sale_unit}</span>}
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs checkbox-primary"
                                    checked={productForm.data.is_fraction_allowed}
                                    onChange={e => productForm.setData("is_fraction_allowed", e.target.checked)}
                                />
                                <span className="text-xs font-bold text-slate-600">
                                    {t("Allow Fractional Sales")}
                                </span>
                            </label>

                            {formErrors.is_fraction_allowed && <span className="text-error text-xs mt-1">{formErrors.is_fraction_allowed}</span>}
                        </div>
                    </div>

                    {/* In-House Pricing Card */}
                    {productType === "in_house" && (
                        <div className="bg-white rounded-2xl border-2 border-warning/20 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                            <div className="bg-warning/5 px-5 py-3 border-b border-warning/10 flex items-center gap-2">
                                <Factory size={16} className="text-warning" />
                                <span className="text-xs font-bold uppercase tracking-widest text-warning/80">{t("Production Costs")}</span>
                            </div>
                            <div className="p-5 grid grid-cols-2 gap-4">
                                {[
                                    { k: 'in_house_cost', l: 'Cost' }, { k: 'in_house_shadow_cost', l: 'Shadow Cost' },
                                    { k: 'in_house_sale_price', l: 'Price' }, { k: 'in_house_shadow_sale_price', l: 'Shadow Price' }
                                ].map(field => (
                                    <div key={field.k} className="form-control">
                                        <label className="label py-0"><span className="label-text text-[10px] font-black text-slate-400 uppercase">{t(field.l)}</span></label>
                                        <input type="number" className="input input-sm input-bordered font-bold" value={productForm.data[field.k]} onChange={e => productForm.setData(field.k, e.target.value)} />
                                        {formErrors[field.k] && <span className="text-error text-xs mt-1">{formErrors[field.k]}</span>}
                                    </div>
                                ))}
                                <div className="form-control col-span-2">
                                    <label className="label py-0"><span className="label-text text-[10px] font-black text-slate-400 uppercase">{t("Initial Stock Quantity")}</span></label>
                                    <input type="number" className="input input-sm input-bordered font-bold" value={productForm.data.in_house_initial_stock} onChange={e => productForm.setData("in_house_initial_stock", e.target.value)} />
                                    {formErrors.in_house_initial_stock && <span className="text-error text-xs mt-1">{formErrors.in_house_initial_stock}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Media & Variants */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Image Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase text-slate-400">{t("Product Media")}</span>
                            <label className="btn btn-xs btn-outline btn-primary px-4">
                                {t("Upload")}
                                <input type="file" className="hidden" onChange={e => {
                                    const file = e.target.files[0];
                                    productForm.setData("photo", file);
                                    setPhotoPreview(URL.createObjectURL(file));
                                }} />
                            </label>
                        </div>
                        <div className="w-full aspect-video rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                            {photoPreview || (update?.photo && `/storage/${update.photo}`) ? (
                                <img src={photoPreview || `/storage/${update.photo}`} className="w-full h-full object-contain" />
                            ) : <ImageIcon size={32} className="text-slate-200" />}
                        </div>
                        {formErrors.photo && <span className="text-error text-xs mt-2 block">{formErrors.photo}</span>}
                    </div>

                    {/* Variants Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                        <div className="bg-slate-50 px-5 py-3 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 size={16} className="text-primary" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{t("Variants")}</span>
                            </div>
                            <button type="button" onClick={() => setVariants([...variants, { attribute_values: {} }])} className="btn btn-xs btn-primary btn-circle"><Plus size={16} /></button>
                        </div>
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                            {variants.map((variant, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl group transition-all hover:bg-white hover:shadow-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">#{idx + 1}</span>
                                        <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-error transition-colors"><Trash size={12} /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {Object.entries(variant.attribute_values).map(([attr, val]) => (
                                            <div key={attr} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold">
                                                <span className="text-primary/50">{attr}:</span> {val}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => setVariantAttributeSelector(idx)} className="btn btn-xs btn-block btn-outline border-slate-300 rounded-lg text-[10px] uppercase font-black">{t("Configure Logic")}</button>
                                </div>
                            ))}
                        </div>
                        {formErrors.variants && <span className="text-error text-xs p-4">{formErrors.variants}</span>}
                    </div>
                </div>

                {/* ATTRIBUTE SELECTOR (Centered Modal) */}
                {variantAttributeSelector !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">{t("Set Attributes")}</h4>
                                <button type="button" onClick={() => setVariantAttributeSelector(null)} className="btn btn-sm btn-circle btn-ghost"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                {availableAttributes.map(attr => (
                                    <div key={attr.code} className="space-y-3">
                                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{attr.name}</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {attr.active_values?.map(val => (
                                                <button key={val.id} type="button"
                                                    onClick={() => {
                                                        const newV = [...variants];
                                                        newV[variantAttributeSelector].attribute_values[attr.code] = val.value;
                                                        setVariants(newV);
                                                    }}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${variants[variantAttributeSelector].attribute_values[attr.code] === val.value ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{val.value}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 border-t bg-slate-50 text-right">
                                <button type="button" onClick={() => setVariantAttributeSelector(null)} className="btn btn-primary px-10 rounded-xl font-bold">{t("Done")}</button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}