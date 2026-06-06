"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { generateAPCs } from "@/lib/mockData";
import { exportJSON } from "@/lib/oscalEngine";
import { KitOrder } from "@/lib/mockData";
import {
  ArrowLeft, Download, CheckCircle, XCircle, Edit3, Mail,
  FlaskConical, MapPin, Users, Package
} from "lucide-react";

const ALL_APCS = generateAPCs();

export default function APCReviewPage({ params }: { params: Promise<{ apcId: string }> }) {
  const { apcId } = use(params);
  const router    = useRouter();
  const original  = ALL_APCS.find(a => a.id === apcId);

  const [apc, setApc]       = useState(original ?? ALL_APCS[0]);
  const [saved, setSaved]   = useState(false);
  const [action, setAction] = useState<"approved"|"rejected"|null>(null);
  const [showEmail, setShowEmail] = useState(false);

  function updateQty(kitId: string, qty: number) {
    setApc(prev => ({
      ...prev,
      kits: prev.kits.map(k => k.kitId === kitId ? { ...k, approved: Math.max(0, qty) } : k),
      status: "modified",
    }));
    setSaved(false);
  }

  function approve() {
    setApc(prev => ({ ...prev, status: "approved" }));
    setAction("approved");
    setSaved(true);
  }

  function reject() {
    setApc(prev => ({ ...prev, status: "rejected" }));
    setAction("rejected");
    setSaved(true);
  }

  const totalQty  = apc.kits.reduce((s, k) => s + (k.approved ?? k.recommended), 0);
  const totalCost = apc.kits.reduce((s, k) => s + (k.approved ?? k.recommended) * k.unitCost, 0);

  const catGroups = apc.kits.reduce((acc, k) => {
    if (!acc[k.category]) acc[k.category] = [];
    acc[k.category].push(k);
    return acc;
  }, {} as Record<string, KitOrder[]>);

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={`${apc.name} — Order Review`}
        subtitle={`${apc.id} · ${apc.region} · ${apc.lab}`}
      />

      <div className="flex-1 p-6 space-y-4 max-w-6xl mx-auto w-full">
        {/* Back */}
        <button
          onClick={() => router.push("/review")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Order Review
        </button>

        {/* Status banner */}
        {saved && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${action === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {action === "approved" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            Order {action}. Changes reflected in the order review dashboard.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* APC Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="font-bold text-gray-800">APC Details</h2>
            {[
              { icon: MapPin,      label: "Region",   value: `${apc.region} · ${apc.state}` },
              { icon: FlaskConical,label: "Lab",      value: apc.lab                         },
              { icon: Users,       label: "Manager",  value: apc.manager                     },
              { icon: Mail,        label: "Email",    value: apc.email                       },
              { icon: Package,     label: "Visits",   value: `${apc.upcomingVisits} upcoming (14 days)` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: "#002677" + "12" }}>
                  <Icon size={13} style={{ color: "#002677" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-700 break-all">{value}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <StatusBadge status={apc.status} />
            </div>
          </div>

          {/* Kit Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Kit Line Items</h2>
              <span className="text-sm text-gray-500">{apc.kits.length} items</span>
            </div>
            <div className="overflow-x-auto">
              {Object.entries(catGroups).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-5 py-2 text-xs font-bold uppercase tracking-wide text-gray-400 bg-gray-50 border-b border-gray-100">
                    {cat}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-2 text-xs text-gray-400 font-semibold">Kit</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-400 font-semibold">Forecast</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-400 font-semibold">Buffer</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-400 font-semibold">Recommended</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-400 font-semibold">Approved Qty</th>
                        <th className="text-right px-5 py-2 text-xs text-gray-400 font-semibold">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((kit) => {
                        const qty   = kit.approved ?? kit.recommended;
                        const total = qty * kit.unitCost;
                        const diff  = qty - kit.recommended;
                        return (
                          <tr key={kit.kitId} className="border-b border-gray-50 hover:bg-blue-50/20">
                            <td className="px-5 py-2.5">
                              <p className="font-medium text-gray-800">{kit.kitName}</p>
                              <p className="text-xs text-gray-400">${kit.unitCost.toFixed(2)} / unit</p>
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-600">{kit.forecasted}</td>
                            <td className="px-3 py-2.5 text-right text-gray-600">+{kit.bufferQty}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-gray-700">{kit.recommended}</td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {diff !== 0 && (
                                  <span className={`text-xs font-semibold ${diff > 0 ? "text-blue-600" : "text-orange-600"}`}>
                                    {diff > 0 ? `+${diff}` : diff}
                                  </span>
                                )}
                                <input
                                  type="number"
                                  value={qty}
                                  min={0}
                                  onChange={e => updateQty(kit.kitId, Number(e.target.value))}
                                  className="w-20 text-right px-2 py-1 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-right font-semibold" style={{ color: "#002677" }}>
                              ${total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Totals row */}
            <div className="px-5 py-4 border-t-2 border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  Total Quantity: <span className="font-bold text-gray-800">{totalQty} kits</span>
                </p>
              </div>
              <p className="text-lg font-black" style={{ color: "#002677" }}>
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <button
            onClick={() => setShowEmail(!showEmail)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Mail size={15} /> {showEmail ? "Hide" : "Preview"} Email Notification
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportJSON(apc)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all hover:opacity-90"
              style={{ borderColor: "#002677", color: "#002677" }}
            >
              <Download size={15} /> Export JSON
            </button>
            <button
              onClick={reject}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#ef4444", color: "white" }}
            >
              <XCircle size={15} /> Reject
            </button>
            <button
              onClick={approve}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#16a34a", color: "white" }}
            >
              <CheckCircle size={15} /> Approve Order
            </button>
          </div>
        </div>

        {/* Email preview */}
        {showEmail && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Mail size={15} style={{ color: "#002677" }} />
              <span className="text-sm font-bold text-gray-700">Email Notification Preview</span>
              <span className="text-xs text-gray-400 ml-2">Sent to: {apc.email}</span>
            </div>
            <div className="p-6">
              <div className="max-w-2xl border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4" style={{ background: "#002677" }}>
                  <p className="text-white font-bold text-lg">OSCAR Supply Chain Notification</p>
                  <p className="text-blue-200 text-sm">Optum HouseCalls · Just-in-Time Ordering</p>
                </div>
                <div className="p-6 space-y-4" style={{ fontFamily: "Arial, sans-serif" }}>
                  <p className="text-gray-700">Hi {apc.manager.split(" ")[0]},</p>
                  <p className="text-gray-700 text-sm">
                    OSCAR has completed its supply chain analysis for <strong>{apc.name}</strong>.
                    Based on <strong>{apc.upcomingVisits} upcoming visits</strong> over the next 14 days,
                    the following order has been generated for your review.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Order Summary</p>
                    <p className="text-sm text-gray-600">Total Kits: <strong>{totalQty}</strong></p>
                    <p className="text-sm text-gray-600">Estimated Cost: <strong>${totalCost.toFixed(2)}</strong></p>
                    <p className="text-sm text-gray-600">Lab Partner: <strong>{apc.lab}</strong></p>
                  </div>
                  <div className="pt-2">
                    <span
                      className="inline-block px-6 py-3 rounded-lg text-white text-sm font-bold cursor-default"
                      style={{ background: "#002677" }}
                    >
                      Review & Approve Order →
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    This order will auto-submit in 48 hours if no action is taken.
                    Questions? Contact your Supply Chain coordinator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
