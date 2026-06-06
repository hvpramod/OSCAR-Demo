"use client";
import { useState } from "react";
import Header from "@/components/Header";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { TrendingDown, DollarSign, BarChart3, PieChart as PieIcon, Activity } from "lucide-react";

// ── Mock data ──────────────────────────────────────────────────────────────

const WASTE_DATA = [
  { month: "Jan", before: 112000, after: 87000 },
  { month: "Feb", before: 108000, after: 79000 },
  { month: "Mar", before: 124000, after: 74000 },
  { month: "Apr", before: 117000, after: 68000 },
  { month: "May", before: 131000, after: 62000 },
  { month: "Jun", before: 119000, after: 54000 },
];

const SAVINGS_DATA = [
  { month: "Jan", savings: 25000,  cumulative: 25000  },
  { month: "Feb", savings: 29000,  cumulative: 54000  },
  { month: "Mar", savings: 50000,  cumulative: 104000 },
  { month: "Apr", savings: 49000,  cumulative: 153000 },
  { month: "May", savings: 69000,  cumulative: 222000 },
  { month: "Jun", savings: 65000,  cumulative: 287000 },
];

const COMPLIANCE_DATA = [
  { name: "Approved On Time", value: 72, color: "#16a34a" },
  { name: "Modified",          value: 14, color: "#F5B700" },
  { name: "Pending",           value: 10, color: "#6b7280" },
  { name: "Auto-Approved",     value: 4,  color: "#002677" },
];

const FORECAST_DATA = [
  { month: "Jan", predicted: 812, actual: 798  },
  { month: "Feb", predicted: 824, actual: 831  },
  { month: "Mar", predicted: 795, actual: 789  },
  { month: "Apr", predicted: 841, actual: 856  },
  { month: "May", predicted: 818, actual: 812  },
  { month: "Jun", predicted: 847, actual: null },
];

const REGIONAL_DATA = [
  { region: "Northeast",    apcs: 10, kits: 2840, waste_reduction: 18.2 },
  { region: "Southeast",    apcs: 10, kits: 2310, waste_reduction: 22.1 },
  { region: "Midwest",      apcs: 9,  kits: 1970, waste_reduction: 19.4 },
  { region: "South Central",apcs: 6,  kits: 2120, waste_reduction: 21.7 },
  { region: "Southwest",    apcs: 10, kits: 1840, waste_reduction: 16.8 },
  { region: "Northwest",    apcs: 7,  kits: 1480, waste_reduction: 17.3 },
];

const TABS = [
  { id: "waste",      label: "Waste Reduction",    icon: TrendingDown },
  { id: "savings",    label: "Cost Savings",        icon: DollarSign   },
  { id: "compliance", label: "APC Compliance",      icon: PieIcon      },
  { id: "forecast",   label: "Forecast Accuracy",   icon: Activity     },
  { id: "regional",   label: "Regional Breakdown",  icon: BarChart3    },
];

const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 },
};

function fmt$(v: number) { return `$${(v/1000).toFixed(0)}K`; }

export default function ReportsPage() {
  const [tab, setTab] = useState("waste");

  return (
    <div className="flex flex-col flex-1">
      <Header title="Reports & Analytics" subtitle="Supply chain performance metrics · Powered by Snowflake" />

      <div className="flex-1 p-6 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "YTD Cost Savings",     value: "$287K",  sub: "vs. manual ordering",  color: "#16a34a" },
            { label: "Waste Reduced",        value: "38%",    sub: "vs. Jan baseline",      color: "#002677" },
            { label: "Forecast Accuracy",    value: "97.2%",  sub: "predicted vs actual",   color: "#F5B700" },
            { label: "Annualized Savings",   value: "$1.2M",  sub: "projected run-rate",    color: "#002677" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-black mt-1" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  tab === id
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={tab === id ? { borderColor: "#002677", color: "#002677" } : {}}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "waste" && (
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Monthly Waste Cost: Before vs After OSCAR</h3>
                <p className="text-sm text-gray-500 mb-6">Comparison of supply waste spend before OSCAR deployment (Jan 2026) vs. after</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={WASTE_DATA} {...TOOLTIP_STYLE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={fmt$} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} />
                    <Legend />
                    <Bar dataKey="before" name="Before OSCAR" fill="#d1d5db" radius={[4,4,0,0]} />
                    <Bar dataKey="after"  name="After OSCAR"  fill="#002677" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {tab === "savings" && (
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Cumulative Cost Savings YTD</h3>
                <p className="text-sm text-gray-500 mb-6">Monthly savings and running total · On track for $1.2M annualized</p>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={SAVINGS_DATA} {...TOOLTIP_STYLE}>
                    <defs>
                      <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#002677" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#002677" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={fmt$} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} />
                    <Legend />
                    <Area  dataKey="cumulative" name="Cumulative Savings" stroke="#002677" fill="url(#savGrad)" strokeWidth={2} />
                    <Bar   dataKey="savings"    name="Monthly Savings"    fill="#F5B700"  radius={[4,4,0,0]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {tab === "compliance" && (
              <div>
                <h3 className="font-bold text-gray-800 mb-1">APC Order Compliance</h3>
                <p className="text-sm text-gray-500 mb-6">Distribution of order approval outcomes across all active APCs · Current cycle</p>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={COMPLIANCE_DATA} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                           dataKey="value" nameKey="name" paddingAngle={3}>
                        {COMPLIANCE_DATA.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${Number(v)}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 min-w-48">
                    {COMPLIANCE_DATA.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{name}</p>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "forecast" && (
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Forecast Accuracy: Predicted vs Actual Kits</h3>
                <p className="text-sm text-gray-500 mb-6">Monthly comparison of OSCAR forecasted kit demand vs. actual consumption</p>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={FORECAST_DATA} {...TOOLTIP_STYLE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[750, 880]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="predicted" name="Predicted" stroke="#002677" strokeWidth={2} dot={{ r: 4 }} />
                    <Line dataKey="actual"    name="Actual"    stroke="#F5B700" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-gray-400 mt-2">Jun actual pending · Forecast accuracy: 97.2% (±1 SD)</p>
              </div>
            )}

            {tab === "regional" && (
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Regional Performance Breakdown</h3>
                <p className="text-sm text-gray-500 mb-4">Kit volume and waste reduction by region · Current cycle</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {["Region","APCs","Total Kits","Waste Reduction"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {REGIONAL_DATA.map((row, i) => (
                        <tr key={row.region} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                          <td className="px-4 py-3 font-semibold text-gray-800">{row.region}</td>
                          <td className="px-4 py-3 text-gray-600">{row.apcs}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: "#002677" }}>{row.kits.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-24">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${row.waste_reduction * 4}%` }} />
                              </div>
                              <span className="font-semibold text-green-700">{row.waste_reduction}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={REGIONAL_DATA} {...TOOLTIP_STYLE} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="kits" name="Total Kits" fill="#002677" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
