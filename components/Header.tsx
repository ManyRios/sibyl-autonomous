"use client";

import React from "react";
import { FiDatabase, FiShield } from "react-icons/fi";
import { FaAutoprefixer } from "react-icons/fa";

interface HeaderProps {
  memoryEnabled: boolean;
  onToggleMemory: (enabled: boolean) => void;
  stats: {
    tier?: string;
    db_size_bytes?: number;
    tenant_id?: string;
    counterparty_count?: number;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  memoryEnabled,
  onToggleMemory,
  stats,
}) => {
  const dbKb = stats?.db_size_bytes
    ? (stats.db_size_bytes / 1024).toFixed(1)
    : "276.0";

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <FaAutoprefixer className="text-white text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Sibyl Autonomous Negotiator
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Negotiator Agent
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Tactical Agent with Strategy Persistence and Load-Bearing Memory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-zinc-300">
              <FiShield className={memoryEnabled ? "text-emerald-400" : "text-zinc-500"} />
              <span>Gate Criteria (The Litmus Test)</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {memoryEnabled
                ? "Active Sibyl Memory (Adaptive Strategy)"
                : "Stateless Mode (Simulated Deletion)"}
            </p>
          </div>

          <button
            onClick={() => onToggleMemory(!memoryEnabled)}
            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              memoryEnabled ? "bg-orange-500" : "bg-zinc-700"
            }`}
            title="Toggle Sibyl Memory"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                memoryEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <FiDatabase className="text-amber-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Sibyl Engine
              </span>
              <span className="text-zinc-200 font-mono font-medium">
                {stats?.tier?.toUpperCase() || "STAKE"} · {dbKb} KB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};
