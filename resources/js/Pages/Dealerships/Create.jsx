import { useForm, router } from "@inertiajs/react";
import { useState } from "react";
import { 
    ArrowLeft, Save, Building2, User, Mail, Phone, MapPin, 
    FileText, CreditCard, Calendar, DollarSign, Shield, 
    Star, FileCheck, TrendingUp, Clock, CheckCircle, XCircle 
} from "lucide-react";

export default function Create({ companies, users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        company_id: "",
        name: "",
        owner_name: "",
        email: "",
        phone: "",
        address: "",
        trade_license_no: "",
        tin_no: "",
        nid_no: "",
        advance_amount: "",
        due_amount: "",
        credit_limit: "",
        payment_terms: "",
        contract_start: "",
        contract_end: "",
        contract_file: "",
        status: "pending",
        approved_by: "",
        approved_at: "",
        remarks: "",
        total_sales: "",
        total_orders: "",
        rating: "",
        last_order_date: "",
        agreement_doc: "",
        bank_guarantee_doc: "",
        trade_license_doc: "",
        nid_doc: "",
        tax_clearance_doc: ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("dealerships.store"), {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Create New Dealership</h1>
                        <p className="text-gray-600 mt-2">Add a new dealership partner to your network</p>
                    </div>
                    <a
                        href={route("dealerships.index")}
                        className="group flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                    >
                        <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Back</span>
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Building2 className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Basic Information</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Building2 size={16} className="text-blue-600" />
                                    Company *
                                </label>
                                <select
                                    value={data.company_id}
                                    onChange={(e) => setData("company_id", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.company_id && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.company_id}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dealership Name *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="Enter dealership name"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                        ⚠️ {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <User size={16} className="text-green-600" />
                                    Owner Name
                                </label>
                                <input
                                    type="text"
                                    value={data.owner_name}
                                    onChange={(e) => setData("owner_name", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="Enter owner's full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Mail size={16} className="text-red-500" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="email@example.com"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Phone size={16} className="text-purple-600" />
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData("phone", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="+1 (555) 000-0000"
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <MapPin size={16} className="text-orange-500" />
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={(e) => setData("address", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                    placeholder="Full business address"
                                />
                                {errors.address && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">{errors.address}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legal & Registration Information */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Shield className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Legal & Registration</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trade License No.
                                </label>
                                <input
                                    type="text"
                                    value={data.trade_license_no}
                                    onChange={(e) => setData("trade_license_no", e.target.value)}
                                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white"
                                    placeholder="Trade license number"
                                />
                                {errors.trade_license_no && (
                                    <p className="text-sm text-red-600 mt-2">{errors.trade_license_no}</p>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    TIN No.
                                </label>
                                <input
                                    type="text"
                                    value={data.tin_no}
                                    onChange={(e) => setData("tin_no", e.target.value)}
                                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    placeholder="Tax identification number"
                                />
                                {errors.tin_no && (
                                    <p className="text-sm text-red-600 mt-2">{errors.tin_no}</p>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NID No.
                                </label>
                                <input
                                    type="text"
                                    value={data.nid_no}
                                    onChange={(e) => setData("nid_no", e.target.value)}
                                    className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                    placeholder="National ID number"
                                />
                                {errors.nid_no && (
                                    <p className="text-sm text-red-600 mt-2">{errors.nid_no}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Financial Information</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-600" />
                                    Advance Amount (Tk)
                                </label>
                                <input
                                    type="number"
                                    value={data.advance_amount}
                                    onChange={(e) => setData("advance_amount", e.target.value)}
                                    className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                                {errors.advance_amount && (
                                    <p className="text-sm text-red-600 mt-2">{errors.advance_amount}</p>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CreditCard size={16} className="text-yellow-600" />
                                    Due Amount (Tk)
                                </label>
                                <input
                                    type="number"
                                    value={data.due_amount}
                                    onChange={(e) => setData("due_amount", e.target.value)}
                                    className="w-full px-4 py-3 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CreditCard size={16} className="text-blue-600" />
                                    Credit Limit (Tk)
                                </label>
                                <input
                                    type="number"
                                    value={data.credit_limit}
                                    onChange={(e) => setData("credit_limit", e.target.value)}
                                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Terms
                                </label>
                                <input
                                    type="text"
                                    value={data.payment_terms}
                                    onChange={(e) => setData("payment_terms", e.target.value)}
                                    className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                    placeholder="e.g., 30 days credit"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contract Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Contract Information</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-600" />
                                    Contract Start Date
                                </label>
                                <input
                                    type="date"
                                    value={data.contract_start}
                                    onChange={(e) => setData("contract_start", e.target.value)}
                                    className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                                />
                                {errors.contract_start && (
                                    <p className="text-sm text-red-600 mt-2">{errors.contract_start}</p>    
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-pink-600" />
                                    Contract End Date
                                </label>
                                <input
                                    type="date"
                                    value={data.contract_end}
                                    onChange={(e) => setData("contract_end", e.target.value)}
                                    className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-white"
                                />
                                {errors.contract_end && (
                                    <p className="text-sm text-red-600 mt-2">{errors.contract_end}</p>    
                                )}
                            </div>
{/* 
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileCheck size={16} className="text-blue-600" />
                                    Contract File
                                </label>
                                <input
                                    type="text"
                                    value={data.contract_file}
                                    onChange={(e) => setData("contract_file", e.target.value)}
                                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    placeholder="Contract file path/URL"
                                />
                                {errors.contract_file && (
                                    <p className="text-sm text-red-600 mt-2">{errors.contract_file}</p>
                                )}
                            </div> */}

                            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock size={16} className="text-gray-600" />
                                    Last Order Date
                                </label>
                                <input
                                    type="date"
                                    value={data.last_order_date}
                                    onChange={(e) => setData("last_order_date", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Performance & Status Card */}
                    {/* <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-slate-600 to-gray-700 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Performance & Status</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-green-600" />
                                    Total Sales (Tk)
                                </label>
                                <input
                                    type="number"
                                    value={data.total_sales}
                                    onChange={(e) => setData("total_sales", e.target.value)}
                                    className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Orders
                                </label>
                                <input
                                    type="number"
                                    value={data.total_orders}
                                    onChange={(e) => setData("total_orders", e.target.value)}
                                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                    placeholder="0"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Star size={16} className="text-yellow-600" />
                                    Rating (0-5)
                                </label>
                                <input
                                    type="number"
                                    value={data.rating}
                                    onChange={(e) => setData("rating", e.target.value)}
                                    className="w-full px-4 py-3 border border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white"
                                    placeholder="0.0"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData("status", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                    </div> */}

                    {/* Document Uploads Card */}
                   <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <FileCheck className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Document Uploads</h2>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="file-upload-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Agreement Document
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData("agreement_doc", file);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {errors.agreement_doc && (
                                    <p className="text-sm text-red-600 mt-2">{errors.agreement_doc}</p>
                                )}
                                {data.agreement_doc && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        Selected: {data.agreement_doc.name}
                                    </p>
                                )}
                            </div>

                            {/* Bank Guarantee Document */}
                            <div className="file-upload-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bank Guarantee Document
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData("bank_guarantee_doc", file);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {errors.bank_guarantee_doc && (
                                    <p className="text-sm text-red-600 mt-2">{errors.bank_guarantee_doc}</p>
                                )}
                                {data.bank_guarantee_doc && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        Selected: {data.bank_guarantee_doc.name}
                                    </p>
                                )}
                            </div>

                            {/* Trade License Document */}
                            <div className="file-upload-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trade License Document
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData("trade_license_doc", file);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {errors.trade_license_doc && (
                                    <p className="text-sm text-red-600 mt-2">{errors.trade_license_doc}</p>
                                )}
                                {data.trade_license_doc && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        Selected: {data.trade_license_doc.name}
                                    </p>
                                )}
                            </div>

                            {/* NID Document */}
                            <div className="file-upload-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NID Document
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData("nid_doc", file);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {errors.nid_doc && (
                                    <p className="text-sm text-red-600 mt-2">{errors.nid_doc}</p>
                                )}
                                {data.nid_doc && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        Selected: {data.nid_doc.name}
                                    </p>
                                )}
                            </div>

                            {/* Tax Clearance Document */}
                            <div className="file-upload-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tax Clearance Document
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData("tax_clearance_doc", file);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                </div>
                                {errors.tax_clearance_doc && (
                                    <p className="text-sm text-red-600 mt-2">{errors.tax_clearance_doc}</p>
                                )}
                                {data.tax_clearance_doc && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        Selected: {data.tax_clearance_doc.name}
                                    </p>
                                )}
                            </div>

                            {/* Contract File */}
                            <div className="file-upload-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contract File
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData("contract_file", file);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept=".pdf,.doc,.docx"
                                    />
                                </div>
                                {errors.contract_file && (
                                    <p className="text-sm text-red-600 mt-2">{errors.contract_file}</p>
                                )}
                                {data.contract_file && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <CheckCircle size={16} />
                                        Selected: {data.contract_file.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <FileCheck size={18} />
                                    Upload Guidelines
                                </h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG</li>
                                    <li>• Maximum file size: 10MB per document</li>
                                    <li>• Ensure documents are clear and readable</li>
                                    <li>• All documents should be valid and up-to-date</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    

                    {/* Additional Information Card */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-gray-600 to-slate-700 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <FileText className="text-white" size={24} />
                                <h2 className="text-xl font-semibold text-white">Additional Information</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Remarks & Notes
                                </label>
                                <textarea
                                    value={data.remarks}
                                    onChange={(e) => setData("remarks", e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                                    rows={4}
                                    placeholder="Any additional notes or remarks about this dealership..."
                                />
                                {errors.remarks && (
                                    <p className="text-sm text-red-600 mt-2">{errors.remarks}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            disabled={processing}
                            className={`
                                group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white
                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                ${processing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                }
                            `}
                        >
                            <Save size={20} className={processing ? 'animate-pulse' : 'group-hover:animate-bounce'} />
                            {processing ? "Creating Dealership..." : "Create Dealership"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}