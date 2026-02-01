import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { Plus, Search, RefreshCw, Eye, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

function Pagination({ links = [] }) {
  if (!links?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 justify-end mt-4">
      {links.map((l, idx) => (
        <button
          key={idx}
          disabled={!l.url}
          onClick={() => l.url && router.visit(l.url, { preserveScroll: true, preserveState: true })}
          className={`px-3 py-2 rounded-lg text-sm border ${
            l.active ? "bg-[#1e4d2b] text-white border-[#1e4d2b]" : "bg-white hover:bg-slate-50 border-slate-200"
          } ${!l.url ? "opacity-50 cursor-not-allowed" : ""}`}
          dangerouslySetInnerHTML={{ __html: l.label }}
        />
      ))}
    </div>
  );
}

const money = (n) => `৳ ${Number(n || 0).toFixed(2)}`;

export default function Index({ investments, investors = [], outlets = [], filters }) {
  const { flash } = usePage().props;
  const { locale } = useTranslation();

  const [search, setSearch] = useState(filters?.search || "");
  const [status, setStatus] = useState(filters?.status || "all");
  const [investorId, setInvestorId] = useState(filters?.investor_id || "");
  const [outletId, setOutletId] = useState(filters?.outlet_id || "");

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const applyFilters = () => {
    router.get(
      route("investments.index"),
      { search, status, investor_id: investorId || null, outlet_id: outletId || null },
      { preserveScroll: true, preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setInvestorId("");
    setOutletId("");
    router.get(route("investments.index"), {}, { preserveScroll: true, preserveState: true });
  };

  const onDelete = (id) => {
    if (!confirm(locale === "bn" ? "ডিলিট করবেন?" : "Delete this investment?")) return;
    router.delete(route("investments.destroy", id), {
      preserveScroll: true,
      onSuccess: () => toast.success(locale === "bn" ? "ডিলিট হয়েছে" : "Deleted"),
      onError: () => toast.error(locale === "bn" ? "ডিলিট করা যায়নি" : "Delete failed"),
    });
  };

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title={locale === "bn" ? "ইনভেস্টমেন্ট" : "Investments"}
        subtitle={locale === "bn" ? "ইনভেস্টমেন্ট তালিকা ও ফিল্টার" : "List & filter investments"}
        icon={<Wallet className="w-5 h-5" />}
        actions={
          <Link
            href={route("investments.create")}
            className="inline-flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#163a21] text-white px-4 py-2 rounded-xl font-semibold"
          >
            <Plus size={16} />
            {locale === "bn" ? "নতুন ইনভেস্টমেন্ট" : "Add Investment"}
          </Link>
        }
      />

      {/* Filters */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "সার্চ" : "Search"}</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder={locale === "bn" ? "কোড/ইনভেস্টর" : "Code/Investor"}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "স্ট্যাটাস" : "Status"}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="all">{locale === "bn" ? "সব" : "All"}</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="closed">closed</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "ইনভেস্টর" : "Investor"}</label>
            <select
              value={investorId}
              onChange={(e) => setInvestorId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="">{locale === "bn" ? "সব" : "All"}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "আউটলেট" : "Outlet"}</label>
            <select
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="">{locale === "bn" ? "সব" : "All"}</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.code ? `(${o.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12 flex gap-2 justify-end mt-2">
            <button
              onClick={applyFilters}
              className="bg-[#1e4d2b] hover:bg-[#163a21] text-white px-4 py-2.5 rounded-xl font-semibold"
            >
              {locale === "bn" ? "ফিল্টার" : "Apply"}
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
              title="Reset"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-slate-700">Code</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "ইনভেস্টর" : "Investor"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "মেয়াদ" : "Duration"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "সুদ" : "Rate"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "Initial" : "Initial"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "Current" : "Current"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">Status</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">{locale === "bn" ? "একশন" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {investments?.data?.length ? (
                investments.data.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{inv.code}</td>
                    <td className="px-4 py-3 text-slate-700">{inv.investor?.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="text-xs">
                        {inv.start_date} → {inv.end_date}
                      </div>
                      <div className="text-[11px] text-slate-500">{inv.duration_months} month(s)</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{Number(inv.profit_rate || 0).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-slate-700">{money(inv.initial_principal)}</td>
                    <td className="px-4 py-3 text-slate-700">{money(inv.current_principal)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={route("investments.show", inv.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                        >
                          <Eye size={16} />
                          {locale === "bn" ? "দেখুন" : "View"}
                        </Link>
                        <Link
                          href={route("investments.edit", inv.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                        >
                          <Pencil size={16} />
                          {locale === "bn" ? "এডিট" : "Edit"}
                        </Link>
                        <button
                          onClick={() => onDelete(inv.id)}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 inline-flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          {locale === "bn" ? "ডিলিট" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    {locale === "bn" ? "কোন ইনভেস্টমেন্ট পাওয়া যায়নি" : "No investments found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4">
          <Pagination links={investments?.links || []} />
        </div>
      </div>
    </div>
  );
}
