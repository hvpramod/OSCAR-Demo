"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { generateAPCs, AGENT_RUNS } from "@/lib/mockData";
import { Activity, Package, CheckCircle, Clock, Zap, RefreshCw, ArrowRight, AlertTriangle } from "lucide-react";

const APCS = generateAPCs();

export default function DashboardPage() {
  const router = useRouter();
  const [triggering, setTriggering] = useState(false);

  const pendingCount  = APCS.filter((a) => a.status === "pending").length;
  const approvedCount = APCS.filter((a) => a.status === "approved").length;
  const totalKits     = APCS.reduce((s, a) => s + a.kits.reduce((ss, k) => ss + k.recommended, 0), 0);
  const totalCost     = APCS.reduce((s, a) => s + (a.totalCost ?? 0), 0);

  const lastRun = AGENT_RUNS[0];

  function handleTrigger() {
    setTriggering(true);
    setTimeout(() => {
      router.push("/agent-run");
    }, 600);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" subtitle="OSCAR Supply Chain Agent — Real-time overview" />

      <div className="flex-1 p-6 space-y-6">
        {/* Hero stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "APCs Monitored",     value: "3,250",              sub: "50 active in demo",     icon: Activity,    color: "#002677" },
            { label: "Kits Calculated",    value: totalKits.toLocaleString(), sub: "Last agent run",   icon: Package,     color: "#F5B700" },
            { label: "Pending Approvals",  value: pendingCount,         sub: "Requires action",       icon: AlertTriangle, color: "#ef4444" },
            { label: "Orders Approved",    value: approvedCount,        sub: "This cycle",            icon: CheckCircle, color: "#16a34a" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{label}</p>
                  <p className="text-3xl font-black mt-1" style={{ color }}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
                  <Icon size={20} style={{ color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap size={16} style={{ color: "#F5B700" }} /> Agent Status
            </h2>
            <div className="flex flex-col items-center py-4">
              <div className="relative w-24 h-24">
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: "#16a34a" }}>
                  <div className="text-center">
                    <CheckCircle size={28} className="mx-auto" style={{ color: "#16a34a" }} />
                    <p className="text-xs font-bold text-green-700 mt-1">IDLE</p>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-gray-700">Last run completed</p>
                <p className="text-xs text-gray-400">Jun 7, 2026 · 02:00 AM EST</p>
                <p className="text-xs text-gray-400">Duration: 28 seconds</p>
              </div>
            </div>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full mt-2 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{ background: triggering ? "#e5e7eb" : "#002677", color: triggering ? "#9ca3af" : "white" }}
            >
              {triggering ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
              {triggering ? "Triggering..." : "Trigger Agent Now"}
            </button>
          </div>

          {/* Recent Runs */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={16} style={{ color: "#002677" }} /> Recent Agent Runs
            </h2>
            <div className="space-y-3">
              {AGENT_RUNS.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#002677" }}>
                      <Activity size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{run.id}</p>
                      <p className="text-xs text-gray-500">{run.triggeredAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{run.kitsCalculated} kits</p>
                      <p className="text-xs text-gray-400">{run.apcCount} APCs</p>
                    </div>
                    <StatusBadge status={run.trigger} />
                    <StatusBadge status={run.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Summary + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">Projected Cycle Cost</h2>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-4xl font-black" style={{ color: "#002677" }}>
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-gray-400 mb-1 text-sm">estimated this cycle</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Lab Kits",    pct: 62, color: "#002677" },
                { label: "Print",       pct: 18, color: "#F5B700" },
                { label: "Clinical",    pct: 20, color: "#16a34a" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span><span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Review Pending Orders", href: "/review",    badge: pendingCount, color: "#002677" },
                { label: "Configure Agent",        href: "/admin",    badge: null,          color: "#002677" },
                { label: "View Reports",           href: "/reports",  badge: null,          color: "#002677" },
              ].map(({ label, href, badge, color }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700"
                >
                  <span>{label}</span>
                  <div className="flex items-center gap-2">
                    {badge !== null && badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs text-white font-bold" style={{ background: "#ef4444" }}>{badge}</span>
                    )}
                    <ArrowRight size={14} style={{ color }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
