"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { Search, CheckCircle, ChevronRight, MapPin, FlaskConical, AlertCircle, RefreshCw } from "lucide-react";

interface APCSummary {
  apc_id: string; apc_name: string; region: string; state: string;
  lab: string; manager_name: string; upcoming_visits: number;
  total_kits: number; total_cost: number;
  status: "pending"|"approved"|"modified"|"rejected";
  run_id: string;
}

const REGIONS  = ["All Regions"];
const STATUSES = ["All Statuses","pending","approved","modified","rejected"];

export default function ReviewPage() {
  const [apcs, setApcs]       = useState<APCSummary[]>([]);
  const [runId, setRunId]     = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [region, setRegion]   = useState("All Regions");
  const [status, setStatus]   = useState("All Statuses");
  const [bulkDone, setBulkDone] = useState(false);

  const regions = ["All Regions", ...Array.from(new Set(apcs.map(a => a.region))).sort()];

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch orders");
      setApcs(data.orders ?? []);
      setRunId(data.runId ?? "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function bulkApprove() {
    if (!runId) return;
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId }),
    });
    setBulkDone(true);
    setTimeout(() => setBulkDone(false), 3000);
    fetchOrders();
  }

  const filtered = apcs.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.apc_name.toLowerCase().includes(q) || a.manager_name.toLowerCase().includes(q) || a.lab.toLowerCase().includes(q)) &&
      (region === "All Regions"  || a.region === region) &&
      (status === "All Statuses" || a.status === status)
    );
  });

  const pendingCount = apcs.filter(a => a.status === "pending").length;

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Order Review"
        subtitle={runId ? `Run: ${runId} · ${pendingCount} pending · Reading from oscar_kit_orders` : "No agent run found — trigger the agent first"}
      />
      <div className="flex-1 p-6 space-y-4">

        {bulkDone && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
            <CheckCircle size={16} /> All pending orders approved and saved to PostgreSQL.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
            <span className="text-red-500 text-xs ml-2">— Ensure PostgreSQL is running and the agent has been triggered.</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search APC, manager, lab..." className="flex-1 text-sm outline-none" />
            </div>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              {regions.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              {STATUSES.map(s => <option key={s}>{s === "All Statuses" ? s : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={fetchOrders} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <RefreshCw size={15} className="text-gray-500" />
              </button>
              <span className="text-sm text-gray-500">{filtered.length} APCs</span>
              {pendingCount > 0 && (
                <button onClick={bulkApprove}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold"
                  style={{ background: "#16a34a" }}>
                  <CheckCircle size={14} /> Approve All Pending ({pendingCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader size={20} /> Loading from PostgreSQL...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ background: "#f8f9fb" }}>
                  {["APC","Region","Lab","Visits","Kits","Est. Cost","Status",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((apc, i) => (
                  <tr key={apc.apc_id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i%2===0?"":"bg-gray-50/30"}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{apc.apc_name}</p>
                      <p className="text-xs text-gray-400">{apc.apc_id} · {apc.manager_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600"><MapPin size={12}/>{apc.region}</div>
                      <p className="text-xs text-gray-400">{apc.state}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600 truncate max-w-32"><FlaskConical size={12}/>{apc.lab}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{apc.upcoming_visits}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{apc.total_kits}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color:"#002677" }}>
                      ${Number(apc.total_cost).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={apc.status}/></td>
                    <td className="px-4 py-3">
                      <Link href={`/review/${apc.apc_id}?runId=${runId}`}
                        className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color:"#002677" }}>
                        Review <ChevronRight size={12}/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && !error && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No orders found</p>
              <p className="text-xs mt-1">Trigger an agent run first to generate orders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loader({ size }: { size: number }) {
  return <RefreshCw size={size} className="animate-spin"/>;
}
