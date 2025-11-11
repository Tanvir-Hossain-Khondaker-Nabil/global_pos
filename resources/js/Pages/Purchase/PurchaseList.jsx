import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Eye, Plus, Trash2, Frown, Calendar, User, Warehouse, DollarSign, Package, Shield, Search, Filter, X, Edit, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function PurchaseList({ purchases, filters, isShadowUser }) {
    const { auth } = usePage().props;

    const [localFilters, setLocalFilters] = useState({
        search: filters.search || "",
        status: filters.status || "",
        date: filters.date || "",
    });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [paymentData, setPaymentData] = useState({
        paid_amount: 0,
        payment_status: 'unpaid'
    });
    const [approveData, setApproveData] = useState({
        items: [],
        notes: ''
    });

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters({
            search: filters.search || "",
            status: filters.status || "",
            date: filters.date || "",
        });
    }, [filters]);

    const handleFilter = (field, value) => {
        const newFilters = {
            ...localFilters,
            [field]: value
        };
        setLocalFilters(newFilters);

        // Remove empty filters
        const queryString = {};
        if (newFilters.search) queryString.search = newFilters.search;
        if (newFilters.status) queryString.status = newFilters.status;
        if (newFilters.date) queryString.date = newFilters.date;

        router.get(route("purchase.list"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({
            search: "",
            status: "",
            date: "",
        });
        router.get(route("purchase.list"), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this purchase? This will reverse the stock.")) {
            router.delete(route("purchase.destroy", id));
        }
    };

    // Payment Modal Functions
    const openPaymentModal = (purchase) => {
        setSelectedPurchase(purchase);
        setPaymentData({
            paid_amount: purchase.paid_amount,
            payment_status: purchase.payment_status
        });
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPurchase(null);
        setPaymentData({ paid_amount: 0, payment_status: 'unpaid' });
    };

    const handlePaymentUpdate = () => {
        if (!selectedPurchase) return;

        router.patch(route('purchase.updatePayment', selectedPurchase.id), paymentData, {
            onSuccess: () => {
                closePaymentModal();
            },
            preserveScroll: true
        });
    };

    // Approve Modal Functions
    const openApproveModal = (purchase) => {
        setSelectedPurchase(purchase);
        
        // Initialize approve data with shadow prices
        const itemsWithPrices = purchase.items.map(item => ({
            id: item.id,
            purchase_price: item.shadow_unit_price,
            sale_price: item.shadow_sale_price,
            total_price: item.shadow_total_price
        }));
        
        setApproveData({
            items: itemsWithPrices,
            notes: ''
        });
        
        setShowApproveModal(true);
    };

    const closeApproveModal = () => {
        setShowApproveModal(false);
        setSelectedPurchase(null);
        setApproveData({ items: [], notes: '' });
    };

    const handleApprovePurchase = () => {
        if (!selectedPurchase) return;

        // Validate all prices
        const invalidItems = approveData.items.filter(item => 
            !item.purchase_price || item.purchase_price <= 0 || 
            !item.sale_price || item.sale_price <= 0
        );

        if (invalidItems.length > 0) {
            alert('Please enter valid prices for all items');
            return;
        }

        router.patch(route('purchase.approve', selectedPurchase.id), approveData, {
            onSuccess: () => {
                closeApproveModal();
            },
            preserveScroll: true
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount);
    };

    const hasActiveFilters = localFilters.search || localFilters.status || localFilters.date;

    // Check if purchase is from shadow user and needs approval
    const isPendingApproval = (purchase) => {
        return purchase.user_type === 'shadow' && purchase.status === 'pending';
    };

    // Check if user can approve purchases (general users only)
    const canApprovePurchases = !isShadowUser && auth.role === 'admin';

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title={isShadowUser ? "Purchase Management" : "Purchase Management"}
                subtitle={isShadowUser ? "View purchase data" : "Manage your product purchases"}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                onChange={(e) => handleFilter('search', e.target.value)}
                                value={localFilters.search}
                                style={{ padding: '0 0 0 20px', width: '150px' }}
                                placeholder="Search purchases..."
                                className="input input-sm input-bordered pl-9"
                            />
                        </div>
                        <select
                            onChange={(e) => handleFilter('status', e.target.value)}
                            value={localFilters.status}
                            className="select select-sm select-bordered"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            onChange={(e) => handleFilter('date', e.target.value)}
                            value={localFilters.date}
                            className="input input-sm input-bordered"
                        />
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="btn btn-sm btn-ghost"
                                title="Clear all filters"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {auth.role === "admin" && (
                        <Link
                            href={route("purchase.create")}
                            className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                        >
                            <Plus size={15} />
                            {isShadowUser ? 'New Purchase' : 'New Purchase'}
                        </Link>
                    )}
                </div>
            </PageHeader>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mb-4 p-3 bg-base-200 rounded-box">
                    <div className="flex items-center gap-2 text-sm">
                        <Filter size={14} className="text-gray-500" />
                        <span className="font-medium">Active Filters:</span>
                        {localFilters.search && (
                            <span className="badge badge-outline">
                                Search: "{localFilters.search}"
                            </span>
                        )}
                        {localFilters.status && (
                            <span className="badge badge-outline">
                                Status: {localFilters.status}
                            </span>
                        )}
                        {localFilters.date && (
                            <span className="badge badge-outline">
                                Date: {localFilters.date}
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="btn btn-xs btn-ghost ml-auto"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                {purchases.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className={isShadowUser ? "bg-warning text-warning-content" : "bg-primary text-primary-content"}>
                            <tr>
                                <th className="bg-opacity-20">#</th>
                                <th>Purchase Details</th>
                                <th>Supplier & Warehouse</th>
                                <th>Items & Amount</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.data.map((purchase, index) => (
                                <tr key={purchase.id} className="hover:bg-base-100">
                                    <th className="bg-base-200">{index + 1}</th>
                                    <td>
                                        <div className="space-y-1">
                                            <div className="font-mono font-bold flex items-center gap-2">
                                                {purchase.purchase_no}
                                                {isPendingApproval(purchase) && (
                                                    <span className="badge badge-warning badge-sm">
                                                        <Clock size={12} /> Pending
                                                    </span>
                                                )}
                                                {purchase.user_type === 'shadow' && (
                                                    <Shield size={14} className="text-warning" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} />
                                                {formatDate(purchase.purchase_date)}
                                            </div>
                                            {purchase.user_type === 'shadow' && (
                                                <div className="text-xs text-warning flex items-center gap-1">
                                                    <Shield size={12} />
                                                    Shadow Purchase
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-blue-600" />
                                                <div>
                                                    <div className="font-medium">{purchase.supplier.name}</div>
                                                    <div className="text-xs text-gray-500">{purchase.supplier.company}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Warehouse size={14} className="text-green-600" />
                                                <div>
                                                    <div className="font-medium">{purchase.warehouse.name}</div>
                                                    <div className="text-xs text-gray-500">{purchase.warehouse.code}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-purple-600" />
                                                <span className="font-medium">
                                                    {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} units
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({purchase.items.length} items)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={14} className={isShadowUser ? "text-warning" : "text-green-600"} />
                                                <span className="font-bold">
                                                    {formatCurrency(purchase.total_amount)}
                                                </span>
                                            </div>
                                            {purchase.user_type === 'shadow' && purchase.status === 'pending' && (
                                                <div className="text-xs text-warning">
                                                    Needs Approval
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`badge badge-${purchase.status_color} badge-sm`}>
                                                {purchase.status}
                                            </span>
                                            <div className="text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Paid:</span>
                                                    <span className="text-green-600">
                                                        {formatCurrency(purchase.paid_amount)}
                                                    </span>
                                                </div>
                                                {purchase.due_amount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Due:</span>
                                                        <span className="text-orange-600">
                                                            {formatCurrency(purchase.due_amount)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`badge badge-xs ${purchase.payment_status === 'paid' ? 'badge-success' :
                                                        purchase.payment_status === 'partial' ? 'badge-warning' : 'badge-error'
                                                    }`}>
                                                    {purchase.payment_status}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <Link
                                                href={route("purchase.show", purchase.id)}
                                                className="btn btn-xs btn-info btn-outline"
                                            >
                                                <Eye size={12} /> Details
                                            </Link>

                                            {auth.role === "admin" && purchase.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => openPaymentModal(purchase)}
                                                    className="btn btn-xs btn-warning btn-outline"
                                                >
                                                    <Edit size={12} /> Payment
                                                </button>
                                            )}

                                            {canApprovePurchases && isPendingApproval(purchase) && (
                                                <button
                                                    onClick={() => openApproveModal(purchase)}
                                                    className="btn btn-xs btn-success btn-outline"
                                                >
                                                    <CheckCircle size={12} /> Approve
                                                </button>
                                            )}

                                            {auth.role === "admin" && purchase.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleDelete(purchase.id)}
                                                    className="btn btn-xs btn-error btn-outline"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-16 flex flex-col justify-center items-center gap-3">
                        <Frown size={40} className="text-gray-400" />
                        <h1 className="text-gray-500 text-lg font-medium">
                            {hasActiveFilters ? "No purchases match your filters" :
                                isShadowUser ? "No purchases found!" : "No purchases found!"}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {hasActiveFilters ? "Try adjusting your search criteria" :
                                isShadowUser ? "Get started by creating your first purchase" :
                                    "Get started by creating your first purchase"}
                        </p>
                        <div className="flex gap-2 mt-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Clear Filters
                                </button>
                            )}
                            {auth.role === "admin" && (
                                <Link
                                    href={route("purchase.create")}
                                    className={`btn btn-sm ${isShadowUser ? 'btn-warning' : 'btn-primary'}`}
                                >
                                    <Plus size={15} />
                                    {isShadowUser ? 'Create Purchase' : 'Create Purchase'}
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Pagination data={purchases} />

            {/* Payment Update Modal */}
            {showPaymentModal && selectedPurchase && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <DollarSign size={18} />
                            Update Payment Status
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-base-200 p-3 rounded-box">
                                <h4 className="font-semibold mb-2">Purchase Information</h4>
                                <div className="text-sm space-y-1">
                                    <div>Purchase #: <strong>{selectedPurchase.purchase_no}</strong></div>
                                    <div>Total Amount: <strong>{formatCurrency(selectedPurchase.total_amount)}</strong></div>
                                    <div>Current Paid: <strong>{formatCurrency(selectedPurchase.paid_amount)}</strong></div>
                                    <div>Current Due: <strong>{formatCurrency(selectedPurchase.due_amount)}</strong></div>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Payment Status</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={paymentData.payment_status}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_status: e.target.value })}
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Paid Amount (৳)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={selectedPurchase.total_amount}
                                    step="0.01"
                                    className="input input-bordered"
                                    value={paymentData.paid_amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, paid_amount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="bg-base-200 p-3 rounded-box">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span>Total Amount:</span>
                                        <strong>{formatCurrency(selectedPurchase.total_amount)}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>New Paid Amount:</span>
                                        <strong className="text-green-600">{formatCurrency(paymentData.paid_amount)}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>New Due Amount:</span>
                                        <strong className="text-orange-600">
                                            {formatCurrency(selectedPurchase.total_amount - paymentData.paid_amount)}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button onClick={closePaymentModal} className="btn btn-ghost">Cancel</button>
                            <button onClick={handlePaymentUpdate} className="btn btn-primary">
                                Update Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Shadow Purchase Modal */}
            {showApproveModal && selectedPurchase && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle size={18} className="text-success" />
                            Approve Shadow Purchase
                        </h3>

                        <div className="space-y-4">
                            {/* Purchase Summary */}
                            <div className="bg-warning/10 p-4 rounded-box border border-warning">
                                <h4 className="font-semibold mb-3 text-warning flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Purchase Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div><strong>Purchase #:</strong> {selectedPurchase.purchase_no}</div>
                                        <div><strong>Supplier:</strong> {selectedPurchase.supplier.name}</div>
                                        <div><strong>Warehouse:</strong> {selectedPurchase.warehouse.name}</div>
                                    </div>
                                    <div>
                                        <div><strong>Date:</strong> {formatDate(selectedPurchase.purchase_date)}</div>
                                        <div><strong>Shadow Total:</strong> {formatCurrency(selectedPurchase.shadow_total_amount)}</div>
                                        <div><strong>Status:</strong> <span className="badge badge-warning badge-sm">Pending Approval</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Items List with Price Approval */}
                            <div className="bg-base-200 p-4 rounded-box">
                                <h4 className="font-semibold mb-3">Approve Item Prices</h4>
                                <div className="space-y-3">
                                    {selectedPurchase.items.map((item, index) => (
                                        <div key={item.id} className="border border-gray-300 rounded-box p-3">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h5 className="font-medium">{item.product?.name || 'N/A'}</h5>
                                                    <p className="text-sm text-gray-600">
                                                        Variant: {item.variant?.name || 'Default Variant'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-warning">
                                                        Shadow Total: {formatCurrency(item.shadow_total_price)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price Approval Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Purchase Price */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">Purchase Price (৳) *</span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            className="input input-bordered input-sm flex-1"
                                                            value={approveData.items?.[index]?.purchase_price || item.shadow_unit_price}
                                                            onChange={(e) => {
                                                                const newItems = [...(approveData.items || [])];
                                                                if (!newItems[index]) {
                                                                    newItems[index] = { ...item };
                                                                }
                                                                newItems[index].purchase_price = parseFloat(e.target.value) || 0;
                                                                newItems[index].total_price = newItems[index].purchase_price * item.quantity;
                                                                setApproveData({ ...approveData, items: newItems });
                                                            }}
                                                            required
                                                        />
                                                        <div className="text-xs text-gray-500 w-20">
                                                            Shadow: ৳{item.shadow_unit_price}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sale Price */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text">Sale Price (৳) *</span>
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            className="input input-bordered input-sm flex-1"
                                                            value={approveData.items?.[index]?.sale_price || item.shadow_sale_price}
                                                            onChange={(e) => {
                                                                const newItems = [...(approveData.items || [])];
                                                                if (!newItems[index]) {
                                                                    newItems[index] = { ...item };
                                                                }
                                                                newItems[index].sale_price = parseFloat(e.target.value) || 0;
                                                                setApproveData({ ...approveData, items: newItems });
                                                            }}
                                                            required
                                                        />
                                                        <div className="text-xs text-gray-500 w-20">
                                                            Shadow: ৳{item.shadow_sale_price}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price Summary */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-2 border-t">
                                                <div className="text-xs">
                                                    <div className="flex justify-between">
                                                        <span>New Purchase Total:</span>
                                                        <span className="font-medium">
                                                            ৳{((approveData.items?.[index]?.purchase_price || item.shadow_unit_price) * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-warning">
                                                    <div className="flex justify-between">
                                                        <span>Shadow Total:</span>
                                                        <span className="font-medium">৳{item.shadow_total_price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Approval Summary */}
                            <div className="bg-info/10 p-4 rounded-box border border-info">
                                <h4 className="font-semibold mb-3 text-info">Approval Summary</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="flex justify-between">
                                            <span>Total Items:</span>
                                            <strong>{selectedPurchase.items.length} items</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Quantity:</span>
                                            <strong>{selectedPurchase.items.reduce((sum, item) => sum + item.quantity, 0)} units</strong>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between">
                                            <span>New Purchase Total:</span>
                                            <strong className="text-success">
                                                ৳{selectedPurchase.items.reduce((sum, item, index) => {
                                                    const purchasePrice = approveData.items?.[index]?.purchase_price || item.shadow_unit_price;
                                                    return sum + (purchasePrice * item.quantity);
                                                }, 0).toFixed(2)}
                                            </strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shadow Total:</span>
                                            <strong className="text-warning">
                                                ৳{selectedPurchase.shadow_total_amount}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Approval Notes (Optional)</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered"
                                    rows="3"
                                    placeholder="Add any notes about this approval..."
                                    value={approveData.notes || ''}
                                    onChange={(e) => setApproveData({ ...approveData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button onClick={closeApproveModal} className="btn btn-ghost">Cancel</button>
                            <button
                                onClick={handleApprovePurchase}
                                className="btn btn-success"
                                disabled={!approveData.items || approveData.items.length === 0}
                            >
                                <CheckCircle size={16} />
                                Approve Purchase
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}