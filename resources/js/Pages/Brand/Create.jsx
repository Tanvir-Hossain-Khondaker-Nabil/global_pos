import { useForm, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Save,
    Tag,
    Image,
    FileText,
    Upload,
    X
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useState, useRef } from "react";

export default function Create() {
    const { t, locale } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        slug: "",
        logo: null,
        description: "",
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("brands.store"), {
            data: data,
            onSuccess: () => reset(),
            preserveScroll: true,
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
        setData("logo", null);
        setLogoPreview(null);
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

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{t('brand.create_title', 'Create New Brand')}</h1>
                        <p className="text-gray-600 mt-2">{t('brand.create_subtitle', 'Add a new brand to your catalog')}</p>
                    </div>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className=" px-6 py-4"
                            style={{
                                background: "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)",
                            }}>
                            <div className="flex items-center gap-3">
                                <Tag className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">
                                    {t('brand.basic_information', 'Basic Information')}
                                </h2>
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

                                {logoPreview ? (
                                    <div className="relative">
                                        <div className="w-48 h-48 border-2 border-dashed border-blue-200 rounded-xl overflow-hidden bg-gray-50">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="w-full h-full object-contain p-4"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            title={t('brand.remove_logo', 'Remove logo')}
                                        >
                                            <X size={16} />
                                        </button>
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
                                            className="cursor-pointer block w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                                        >
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                                <Upload size={32} className="text-gray-400 mb-3" />
                                                <span className="text-sm text-gray-600 font-medium text-center">
                                                    {t('brand.upload_logo', 'Upload Logo')}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1 text-center">
                                                    {t('brand.recommended_size', 'Recommended: 500×500px')}
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 mt-2">
                                    {t('brand.logo_hint', 'Upload a logo image for the brand. PNG, JPG, SVG up to 2MB.')}
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
                                <p className="text-xs text-gray-500 mt-2">
                                    {t('brand.description_hint', 'Optional. Provide details about the brand for better customer understanding.')}
                                </p>
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
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
                                    : 'shadow-lg hover:shadow-xl'
                                }
                            `}
                            style={{
                                background: "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)",
                            }}
                        >
                            <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                            {processing ? t('brand.creating', 'Creating Brand...') : t('brand.create', 'Create Brand')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}