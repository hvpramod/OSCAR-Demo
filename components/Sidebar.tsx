"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Settings, Cpu, ClipboardList, BarChart3, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin",      label: "Admin Config",   icon: Settings        },
  { href: "/agent-run",  label: "Agent Run",      icon: Cpu             },
  { href: "/review",     label: "Order Review",   icon: ClipboardList   },
  { href: "/reports",    label: "Reports",        icon: BarChart3       },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: "#002677" }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F5B700" }}>
            <span className="text-white font-black text-sm">O</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">OSCAR</p>
            <p className="text-blue-200 text-xs mt-0.5">Supply Chain Agent</p>
          </div>
        </div>
        <p className="text-blue-200/60 text-xs mt-3">Optum HouseCalls</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "text-white"
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              )}
              style={active ? { background: "#F5B700", color: "#002677" } : {}}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 pulse-ring" />
          <span className="text-blue-200 text-xs">3,250 APCs monitored</span>
        </div>
        <p className="text-blue-200/40 text-xs mt-1">v1.0.0 · Demo Mode</p>
      </div>
    </aside>
  );
}
