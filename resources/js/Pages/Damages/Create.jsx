import PageHeader from "../../components/PageHeader";
import { useForm, router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export default function CreateDamage({ data, type, accounts }) {
    const { t, locale } = useTranslation();
    const isSale = type === 'sale';
    
    // Get parent data based on type
    const parentData = isSale ? data?.sale : data?.purchase;
    const product = data?.product;
    const variant = data?.variant;
    const warehouse = data?.warehouse;

    const form = useForm({
        type: type,
        item_id: data?.id || "",
        parent_id: parentData?.id || "", 
        product_id: product?.id || "",
        variant_id: variant?.id || "",
        warehouse_id: warehouse?.id || "",
        date: new Date().toISOString().split('T')[0], 
        quantity: 1,
        reason: "",
        notes: "",
        account_id: "",
        loss_amount: data?.unit_price || product?.price || 0,
    });

    const submit = (e) => {
        e.preventDefault();
        
        form.post(route("damages.store"), {
            onSuccess: () => {
                if (isSale) {
                    router.visit(route("sales.show", parentData?.id));
                } else {
                    router.visit(route("purchases.show", parentData?.id));
                }
            },
        });
    };

    // Calculate total loss
    const totalLoss = form.data.loss_amount * form.data.quantity;

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('damages.create_damage', 'Create Damage Record')}
                subtitle={t('damages.damage_information', 'Damage Information')}
            >
                <button
                    onClick={() => {
                        if (isSale) {
                            router.visit(route("sales.show", parentData?.id));
                        } else {
                            router.visit(route("purchases.show", parentData?.id));
                        }
                    }}
                    className="btn btn-sm btn-ghost"
                >
                    <ArrowLeft size={15} /> {t('damages.back_to_transaction', 'Back to Transaction')}
                </button>
            </PageHeader>

            {/* Transaction Information Card */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <h3 className="card-title text-lg">
                        {isSale 
                            ? t('damages.sale_information', 'Sale Information')
                            : t('damages.purchase_information', 'Purchase Information')
                        }
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">
                                {isSale 
                                    ? t('damages.sale_number', 'Sale Number')
                                    : t('damages.purchase_number', 'Purchase Number')
                                }
                            </p>
                            <p className="font-medium">{parentData?.reference || parentData?.id}</p>
                        </div>
                        
                        <div>
                            <p className="text-sm text-gray-500">
                                {isSale 
                                    ? t('damages.sale_date', 'Sale Date')
                                    : t('damages.purchase_date', 'Purchase Date')
                                }
                            </p>
                            <p className="font-medium">{parentData?.date}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Information Card */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <h3 className="card-title text-lg">{t('damages.product_information', 'Product Information')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">{t('damages.product_name', 'Product Name')}</p>
                            <p className="font-medium">{product?.name}</p>
                        </div>
                        
                        <div>
                            <p className="text-sm text-gray-500">{t('damages.variant', 'Variant')}</p>
                            <p className="font-medium">{variant?.name || t('damages.n_a', 'N/A')}</p>
                        </div>
                        
                        <div>
                            <p className="text-sm text-gray-500">{t('damages.warehouse', 'Warehouse')}</p>
                            <p className="font-medium">{warehouse?.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Damage Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('damages.damage_details', 'Damage Details')}</h3>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    {t('damages.damage_date', 'Damage Date')}
                                    <span className="text-red-500 ml-1">*</span>
                                </span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered"
                                value={form.data.date}
                                onChange={(e) => form.setData("date", e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    {t('damages.damaged_quantity', 'Damaged Quantity')}
                                    <span className="text-red-500 ml-1">*</span>
                                </span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={data?.quantity || 9999}
                                className="input input-bordered"
                                value={form.data.quantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    const maxQuantity = data?.quantity || 9999;
                                    form.setData("quantity", Math.min(value, maxQuantity));
                                }}
                                required
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    {t('damages.available_quantity', 'Available Quantity')}: {data?.quantity || 0}
                                </span>
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    {t('damages.account', 'Account')}
                                    <span className="text-red-500 ml-1">*</span>
                                </span>
                            </label>
                            <div className="relative">
                               <select
                                   className="select select-bordered"
                                   value={form.data.account_id}
                                   onChange={(e) => form.setData("account_id", e.target.value)}
                                   required
                               >
                                   <option value="">{t('damages.select_account', 'Select Account')}</option>
                                   {accounts.map((account) => (
                                       <option key={account.id} value={account.id}>
                                           {account.name} (Balance: ${account.current_balance})
                                       </option>
                                   ))}
                               </select>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    {t('damages.loss_amount_per_unit', 'Loss Amount per Unit')}
                                    <span className="text-red-500 ml-1">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input input-bordered pl-4"
                                    value={form.data.loss_amount}
                                    onChange={(e) => form.setData("loss_amount", parseFloat(e.target.value) || 0)}
                                    required
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Damage Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('damages.additional_information', 'Additional Information')}</h3>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    {t('damages.damage_reason', 'Damage Reason')}
                                    <span className="text-red-500 ml-1">*</span>
                                </span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={form.data.reason}
                                onChange={(e) => form.setData("reason", e.target.value)}
                                required
                            >
                                <option value="">{t('damages.select_reason', 'Select Reason')}</option>
                                <option value="transport">{t('damages.transport_damage', 'Transport Damage')}</option>
                                <option value="storage">{t('damages.storage_damage', 'Storage Damage')}</option>
                                <option value="manufacturing">{t('damages.manufacturing_defect', 'Manufacturing Defect')}</option>
                                <option value="expired">{t('damages.expired_product', 'Expired Product')}</option>
                                <option value="handling">{t('damages.mishandling', 'Mishandling')}</option>
                                <option value="other">{t('damages.other', 'Other')}</option>
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{t('damages.notes', 'Notes')}</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                rows="4"
                                placeholder={t('damages.additional_notes_placeholder', 'Additional notes about the damage...')}
                                value={form.data.notes}
                                onChange={(e) => form.setData("notes", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="card bg-base-100 shadow-sm mt-6">
                    <div className="card-body">
                        <h3 className="card-title text-lg">{t('damages.summary', 'Summary')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="stat">
                                <div className="stat-title">{t('damages.damaged_quantity', 'Damaged Quantity')}</div>
                                <div className="stat-value text-2xl">{form.data.quantity}</div>
                            </div>
                            
                            {/* <div className="stat">
                                <div className="stat-title">{t('damages.loss_per_unit', 'Loss per Unit')}</div>
                                <div className="stat-value text-2xl">${form.data.loss_amount.toFixed(2)}</div>
                            </div> */}
                            
                            <div className="stat">
                                <div className="stat-title">{t('damages.total_loss', 'Total Loss')}</div>
                                <div className="stat-value text-2xl text-error">${totalLoss.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Messages */}
                {Object.keys(form.errors).length > 0 && (
                    <div className="alert alert-error mt-4">
                        <div>
                            <span>{t('damages.form_errors', 'Please fix the following errors:')}</span>
                            <ul className="mt-2">
                                {Object.entries(form.errors).map(([key, error]) => (
                                    <li key={key}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        className="btn bg-[#1e4d2b] text-white"
                        disabled={form.processing}
                    >
                        {form.processing 
                            ? t('damages.saving', 'Saving...') 
                            : t('damages.create_damage_record', 'Create Damage Record')
                        }
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (isSale) {
                                router.visit(route("sales.show", parentData?.id));
                            } else {
                                router.visit(route("purchases.show", parentData?.id));
                            }
                        }}
                        className="btn btn-ghost"
                    >
                        {t('damages.cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}