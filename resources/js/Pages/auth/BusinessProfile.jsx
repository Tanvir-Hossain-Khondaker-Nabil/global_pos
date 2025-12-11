import React from 'react'
import PageHeader from '../../components/PageHeader'
import Image from '../../components/Image'
import { useForm, usePage } from '@inertiajs/react'
import { useTranslation } from "../../hooks/useTranslation";

export default function Profile() {
    const { business } = usePage().props
    const { t, locale } = useTranslation()


    const businessData = business || {};

    console.log('Business Data:', businessData);
    
    // handle form - updated to match fillable fields
    const { data, setData, errors, processing, post } = useForm({
        name: businessData.name || '',
        email: businessData.email || auth.email || '',
        phone: businessData.phone || '',
        address: businessData.address || '',
        website: businessData.website || '',
        description: businessData.description || '',
        tax_number: businessData.tax_number || '',
        thum: null, 
        logo: null, 
    })

    const handleUpdate = (e) => {
        e.preventDefault()
        post(route('businessProfile.update'), {
            _method: 'POST', // Since your route uses POST method
            ...data,
            preserveScroll: true,
        })
    }

    const handleFileChange = (fieldName) => (e) => {
        if (e.target.files.length > 0) {
            setData(fieldName, e.target.files[0])
        }
    }

    // Clear file input
    const clearFile = (fieldName) => {
        setData(fieldName, null)
    }

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('auth.business_profile_title', 'Business Profile')}
                subtitle={t('auth.profile_subtitle', 'Update your business information')}
            />

            {/* Success/Error Messages */}
            {usePage().props.flash.success && (
                <div className="alert alert-success mb-6">
                    <span>{usePage().props.flash.success}</span>
                </div>
            )}
            
            {usePage().props.flash.error && (
                <div className="alert alert-error mb-6">
                    <span>{usePage().props.flash.error}</span>
                </div>
            )}

            {/* form */}
            <form onSubmit={handleUpdate} className='space-y-6' encType="multipart/form-data">
                {/* Image Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Thumbnail Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('auth.thumbnail', 'Thumbnail Image')}
                        </label>
                        <div className='flex items-start gap-4'>
                            <div className="avatar">
                                <div className="ring-primary ring-offset-base-100 w-20 h-20 rounded-lg ring-2 ring-offset-2 flex items-center justify-center overflow-hidden">
                                    {data.thum ? (
                                        <div className="relative w-full h-full">
                                            <img 
                                                src={URL.createObjectURL(data.thum)} 
                                                alt="Thumbnail preview" 
                                                className="w-full h-full object-cover"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => clearFile('thum')}
                                                className="absolute top-1 right-1 btn btn-xs btn-circle btn-error"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : businessData.thum ? (
                                        <Image path={`/storage/${businessData.thum}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400">{t('auth.no_image', 'No Image')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <input 
                                    onChange={handleFileChange('thum')} 
                                    type="file" 
                                    accept='image/*' 
                                    className="file-input file-input-bordered w-full" 
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('auth.thumbnail_hint', 'Recommended: 200x200px')}
                                </p>
                                {errors.thum && <div className="text-red-600 text-sm mt-1">{errors.thum}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('auth.logo', 'Logo')}
                        </label>
                        <div className='flex items-start gap-4'>
                            <div className="avatar">
                                <div className="ring-primary ring-offset-base-100 w-20 h-20 rounded-lg ring-2 ring-offset-2 flex items-center justify-center bg-white overflow-hidden">
                                    {data.logo ? (
                                        <div className="relative w-full h-full">
                                            <img 
                                                src={URL.createObjectURL(data.logo)} 
                                                alt="Logo preview" 
                                                className="w-full h-full object-contain"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => clearFile('logo')}
                                                className="absolute top-1 right-1 btn btn-xs btn-circle btn-error"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : businessData.logo ? (
                                        <Image path={`/storage/${businessData.logo}`} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-gray-400">{t('auth.no_image', 'No Image')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <input 
                                    onChange={handleFileChange('logo')} 
                                    type="file" 
                                    accept='image/*' 
                                    className="file-input file-input-bordered w-full" 
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('auth.logo_hint', 'Recommended: Transparent PNG, 400x200px')}
                                </p>
                                {errors.logo && <div className="text-red-600 text-sm mt-1">{errors.logo}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Basic Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.business_name', 'Business Name')}*
                        </legend>
                        <input 
                            value={data.name} 
                            onChange={(e) => setData('name', e.target.value)} 
                            type="text" 
                            className="input input-bordered w-full" 
                            placeholder={t('auth.type_here', 'Type here')}
                            required 
                        />
                        {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.email', 'Email')}*
                        </legend>
                        <input 
                            value={data.email} 
                            onChange={(e) => setData('email', e.target.value)} 
                            type="email" 
                            className="input input-bordered w-full" 
                            placeholder={t('auth.email_placeholder', 'your@email.com')}
                            required 
                        />
                        {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                    </fieldset>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.phone', 'Phone')}*
                        </legend>
                        <input 
                            value={data.phone} 
                            onChange={(e) => setData('phone', e.target.value)} 
                            type="tel" 
                            className="input input-bordered w-full" 
                            placeholder={t('auth.phone_placeholder', '+1234567890')} 
                            required
                        />
                        {errors.phone && <div className="text-red-600 text-sm mt-1">{errors.phone}</div>}
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.website', 'Website')}
                        </legend>
                        <input 
                            value={data.website} 
                            onChange={(e) => setData('website', e.target.value)} 
                            type="url" 
                            className="input input-bordered w-full" 
                            placeholder={t('auth.website_placeholder', 'https://example.com')} 
                        />
                        {errors.website && <div className="text-red-600 text-sm mt-1">{errors.website}</div>}
                    </fieldset>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">
                            {t('auth.tax_number', 'Tax Number')}
                        </legend>
                        <input 
                            value={data.tax_number} 
                            onChange={(e) => setData('tax_number', e.target.value)} 
                            type="text" 
                            className="input input-bordered w-full" 
                            placeholder={t('auth.tax_number_placeholder', 'TAX-123456')} 
                        />
                        {errors.tax_number && <div className="text-red-600 text-sm mt-1">{errors.tax_number}</div>}
                    </fieldset>
                </div>

                <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                        {t('auth.address', 'Address')}*
                    </legend>
                    <textarea 
                        value={data.address} 
                        onChange={(e) => setData('address', e.target.value)} 
                        className="textarea textarea-bordered w-full h-24" 
                        placeholder={t('auth.address_placeholder', 'Enter your full address')}
                        required
                    ></textarea>
                    {errors.address && <div className="text-red-600 text-sm mt-1">{errors.address}</div>}
                </fieldset>

                <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                        {t('auth.description', 'Description')}
                    </legend>
                    <textarea 
                        value={data.description} 
                        onChange={(e) => setData('description', e.target.value)} 
                        className="textarea textarea-bordered w-full h-32" 
                        placeholder={t('auth.description_placeholder', 'Tell us about your business...')}
                    ></textarea>
                    {errors.description && <div className="text-red-600 text-sm mt-1">{errors.description}</div>}
                </fieldset>

                <div className="flex justify-end pt-4">
                    <button 
                        disabled={processing} 
                        type='submit' 
                        className='btn btn-primary min-w-32'
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <span className="loading loading-spinner loading-sm"></span>
                                {t('auth.saving', 'Saving...')}
                            </span>
                        ) : t('auth.save_changes', 'Save Changes')}
                    </button>
                </div>
            </form>
        </div>
    )
}