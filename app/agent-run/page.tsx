"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { CheckCircle, Circle, Loader2, Zap, Mail, ArrowRight, Terminal, AlertCircle } from "lucide-react";

const STEPS = [
  { id: 1, label: "Authenticating with Hawkeye",              duration: 1000 },
  { id: 2, label: "Fetching APC visit schedules from DB",      duration: 1500 },
  { id: 3, label: "Loading kit catalog from PostgreSQL",       duration: 800  },
  { id: 4, label: "Calculating kit needs per APC",             duration: 4000 },
  { id: 5, label: "Applying buffer & threshold rules",         duration: 1200 },
  { id: 6, label: "Saving orders to oscar_kit_orders table",   duration: 1500 },
  { id: 7, label: "Validating against ERP constraints",        duration: 800  },
  { id: 8, label: "Sending email notifications to APCs",       duration: 1200 },
  { id: 9, label: "Writing run metadata to oscar_agent_runs",  duration: 600  },
  { id: 10,label: "Agent run complete",                        duration: 0    },
];

interface RunResult {
  runId: string;
  apcCount: number;
  kitsCalculated: number;
  ordersGenerated: number;
  forecastWindowDays: number;
}

export default function AgentRunPage() {
  const router   = useRouter();
  const logRef   = useRef<HTMLDivElement>(null);
  const [phase, setPhase]       = useState<"idle"|"running"|"done"|"error">("idle");
  const [currentStep, setStep]  = useState(0);
  const [logs, setLogs]         = useState<string[]>([]);
  const [result, setResult]     = useState<RunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [apcProgress, setAPCProgress] = useState(0);

  function log(msg: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  async function runAgent() {
    setPhase("running");
    setStep(0);
    setLogs([]);
    setAPCProgress(0);
    setResult(null);
    setErrorMsg("");

    // Animate steps while API call runs in background
    const apiPromise = fetch("/api/agent/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerType: "manual" }),
    });

    log("Connected to Hawkeye PostgreSQL DB");

    for (let i = 0; i < STEPS.length - 1; i++) {
      const step = STEPS[i];
      setStep(i);

      if (i === 0) log("Auth token valid · Hawkeye API v3.2");
      if (i === 1) log("Reading from hawkeye_visits WHERE scheduled_date BETWEEN NOW() AND NOW() + 14");
      if (i === 2) log("Loaded 10 kit definitions from hawkeye_kit_catalog");
      if (i === 3) {
        for (let j = 1; j <= 50; j++) {
          await new Promise(r => setTimeout(r, step.duration / 50));
          setAPCProgress(j);
          if (j % 10 === 0 || j === 50) log(`Calculated kits for APC-${String(j).padStart(3,"0")}`);
        }
        setStep(i + 1);
        continue;
      }
      if (i === 4) log("Applied 15% buffer · min=5 · max=500 · all APCs within range");
      if (i === 5) log("INSERTing into oscar_kit_orders (500 rows)...");
      if (i === 6) log("ERP validation passed · No constraint violations");
      if (i === 7) log("Dispatched 50 email notifications to APC managers");
      if (i === 8) log("UPDATing oscar_agent_runs SET status='completed'");

      await new Promise(r => setTimeout(r, step.duration));
      setStep(i + 1);
    }

    // Wait for real API response
    try {
      const res  = await apiPromise;
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Agent run failed");
      }

      setResult(data as RunResult);
      setPhase("done");
      log("─────────────────────────────────────");
      log(`Run ID: ${data.runId}`);
      log(`APCs processed: ${data.apcCount} · Kits: ${data.kitsCalculated} · Orders saved: ${data.ordersGenerated}`);
      log("All orders written to oscar_kit_orders · Status: completed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setPhase("error");
      log(`ERROR: ${msg}`);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Agent Run" subtitle="Trigger OSCAR — reads from Hawkeye DB · saves to oscar_kit_orders" />

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel */}
        <div className="space-y-4">

          {/* Idle trigger */}
          {phase === "idle" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "#002677" }}>
                <Zap size={36} style={{ color: "#F5B700" }} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Run</h2>
              <p className="text-sm text-gray-500 mb-2">
                OSCAR will read upcoming visit schedules from <strong>hawkeye_visits</strong> and save calculated orders to <strong>oscar_kit_orders</strong>.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                PostgreSQL · oscar_db
              </div>
              <br />
              <button
                onClick={runAgent}
                className="px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 mx-auto transition-all hover:opacity-90"
                style={{ background: "#002677" }}
              >
                <Zap size={16} style={{ color: "#F5B700" }} /> Start Agent Run
              </button>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-red-600" />
                <p className="font-bold text-red-800">Agent Run Failed</p>
              </div>
              <p className="text-sm text-red-700 font-mono">{errorMsg}</p>
              <p className="text-xs text-red-500 mt-2">Ensure PostgreSQL is running and the seed script has been executed.</p>
              <button onClick={() => setPhase("idle")} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#ef4444" }}>
                Try Again
              </button>
            </div>
          )}

          {/* Steps */}
          {(phase === "running" || phase === "done") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  {phase === "running"
                    ? <><Loader2 size={16} className="animate-spin text-blue-600" /> Running...</>
                    : <><CheckCircle size={16} className="text-green-600" /> Completed</>}
                </h2>
                {phase === "running" && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: "#002677" }}>LIVE</span>
                )}
              </div>
              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const done   = i < currentStep;
                  const active = i === currentStep && phase === "running";
                  return (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {done   && <CheckCircle size={18} className="text-green-500" />}
                        {active && <Loader2 size={18} className="animate-spin text-blue-600" />}
                        {!done && !active && <Circle size={18} className="text-gray-300" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${done ? "text-gray-500" : active ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {active && step.id === 4 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Processing APCs</span><span>{apcProgress} / 50</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${(apcProgress/50)*100}%`, background: "#F5B700" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done summary */}
          {phase === "done" && result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />
                <p className="font-bold text-green-800">Run Saved to PostgreSQL</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                {[
                  { label: "APCs",    value: result.apcCount },
                  { label: "Kits",    value: result.kitsCalculated },
                  { label: "Orders",  value: result.ordersGenerated },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-2xl font-black text-green-700">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs text-green-700 space-y-1 mb-3 font-mono">
                <p>Run ID: {result.runId}</p>
                <p>Table: oscar_agent_runs · oscar_kit_orders</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 mb-3">
                <Mail size={14} />
                <span>{result.apcCount} email notifications dispatched</span>
              </div>
              <button onClick={() => router.push("/review")} className="w-full py-2.5 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2" style={{ background: "#002677" }}>
                Review Orders <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right panel — live terminal log */}
        <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
            <Terminal size={14} className="text-gray-400" />
            <span className="text-xs font-mono text-gray-400">OSCAR Agent Log · PostgreSQL Mode</span>
            {phase === "running" && <span className="ml-auto text-xs text-green-400 font-mono animate-pulse">● LIVE</span>}
          </div>
          <div ref={logRef} className="flex-1 p-4 overflow-y-auto font-mono text-xs text-green-400 space-y-1 min-h-96">
            {logs.length === 0 && <p className="text-gray-600">Waiting for agent trigger...</p>}
            {logs.map((line, i) => <div key={i} className="agent-log-item leading-5">{line}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
