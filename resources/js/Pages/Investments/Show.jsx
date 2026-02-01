import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Wallet, HandCoins, X, Save, DollarSign, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

const money = (n) => `৳ ${Number(n || 0).toFixed(2)}`;

export default function Show({ investment, withdrawals = [], returns = [] }) {
  const { flash } = usePage().props;
  const { locale } = useTranslation();

  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const canWithdraw = investment?.status === "active" && Number(investment?.current_principal || 0) > 0;

  const { data, setData, post, processing, errors, reset } = useForm({
    withdraw_date: new Date().toISOString().slice(0, 10),
    amount: "",
    reason: "",
  });

  const openWithdraw = () => {
    reset();
    setData("withdraw_date", new Date().toISOString().slice(0, 10));
    setWithdrawOpen(true);
  };

  const submitWithdraw = (e) => {
    e.preventDefault();
    post(route("investments.withdraw", investment.id), {
      preserveScroll: true,
      onSuccess: () => {
        setWithdrawOpen(false);
        toast.success(locale === "bn" ? "Withdraw সফল" : "Withdraw successful");
      },
    });
  };

  const markPaid = (ret) => {
    if (ret.status === "paid") return;
    if (!confirm(locale === "bn" ? "Paid হিসেবে মার্ক করবেন?" : "Mark this return as paid?")) return;

    router.post(route("investmentReturns.markPaid", ret.id), {}, { preserveScroll: true });
  };

  const summary = useMemo(() => {
    const pending = returns.filter((r) => r.status === "pending").reduce((a, b) => a + Number(b.profit_amount || 0), 0);
    const paid = returns.filter((r) => r.status === "paid").reduce((a, b) => a + Number(b.profit_amount || 0), 0);
    return { pending, paid };
  }, [returns]);

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        title={locale === "bn" ? `ইনভেস্টমেন্ট: ${investment.code}` : `Investment: ${investment.code}`}
        subtitle={locale === "bn" ? "ডিটেইলস, রিটার্ন ও উইথড্র" : "Details, returns and withdrawals"}
        icon={<Wallet className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canWithdraw && (
              <button
                onClick={openWithdraw}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                <HandCoins size={16} />
                {locale === "bn" ? "Withdraw" : "Withdraw"}
              </button>
            )}
            <Link
              href={route("investments.index")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
            >
              <ArrowLeft size={16} />
              {locale === "bn" ? "ফিরে যান" : "Back"}
            </Link>
          </div>
        }
      />

      {/* Top cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={locale === "bn" ? "ইনভেস্টর" : "Investor"}>
          <div className="text-lg font-bold text-slate-900">{investment?.investor?.name || "-"}</div>
          <div className="text-sm text-slate-500">{investment?.investor?.phone || ""}</div>
        </Card>

        <Card title={locale === "bn" ? "প্রিন্সিপাল" : "Principal"}>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Initial</span>
            <span className="font-semibold">{money(investment.initial_principal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-1">
            <span>Current</span>
            <span className="font-semibold">{money(investment.current_principal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-1">
            <span>Status</span>
            <span className="font-semibold">{investment.status}</span>
          </div>
        </Card>

        <Card title={locale === "bn" ? "রিটার্ন সারাংশ" : "Returns summary"}>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Pending</span>
            <span className="font-semibold">{money(summary.pending)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-1">
            <span>Paid</span>
            <span className="font-semibold">{money(summary.paid)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mt-1">
            <span>Rate</span>
            <span className="font-semibold">{Number(investment.profit_rate || 0).toFixed(2)}% / month</span>
          </div>
        </Card>
      </div>

      {/* Returns + Withdrawals */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <DollarSign size={18} />
              {locale === "bn" ? "মাসিক রিটার্ন" : "Monthly Returns"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left">
                  <th className="px-4 py-3 font-bold text-slate-700">Period End</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Principal</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Profit</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Status</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {returns?.length ? (
                  returns.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">{r.period_end}</td>
                      <td className="px-4 py-3 text-slate-700">{money(r.principal_snapshot)}</td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{money(r.profit_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "pending" ? (
                          <button
                            onClick={() => markPaid(r)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                          >
                            <CheckCircle size={16} />
                            {locale === "bn" ? "Paid" : "Mark Paid"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">{r.paid_date ? `Paid: ${r.paid_date}` : ""}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {locale === "bn" ? "কোন রিটার্ন নেই" : "No returns yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <HandCoins size={18} />
              {locale === "bn" ? "উইথড্র লিস্ট" : "Withdrawals"}
            </div>
            {canWithdraw && (
              <button
                onClick={openWithdraw}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                <HandCoins size={16} />
                {locale === "bn" ? "Withdraw" : "Withdraw"}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left">
                  <th className="px-4 py-3 font-bold text-slate-700">Date</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Amount</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Reason</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals?.length ? (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-700">{w.withdraw_date}</td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">{money(w.amount)}</td>
                      <td className="px-4 py-3 text-slate-700">{w.reason || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      {locale === "bn" ? "কোন উইথড্র নেই" : "No withdrawals yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/50" onMouseDown={() => setWithdrawOpen(false)} />
          <div className="absolute inset-x-0 top-10 mx-auto max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="font-bold text-slate-900">
                {locale === "bn" ? "Withdraw করুন" : "Withdraw"}
              </div>
              <button onClick={() => setWithdrawOpen(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitWithdraw} className="p-4 space-y-3">
              <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <div className="flex justify-between">
                  <span>Current principal</span>
                  <span className="font-bold">{money(investment.current_principal)}</span>
                </div>
              </div>

              <Field
                label={locale === "bn" ? "তারিখ" : "Withdraw date"}
                type="date"
                value={data.withdraw_date}
                onChange={(v) => setData("withdraw_date", v)}
                error={errors.withdraw_date}
                required
              />

              <Field
                label={locale === "bn" ? "Amount" : "Amount"}
                type="number"
                value={data.amount}
                onChange={(v) => setData("amount", v)}
                error={errors.amount}
                required
              />

              <div>
                <label className="text-sm font-semibold text-slate-700">{locale === "bn" ? "কারণ (ঐচ্ছিক)" : "Reason (optional)"}</label>
                <input
                  value={data.reason}
                  onChange={(e) => setData("reason", e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                {errors.reason ? <p className="text-xs text-rose-600 mt-1">{errors.reason}</p> : null}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
                >
                  {locale === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  disabled={processing}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold"
                >
                  <Save size={16} />
                  {locale === "bn" ? "Confirm" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="text-xs font-bold text-slate-500 uppercase">{title}</div>
      <div className="mt-2">{children}</div>
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
        className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
      />
      {error ? <p className="text-xs text-rose-600 mt-1">{error}</p> : null}
    </div>
  );
}
