"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { TacticalPanel, TacticalSettings } from "@/components/TacticalPanel";
import { NegotiationChat, MessageTurn } from "@/components/NegotiationChat";
import { MemoryConnectome } from "@/components/MemoryConnectome";
import { CounterpartyEntity, SibylStatsResult } from "@/lib/sibyl";

export default function Home() {
  // Global States
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);
  const [stats, setStats] = useState<SibylStatsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Tactical Parameters
  const [settings, setSettings] = useState<TacticalSettings>({
    item: "Lote de Servidores GPU H100 (500 Unidades)",
    targetPrice: 15000,
    floorPrice: 11000,
    strategy: "balanced",
    counterpartyId: "titan_procurement",
  });

  // Negotiation Feed
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [dealStatus, setDealStatus] = useState<"negotiating" | "accepted" | "rejected">("negotiating");

  // Memory Connectome State
  const [entity, setEntity] = useState<CounterpartyEntity | null>(null);
  const [recalledOnColdStart, setRecalledOnColdStart] = useState<boolean>(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [lastSavedInsight, setLastSavedInsight] = useState<string | null>(null);

  // Fetch Sibyl system diagnostics
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error("Error fetching Sibyl stats:", e);
    }
  }, []);

  // Cold-Start Recall for current counterparty
  const loadCounterpartyMemory = useCallback(
    async (counterpartyId: string) => {
      try {
        const res = await fetch(`/api/memory?counterpartyId=${encodeURIComponent(counterpartyId)}`);
        const data = await res.json();
        if (data.specificCounterparty?.found && data.specificCounterparty.entity) {
          setEntity(data.specificCounterparty.entity);
          setRecentEvents(data.specificCounterparty.recent_events || []);
          setRecalledOnColdStart(true);
        } else {
          setEntity(null);
          setRecentEvents([]);
          setRecalledOnColdStart(false);
        }
      } catch (e) {
        console.error("Error loading counterparty memory:", e);
      }
    },
    []
  );

  useEffect(() => {
    fetchStats();
    loadCounterpartyMemory(settings.counterpartyId);
  }, [fetchStats, loadCounterpartyMemory, settings.counterpartyId]);

  // Handle new negotiation offer submission
  const handleSendOffer = async (offerAmount: number) => {
    setLoading(true);

    const userTurn: MessageTurn = {
      id: `turn-user-${Date.now()}`,
      sender: "counterparty",
      offer: offerAmount,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newTurns = [...turns, userTurn];
    setTurns(newTurns);

    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: settings.item,
          targetPrice: settings.targetPrice,
          floorPrice: settings.floorPrice,
          counterpartyOffer: offerAmount,
          counterpartyId: settings.counterpartyId,
          memoryEnabled,
          strategy: settings.strategy,
          turnNumber: Math.floor(newTurns.length / 2) + 1,
        }),
      });

      const data = await response.json();

      if (data.decision) {
        const agentTurn: MessageTurn = {
          id: `turn-agent-${Date.now()}`,
          sender: "agent",
          decision: data.decision,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setTurns([...newTurns, agentTurn]);

        if (data.decision.action === "ACCEPT") {
          setDealStatus("accepted");
        } else if (data.decision.action === "REJECT") {
          setDealStatus("rejected");
        }

        if (data.decision.new_insight) {
          setLastSavedInsight(data.decision.new_insight);
        }

        // Refresh recalled memory
        if (memoryEnabled) {
          await loadCounterpartyMemory(settings.counterpartyId);
          await fetchStats();
        }
      }
    } catch (err) {
      console.error("Error en negociación:", err);
    } finally {
      setLoading(false);
    }
  };

  // Seed preset profile for demo
  const handleSeedProfile = async (type: "lowballer" | "partner") => {
    setLoading(true);
    try {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed",
          counterpartyId: settings.counterpartyId,
          seedType: type,
        }),
      });
      await loadCounterpartyMemory(settings.counterpartyId);
      await fetchStats();
      setTurns([]);
      setDealStatus("negotiating");
    } catch (e) {
      console.error("Error seeding profile:", e);
    } finally {
      setLoading(false);
    }
  };

  // Reset memory for counterparty
  const handleResetMemory = async () => {
    setLoading(true);
    try {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          counterpartyId: settings.counterpartyId,
        }),
      });
      setEntity(null);
      setRecentEvents([]);
      setRecalledOnColdStart(false);
      setTurns([]);
      setDealStatus("negotiating");
      await fetchStats();
    } catch (e) {
      console.error("Error resetting memory:", e);
    } finally {
      setLoading(false);
    }
  };

  // Start fresh session (crucial for demo video to show Cold-Start Recall)
  const handleNewSession = () => {
    setTurns([]);
    setDealStatus("negotiating");
    setLastSavedInsight(null);
    loadCounterpartyMemory(settings.counterpartyId);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Header
        memoryEnabled={memoryEnabled}
        onToggleMemory={setMemoryEnabled}
        stats={stats}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tactical Configuration & Presets (3 cols) */}
        <div className="lg:col-span-3">
          <TacticalPanel
            settings={settings}
            onChangeSettings={setSettings}
            onSeedProfile={handleSeedProfile}
            onResetMemory={handleResetMemory}
            onNewSession={handleNewSession}
            loading={loading}
          />
        </div>

        {/* Center Column: Live Negotiation Feed & Offer Submissions (5 cols) */}
        <div className="lg:col-span-5">
          <NegotiationChat
            turns={turns}
            onSendOffer={handleSendOffer}
            loading={loading}
            targetPrice={settings.targetPrice}
            floorPrice={settings.floorPrice}
            dealStatus={dealStatus}
          />
        </div>

        {/* Right Column: Sibyl Memory Connectome & Cold-Start Inspector (4 cols) */}
        <div className="lg:col-span-4">
          <MemoryConnectome
            counterpartyId={settings.counterpartyId}
            entity={entity}
            recalledOnColdStart={recalledOnColdStart}
            memoryEnabled={memoryEnabled}
            recentEvents={recentEvents}
            lastSavedInsight={lastSavedInsight}
          />
        </div>
      </main>
    </div>
  );
}
