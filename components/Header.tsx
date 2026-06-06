"use client";
import { Bell, User } from "lucide-react";

interface Props { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: Props) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "#002677" }}>{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#F5B700" }} />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#002677" }}>
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">Admin User</p>
            <p className="text-xs text-gray-500">Optum HouseCalls</p>
          </div>
        </div>
      </div>
    </header>
  );
}
