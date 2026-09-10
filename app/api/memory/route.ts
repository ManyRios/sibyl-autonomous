import { NextRequest, NextResponse } from "next/server";
import {
  getMemoryStats,
  listCounterparties,
  recallContext,
  resetCounterparty,
  rememberInsight,
} from "@/lib/sibyl";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const counterpartyId = searchParams.get("counterpartyId");

    const stats = await getMemoryStats();
    const counterparties = await listCounterparties();

    let specificCounterparty = null;
    if (counterpartyId) {
      specificCounterparty = await recallContext(counterpartyId);
    }

    return NextResponse.json({
      stats,
      counterparties,
      specificCounterparty,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error consulting Sibyl Memory", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, counterpartyId, seedType } = body;

    if (action === "reset" && counterpartyId) {
      const res = await resetCounterparty(counterpartyId);
      return NextResponse.json(res);
    }

    if (action === "seed" && counterpartyId) {
      // Seed realistic negotiation profiles for the demo video
      let seedPayload: any = {
        name: counterpartyId,
        insights: [
          "They usually start by offering 35% below the target price to unsettle the other party.",
          "They concede between 8% and 12% in each counteroffer if the agent does not come down from their floor price.",
          "Historically, they have accepted deals around $13,200 in previous contracts."
        ],
        concession_pattern: "MODERATE_RESISTANT",
        estimated_reservation_price: 13500,
        trust_score: 72,
        deal_closed: false,
        action: "INITIAL_SEED",
        offer: 10500,
        agent_response: "Profile preloaded in Sibyl Memory.",
        timestamp: new Date().toISOString(),
      };

      if (seedType === "lowballer") {
        seedPayload = {
          name: "Titan Procurement (Aggressive Lowballer)",
          insights: [
            "RECURRING TACTIC: Starts with ridiculously low offers (<$9,000) aiming to break psychological resistance.",
            "If the agent holds firm during the first round, they suddenly raise their offer by 25%.",
            "Hidden reserve price detected in a previous session: $12,800."
          ],
          concession_pattern: "EXTREMELY_AGGRESSIVE",
          estimated_reservation_price: 12800,
          trust_score: 45,
          deal_closed: false,
          action: "INITIAL_SEED",
          offer: 8500,
          agent_response: "Aggressive buyer profile.",
          timestamp: new Date().toISOString(),
        };
      } else if (seedType === "partner") {
        seedPayload = {
          name: "Apex Global Tech (Strategic Partner)",
          insights: [
            "Collaborative negotiator: respects fair margins for mutual benefit.",
            "Willing to close the deal if the final discount falls within 5–8% of the target.",
            "Clean payment record; high-value, long-term business relationship.",
          ],
          concession_pattern: "HIGH_COLLABORATION",
          estimated_reservation_price: 14200,
          trust_score: 95,
          deal_closed: true,
          action: "INITIAL_SEED",
          offer: 13800,
          agent_response: "Profile of a prospective cooperative partner.",
          timestamp: new Date().toISOString(),
        };
      }

      const res = await rememberInsight(counterpartyId, seedPayload);
      return NextResponse.json({ status: "success", seeded: true, entity: res.entity });
    }

    return NextResponse.json({ error: "Unrecognized action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error modifying Sibyl memory", details: error.message },
      { status: 500 }
    );
  }
}
