import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, router, usePage } from "@inertiajs/react";
import { Plus, Search, Pencil, Trash2, RefreshCw, Users } from "lucide-react";
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

export default function Index({ investors, filters }) {
  const { flash } = usePage().props;
  const { t, locale } = useTranslation();

  const [search, setSearch] = useState(filters?.search || "");
  const [status, setStatus] = useState(filters?.status || "all");

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const applyFilters = () => {
    router.get(
      route("investors.index"),
      { search, status },
      { preserveScroll: true, preserveState: true }
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    router.get(route("investors.index"), {}, { preserveScroll: true, preserveState: true });
  };

  const onDelete = (id) => {
    if (!confirm(locale === "bn" ? "ডিলিট করবেন?" : "Delete this investor?")) return;
    router.delete(route("investors.destroy", id), {
      preserveScroll: true,
      onSuccess: () => toast.success(locale === "bn" ? "ডিলিট হয়েছে" : "Deleted"),
      onError: () => toast.error(locale === "bn" ? "ডিলিট করা যায়নি" : "Delete failed"),
    });
  };

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title={locale === "bn" ? "ইনভেস্টর" : "Investors"}
        subtitle={locale === "bn" ? "ইনভেস্টর তালিকা ও ম্যানেজ করুন" : "Manage investors"}
        icon={<Users className="w-5 h-5" />}
        actions={
          <Link
            href={route("investors.create")}
            className="inline-flex items-center gap-2 bg-[#1e4d2b] hover:bg-[#163a21] text-white px-4 py-2 rounded-xl font-semibold"
          >
            <Plus size={16} />
            {locale === "bn" ? "নতুন ইনভেস্টর" : "Add Investor"}
          </Link>
        }
      />

      {/* Filters */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="text-sm font-semibold text-slate-700">
              {locale === "bn" ? "সার্চ" : "Search"}
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder={locale === "bn" ? "নাম/ফোন/ইমেইল" : "Name/phone/email"}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm font-semibold text-slate-700">
              {locale === "bn" ? "স্ট্যাটাস" : "Status"}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="all">{locale === "bn" ? "সব" : "All"}</option>
              <option value="active">{locale === "bn" ? "Active" : "Active"}</option>
              <option value="inactive">{locale === "bn" ? "Inactive" : "Inactive"}</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-[#1e4d2b] hover:bg-[#163a21] text-white px-4 py-2.5 rounded-xl font-semibold"
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
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "নাম" : "Name"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "ফোন" : "Phone"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "ইমেইল" : "Email"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "স্ট্যাটাস" : "Status"}</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">{locale === "bn" ? "একশন" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {investors?.data?.length ? (
                investors.data.map((i) => (
                  <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{i.name}</div>
                      {i.address ? <div className="text-xs text-slate-500 line-clamp-1">{i.address}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{i.phone || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{i.email || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          i.is_active ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {i.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={route("investors.edit", i.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                        >
                          <Pencil size={16} />
                          {locale === "bn" ? "এডিট" : "Edit"}
                        </Link>
                        <button
                          onClick={() => onDelete(i.id)}
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
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    {locale === "bn" ? "কোন ইনভেস্টর পাওয়া যায়নি" : "No investors found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4">
          <Pagination links={investors?.links || []} />
        </div>
      </div>
    </div>
  );
}
