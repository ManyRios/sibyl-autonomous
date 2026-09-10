"use client";

import React, { useState } from "react";
import {
  FiSliders,
  FiDollarSign,
  FiUser,
  FiZap,
  FiRefreshCw,
  FiShield,
  FiPlusCircle,
  FiTrash2,
} from "react-icons/fi";

export interface TacticalSettings {
  item: string;
  targetPrice: number;
  floorPrice: number;
  strategy: "conservative" | "balanced" | "aggressive";
  counterpartyId: string;
}

interface TacticalPanelProps {
  settings: TacticalSettings;
  onChangeSettings: (newSettings: TacticalSettings) => void;
  onSeedProfile: (type: "lowballer" | "partner") => void;
  onResetMemory: () => void;
  onNewSession: () => void;
  loading: boolean;
}

export const TacticalPanel: React.FC<TacticalPanelProps> = ({
  settings,
  onChangeSettings,
  onSeedProfile,
  onResetMemory,
  onNewSession,
  loading,
}) => {
  const [activePreset, setActivePreset] = useState<string>("custom");

  const handlePresetSelect = (preset: "lowballer" | "partner" | "fresh") => {
    setActivePreset(preset);
    if (preset === "lowballer") {
      onChangeSettings({
        ...settings,
        counterpartyId: "titan_procurement",
      });
      onSeedProfile("lowballer");
    } else if (preset === "partner") {
      onChangeSettings({
        ...settings,
        counterpartyId: "apex_global",
      });
      onSeedProfile("partner");
    } else if (preset === "fresh") {
      const freshId = `nuevo_comprador_${Math.floor(100 + Math.random() * 900)}`;
      onChangeSettings({
        ...settings,
        counterpartyId: freshId,
      });
      onNewSession();
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-6 flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <FiSliders className="text-orange-400" />
          <h2 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider">
            Tactical Parameters
          </h2>
        </div>
        <button
          onClick={onNewSession}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition"
          title="Restart current conversation while retaining memory"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          <span>New session</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Asset to be Traded</label>
        <input
          type="text"
          value={settings.item}
          onChange={(e) => onChangeSettings({ ...settings, item: e.target.value })}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none transition"
          placeholder="Ej: Batch 500 GPUs H100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
            <FiDollarSign className="text-emerald-400 text-xs" />
            <span>Target Price</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              value={settings.targetPrice}
              onChange={(e) =>
                onChangeSettings({
                  ...settings,
                  targetPrice: Math.max(0, Number(e.target.value)),
                })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-zinc-500">Ideal commercial goal</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
            <FiShield className="text-rose-400 text-xs" />
            <span>Floor price</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              value={settings.floorPrice}
              onChange={(e) =>
                onChangeSettings({
                  ...settings,
                  floorPrice: Math.max(0, Number(e.target.value)),
                })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-rose-400 focus:border-rose-500 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-zinc-500">Walk-away</p>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
          <FiZap className="text-amber-400 text-xs" />
          <span>Concession Strategy</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "conservative", label: "Conservative" },
              { id: "balanced", label: "Balanced" },
              { id: "aggressive", label: "Aggresive" },
            ] as const
          ).map((strat) => (
            <button
              key={strat.id}
              onClick={() => onChangeSettings({ ...settings, strategy: strat.id })}
              className={`py-2 text-xs rounded-xl font-medium border transition ${
                settings.strategy === strat.id
                  ? "bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-sm"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {strat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
            <FiUser className="text-blue-400" />
            <span>Counterpart (Sibyl Memory Key)</span>
          </label>
          <span className="text-[10px] text-center text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            Demo Presets
          </span>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => handlePresetSelect("lowballer")}
            className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
              activePreset === "lowballer"
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div>
              <p className="font-semibold text-zinc-200">Titan Procurement</p>
              <p className="text-[11px] text-zinc-500">
                Aggressive lowballer · Low anchoring and bluffs
              </p>
            </div>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-1 rounded">
              Memory Seed
            </span>
          </button>

          <button
            onClick={() => handlePresetSelect("partner")}
            className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
              activePreset === "partner"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div>
              <p className="font-semibold text-zinc-200">Apex Global Tech</p>
              <p className="text-[11px] text-zinc-500">
                Strategic partner · Mutual concession
              </p>
            </div>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-1 rounded">
              Sown Memory
            </span>
          </button>

          <button
            onClick={() => handlePresetSelect("fresh")}
            className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
              activePreset === "fresh"
                ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div>
              <p className="font-semibold text-zinc-200">New buyer</p>
              <p className="text-[11px] text-zinc-500">
                Cold Start (No prior history)
              </p>
            </div>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-1 rounded">
              Cold
            </span>
          </button>
        </div>

        <div className="pt-2">
          <input
            type="text"
            value={settings.counterpartyId}
            onChange={(e) => {
              setActivePreset("custom");
              onChangeSettings({ ...settings, counterpartyId: e.target.value });
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:border-orange-500 focus:outline-none"
            placeholder="ID único de contraparte"
          />
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={onResetMemory}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/50 text-rose-400 text-xs py-2 rounded-xl transition"
            title="Borrar memoria de este counterparty para repetir el demo"
          >
            <FiTrash2 className="text-xs" />
            <span>Clean memory {settings.counterpartyId}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
