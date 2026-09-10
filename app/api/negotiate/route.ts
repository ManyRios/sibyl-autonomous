import { NextRequest, NextResponse } from "next/server";
import {
  recallContext,
  rememberInsight,
  formatMemoryContextForPrompt,
  SibylRecallResult,
} from "@/lib/sibyl";
import { executeNegotiationStep } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      item = "Lote de Servidores GPU H100 (500 Unidades)",
      targetPrice = 15000,
      floorPrice = 11000,
      counterpartyOffer,
      counterpartyId = "corp_buyer_demo",
      memoryEnabled = true,
      strategy = "balanced",
      turnNumber = 1,
      recentTranscript = [],
    } = body;

    if (counterpartyOffer === undefined || typeof counterpartyOffer !== "number") {
      return NextResponse.json(
        { error: "counterpartyOffer es requerido y debe ser un número." },
        { status: 400 }
      );
    }

    // Step 1: Query Sibyl Memory (Load-Bearing Step)
    let memoryData: SibylRecallResult = {
      status: "success",
      found: false,
      counterparty_id: counterpartyId,
      entity: null,
      recent_events: [],
    };
    let formattedContext = "Modo sin memoria habilitado.";

    if (memoryEnabled) {
      memoryData = await recallContext(counterpartyId);
      formattedContext = formatMemoryContextForPrompt(memoryData);
    }

    // Step 2: Tactical Negotiation Engine Execution with Gemini
    const decision = await executeNegotiationStep({
      item,
      targetPrice,
      floorPrice,
      counterpartyOffer,
      counterpartyId,
      historicalContext: formattedContext,
      memoryEnabled,
      strategy,
      turnNumber,
      recentTranscript,
    });

    // Step 3: Persist New Insight and Round Audit in Sibyl Memory
    let persistedResponse = null;
    if (memoryEnabled) {
      try {
        persistedResponse = await rememberInsight(counterpartyId, {
          name: counterpartyId,
          insights: decision.new_insight ? [decision.new_insight] : [],
          turn: {
            turn: turnNumber,
            offer: counterpartyOffer,
            agentPrice: decision.price,
            action: decision.action,
            timestamp: new Date().toISOString(),
          },
          concession_pattern: decision.counterparty_analysis.concession_velocity,
          estimated_reservation_price:
            decision.counterparty_analysis.estimated_reservation_price || undefined,
          deal_closed: decision.action === "ACCEPT",
          action: decision.action,
          offer: counterpartyOffer,
          agent_response: decision.reasoning,
          timestamp: new Date().toISOString(),
        });
      } catch (memErr) {
        console.error("[Route] Error persistiendo en Sibyl Memory:", memErr);
      }
    }

    return NextResponse.json({
      decision,
      memory: {
        enabled: memoryEnabled,
        foundPriorState: memoryData.found,
        entity: memoryData.entity,
        recalledEvents: memoryData.recent_events,
        newInsightPersisted: decision.new_insight,
        storageSaved: persistedResponse?.saved || false,
      },
      turnNumber,
    });
  } catch (error: any) {
    console.error("[Route /api/negotiate] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno en el motor de negociación.", details: error.message },
      { status: 500 }
    );
  }
}
