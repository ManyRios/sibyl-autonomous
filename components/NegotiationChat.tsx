"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import { FaBrain } from "react-icons/fa";
import { NegotiationDecision } from "@/lib/agent";

export interface MessageTurn {
  id: string;
  sender: "counterparty" | "agent";
  offer?: number;
  decision?: NegotiationDecision;
  text?: string;
  timestamp: string;
  memoryNote?: string;
}

interface NegotiationChatProps {
  turns: MessageTurn[];
  onSendOffer: (offer: number) => void;
  loading: boolean;
  targetPrice: number;
  floorPrice: number;
  dealStatus: "negotiating" | "accepted" | "rejected";
}

export const NegotiationChat: React.FC<NegotiationChatProps> = ({
  turns,
  onSendOffer,
  loading,
  targetPrice,
  floorPrice,
  dealStatus,
}) => {
  const [offerInput, setOfferInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(offerInput);
    if (!val || val <= 0 || loading || dealStatus !== "negotiating") return;
    onSendOffer(val);
    setOfferInput("");
  };

  const handleQuickOffer = (amount: number) => {
    if (loading || dealStatus !== "negotiating") return;
    onSendOffer(amount);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col h-185 shadow-xl overflow-hidden">
      <div className="border-b border-zinc-800 px-5 py-3.5 bg-zinc-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Tactical Trading Feed
          </h2>
        </div>
        <div>
          {dealStatus === "negotiating" && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Under Negotiation
            </span>
          )}
          {dealStatus === "accepted" && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
              <FiCheckCircle /> Deal Closed
            </span>
          )}
          {dealStatus === "rejected" && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold flex items-center gap-1">
              <FiXCircle /> Deal Rejected
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
            <FiTrendingUp className="text-4xl text-zinc-700 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Negotiation Session on Hold
            </h3>
            <p className="text-xs max-w-sm mt-1">
              Send an initial counter-offer (as the buyer) to test Sibyl's reasoning and memory.
            </p>
          </div>
        ) : (
          turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex flex-col ${
                turn.sender === "counterparty" ? "items-end" : "items-start"
              }`}
            >
              {turn.sender === "counterparty" ? (
                <div className="max-w-[80%] bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tr-sm px-4 py-3 text-zinc-100 shadow-md">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-400 mb-1 border-b border-zinc-700/60 pb-1">
                    <span className="font-semibold text-orange-400">Counterparty (Buyer)</span>
                    <span className="flex items-center gap-1">
                      <FiClock className="text-[10px]" />
                      {turn.timestamp}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xs text-zinc-400">Offer sent:</span>
                    <span className="text-lg font-mono font-bold text-white">
                      ${turn.offer?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="max-w-[90%] bg-zinc-950 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-orange-400">
                        Sibyl Agent
                      </span>
                      {turn.decision?.action === "COUNTER" && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          COUNTEROFFER
                        </span>
                      )}
                      {turn.decision?.action === "ACCEPT" && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <FiCheckCircle /> ACCEPTED
                        </span>
                      )}
                      {turn.decision?.action === "REJECT" && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <FiXCircle /> REJECTED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {turn.timestamp}
                    </span>
                  </div>
                  {turn.decision && (
                    <div className="flex items-center justify-between bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
                          {turn.decision.action === "COUNTER"
                            ? "Proposed Price"
                            : "Closing Price"}
                        </p>
                        <p className="text-xl font-mono font-bold text-orange-400">
                          ${turn.decision.price?.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <p className="text-[10px] text-zinc-500">Margin vs Floor ($)</p>
                        <p className="font-mono text-emerald-400 font-semibold">
                          +${(turn.decision.price - floorPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {turn.decision?.reasoning && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-zinc-300">
                        Strategic Reasoning:
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/40">
                        {turn.decision.reasoning}
                      </p>
                    </div>
                  )}
                  {turn.decision?.memory_applied && (
                    <div className="bg-orange-950/20 border border-orange-500/30 rounded-xl p-2.5 flex items-start gap-2">
                      <FaBrain className="text-orange-400 mt-0.5 shrink-0 text-sm" />
                      <div className="text-xs">
                        <span className="font-semibold text-orange-300">
                          Sibyl's Load-Bearing Impact:
                        </span>{" "}
                        <span className="text-zinc-300">
                          {turn.decision.memory_applied}
                        </span>
                      </div>
                    </div>
                  )}
                  {turn.decision?.new_insight && (
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 border-t border-zinc-800/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>New insight persisted in memory:</span>
                      <span className="italic text-zinc-300 truncate">
                        "{turn.decision.new_insight}"
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-zinc-400 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 w-fit">
            <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span>Consulting Sibyl Memory and calculating tactical movement...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 text-[11px] shrink-0">Flash Offers:</span>
          {[
            { label: "Down ($8,500)", val: 8500 },
            { label: "Floor ($11,000)", val: floorPrice },
            { label: "Average ($12,800)", val: 12800 },
            { label: "Strong ($14,200)", val: 14200 },
            { label: "Target ($15,000)", val: targetPrice },
          ].map((btn) => (
            <button
              key={btn.val}
              onClick={() => handleQuickOffer(btn.val)}
              disabled={loading || dealStatus !== "negotiating"}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] shrink-0 transition disabled:opacity-50"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
            <input
              type="number"
              value={offerInput}
              onChange={(e) => setOfferInput(e.target.value)}
              disabled={loading || dealStatus !== "negotiating"}
              placeholder={
                dealStatus === "negotiating"
                  ? "Type the counterparty's offer in USD..."
                  : "Negotiation concluded. Start a new session."
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-white focus:border-orange-500 focus:outline-none transition disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !offerInput || dealStatus !== "negotiating"}
            className="px-5 py-2.5 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <FiSend className="text-xs" />
          </button>
        </form>
      </div>
    </div>
  );
};
