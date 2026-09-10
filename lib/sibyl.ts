import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

const SIBYL_PYTHON =
  process.env.SIBYL_PYTHON_PATH ||
  path.join(os.homedir(), ".sibyl-memory/venv/bin/python");

const BRIDGE_SCRIPT = path.join(process.cwd(), "scripts", "sibyl_bridge.py");

export interface CounterpartyEntity {
  name: string;
  type?: string;
  insights: string[];
  history?: Array<{
    turn: number;
    offer: number;
    agentPrice: number;
    action: string;
    timestamp: string;
  }>;
  concession_pattern?: string;
  estimated_reservation_price?: number | null;
  trust_score?: number;
  total_deals_closed?: number;
  last_interaction?: string;
}

export interface SibylRecallResult {
  status: "success" | "error";
  found: boolean;
  counterparty_id: string;
  entity: CounterpartyEntity | null;
  metadata?: {
    created_at?: string;
    updated_at?: string;
  };
  recent_events?: Array<{
    ts?: string;
    acted?: any;
    extra?: any;
  }>;
  message?: string;
}

export interface SibylStatsResult {
  status: "success" | "error";
  tenant_id?: string;
  tier?: string;
  db_path?: string;
  db_size_bytes?: number;
  counterparty_count?: number;
  error?: string;
}

async function runBridge(args: string[]): Promise<any> {
  try {
    const { stdout } = await execFileAsync(SIBYL_PYTHON, [BRIDGE_SCRIPT, ...args], {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5,
    });
    return JSON.parse(stdout.trim());
  } catch (error: any) {
    console.error(`[SibylBridge Error] Command args: ${args.join(" ")}`, error);
    return {
      status: "error",
      message: error.message || String(error),
      fallback: true,
    };
  }
}

export async function recallContext(counterpartyId: string): Promise<SibylRecallResult> {
  const result = await runBridge(["recall", counterpartyId]);
  if (result.status === "error") {
    return {
      status: "error",
      found: false,
      counterparty_id: counterpartyId,
      entity: null,
      recent_events: [],
      message: result.message,
    };
  }
  return result as SibylRecallResult;
}

export async function rememberInsight(
  counterpartyId: string,
  payload: {
    name?: string;
    insights?: string[];
    turn?: {
      turn: number;
      offer: number;
      agentPrice: number;
      action: string;
      timestamp: string;
    };
    concession_pattern?: string;
    estimated_reservation_price?: number;
    trust_score?: number;
    deal_closed?: boolean;
    action?: string;
    offer?: number;
    agent_response?: string;
    timestamp?: string;
  }
): Promise<any> {
  const payloadStr = JSON.stringify(payload);
  return await runBridge(["remember", counterpartyId, payloadStr]);
}

export async function listCounterparties(): Promise<any[]> {
  const res = await runBridge(["list"]);
  return res.counterparties || [];
}

export async function getMemoryStats(): Promise<SibylStatsResult> {
  const res = await runBridge(["stats"]);
  return res;
}

 // Reset a counterparty's memory
export async function resetCounterparty(counterpartyId: string): Promise<any> {
  return await runBridge(["reset", counterpartyId]);
}

export function formatMemoryContextForPrompt(memory: SibylRecallResult): string {
  if (!memory.found || !memory.entity) {
    return `[SIBYL MEMORY: COLD-START NEW COUNTERPARTY]
- Esta contraparte es COMPLETAMENTE NUEVA en Sibyl Memory.
- Sin antecedentes previos de regateo o precios de reserva.
- Recomendación Táctica: Proceder con cautela, testear elasticidad con una primera contraoferta cercana al Precio Objetivo.`;
  }

  const { entity, recent_events } = memory;
  const insightsList =
    entity.insights && entity.insights.length > 0
      ? entity.insights.map((ins, i) => `  ${i + 1}. ${ins}`).join("\n")
      : "  - Sin notas cualitativas previas.";

  const reservation = entity.estimated_reservation_price
    ? `$${entity.estimated_reservation_price}`
    : "Desconocido (aún no revelado)";

  const pattern = entity.concession_pattern || "No clasificado";
  const trust = entity.trust_score ?? 50;
  const dealsClosed = entity.total_deals_closed ?? 0;

  let journalSummary = "  - Sin eventos recientes en el diario de Sibyl.";
  if (recent_events && recent_events.length > 0) {
    journalSummary = recent_events
      .map((ev, i) => {
        const act = ev.acted || {};
        return `  ${i + 1}. [${act.action || "EVENTO"}] Oferta: $${act.offer ?? "N/A"}, Resp: ${act.agent_response ?? "N/A"}`;
      })
      .join("\n");
  }

  return `[SIBYL MEMORY ENGINE: RECUERDO AUTORITATIVO (LOAD-BEARING)]
- Nombre Contraparte: ${entity.name || memory.counterparty_id}
- Tasa / Patrón de Concesión Histórico: ${pattern}
- Precio de Reserva Estimado (Punto de quiebre de la contraparte): ${reservation}
- Nivel de Confianza (0-100): ${trust} / 100 (Tratos previos cerrados: ${dealsClosed})
- PATRONES ESTRATÉGICOS APRENDIDOS EN SESIONES PREVIAS:
${insightsList}
- ÚLTIMOS EVENTOS REGISTRADOS EN SIBYL COLD-TIER JOURNAL:
${journalSummary}

INSTRUCCIÓN CRÍTICA DE MEMORIA:
Utiliza estos antecedentes recuperados para ajustar tu contraoferta. Si la contraparte suele ceder ante firmeza, no te apresures a bajar el precio. Si previamente intentó anclar precios bajos o retractarse de concesiones, recuérdaselo tácticamente en tu razonamiento.`;
}
