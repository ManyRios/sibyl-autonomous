"use client";

import React from "react";
import {
  FiDatabase,
  FiActivity,
  FiBookOpen,
  FiLayers,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";
import { CounterpartyEntity } from "@/lib/sibyl";

interface MemoryConnectomeProps {
  counterpartyId: string;
  entity: CounterpartyEntity | null;
  recalledOnColdStart: boolean;
  memoryEnabled: boolean;
  recentEvents: any[];
  lastSavedInsight?: string | null;
}

export const MemoryConnectome: React.FC<MemoryConnectomeProps> = ({
  counterpartyId,
  entity,
  recalledOnColdStart,
  memoryEnabled,
  recentEvents,
  lastSavedInsight,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-5 flex flex-col h-185 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <FiDatabase className="text-amber-400" />
          <h2 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider">
            Sibyl Connectome & Inspector
          </h2>
        </div>
        {memoryEnabled && recalledOnColdStart ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FiCheckCircle className="text-xs" />
            <span>Cold-Start Recalled</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span>{memoryEnabled ? "Without prior precedent": "Erased Memory"}</span>
          </span>
        )}
      </div>
      <div
        className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
          memoryEnabled
            ? "bg-amber-950/20 border-amber-500/30 text-amber-200/90"
            : "bg-rose-950/20 border-rose-500/30 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          <FiShield />
          <span>
            {memoryEnabled
              ? "Load-Bearing Memory: Activated"
              : "Stateless Mode: Disconnected Memory"}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-300">
          {memoryEnabled
            ? "Sibyl Memory governs elasticity and reserve prices. Each turn, it queries and updates the connectome"
            : "Deletion Test: The agent does not remember previous sessions and is vulnerable to low-anchoring tactics"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Stored Entity:</span>
            <span className="font-mono text-orange-400 font-semibold truncate max-w-37.5">
              counterparty/{counterpartyId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] text-zinc-500 block">Concession Pattern</span>
              <span className="text-xs font-semibold text-zinc-200">
                {entity?.concession_pattern || "Not determined"}
              </span>
            </div>

            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] text-zinc-500 block">Estimated Booking Point</span>
              <span className="text-xs font-semibold font-mono text-emerald-400">
                {entity?.estimated_reservation_price
                  ? `$${entity.estimated_reservation_price.toLocaleString()}`
                  : "To be discovered"}
              </span>
            </div>

            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] text-zinc-500 block">Trust Score</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${entity?.trust_score ?? 50}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-300">
                  {entity?.trust_score ?? 50}%
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] text-zinc-500 block">Deals Closed</span>
              <span className="text-xs font-semibold text-zinc-200">
                {entity?.total_deals_closed ?? 0} contracts
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <FiBookOpen className="text-amber-400 text-xs" />
              <span>Strategic Patterns in Sibyls</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {entity?.insights?.length || 0} patterns
            </span>
          </div>

          <div className="space-y-2">
            {!entity?.insights || entity.insights.length === 0 ? (
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-center text-xs text-zinc-500">
                No prior notes. Insights detected by the AI Model will be automatically saved here.
              </div>
            ) : (
              entity.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-300 flex items-start gap-2 shadow-sm"
                >
                  <span className="w-4 h-4 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{insight}</p>
                </div>
              ))
            )}

            {lastSavedInsight && (
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
                <FiZap className="shrink-0" />
                <span className="truncate">
                  Persisted in the DB: "{lastSavedInsight}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sibyl Cold Journal (Audit of Decisions) */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <FiLayers className="text-blue-400 text-xs" />
              <span>Sibyl Cold-Tier Journal</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">write_event</span>
          </div>

          <div className="space-y-1.5">
            {recentEvents.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic p-2 bg-zinc-950 rounded-lg">
                The append-only journal will record every executed bid and counter-bid.
              </p>
            ) : (
              recentEvents.map((ev, i) => (
                <div
                  key={i}
                  className="bg-zinc-950/80 border border-zinc-800/60 rounded-lg p-2 text-[11px] text-zinc-400 font-mono flex items-center justify-between"
                >
                  <span className="text-zinc-300 truncate max-w-42.5">
                    {ev.acted?.action || "EVENT"}: ${ev.acted?.offer ?? "N/A"}
                  </span>
                  <span className="text-[9px] text-zinc-500">
                    {ev.ts ? new Date(ev.ts).toLocaleTimeString() : "recent"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
