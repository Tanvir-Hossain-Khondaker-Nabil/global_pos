import { useForm, router } from "@inertiajs/react";
import { 
    ArrowLeft,
    Save, 
    Tag, 
    DollarSign,
    Calendar, 
    FileText, 
    CheckCircle, 
    Plus, 
    Trash2, 
    Star
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function Edit({ plans }) {
    const { t, locale } = useTranslation();
    const { data, setData, put, processing, errors } = useForm({
        name: plans.name || "",
        price: plans.price || "",
        plan_type: plans.plan_type || "",
        validity: plans.validity || "",
        description: plans.description || "",
        features: plans.features && plans.features.length > 0 ? plans.features : [""],
        status: plans.status || "",
        total_sell: plans.total_sell || "0"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const filteredData = {
            ...data,
            features: data.features.filter(feature => feature.trim() !== "")
        };
        
        put(route("plans.update", plans.id), {
            data: filteredData,
            preserveScroll: true,
        });
    };

    // Add new feature field
    const addFeature = () => {
        setData("features", [...data.features, ""]);
    };

    // Remove feature field
    const removeFeature = (index) => {
        const newFeatures = data.features.filter((_, i) => i !== index);
        setData("features", newFeatures);
    };

    // Update specific feature
    const updateFeature = (index, value) => {
        const newFeatures = [...data.features];
        newFeatures[index] = value;
        setData("features", newFeatures);
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{t('plan.edit_title', 'Edit Plan')}</h1>
                        <p className="text-gray-600 mt-2">{t('plan.edit_subtitle', 'Update the subscription plan information')}</p>
                    </div>
                    <a
                        href={route("plans.index")}
                        className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                    >
                        <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {t('plan.back', 'Back')}
                        </span>
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Tag className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.basic_information', 'Basic Information')}
                                </h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Tag size={16} className="text-blue-600" />
                                    {t('plan.plan_name', 'Plan Name')} *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder={t('plan.enter_plan_name', 'Enter plan name')}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    {t('plan.currency', '৳')}
                                    {t('plan.price', 'Price')} *
                                </label>
                                <input
                                    type="number"
                                    value={data.price}
                                    onChange={(e) => setData("price", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder={t('plan.enter_price', '0.00')}
                                    step="0.01"
                                    min="0"
                                />
                                {errors.price && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.price}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('plan.plan_type', 'Plan Type')} *
                                </label>
                                <select
                                    value={data.plan_type}
                                    onChange={(e) => setData("plan_type", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="">{t('plan.select_plan_type', 'Select Plan Type')}</option>
                                    <option value="1">{t('plan.free', 'Free')}</option>
                                    <option value="2">{t('plan.premium', 'Premium')}</option>
                                </select>
                                {errors.plan_type && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.plan_type}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-600" />
                                    {t('plan.validity', 'Validity')} ({t('plan.validity_days', 'Days')}) *
                                </label>
                                <input
                                    type="number"
                                    value={data.validity}
                                    onChange={(e) => setData("validity", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder={t('plan.enter_validity', '30')}
                                    min="1"
                                />
                                {errors.validity && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.validity}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-gray-600" />
                                    {t('plan.description', 'Description')}
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                                    rows={3}
                                    placeholder={t('plan.enter_description', 'Describe the plan features and benefits...')}
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Features Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-white" size={24} />
                                    <h2 className="text-xl font-semibold text-white">
                                        {t('plan.plan_features', 'Plan Features')}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                    <Plus size={18} className="text-white" />
                                    <span className="text-white font-medium">
                                        {t('plan.add_feature', 'Add Feature')}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-4">
                                {data.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-200">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {t('plan.features', 'Feature')} {index + 1}
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                                placeholder={t('plan.enter_feature', 'Enter feature description...')}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 mt-7"
                                            title={t('plan.remove', 'Remove feature')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {errors.features && (
                                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    ⚠️ {errors.features}
                                </p>
                            )}
                            
                            {/* Add Feature Button (Bottom) */}
                            <div className="flex justify-center mt-6">
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    <Plus size={18} />
                                    {t('plan.add_another_feature', 'Add Another Feature')}
                                </button>
                            </div>
                            
                            {/* Features Guidelines */}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-6">
                                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    {t('plan.features_guidelines', 'Features Guidelines')}
                                </h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>• {t('plan.guideline_1', 'Click "Add Feature" to add multiple features at once')}</li>
                                    <li>• {t('plan.guideline_2', 'Be specific and clear about what users get')}</li>
                                    <li>• {t('plan.guideline_3', 'Empty features will be automatically removed when saving')}</li>
                                    <li>• {t('plan.guideline_4', 'Order features by importance')}</li>
                                    <li>• {t('plan.guideline_5', 'You can add unlimited features')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Status & Performance Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Star className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">
                                    {t('plan.status_performance', 'Status & Performance')}
                                </h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('plan.status', 'Status')} *
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData("status", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="1">{t('plan.active', 'Active')}</option>
                                    <option value="2">{t('plan.inactive', 'Inactive')}</option>
                                </select>
                                {errors.status && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Star size={16} className="text-yellow-600" />
                                    {t('plan.total_sales', 'Total Sales')}
                                </label>
                                <input
                                    type="number"
                                    value={data.total_sell}
                                    onChange={(e) => setData("total_sell", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="0"
                                    min="0"
                                    readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('plan.total_sales_readonly', 'Total sales cannot be edited')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <a
                            href={route("plans.index")}
                            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                        >
                            {t('plan.cancel', 'Cancel')}
                        </a>
                        <button
                            disabled={processing}
                            className={`
                                group flex items-center gap-3 px-8 py-3 rounded-xl font-semibold text-white
                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                ${processing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                }
                            `}
                        >
                            <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                            {processing ? t('plan.updating_plan', 'Updating Plan...') : t('plan.update_plan', 'Update Plan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}