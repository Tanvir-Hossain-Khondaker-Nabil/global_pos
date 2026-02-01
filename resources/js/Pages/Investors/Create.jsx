import React, { useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function Create() {
  const { flash } = usePage().props;
  const { locale } = useTranslation();

  const { data, setData, post, processing, errors } = useForm({
    name: "",
    phone: "",
    email: "",
    address: "",
    is_active: true,
  });

  useEffect(() => {
    if (flash?.error) toast.error(flash.error);
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  const submit = (e) => {
    e.preventDefault();
    post(route("investors.store"), { preserveScroll: true });
  };

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title={locale === "bn" ? "নতুন ইনভেস্টর" : "Create Investor"}
        icon={<UserPlus className="w-5 h-5" />}
        actions={
          <Link
            href={route("investors.index")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            <ArrowLeft size={16} />
            {locale === "bn" ? "ফিরে যান" : "Back"}
          </Link>
        }
      />

      <form onSubmit={submit} className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={locale === "bn" ? "নাম" : "Name"}
            value={data.name}
            onChange={(v) => setData("name", v)}
            error={errors.name}
            required
          />
          <Field
            label={locale === "bn" ? "ফোন" : "Phone"}
            value={data.phone}
            onChange={(v) => setData("phone", v)}
            error={errors.phone}
          />
          <Field
            label={locale === "bn" ? "ইমেইল" : "Email"}
            value={data.email}
            onChange={(v) => setData("email", v)}
            error={errors.email}
          />
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {locale === "bn" ? "স্ট্যাটাস" : "Status"}
            </label>
            <select
              value={data.is_active ? "1" : "0"}
              onChange={(e) => setData("is_active", e.target.value === "1")}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            {errors.is_active ? <p className="text-xs text-rose-600 mt-1">{errors.is_active}</p> : null}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">
              {locale === "bn" ? "ঠিকানা" : "Address"}
            </label>
            <textarea
              value={data.address}
              onChange={(e) => setData("address", e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
              rows={3}
            />
            {errors.address ? <p className="text-xs text-rose-600 mt-1">{errors.address}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            disabled={processing}
            className="inline-flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#163a21] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold"
          >
            <Save size={16} />
            {locale === "bn" ? "সেভ" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, error, required }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
      />
      {error ? <p className="text-xs text-rose-600 mt-1">{error}</p> : null}
    </div>
  );
}
