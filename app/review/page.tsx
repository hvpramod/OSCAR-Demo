"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { generateAPCs } from "@/lib/mockData";
import { Search, Filter, CheckCircle, ChevronRight, MapPin, FlaskConical } from "lucide-react";

const INITIAL_APCS = generateAPCs();

const REGIONS = ["All Regions", ...Array.from(new Set(INITIAL_APCS.map(a => a.region))).sort()];
const STATUSES = ["All Statuses", "pending", "approved", "modified", "rejected"];

export default function ReviewPage() {
  const [apcs, setApcs]         = useState(INITIAL_APCS);
  const [search, setSearch]     = useState("");
  const [region, setRegion]     = useState("All Regions");
  const [status, setStatus]     = useState("All Statuses");
  const [bulkDone, setBulkDone] = useState(false);

  const filtered = apcs.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.manager.toLowerCase().includes(search.toLowerCase()) ||
                        a.lab.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === "All Regions" || a.region === region;
    const matchStatus = status === "All Statuses" || a.status === status;
    return matchSearch && matchRegion && matchStatus;
  });

  function bulkApprove() {
    setApcs(prev => prev.map(a => a.status === "pending" ? { ...a, status: "approved" } : a));
    setBulkDone(true);
    setTimeout(() => setBulkDone(false), 3000);
  }

  const pendingCount = apcs.filter(a => a.status === "pending").length;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Order Review" subtitle={`${pendingCount} orders pending approval · Last run: Jun 7, 2026 02:00 AM`} />

      <div className="flex-1 p-6 space-y-4">
        {bulkDone && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
            <CheckCircle size={16} /> All pending orders approved successfully.
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search APC, manager, lab..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
            >
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
            >
              {STATUSES.map(s => <option key={s}>{s === "All Statuses" ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-gray-500">{filtered.length} APCs</span>
              {pendingCount > 0 && (
                <button
                  onClick={bulkApprove}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: "#16a34a" }}
                >
                  <CheckCircle size={14} /> Approve All Pending ({pendingCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100" style={{ background: "#f8f9fb" }}>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">APC</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Region</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Lab</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Visits</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Kits</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Est. Cost</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((apc, i) => {
                const totalKits = apc.kits.reduce((s, k) => s + (k.approved ?? k.recommended), 0);
                return (
                  <tr key={apc.id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{apc.name}</p>
                      <p className="text-xs text-gray-400">{apc.id} · {apc.manager}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin size={12} />
                        <span>{apc.region}</span>
                      </div>
                      <p className="text-xs text-gray-400">{apc.state}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <FlaskConical size={12} />
                        <span className="truncate max-w-32">{apc.lab}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{apc.upcomingVisits}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{totalKits}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#002677" }}>
                      ${(apc.totalCost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={apc.status} /></td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/review/${apc.id}`}
                        className="flex items-center gap-1 text-xs font-semibold hover:underline"
                        style={{ color: "#002677" }}
                      >
                        Review <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Filter size={32} className="mx-auto mb-2" />
              <p>No APCs match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
