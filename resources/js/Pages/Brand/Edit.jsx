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
    
    // Initialize form with brand data
    const { data, setData, post, processing, errors } = useForm({
        name: brand.name || "",
        slug: brand.slug || "",
        logo: null,
        description: brand.description || "",
        _method: 'PUT'
    });

    // State for logo handling
    const [logoPreview, setLogoPreview] = useState(null);
    const [existingLogo, setExistingLogo] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageLoadError, setImageLoadError] = useState(false);
    const [debugInfo, setDebugInfo] = useState({});
    const fileInputRef = useRef(null);

    // Fallback image path - adjust this based on your project structure
    const FALLBACK_IMAGE = '/images/no-image.png'; // Create this placeholder image
    const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50\' y=\'50\' font-size=\'14\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';

    // Function to construct image URL from various possible formats
    const constructImageUrl = (logo) => {
        if (!logo) return null;
        
        // If it's already a full URL, return as is
        if (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:')) {
            return logo;
        }
        
        // Try different possible paths
        const possiblePaths = [
            `/storage/${logo}`,           // Laravel storage
            `/uploads/${logo}`,            // Uploads folder
            `/images/${logo}`,              // Images folder
            `/images/brands/${logo}`,       // Brands images folder
            `/${logo}`,                      // Root path
            `/storage/brands/${logo}`,       // Storage brands folder
        ];
        
        // Return the first path that might work (we'll let the browser try)
        return possiblePaths[0];
    };

    // Initialize logo states when component mounts or brand changes
    useEffect(() => {
        console.log('Brand data received:', brand);
        console.log('Logo URL:', brand.logo_url);
        console.log('Brand logo field:', brand.logo);
        
        // Debug info
        setDebugInfo({
            brandId: brand.id,
            brandName: brand.name,
            logo_url: brand.logo_url,
            logo_field: brand.logo,
            timestamp: new Date().toISOString()
        });
        
        // Determine the correct logo URL
        let logoUrl = null;
        
        if (brand.logo_url) {
            logoUrl = brand.logo_url;
        } else if (brand.logo) {
            // Try to construct URL from logo field
            logoUrl = constructImageUrl(brand.logo);
        }
        
        // Set existing logo from brand data
        if (logoUrl) {
            console.log('Setting logo URL:', logoUrl);
            setExistingLogo(logoUrl);
            setLogoPreview(logoUrl);
        } else {
            console.log('No logo URL found');
            setExistingLogo(null);
            setLogoPreview(null);
        }
        
        // Reset image error state
        setImageLoadError(false);
    }, [brand]);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('description', data.description);
        
        // Only append logo if a new file is selected
        if (data.logo instanceof File) {
            formData.append('logo', data.logo);
        }

        // Use post with FormData
        post(route("brands.update", brand.id), {
            data: formData,
            preserveScroll: true,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onSuccess: () => {
                // Reset states on success
                if (data.logo instanceof File) {
                    setExistingLogo(logoPreview);
                }
            }
        });
    };

    // Handle logo file selection
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert(t('brand.invalid_image', 'Please select a valid image file'));
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert(t('brand.image_too_large', 'Image size should be less than 2MB'));
                return;
            }

            setData("logo", file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
                setImageLoadError(false);
            };
            reader.onerror = () => {
                console.error('Error reading file');
                setLogoPreview(null);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove selected new logo
    const removeLogo = () => {
        setData("logo", null);
        setLogoPreview(existingLogo); // Revert to existing logo
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setImageLoadError(false);
    };

    // Restore original logo
    const restoreOriginalLogo = () => {
        setData("logo", null);
        setLogoPreview(existingLogo);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setImageLoadError(false);
    };

    // Generate slug from name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Handle name change with auto slug generation
    const handleNameChange = (e) => {
        const name = e.target.value;
        setData("name", name);

        // Auto-generate slug if slug is empty or matches the previous name
        if (!data.slug || data.slug === generateSlug(data.name)) {
            setData("slug", generateSlug(name));
        }
    };

    // Handle brand deletion
    const handleDelete = () => {
        if (window.confirm(t('brand.delete_confirm', 'Are you sure you want to delete this brand? This action cannot be undone.'))) {
            router.delete(route('brands.destroy', brand.id), {
                preserveScroll: true,
                onBefore: () => setIsDeleting(true),
                onFinish: () => setIsDeleting(false)
            });
        }
    };

    // Handle image load error with multiple fallback attempts
    const handleImageError = (e) => {
        console.error('Failed to load image:', e.target.src);
        
        // Try alternative paths if this is not already a fallback attempt
        if (!e.target.src.includes('no-image') && !e.target.src.startsWith('data:')) {
            const currentSrc = e.target.src;
            
            // Try different path variations
            if (currentSrc.includes('/storage/')) {
                // Try without /storage prefix
                const filename = currentSrc.split('/storage/')[1];
                e.target.src = `/uploads/${filename}`;
            } else if (currentSrc.includes('/uploads/')) {
                // Try with /storage prefix
                const filename = currentSrc.split('/uploads/')[1];
                e.target.src = `/storage/${filename}`;
            } else {
                // Last resort - use placeholder
                e.target.src = PLACEHOLDER_IMAGE;
                setImageLoadError(true);
            }
        } else {
            setImageLoadError(true);
        }
    };

    // Test image load function
    const testImageLoad = (url) => {
        const img = new Image();
        img.onload = () => console.log('Image loaded successfully:', url);
        img.onerror = () => console.log('Image failed to load:', url);
        img.src = url;
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
                        {/* <a
                            href={route("brands.show", brand.id)}
                            className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300"
                            title={t('brand.view_brand', 'View Brand')}
                        >
                            <Eye size={18} className="text-gray-600 group-hover:text-green-600 transition-colors" />
                            <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                {t('brand.view', 'View')}
                            </span>
                        </a> */}
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

                <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="px-6 py-4"
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
                                    required
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
                                        required
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
                                    {/* Current/Existing Logo - With multiple fallback attempts */}
                                    {(existingLogo || brand.logo || brand.logo_url) && (
                                        <div className="flex-shrink-0">
                                            <p className="text-sm font-medium text-gray-700 mb-3">
                                                {t('brand.current_logo', 'Current Logo')}:
                                            </p>
                                            <div className="relative">
                                                <div className="w-48 h-48 border-2 border-blue-200 rounded-xl overflow-hidden bg-gray-50">
                                                    <img
                                                        src={imageLoadError ? PLACEHOLDER_IMAGE : (logoPreview || existingLogo)}
                                                        alt="Current logo"
                                                        className="w-full h-full object-contain p-4"
                                                        onError={handleImageError}
                                                        key={existingLogo} // Force re-render when logo changes
                                                    />
                                                </div>
                                                {imageLoadError && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                                        <p className="text-xs text-red-500 text-center p-2">
                                                            Image not found<br/>
                                                            <button 
                                                                onClick={() => {
                                                                    setImageLoadError(false);
                                                                    // Force reload with cache busting
                                                                    const timestamp = new Date().getTime();
                                                                    setLogoPreview(`${existingLogo}?t=${timestamp}`);
                                                                }}
                                                                className="text-blue-500 underline mt-1"
                                                            >
                                                                Retry
                                                            </button>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {data.logo && (
                                                <button
                                                    type="button"
                                                    onClick={restoreOriginalLogo}
                                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                >
                                                    <span>{t('brand.use_current', 'Use Current Logo')}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Logo Upload/Preview */}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700 mb-3">
                                            {data.logo ? t('brand.new_logo', 'New Logo') : t('brand.upload_logo', 'Upload Logo')}:
                                        </p>

                                        {logoPreview && data.logo ? (
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
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
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
                                                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
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
                                                        <span className="text-xs text-gray-500 mt-1 text-center">
                                                            Max: 2MB
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
                                    maxLength={2000}
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
                                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 hover:shadow-md'
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
                                className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
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
                                        ? 'opacity-75 cursor-not-allowed'
                                        : 'hover:shadow-xl'
                                    }
                                `}
                                style={{
                                    background: "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)",
                                }}
                            >
                                <Save size={20} className={processing ? 'animate-spin' : 'group-hover:animate-bounce'} />
                                {processing ? t('brand.updating', 'Updating...') : t('brand.update', 'Update Brand')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}