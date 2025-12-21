import React, { useState, useEffect, useCallback, useRef } from "react";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { 
  Eye, Frown, Pen, Plus, Trash2, X, Mail, Phone, 
  MapPin, User, CheckCircle, XCircle, DollarSign, 
  CreditCard, Wallet, Receipt 
} from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import { debounce } from "lodash";

export default function Customers({ customers, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [advanceModel, setAdvanceModel] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editProcessing, setEditProcessing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Handle customer form submission
    const customerForm = useForm({
        id: "",
        customer_name: "",
        phone: "",
        address: "",
        advance_amount: 0,
        due_amount: 0,
        is_active: true,
    });

    // Handle advance payment form
    const advanceForm = useForm({
        customer_id: "",
        amount: "",
        payment_type: "cash",
        transaction_id: "",
        notes: "",
    });

    // Memoize format functions
    const formatCurrency = useCallback((amount) => {
        const formattedAmount = parseFloat(amount) || 0;
        const currency = locale === 'bn' ? 'bn-BD' : 'en-BD';
        
        return new Intl.NumberFormat(currency, {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(formattedAmount);
    }, [locale]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        const localeCode = locale === 'bn' ? 'bn-BD' : 'en-US';
        return new Date(dateString).toLocaleDateString(localeCode, options);
    }, [locale]);

    // Calculate due amount with memoization
    const calculateDueAmount = useCallback((sales) => {
        if (!sales || !Array.isArray(sales) || sales.length === 0) return 0;
        return sales.reduce((total, sale) => {
            return total + (parseFloat(sale.due_amount) || 0);
        }, 0);
    }, []);

    // Model close handlers - NOW AFTER customerForm is initialized
    const modelClose = useCallback(() => {
        customerForm.reset();
        setModel(false);
    }, [customerForm]);

    const advanceModelClose = useCallback(() => {
        advanceForm.reset();
        setSelectedCustomer(null);
        setAdvanceModel(false);
    }, [advanceForm]);

    // Handle search with debounce
    const searchForm = useForm({
        search: filters?.search || "",
    });

    // Use ref for debounce to maintain instance
    const debouncedSearchRef = useRef(
        debounce((value) => {
            router.get(route("customer.index"), 
                { search: value },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    onStart: () => setLoading(true),
                    onFinish: () => setLoading(false),
                }
            );
        }, 500)
    );

    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);
        debouncedSearchRef.current(value);
    };

    const handleAdvancePayment = (customer) => {
        setSelectedCustomer(customer);
        advanceForm.setData({
            customer_id: customer.id,
            amount: "",
            payment_type: "cash",
            transaction_id: "",
            notes: "",
        });
        setAdvanceModel(true);
    };

    const handleAdvanceSubmit = (e) => {
        e.preventDefault();

        if (!advanceForm.data.amount || parseFloat(advanceForm.data.amount) <= 0) {
            alert(t('customer.amount_required', 'Please enter a valid amount'));
            return;
        }

        advanceForm.post(route("advancePayment.store", { id: selectedCustomer.id }), {
            preserveScroll: true,
            onSuccess: () => {
                advanceForm.reset();
                setAdvanceModel(false);
                setSelectedCustomer(null);
            },
            onError: (errors) => {
                console.error("Advance payment errors:", errors);
            }
        });
    };

    const handleCustomerCreateForm = (e) => {
        e.preventDefault();

        // Validation
        if (!customerForm.data.customer_name.trim()) {
            alert(t('customer.name_required', 'Customer name is required'));
            return;
        }

        if (!customerForm.data.phone.trim()) {
            alert(t('customer.phone_required', 'Phone number is required'));
            return;
        }

        if (customerForm.data.id) {
            // Update existing customer
            customerForm.put(route("customer.update", customerForm.data.id), {
                preserveScroll: true,
                onSuccess: () => {
                    customerForm.reset();
                    setModel(false);
                },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                }
            });
        } else {
            // Create new customer
            customerForm.post(route("customer.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    customerForm.reset();
                    setModel(false);
                },
                onError: (errors) => {
                    console.error("Create errors:", errors);
                }
            });
        }
    };

    // Handle customer edit
    const handleCustomerEdit = async (id) => {
        if (editProcessing) return;
        
        setEditProcessing(true);
        try {
            const res = await axios.get(route("customer.edit", { id: id }));
            const data = res.data?.data;
            
            if (data) {
                customerForm.setData({
                    id: data.id,
                    customer_name: data.customer_name || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    advance_amount: parseFloat(data.advance_amount) || 0,
                    due_amount: parseFloat(data.due_amount) || 0,
                    is_active: Boolean(data.is_active),
                });
                setModel(true);
            }
        } catch (error) {
            console.error("Error fetching customer:", error);
            alert(t('customer.fetch_error', 'Failed to fetch customer data'));
        } finally {
            setEditProcessing(false);
        }
    };

    // Calculate summary stats
    const summaryStats = React.useMemo(() => {
        const totalCustomers = customers?.total || 0;
        const activeCustomers = customers?.data?.filter(c => c.is_active).length || 0;
        const totalAdvance = customers?.data?.reduce((sum, c) => sum + parseFloat(c.advance_amount || 0), 0) || 0;
        const totalDue = customers?.data?.reduce((sum, c) => sum + calculateDueAmount(c.sales), 0) || 0;
        
        return { totalCustomers, activeCustomers, totalAdvance, totalDue };
    }, [customers, calculateDueAmount]);

    // Cleanup debounce on unmount
    useEffect(() => {
        const debouncedSearch = debouncedSearchRef.current;
        
        return () => {
            debouncedSearch.cancel();
        };
    }, []);

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('customer.title', 'Customer Management')}
                subtitle={t('customer.subtitle', 'Manage your all customers from here.')}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="search"
                            onChange={handleSearch}
                            value={searchForm.data.search}
                            placeholder={t('customer.search_placeholder', 'Search customers...')}
                            className="input input-sm input-bordered w-64 pr-10"
                            disabled={loading}
                        />
                        {loading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="loading loading-spinner loading-xs"></div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            customerForm.reset();
                            setModel(true);
                        }}
                        className="btn btn-primary btn-sm"
                        disabled={customerForm.processing}
                    >
                        <Plus size={15} /> {t('customer.add_new', 'Add New')}
                    </button>
                </div>
            </PageHeader>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-box p-4">
                    <p className="text-sm text-blue-600 font-medium">{t('customer.total_customers', 'Total Customers')}</p>
                    <p className="text-2xl font-bold text-blue-700">{summaryStats.totalCustomers}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-box p-4">
                    <p className="text-sm text-green-600 font-medium">{t('customer.active_customers', 'Active Customers')}</p>
                    <p className="text-2xl font-bold text-green-700">{summaryStats.activeCustomers}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-box p-4">
                    <p className="text-sm text-amber-600 font-medium">{t('customer.total_advance', 'Total Advance')}</p>
                    <p className="text-2xl font-bold text-amber-700">
                        {formatCurrency(summaryStats.totalAdvance)}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-box p-4">
                    <p className="text-sm text-red-600 font-medium">{t('customer.total_due', 'Total Due')}</p>
                    <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(summaryStats.totalDue)}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {customers?.data?.length > 0 ? (
                    <>
                        <table className="table table-auto w-full">
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th className="w-12">#</th>
                                    <th>{t('customer.contact_info', 'Contact Info')}</th>
                                    <th>{t('customer.address', 'Address')}</th>
                                    <th>{t('customer.financial_info', 'Financial Info')}</th>
                                    <th>{t('customer.status', 'Status')}</th>
                                    <th>{t('customer.join_at', 'Joined On')}</th>
                                    <th className="w-32">{t('customer.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.map((customer, index) => {
                                    const dueAmount = calculateDueAmount(customer.sales);
                                    
                                    return (
                                        <tr key={customer.id} className={!customer.is_active ? 'opacity-70' : ''}>
                                            <th>{index + 1}</th>
                                            <td>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 font-semibold">
                                                        <User size={14} />
                                                        <span>{customer.customer_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={12} />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                            
                                                </div>
                                            </td>
                                            <td className="max-w-xs">
                                                {customer.address ? (
                                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-2">{customer.address}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">
                                                        {t('customer.no_address', 'No address')}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">
                                                            {t('customer.advance', 'Advance')}:
                                                            <span className="font-semibold ml-1 text-green-600">
                                                                {formatCurrency(customer.advance_amount || 0)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">
                                                            {t('customer.due', 'Due')}:
                                                            <span className="font-semibold ml-1 text-red-600">
                                                                {formatCurrency(dueAmount)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        {customer.sales?.length || 0} {t('customer.sales', 'sales')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {customer.is_active ? (
                                                        <>
                                                            <CheckCircle size={10} />
                                                            <span>{t('customer.active', 'Active')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={10} />
                                                            <span>{t('customer.inactive', 'Inactive')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm text-gray-600">
                                                    {formatDate(customer.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route("customer.show", { id: customer.id })}
                                                        className="btn btn-xs btn-info"
                                                        title={t('customer.view_details', 'View Details')}
                                                    >
                                                        <Eye size={12} />
                                                    </Link>

                                                    <button
                                                        onClick={() => handleAdvancePayment(customer)}
                                                        className="btn btn-xs btn-success"
                                                        title={t('customer.add_advance', 'Add Advance')}
                                                        disabled={!customer.is_active}
                                                    >
                                                        <DollarSign size={12} />
                                                    </button>

                                                    {auth.user?.can?.edit_customer && (
                                                        <>
                                                            <button
                                                                disabled={editProcessing}
                                                                onClick={() => handleCustomerEdit(customer.id)}
                                                                className="btn btn-xs btn-warning"
                                                                title={t('customer.edit', 'Edit')}
                                                            >
                                                                <Pen size={12} />
                                                            </button>
                                                            {auth.user?.can?.delete_customer && (
                                                                <Link
                                                                    href={route("customer.del", { id: customer.id })}
                                                                    onClick={(e) => {
                                                                        if (!confirm(t('customer.delete_confirmation', 'Are you sure you want to delete this customer?'))) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    className="btn btn-xs btn-error"
                                                                    title={t('customer.delete', 'Delete')}
                                                                    method="delete"
                                                                    as="button"
                                                                    preserveScroll
                                                                >
                                                                    <Trash2 size={12} />
                                                                </Link>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        {customers.links && customers.links.length > 3 && (
                            <div className="mt-6">
                                <Pagination data={customers} />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3 text-center">
                        <Frown size={40} className="text-gray-400" />
                        <div>
                            <h3 className="text-gray-500 font-medium mb-1">
                                {t('customer.no_customers_found', 'No customers found')}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {searchForm.data.search
                                    ? t('customer.no_matching_customers', 'No customers matching ":search"', {
                                        search: searchForm.data.search
                                    })
                                    : t('customer.get_started_message', 'Get started by adding your first customer')
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                customerForm.reset();
                                setModel(true);
                            }}
                            className="btn btn-primary btn-sm"
                            disabled={customerForm.processing}
                        >
                            <Plus size={15} /> {t('customer.add_new_customer', 'Add New Customer')}
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Customer Modal */}
            {model && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                            <h1 className="text-lg font-semibold text-gray-900">
                                {customerForm.data.id
                                    ? t('customer.edit_customer', 'Edit Customer')
                                    : t('customer.add_new_customer', 'Add New Customer')
                                }
                            </h1>
                            <button
                                onClick={modelClose}
                                className="btn btn-circle btn-xs btn-ghost"
                                disabled={customerForm.processing}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCustomerCreateForm} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Customer Name */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">
                                            {t('customer.customer_name', 'Customer Name')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerForm.data.customer_name}
                                        onChange={(e) => customerForm.setData("customer_name", e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder={t('customer.customer_name_placeholder', 'Enter customer name')}
                                        required
                                        disabled={customerForm.processing}
                                    />
                                    {customerForm.errors.customer_name && (
                                        <label className="label">
                                            <span className="label-text-alt text-red-500">
                                                {customerForm.errors.customer_name}
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">
                                            {t('customer.customer_phone', 'Phone')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerForm.data.phone}
                                        onChange={(e) => customerForm.setData("phone", e.target.value)}
                                        className="input input-bordered w-full"
                                        placeholder={t('customer.customer_phone_placeholder', 'Enter phone number')}
                                        required
                                        disabled={customerForm.processing}
                                    />
                                    {customerForm.errors.phone && (
                                        <label className="label">
                                            <span className="label-text-alt text-red-500">
                                                {customerForm.errors.phone}
                                            </span>
                                        </label>
                                    )}
                                </div>


                                {/* Status */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">
                                            {t('customer.status_field', 'Status')}
                                        </span>
                                    </label>
                                    <label className="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={customerForm.data.is_active}
                                            onChange={(e) => customerForm.setData("is_active", e.target.checked)}
                                            className="toggle toggle-primary"
                                            disabled={customerForm.processing}
                                        />
                                        <span className="label-text">
                                            {customerForm.data.is_active
                                                ? t('customer.active_status', 'Active')
                                                : t('customer.inactive_status', 'Inactive')
                                            }
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">
                                        {t('customer.customer_address', 'Address')}
                                    </span>
                                </label>
                                <textarea
                                    value={customerForm.data.address}
                                    onChange={(e) => customerForm.setData("address", e.target.value)}
                                    className="textarea textarea-bordered w-full"
                                    rows="3"
                                    placeholder={t('customer.customer_address_placeholder', 'Enter full address')}
                                    disabled={customerForm.processing}
                                />
                                {customerForm.errors.address && (
                                    <label className="label">
                                        <span className="label-text-alt text-red-500">
                                            {customerForm.errors.address}
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={customerForm.processing}
                                    className="btn btn-primary flex-1"
                                >
                                    {customerForm.processing
                                        ? <span className="loading loading-spinner"></span>
                                        : customerForm.data.id
                                            ? t('customer.update_customer', 'Update Customer')
                                            : t('customer.add_customer', 'Add Customer')
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={modelClose}
                                    className="btn btn-ghost"
                                    disabled={customerForm.processing}
                                >
                                    {t('customer.cancel', 'Cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Advance Payment Modal */}
            {advanceModel && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                            <h1 className="text-lg font-semibold text-gray-900">
                                {t('customer.add_advance_payment', 'Add Advance Payment')}
                            </h1>
                            <button
                                onClick={advanceModelClose}
                                className="btn btn-circle btn-xs btn-ghost"
                                disabled={advanceForm.processing}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {selectedCustomer && (
                            <>
                                {/* Customer Information */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <h3 className="font-medium text-gray-900 mb-3">
                                        {t('customer.customer_info', 'Customer Information')}
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">{t('customer.customer_name', 'Customer Name')}:</span>
                                            <span className="font-medium">{selectedCustomer.customer_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">{t('customer.phone', 'Phone')}:</span>
                                            <span>{selectedCustomer.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">{t('customer.current_advance', 'Current Advance')}:</span>
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(selectedCustomer.advance_amount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleAdvanceSubmit} className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">
                                                {t('customer.amount', 'Amount')}
                                                <span className="text-red-500 ml-1">*</span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <DollarSign size={16} className="text-gray-400" />
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={advanceForm.data.amount}
                                                onChange={(e) => advanceForm.setData("amount", e.target.value)}
                                                className="input input-bordered w-full pl-3"
                                                placeholder={t('customer.amount_placeholder', 'Enter amount')}
                                                required
                                                disabled={advanceForm.processing}
                                            />
                                        </div>
                                        {advanceForm.errors.amount && (
                                            <label className="label">
                                                <span className="label-text-alt text-red-500">
                                                    {advanceForm.errors.amount}
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    {/* Payment Type */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">
                                                {t('customer.payment_type', 'Payment Type')}
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['cash', 'bank', 'mobile'].map((type) => (
                                                <label key={type} className="flex flex-col items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="payment_type"
                                                        value={type}
                                                        checked={advanceForm.data.payment_type === type}
                                                        onChange={(e) => advanceForm.setData("payment_type", e.target.value)}
                                                        className="radio radio-primary"
                                                        disabled={advanceForm.processing}
                                                    />
                                                    <span className="text-xs mt-2 capitalize">
                                                        {type === 'cash' && <Wallet size={14} className="inline mr-1" />}
                                                        {type === 'bank' && <CreditCard size={14} className="inline mr-1" />}
                                                        {type === 'mobile' && <Phone size={14} className="inline mr-1" />}
                                                        {t(`customer.payment_${type}`, type)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        {advanceForm.errors.payment_type && (
                                            <label className="label">
                                                <span className="label-text-alt text-red-500">
                                                    {advanceForm.errors.payment_type}
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    {/* Transaction ID (if not cash) */}
                                    {advanceForm.data.payment_type !== 'cash' && (
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">
                                                    {t('customer.transaction_id', 'Transaction ID')}
                                                    <span className="text-red-500 ml-1">*</span>
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={advanceForm.data.transaction_id}
                                                onChange={(e) => advanceForm.setData("transaction_id", e.target.value)}
                                                className="input input-bordered w-full"
                                                placeholder={t('customer.transaction_id_placeholder', 'Enter transaction ID')}
                                                required={advanceForm.data.payment_type !== 'cash'}
                                                disabled={advanceForm.processing}
                                            />
                                            {advanceForm.errors.transaction_id && (
                                                <label className="label">
                                                    <span className="label-text-alt text-red-500">
                                                        {advanceForm.errors.transaction_id}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">
                                                {t('customer.notes', 'Notes')}
                                            </span>
                                        </label>
                                        <textarea
                                            value={advanceForm.data.notes}
                                            onChange={(e) => advanceForm.setData("notes", e.target.value)}
                                            className="textarea textarea-bordered w-full"
                                            rows="2"
                                            placeholder={t('customer.notes_placeholder', 'Any additional notes...')}
                                            disabled={advanceForm.processing}
                                        />
                                        {advanceForm.errors.notes && (
                                            <label className="label">
                                                <span className="label-text-alt text-red-500">
                                                    {advanceForm.errors.notes}
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={advanceForm.processing}
                                            className="btn btn-success flex-1"
                                        >
                                            {advanceForm.processing
                                                ? <span className="loading loading-spinner"></span>
                                                : t('customer.submit_payment', 'Submit Payment')
                                            }
                                        </button>
                                        <button
                                            type="button"
                                            onClick={advanceModelClose}
                                            className="btn btn-ghost"
                                            disabled={advanceForm.processing}
                                        >
                                            {t('customer.cancel', 'Cancel')}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}