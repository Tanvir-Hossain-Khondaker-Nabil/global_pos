import React, { useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function Edit({ investment, investors = [], outlets = [] }) {
  const { flash } = usePage().props;
  const { locale } = useTranslation();

  const { data, setData, put, processing, errors } = useForm({
    outlet_id: investment?.outlet_id || "",
    investor_id: investment?.investor_id || "",
    start_date: investment?.start_date || "",
    duration_months: investment?.duration_months || 1,
    profit_rate: investment?.profit_rate || 0,
    status: investment?.status || "active",
    note: investment?.note || "",
  });

  useEffect(() => {
    if (flash?.error) toast.error(flash.error);
    if (flash?.success) toast.success(flash.success);
  }, [flash]);

  const submit = (e) => {
    e.preventDefault();
    put(route("investments.update", investment.id), { preserveScroll: true });
  };

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title={locale === "bn" ? "ইনভেস্টমেন্ট এডিট" : "Edit Investment"}
        icon={<Pencil className="w-5 h-5" />}
        actions={
          <Link
            href={route("investments.show", investment.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
          >
            <ArrowLeft size={16} />
            {locale === "bn" ? "ফিরে যান" : "Back"}
          </Link>
        }
      />

      <form onSubmit={submit} className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label={locale === "bn" ? "ইনভেস্টর" : "Investor"}
            value={data.investor_id}
            onChange={(v) => setData("investor_id", v)}
            error={errors.investor_id}
            required
            options={[
              { value: "", label: locale === "bn" ? "ইনভেস্টর নির্বাচন করুন" : "Select investor" },
              ...investors.map((i) => ({ value: i.id, label: i.name })),
            ]}
          />

          <SelectField
            label={locale === "bn" ? "আউটলেট (ঐচ্ছিক)" : "Outlet (optional)"}
            value={data.outlet_id}
            onChange={(v) => setData("outlet_id", v)}
            error={errors.outlet_id}
            options={[
              { value: "", label: locale === "bn" ? "সব/খালি" : "None" },
              ...outlets.map((o) => ({ value: o.id, label: `${o.name}${o.code ? ` (${o.code})` : ""}` })),
            ]}
          />

          <Field
            label={locale === "bn" ? "শুরু তারিখ" : "Start date"}
            type="date"
            value={data.start_date}
            onChange={(v) => setData("start_date", v)}
            error={errors.start_date}
            required
          />

          <Field
            label={locale === "bn" ? "মেয়াদ (মাস)" : "Duration (months)"}
            type="number"
            value={data.duration_months}
            onChange={(v) => setData("duration_months", v)}
            error={errors.duration_months}
            required
          />

          <Field
            label={locale === "bn" ? "সুদ (%) প্রতি মাস" : "Profit rate (%) per month"}
            type="number"
            value={data.profit_rate}
            onChange={(v) => setData("profit_rate", v)}
            error={errors.profit_rate}
            required
          />

          <div>
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "স্ট্যাটাস" : "Status"}</label>
            <select
              value={data.status}
              onChange={(e) => setData("status", e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="closed">closed</option>
            </select>
            {errors.status ? <p className="text-xs text-rose-600 mt-1">{errors.status}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "নোট" : "Note"}</label>
            <textarea
              value={data.note}
              onChange={(e) => setData("note", e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            {errors.note ? <p className="text-xs text-rose-600 mt-1">{errors.note}</p> : null}
          </div>

          <div className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm">
            <div className="font-semibold text-slate-700">{locale === "bn" ? "প্রিন্সিপাল এডিট" : "Principal edit"}</div>
            <div className="text-slate-600">
              {locale === "bn"
                ? "Initial/Current principal এখানে এডিট নয়—Withdraw দিয়ে পরিবর্তন হবে।"
                : "Initial/Current principal is not editable here. Use Withdraw to change."}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            disabled={processing}
            className="inline-flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#163a21] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold"
          >
            <Save size={16} />
            {locale === "bn" ? "আপডেট" : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, error, type = "text", required }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
      />
      {error ? <p className="text-xs text-rose-600 mt-1">{error}</p> : null}
    </div>
  );
}

function SelectField({ label, value, onChange, error, required, options }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
      >
        {options.map((o, idx) => (
          <option key={idx} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-rose-600 mt-1">{error}</p> : null}
    </div>
  );
}
