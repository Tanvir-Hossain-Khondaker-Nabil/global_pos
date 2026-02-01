import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { router, usePage } from "@inertiajs/react";
import { DollarSign, RefreshCw, CheckCircle } from "lucide-react";
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

export default function Index({ returns, filters }) {
  const { flash } = usePage().props;
  const { locale } = useTranslation();

  const [status, setStatus] = useState(filters?.status || "all");

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const apply = () => {
    router.get(route("investmentReturns.index"), { status }, { preserveScroll: true, preserveState: true });
  };

  const reset = () => {
    setStatus("all");
    router.get(route("investmentReturns.index"), {}, { preserveScroll: true, preserveState: true });
  };

  const markPaid = (id) => {
    if (!confirm(locale === "bn" ? "Paid হিসেবে মার্ক করবেন?" : "Mark as paid?")) return;
    router.post(route("investmentReturns.markPaid", id), {}, { preserveScroll: true });
  };

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title={locale === "bn" ? "ইনভেস্টমেন্ট রিটার্ন" : "Investment Returns"}
        subtitle={locale === "bn" ? "Pending/paid রিটার্ন ম্যানেজ" : "Manage pending/paid returns"}
        icon={<DollarSign className="w-5 h-5" />}
      />

      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-end justify-between">
          <div className="w-full md:w-60">
            <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "স্ট্যাটাস" : "Status"}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="all">{locale === "bn" ? "সব" : "All"}</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={apply}
              className="bg-[#1e4d2b] hover:bg-[#163a21] text-white px-4 py-2.5 rounded-xl font-semibold"
            >
              {locale === "bn" ? "ফিল্টার" : "Apply"}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
              title="Reset"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-slate-700">Investment</th>
                <th className="px-4 py-3 font-bold text-slate-700">{locale === "bn" ? "ইনভেস্টর" : "Investor"}</th>
                <th className="px-4 py-3 font-bold text-slate-700">Period End</th>
                <th className="px-4 py-3 font-bold text-slate-700">Profit</th>
                <th className="px-4 py-3 font-bold text-slate-700">Status</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {returns?.data?.length ? (
                returns.data.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.investment?.code || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{r.investment?.investor_name || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{r.period_end}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{money(r.profit_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.status}
                      </span>
                      {r.status === "paid" && r.paid_date ? (
                        <div className="text-[11px] text-slate-500 mt-1">{`Paid: ${r.paid_date}`}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" ? (
                        <button
                          onClick={() => markPaid(r.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                        >
                          <CheckCircle size={16} />
                          {locale === "bn" ? "Paid" : "Mark Paid"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    {locale === "bn" ? "কোন রিটার্ন পাওয়া যায়নি" : "No returns found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4">
          <Pagination links={returns?.links || []} />
        </div>
      </div>
    </div>
  );
}
