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
      { error: "Error consultando Sibyl Memory", details: error.message },
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
          "Suele comenzar ofertando 35% por debajo del precio objetivo para desestabilizar.",
          "Cede entre un 8% y 12% en cada contraoferta si el agente no baja del piso.",
          "Históricamente aceptó tratos en torno a $13,200 en contratos anteriores.",
        ],
        concession_pattern: "MODERADA_RESISTENTE",
        estimated_reservation_price: 13500,
        trust_score: 72,
        deal_closed: false,
        action: "INITIAL_SEED",
        offer: 10500,
        agent_response: "Perfil precargado en Sibyl Memory.",
        timestamp: new Date().toISOString(),
      };

      if (seedType === "lowballer") {
        seedPayload = {
          name: "Titan Procurement (Lowballer Agresivo)",
          insights: [
            "TÁCTICA RECURRENTE: Inicia con ofertas ridículamente bajas (<$9,000) buscando quebrar la resistencia psicológica.",
            "Si el agente se mantiene firme en la primera ronda, aumenta su oferta un 25% de golpe.",
            "Precio de reserva oculto detectado en sesión anterior: $12,800.",
          ],
          concession_pattern: "AGRESIVA_EXTREMA",
          estimated_reservation_price: 12800,
          trust_score: 45,
          deal_closed: false,
          action: "INITIAL_SEED",
          offer: 8500,
          agent_response: "Perfil sembrado de comprador agresivo.",
          timestamp: new Date().toISOString(),
        };
      } else if (seedType === "partner") {
        seedPayload = {
          name: "Apex Global Tech (Socio Estratégico)",
          insights: [
            "Negociador colaborativo: respeta márgenes justos de beneficio mutuo.",
            "Dispuesto a cerrar trato si el descuento final alcanza el 5-8% sobre target.",
            "Cumplimiento de pago impecable; relación comercial de alto valor a largo plazo.",
          ],
          concession_pattern: "COLABORATIVA_ALTA",
          estimated_reservation_price: 14200,
          trust_score: 95,
          deal_closed: true,
          action: "INITIAL_SEED",
          offer: 13800,
          agent_response: "Perfil sembrado de socio cooperativo.",
          timestamp: new Date().toISOString(),
        };
      }

      const res = await rememberInsight(counterpartyId, seedPayload);
      return NextResponse.json({ status: "success", seeded: true, entity: res.entity });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error modificando memoria de Sibyl", details: error.message },
      { status: 500 }
    );
  }
}
