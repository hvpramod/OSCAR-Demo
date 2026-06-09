"use client";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft, Download, CheckCircle, XCircle, Mail, FlaskConical, MapPin, Users, Package, RefreshCw } from "lucide-react";

interface KitOrderRow {
  id: string; run_id: string; apc_id: string; kit_id: string;
  apc_name: string; region: string; state: string; lab: string;
  manager_name: string; manager_email: string;
  kit_name: string; category: string;
  upcoming_visits: number; kits_per_visit: number;
  forecasted_qty: number; buffer_qty: number;
  recommended_qty: number; approved_qty: number;
  unit_cost: number; line_total: number;
  status: "pending"|"approved"|"modified"|"rejected";
}

export default function APCReviewPage({ params }: { params: Promise<{ apcId: string }> }) {
  const { apcId }     = use(params);
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const runId         = searchParams.get("runId") || "";

  const [kits, setKits]         = useState<KitOrderRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [action, setAction]     = useState<string>("");
  const [showEmail, setShowEmail] = useState(false);

  const apcInfo = kits[0];

  async function fetchKits() {
    setLoading(true);
    const res  = await fetch(`/api/orders/${apcId}?runId=${runId}`);
    const data = await res.json();
    setKits(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchKits(); }, [apcId, runId]);

  async function updateQty(kitId: string, qty: number) {
    await fetch(`/api/orders/${apcId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, action: "update_qty", kitId, approvedQty: qty }),
    });
    setKits(prev => prev.map(k => k.kit_id === kitId ? { ...k, approved_qty: qty, line_total: qty * k.unit_cost } : k));
    setSaved(false);
  }

  async function doAction(act: "approve"|"reject") {
    await fetch(`/api/orders/${apcId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, action: act }),
    });
    setKits(prev => prev.map(k => ({ ...k, status: act === "approve" ? "approved" : "rejected" })));
    setAction(act);
    setSaved(true);
  }

  function exportJSON() {
    if (!apcInfo) return;
    const payload = {
      orderId: `ORD-${apcId}-${Date.now()}`,
      runId,
      apcId,
      apcName: apcInfo.apc_name,
      region: apcInfo.region,
      lab: apcInfo.lab,
      manager: apcInfo.manager_name,
      generatedAt: new Date().toISOString(),
      upcomingVisits: apcInfo.upcoming_visits,
      lineItems: kits.map(k => ({
        kitId: k.kit_id, kitName: k.kit_name, category: k.category,
        quantity: k.approved_qty, unitCost: k.unit_cost,
        lineTotal: (k.approved_qty * k.unit_cost).toFixed(2),
      })),
      totalCost: kits.reduce((s,k) => s + k.approved_qty * k.unit_cost, 0).toFixed(2),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `OSCAR_Order_${apcId}_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  const totalQty  = kits.reduce((s,k) => s + k.approved_qty, 0);
  const totalCost = kits.reduce((s,k) => s + k.approved_qty * k.unit_cost, 0);

  const catGroups = kits.reduce((acc, k) => {
    if (!acc[k.category]) acc[k.category] = [];
    acc[k.category].push(k);
    return acc;
  }, {} as Record<string, KitOrderRow[]>);

  const currentStatus = kits[0]?.status ?? "pending";

  if (loading) return (
    <div className="flex flex-col flex-1">
      <Header title="Loading..." />
      <div className="flex-1 flex items-center justify-center gap-3 text-gray-400">
        <RefreshCw size={20} className="animate-spin" /> Reading from PostgreSQL...
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1">
      <Header title={`${apcInfo?.apc_name ?? apcId} — Order Review`}
        subtitle={`${apcId} · Run: ${runId} · Source: oscar_kit_orders`} />

      <div className="flex-1 p-6 space-y-4 max-w-6xl mx-auto w-full">
        <button onClick={() => router.push("/review")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={15} /> Back to Order Review
        </button>

        {saved && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${action==="approve" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {action==="approve" ? <CheckCircle size={16}/> : <XCircle size={16}/>}
            Order {action}d and saved to PostgreSQL · oscar_kit_orders updated.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* APC Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="font-bold text-gray-800">APC Details</h2>
            <div className="text-xs font-mono text-gray-400 bg-gray-50 rounded-lg p-2">
              Table: hawkeye_apcs · Run: {runId}
            </div>
            {[
              { icon: MapPin,       label: "Region",   value: `${apcInfo?.region} · ${apcInfo?.state}` },
              { icon: FlaskConical, label: "Lab",      value: apcInfo?.lab },
              { icon: Users,        label: "Manager",  value: apcInfo?.manager_name },
              { icon: Mail,         label: "Email",    value: apcInfo?.manager_email },
              { icon: Package,      label: "Visits",   value: `${apcInfo?.upcoming_visits} upcoming (14 days)` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: "#00267712" }}>
                  <Icon size={13} style={{ color: "#002677" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-700 break-all">{value ?? "—"}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <StatusBadge status={currentStatus} />
            </div>
          </div>

          {/* Kit table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Kit Line Items</h2>
              <span className="text-xs font-mono text-gray-400">oscar_kit_orders · {kits.length} rows</span>
            </div>
            <div className="overflow-x-auto">
              {Object.entries(catGroups).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-5 py-2 text-xs font-bold uppercase tracking-wide text-gray-400 bg-gray-50 border-b border-gray-100">{cat}</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Kit","Forecast","Buffer","Recommended","Approved Qty","Line Total"].map(h => (
                          <th key={h} className="text-right px-3 py-2 text-xs text-gray-400 font-semibold first:text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(kit => {
                        const diff = kit.approved_qty - kit.recommended_qty;
                        return (
                          <tr key={kit.kit_id} className="border-b border-gray-50 hover:bg-blue-50/20">
                            <td className="px-5 py-2.5">
                              <p className="font-medium text-gray-800">{kit.kit_name}</p>
                              <p className="text-xs text-gray-400">${kit.unit_cost.toFixed(2)} / unit</p>
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-600">{kit.forecasted_qty}</td>
                            <td className="px-3 py-2.5 text-right text-gray-600">+{kit.buffer_qty}</td>
                            <td className="px-3 py-2.5 text-right font-medium text-gray-700">{kit.recommended_qty}</td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {diff !== 0 && <span className={`text-xs font-semibold ${diff>0?"text-blue-600":"text-orange-600"}`}>{diff>0?`+${diff}`:diff}</span>}
                                <input type="number" value={kit.approved_qty} min={0}
                                  onChange={e => updateQty(kit.kit_id, Number(e.target.value))}
                                  className="w-20 text-right px-2 py-1 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500" />
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-right font-semibold" style={{ color:"#002677" }}>
                              ${(kit.approved_qty * kit.unit_cost).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t-2 border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-600">Total: <span className="font-bold text-gray-800">{totalQty} kits</span></p>
              <p className="text-lg font-black" style={{ color:"#002677" }}>
                ${totalCost.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <button onClick={() => setShowEmail(!showEmail)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Mail size={15}/> {showEmail?"Hide":"Preview"} Email
          </button>
          <div className="flex items-center gap-3">
            <button onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold"
              style={{ borderColor:"#002677", color:"#002677" }}>
              <Download size={15}/> Export JSON
            </button>
            <button onClick={() => doAction("reject")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background:"#ef4444" }}>
              <XCircle size={15}/> Reject
            </button>
            <button onClick={() => doAction("approve")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background:"#16a34a" }}>
              <CheckCircle size={15}/> Approve Order
            </button>
          </div>
        </div>

        {/* Email preview */}
        {showEmail && apcInfo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Mail size={15} style={{ color:"#002677" }}/>
              <span className="text-sm font-bold text-gray-700">Email Preview</span>
              <span className="text-xs text-gray-400 ml-2">To: {apcInfo.manager_email}</span>
            </div>
            <div className="p-6">
              <div className="max-w-2xl border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4" style={{ background:"#002677" }}>
                  <p className="text-white font-bold text-lg">OSCAR Supply Chain Notification</p>
                  <p className="text-blue-200 text-sm">Optum HouseCalls · Just-in-Time Ordering</p>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700">Hi {apcInfo.manager_name.split(" ")[0]},</p>
                  <p className="text-gray-700 text-sm">
                    OSCAR has completed its supply analysis for <strong>{apcInfo.apc_name}</strong> based on <strong>{apcInfo.upcoming_visits} upcoming visits</strong> over the next 14 days.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Order Summary</p>
                    <p className="text-sm text-gray-600">Total Kits: <strong>{totalQty}</strong></p>
                    <p className="text-sm text-gray-600">Estimated Cost: <strong>${totalCost.toFixed(2)}</strong></p>
                    <p className="text-sm text-gray-600">Lab Partner: <strong>{apcInfo.lab}</strong></p>
                  </div>
                  <span className="inline-block px-6 py-3 rounded-lg text-white text-sm font-bold cursor-default" style={{ background:"#002677" }}>
                    Review & Approve Order →
                  </span>
                  <p className="text-xs text-gray-400">This order will auto-submit in 48 hours if no action is taken.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
