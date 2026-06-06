"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { generateAPCs } from "@/lib/mockData";
import { CheckCircle, Circle, Loader2, Zap, Mail, ArrowRight, Terminal } from "lucide-react";

const APCS = generateAPCs();

const STEPS = [
  { id: 1, label: "Authenticating with Hawkeye",           duration: 1200 },
  { id: 2, label: "Fetching APC visit schedules",          duration: 2000 },
  { id: 3, label: "Loading kit catalog from Snowflake",    duration: 800  },
  { id: 4, label: "Calculating kit needs per APC",         duration: 5000 },
  { id: 5, label: "Applying buffer & threshold rules",     duration: 1500 },
  { id: 6, label: "Generating purchase orders",            duration: 1200 },
  { id: 7, label: "Validating against ERP constraints",    duration: 900  },
  { id: 8, label: "Sending email notifications to APCs",   duration: 1500 },
  { id: 9, label: "Writing results to Snowflake",          duration: 700  },
  { id: 10,label: "Agent run complete",                    duration: 0    },
];

export default function AgentRunPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle"|"running"|"done">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [apcProgress, setApcProgress] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  function appendLog(msg: string) {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  async function runAgent() {
    setPhase("running");
    setCurrentStep(0);
    setLogs([]);
    setApcProgress(0);

    for (let i = 0; i < STEPS.length - 1; i++) {
      const step = STEPS[i];
      setCurrentStep(i);

      if (i === 0) appendLog("Connected to Hawkeye API v3.2 · Auth token valid");
      if (i === 1) {
        appendLog(`Retrieved schedule data for ${APCS.length} active APCs`);
        appendLog("Forecast window: 14 days · Data freshness: 4 min ago");
      }
      if (i === 2) appendLog("Loaded 10 kit definitions across 4 categories");
      if (i === 3) {
        for (let j = 0; j < APCS.length; j++) {
          await new Promise(r => setTimeout(r, step.duration / APCS.length));
          setApcProgress(j + 1);
          if (j % 10 === 0 || j === APCS.length - 1) {
            appendLog(`Calculated kits for ${APCS[j].name} · ${APCS[j].kits.reduce((s,k)=>s+k.recommended,0)} kits`);
          }
        }
        setCurrentStep(i + 1);
        continue;
      }
      if (i === 4) appendLog(`Applied 15% buffer · Min=5 · Max=500 · All ${APCS.length} APCs in range`);
      if (i === 5) appendLog(`Generated ${APCS.length} purchase orders · Total: 847 kits · Est. $${(APCS.reduce((s,a)=>s+(a.totalCost??0),0)).toLocaleString("en-US",{maximumFractionDigits:0})}`);
      if (i === 6) appendLog("ERP validation passed · No constraint violations");
      if (i === 7) {
        APCS.slice(0, 5).forEach(a => appendLog(`Email dispatched → ${a.email} (${a.name})`));
        appendLog(`... and ${APCS.length - 5} more APC managers notified`);
      }
      if (i === 8) appendLog("Results written to OSCAR_RUNS.AGENT_LOG · Snowflake sync complete");

      await new Promise(r => setTimeout(r, step.duration));
      setCurrentStep(i + 1);
    }

    setCurrentStep(STEPS.length - 1);
    setPhase("done");
    appendLog("─────────────────────────────────────");
    appendLog("OSCAR agent run completed successfully");
    appendLog(`Total kits: 847 · APCs processed: ${APCS.length} · Orders: ${APCS.length}`);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Agent Run" subtitle="Trigger and monitor OSCAR supply chain calculations" />

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Steps */}
        <div className="space-y-4">
          {/* Trigger card */}
          {phase === "idle" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "#002677" }}>
                <Zap size={36} style={{ color: "#F5B700" }} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Run</h2>
              <p className="text-sm text-gray-500 mb-6">
                OSCAR will calculate kit requirements for all 50 active APCs based on upcoming visit schedules from Hawkeye.
              </p>
              <button
                onClick={runAgent}
                className="px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 mx-auto transition-all hover:opacity-90"
                style={{ background: "#002677" }}
              >
                <Zap size={16} style={{ color: "#F5B700" }} /> Start Agent Run
              </button>
            </div>
          )}

          {/* Steps progress */}
          {phase !== "idle" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  {phase === "running" ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <CheckCircle size={16} className="text-green-600" />}
                  {phase === "running" ? "Running..." : "Completed"}
                </h2>
                {phase === "running" && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "#002677", color: "white" }}>
                    LIVE
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const done    = i < currentStep;
                  const active  = i === currentStep && phase === "running";
                  const pending = i > currentStep;
                  return (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {done    && <CheckCircle size={18} className="text-green-500" />}
                        {active  && <Loader2 size={18} className="animate-spin text-blue-600" />}
                        {pending && <Circle size={18} className="text-gray-300" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${done ? "text-gray-600" : active ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {active && step.id === 4 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Processing APCs</span>
                              <span>{apcProgress} / {APCS.length}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${(apcProgress / APCS.length) * 100}%`, background: "#F5B700" }}
                              />
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
          {phase === "done" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h3 className="font-bold text-green-800">Run Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                {[
                  { label: "APCs Processed", value: 50    },
                  { label: "Kits Calculated",  value: 847  },
                  { label: "Orders Generated", value: 50   },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-black text-green-700">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 mb-3">
                <Mail size={14} />
                <span>50 email notifications dispatched to APC managers</span>
              </div>
              <button
                onClick={() => router.push("/review")}
                className="w-full py-2.5 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "#002677" }}
              >
                Review Orders <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Live log */}
        <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
            <Terminal size={14} className="text-gray-400" />
            <span className="text-xs font-mono text-gray-400">OSCAR Agent Log</span>
            {phase === "running" && <span className="ml-auto text-xs text-green-400 font-mono animate-pulse">● LIVE</span>}
          </div>
          <div
            ref={logRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-xs text-green-400 space-y-1 min-h-96"
          >
            {logs.length === 0 && (
              <p className="text-gray-600">Waiting for agent trigger...</p>
            )}
            {logs.map((line, i) => (
              <div key={i} className="agent-log-item leading-5">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
