"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { DEFAULT_CONFIG } from "@/lib/mockData";
import { Save, RotateCcw, CheckCircle, Settings2, Bell, Database, Shield } from "lucide-react";

export default function AdminPage() {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof config>(key: K, value: typeof config[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    setConfig({ ...DEFAULT_CONFIG });
    setSaved(false);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Admin Configuration" subtitle="Configure OSCAR agent parameters and scheduling" />

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {saved && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
            <CheckCircle size={16} /> Configuration saved successfully. Changes will apply on next agent run.
          </div>
        )}

        {/* Forecast & Ordering */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Settings2 size={16} style={{ color: "#002677" }} />
            <h2 className="font-bold text-gray-800">Forecast & Ordering Parameters</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Forecast Window (days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={1} max={90}
                  value={config.forecastWindowDays}
                  onChange={(e) => update("forecastWindowDays", Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">days ahead to forecast visit demand</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buffer % — {Math.round(config.bufferPct * 100)}%
              </label>
              <input
                type="range" min={0} max={50} step={1}
                value={Math.round(config.bufferPct * 100)}
                onChange={(e) => update("bufferPct", Number(e.target.value) / 100)}
                className="w-full accent-blue-700"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>25%</span><span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Order Threshold (kits)
              </label>
              <input
                type="number" min={1} max={50}
                value={config.minOrderThreshold}
                onChange={(e) => update("minOrderThreshold", Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Order Cap (kits per line item)
              </label>
              <input
                type="number" min={50} max={2000}
                value={config.maxOrderCap}
                onChange={(e) => update("maxOrderCap", Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Auto-Approve Orders Under (kits)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={0} max={100}
                  value={config.autoApproveUnder}
                  onChange={(e) => update("autoApproveUnder", Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">total kits per order</span>
              </div>
            </div>
          </div>
        </section>

        {/* Scheduling */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell size={16} style={{ color: "#002677" }} />
            <h2 className="font-bold text-gray-800">Scheduling & Sync</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cron Schedule</label>
              <select
                value={config.cronSchedule}
                onChange={(e) => update("cronSchedule", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                {["Daily 2:00 AM EST","Daily 6:00 AM EST","Every 12 hours","Every 6 hours","Weekly Monday 2 AM"].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hawkeye Sync Interval</label>
              <select
                value={config.hawkeyeSyncInterval}
                onChange={(e) => update("hawkeyeSyncInterval", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                {["Every 1 hour","Every 3 hours","Every 6 hours","Every 12 hours","Daily"].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notification Email Recipients
              </label>
              <input
                type="text"
                value={config.notificationEmails}
                onChange={(e) => update("notificationEmails", e.target.value)}
                placeholder="email1@optum.com, email2@optum.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated. APC managers receive order review links after each run.</p>
            </div>
          </div>
        </section>

        {/* Integration */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Database size={16} style={{ color: "#002677" }} />
            <h2 className="font-bold text-gray-800">ERP Integration</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ERP Endpoint URL</label>
              <input
                type="text"
                value={config.erpEndpoint}
                onChange={(e) => update("erpEndpoint", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Dry Run Mode</p>
                  <p className="text-xs text-gray-400">Calculate orders but do not submit to ERP</p>
                </div>
              </div>
              <button
                onClick={() => update("dryRunMode", !config.dryRunMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.dryRunMode ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.dryRunMode ? "translate-x-6" : ""}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={15} /> Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#002677" }}
          >
            <Save size={15} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
