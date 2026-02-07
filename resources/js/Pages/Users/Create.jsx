import React, { useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft as ArrowLeftIcon, Save as SaveIcon, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function Create({ user, roles, isEdit = false, outlets = [], outlet_exist }) {
  const { flash } = usePage().props;
  const { locale } = useTranslation();

  useEffect(() => {
    if (flash?.error) toast.error(flash.error);
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  const { data, setData, errors, post, processing } = useForm({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    password: "",
    password_confirmation: "",
    roles: user?.roles || [],
    outlet_id: user?.current_outlet_id || "", // Add outlet_id to form data
  });

  const handleRoleChange = (roleName, isChecked) => {
    if (isChecked) {
      setData("roles", [...data.roles, roleName]);
    } else {
      setData("roles", data.roles.filter((role) => role !== roleName));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setData("roles", [...roles]);
    } else {
      setData("roles", []);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (isEdit) {
      post(route("users.update", user.id), {
        preserveScroll: true,
      });
    } else {
      post(route("userlist.store"), {
        preserveScroll: true,
      });
    }
  };

  const title = isEdit ? "Edit User" : "Create New User";
  const description = isEdit
    ? "Update user information and permissions."
    : "Create a new user account with specific roles and permissions.";
  const submitText = processing
    ? isEdit
      ? "Saving..."
      : "Creating..."
    : isEdit
      ? "Save Changes"
      : "Create User";

  const gradient = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div
            className="mb-8 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-900/10"
            style={{ background: gradient }}
          >
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-white/80">{description}</p>
              {outlet_exist && !isEdit && (
                <p className="mt-2 text-sm text-white/60">
                  Note: Since you have an active subscription, you must select an outlet for the new user.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-200">
            <div className="p-6 bg-white">
              <form onSubmit={submit}>
                {/* Basic Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Outlet Field - Conditionally rendered based on subscription status */}
                    {outlet_exist && !isEdit ? (
                      <div>
                        <label
                          htmlFor="outlet_id"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Outlet <span className="text-red-600">*</span>
                        </label>
                        <select
                          id="outlet_id"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                          value={data.outlet_id}
                          onChange={(e) => setData("outlet_id", e.target.value)}
                          required={outlet_exist && !isEdit}
                        >
                          <option value="">{locale === "bn" ? "সিলেক্ট করুন" : "Select an outlet"}</option>
                          {outlets.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}{o.code ? ` (${o.code})` : ""}
                            </option>
                          ))}
                        </select>
                        {errors.outlet_id && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.outlet_id}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          {locale === "bn" ? "সাবস্ক্রিপশন ইউজারের জন্য আবশ্যক" : "Required for subscription users"}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="outlet_id"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {locale === "bn" ? "আউটলেট (ঐচ্ছিক)" : "Outlet (optional)"}
                        </label>
                        <select
                          id="outlet_id"
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                          value={data.outlet_id}
                          onChange={(e) => setData("outlet_id", e.target.value)}
                        >
                          <option value="">{locale === "bn" ? "সব/খালি" : "None"}</option>
                          {outlets.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}{o.code ? ` (${o.code})` : ""}
                            </option>
                          ))}
                        </select>
                        {errors.outlet_id && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.outlet_id}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address
                      </label>
                      <textarea
                        id="address"
                        rows="3"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                        value={data.address}
                        onChange={(e) => setData("address", e.target.value)}
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password (Optional for edit) */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {isEdit ? "Change Password (Optional)" : "Password"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {isEdit ? "New Password" : "Password *"}
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        placeholder={isEdit ? "Leave blank to keep current password" : ""}
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="password_confirmation"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {isEdit ? "Confirm New Password" : "Confirm Password *"}
                      </label>
                      <input
                        type="password"
                        id="password_confirmation"
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-200/60 focus:border-emerald-600 transition-all"
                        value={data.password_confirmation}
                        onChange={(e) =>
                          setData("password_confirmation", e.target.value)
                        }
                        placeholder={isEdit ? "Leave blank to keep current password" : ""}
                      />
                    </div>
                  </div>

                  {isEdit && (
                    <p className="mt-2 text-sm text-gray-500">
                      Note: Leave password fields blank if you don't want to
                      change the password.
                    </p>
                  )}
                </div>

                {/* Roles */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Roles & Permissions *
                    </h3>
                    <button
                      type="button"
                      className="text-sm font-medium text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
                      onClick={() =>
                        handleSelectAll(data.roles.length !== roles.length)
                      }
                    >
                      {data.roles.length === roles.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles && roles.length > 0 ? (
                      roles.map((role) => (
                        <div
                          key={role}
                          className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-emerald-50/40 transition-colors"
                        >
                          <input
                            type="checkbox"
                            id={`role-${role}`}
                            className="h-5 w-5 text-emerald-700 focus:ring-emerald-600 border-gray-300 rounded"
                            checked={data.roles.includes(role)}
                            onChange={(e) =>
                              handleRoleChange(role, e.target.checked)
                            }
                          />
                          <label
                            htmlFor={`role-${role}`}
                            className="ml-3 flex-1 text-sm font-medium text-gray-700 capitalize cursor-pointer"
                          >
                            {role.replace("_", " ")}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-3 p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-sm text-gray-500">
                          No roles available. Please create roles first.
                        </p>
                      </div>
                    )}
                  </div>

                  {errors.roles && (
                    <p className="mt-2 text-sm text-red-600">{errors.roles}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link
                    href={route("userlist.view")}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={processing}
                    className="flex items-center gap-2 px-6 py-2.5 text-white font-medium rounded-xl hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                    style={{ background: gradient }}
                  >
                    <SaveIcon className="h-5 w-5" />
                    {submitText}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}

// You can remove the SelectField component since we're using direct select elements now