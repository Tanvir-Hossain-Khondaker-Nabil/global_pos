import { useForm, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Save,
    Tag,
    Image,
    FileText,
    Upload,
    X,
    Eye,
    Edit2,
    Trash2,
    ExternalLink
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useState, useRef, useEffect } from "react";

export default function Edit({ brand }) {
    const { t, locale } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        name: brand.name || "",
        slug: brand.slug || "",
        logo: null,
        description: brand.description || "",
        _method: 'PUT'
    });

    const [logoPreview, setLogoPreview] = useState(brand.logo_url || null);
    const [existingLogo, setExistingLogo] = useState(brand.logo_url || null);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef(null);

    // Initialize form data when brand changes
    useEffect(() => {
        setData({
            name: brand.name || "",
            slug: brand.slug || "",
            logo: null,
            description: brand.description || "",
            _method: 'PUT'
        });
        setLogoPreview(brand.logo_url || null);
        setExistingLogo(brand.logo_url || null);
    }, [brand]);

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("brands.update", brand.id), {
            data: data,
            preserveScroll: true,
            onSuccess: () => {
                if (data.logo) {
                    setExistingLogo(logoPreview);
                }
            }
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("logo", file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setData("logo", "");
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const restoreOriginalLogo = () => {
        setData("logo", null);
        setLogoPreview(existingLogo);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setData("name", name);

        // Auto-generate slug if slug is empty or matches the previous name
        if (!data.slug || data.slug === generateSlug(data.name)) {
            setData("slug", generateSlug(name));
        }
    };

    const handleDelete = () => {
        if (window.confirm(t('brand.delete_confirm', 'Are you sure you want to delete this brand? This action cannot be undone.'))) {
            router.delete(route('brands.destroy', brand.id), {
                preserveScroll: true,
                onBefore: () => setIsDeleting(true),
                onFinish: () => setIsDeleting(false)
            });
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-800">{t('brand.edit_title', 'Edit Brand')}</h1>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                ID: {brand.id}
                            </span>
                        </div>
                        <p className="text-gray-600">
                            {t('brand.edit_subtitle', 'Update brand information')}: <span className="font-semibold">{brand.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={route("brands.show", brand.id)}
                            className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300"
                            title={t('brand.view_brand', 'View Brand')}
                        >
                            <Eye size={18} className="text-gray-600 group-hover:text-green-600 transition-colors" />
                            <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                {t('brand.view', 'View')}
                            </span>
                        </a>
                        <a
                            href={route("brands.index")}
                            className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                        >
                            <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                            <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                {t('brand.back', 'Back')}
                            </span>
                        </a>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className=" px-6 py-4"
                            style={{
                                background: "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)",
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Edit2 className="text-white" size={24} />
                                    <h2 className="text-xl font-semibold text-white">
                                        {t('brand.basic_information', 'Basic Information')}
                                    </h2>
                                </div>
                                <div className="text-white/90 text-sm">
                                    {t('brand.last_updated', 'Last updated')}: {new Date(brand.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Brand Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Tag size={16} className="text-blue-600" />
                                    {t('brand.name', 'Brand Name')} *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={handleNameChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder={t('brand.enter_name', 'Enter brand name')}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Brand Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('brand.slug', 'Slug')} *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <span className="text-sm">/brands/</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData("slug", e.target.value)}
                                        className="w-full pl-20 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                        placeholder="brand-slug"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <a
                                            href={`/brands/${data.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                            title={t('brand.preview_url', 'Preview URL')}
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {t('brand.slug_hint', 'URL-friendly version of the name. Auto-generated but can be customized.')}
                                </p>
                                {errors.slug && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.slug}
                                    </p>
                                )}
                            </div>

                            {/* Brand Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Image size={16} className="text-blue-600" />
                                    {t('brand.logo', 'Brand Logo')}
                                </label>

                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Current Logo */}
                                    {existingLogo && (
                                        <div className="flex-shrink-0">
                                            <p className="text-sm font-medium text-gray-700 mb-3">
                                                {t('brand.current_logo', 'Current Logo')}:
                                            </p>
                                            <div className="relative">
                                                <div className="w-48 h-48 border-2 border-blue-200 rounded-xl overflow-hidden bg-gray-50">
                                                    <img
                                                        src={existingLogo}
                                                        alt="Current logo"
                                                        className="w-full h-full object-contain p-4"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={restoreOriginalLogo}
                                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                            >
                                                <span>{t('brand.use_current', 'Use Current Logo')}</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Logo Upload/Preview */}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700 mb-3">
                                            {t('brand.new_logo', 'New Logo')}:
                                        </p>

                                        {logoPreview ? (
                                            <div className="relative inline-block">
                                                <div className="w-48 h-48 border-2 border-dashed border-green-200 rounded-xl overflow-hidden bg-gray-50">
                                                    <img
                                                        src={logoPreview}
                                                        alt="New logo preview"
                                                        className="w-full h-full object-contain p-4"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                    title={t('brand.remove_new_logo', 'Remove new logo')}
                                                >
                                                    <X size={16} />
                                                </button>
                                                <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                                                    <span>✓ {t('brand.new_logo_selected', 'New logo selected')}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={handleLogoChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                    id="logo-upload"
                                                />
                                                <label
                                                    htmlFor="logo-upload"
                                                    className="cursor-pointer inline-block w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                                                >
                                                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                        <Upload size={32} className="text-gray-400 mb-3" />
                                                        <span className="text-sm text-gray-600 font-medium text-center">
                                                            {t('brand.upload_new', 'Upload New Logo')}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1 text-center">
                                                            {t('brand.recommended_size', 'Recommended: 500×500px')}
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                    {t('brand.logo_hint', 'Upload a new logo image for the brand. PNG, JPG, SVG up to 2MB. Leave empty to keep current logo.')}
                                </p>
                                {errors.logo && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.logo}
                                    </p>
                                )}
                            </div>

                            {/* Brand Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600" />
                                    {t('brand.description', 'Description')}
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                                    rows={4}
                                    placeholder={t('brand.enter_description', 'Describe the brand, its history, values, and unique selling points...')}
                                />
                                <div className="flex justify-between mt-2">
                                    <p className="text-xs text-gray-500">
                                        {t('brand.description_hint', 'Optional. Provide details about the brand for better customer understanding.')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {data.description?.length || 0} / 2000 {t('brand.characters', 'characters')}
                                    </p>
                                </div>
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                                ${isDeleting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                }
                            `}
                        >
                            <Trash2 size={18} />
                            {isDeleting ? t('brand.deleting', 'Deleting...') : t('brand.delete', 'Delete Brand')}
                        </button>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit(route('brands.index'))}
                                className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                            >
                                {t('brand.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className={`
                                    group flex items-center gap-3 px-8 py-3 rounded-xl font-semibold text-white
                                    transition-all duration-200 transform hover:scale-105 active:scale-95
                                    ${processing
                                        ? 'cursor-not-allowed'
                                        : ' shadow-lg hover:shadow-xl'
                                    }
                                `}
                                style={{
                                    background: "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)",
                                }}
                            >
                                <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                                {processing ? t('brand.updating', 'Updating...') : t('brand.update', 'Update Brand')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}