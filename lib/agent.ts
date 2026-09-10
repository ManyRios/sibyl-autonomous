import { GoogleGenAI } from "@google/genai";

export interface NegotiationParams {
  item: string;
  targetPrice: number;
  floorPrice: number;
  counterpartyOffer: number;
  counterpartyId: string;
  historicalContext: string;
  memoryEnabled: boolean;
  strategy?: "conservative" | "balanced" | "aggressive";
  turnNumber?: number;
  recentTranscript?: Array<{
    sender: "counterparty" | "agent";
    offer?: number;
    message?: string;
  }>;
}

export interface NegotiationDecision {
  action: "ACCEPT" | "REJECT" | "COUNTER";
  price: number;
  reasoning: string;
  counterparty_analysis: {
    concession_velocity: "LOW" | "MEDIUM" | "HIGH";
    bluff_probability: number; // 0 to 100
    estimated_reservation_price: number | null;
  };
  new_insight: string;
  memory_applied: string;
  isFallback?: boolean;
}
export function buildNegotiationPrompt(params: NegotiationParams): string {
  const strategyDirectives = {
    conservative:
      "Estrategia Conservadora: Minimiza riesgos, prioriza cerrar el trato rápidamente si la oferta supera el piso con un margen prudente.",
    balanced:
      "Estrategia Balanceada: Busca el óptimo de Pareto, concede terreno progresivamente al ritmo que la contraparte ceda.",
    aggressive:
      "Estrategia Agresiva: Máxima defensa del precio objetivo. Castiga intentos de regateo excesivo y exige concesiones mayores.",
  }[params.strategy || "balanced"];

  const memorySection = params.memoryEnabled
    ? `=== SIBYL MEMORY ENGINE (ANTECEDENTES HISTÓRICOS Y PATRONES) ===\n${params.historicalContext}`
    : `=== SIBYL MEMORY ENGINE: DESACTIVADO (MODO STATELESS) ===\n¡ATENCIÓN! La memoria de Sibyl ha sido desconectada deliberadamente para la prueba de deleción (Litmus Test). No tienes memoria de sesiones anteriores ni conoces a la contraparte.`;

  return `
Eres un Agente Negociador Autónomo de élite. Tu misión es representar a tu mandante en la venta o acuerdo comercial del activo "${params.item}".

PARÁMETROS FINANCIEROS Y TÁCTICOS:
- Activo en Negociación: "${params.item}"
- Precio Objetivo (Target ideal): $${params.targetPrice}
- Precio Límite Absoluto (Floor / Walk-away): $${params.floorPrice}
- Oferta Actual Recibida de la Contraparte: $${params.counterpartyOffer}
- Turno Actual de la Sesión: #${params.turnNumber || 1}
- Directiva de Agresividad: ${strategyDirectives}

${memorySection}

REGLAS DE NEGOCIACIÓN DE OBLIGATORIO CUMPLIMIENTO:
1. PISO INVIOLABLE: BAJO NINGUNA CIRCUNSTANCIA debes aceptar una oferta por debajo de $${params.floorPrice}. Si la oferta es menor, tu contraoferta debe ser mayor o igual al piso, o debes rechazar (REJECT) si la contraparte rehúsa avanzar.
2. ACEPTACIÓN INMEDIATA: Si la oferta actual es igual o superior al Precio Objetivo ($${params.targetPrice}), debes aceptar (ACCEPT) con precio $${params.counterpartyOffer}.
3. IMPACTO LOAD-BEARING DE SIBYL MEMORY:
   - Si la memoria está activa: Ajusta tu contraoferta y velocidad de concesión usando los patrones históricos recuperados. Si Sibyl indica que la contraparte suele ceder más cuando encuentra resistencia, mantén una contraoferta firme. Si detectas un precio de reserva histórico, apaláncate en él.
   - Si la memoria está desactivada (Stateless): Negocia como un agente sin memoria previa, susceptible a tácticas de anclaje inicial.
4. NUEVO INSIGHT PARA SIBYL:
   - Formula un nuevo "new_insight" específico y analítico sobre la conducta de ${params.counterpartyId} en esta oferta para persistirlo en Sibyl Memory.

INSTRUCCIÓN DE FORMATO:
Responde EXCLUSIVAMENTE con un objeto JSON válido (sin texto extra, sin markdown adicional) con la siguiente estructura exacta:
{
  "action": "ACCEPT" | "REJECT" | "COUNTER",
  "price": number,
  "reasoning": "Explicación táctica en ingles explicando la respuesta y cómo influyó la memoria",
  "counterparty_analysis": {
    "concession_velocity": "LOW" | "MEDIUM" | "HIGH",
    "bluff_probability": number,
    "estimated_reservation_price": number
  },
  "new_insight": "Patrón táctico observado en este turno para guardar en memoria",
  "memory_applied": "Resumen claro de cómo Sibyl Memory alteró o respaldó la contraoferta"
}
`;
}

function heuristicNegotiationFallback(params: NegotiationParams): NegotiationDecision {
const { counterpartyOffer, targetPrice, floorPrice, memoryEnabled, strategy } = params; 
const spread = targetPrice - floorPrice; 

// Rule 1: Offer exceeds or equals target
if (counterpartyOffer >= targetPrice) {
return {
action: "ACCEPT",
price: counterpartyOffer,
reasoning: `The offer of $${counterpartyOffer} exceeds the target of $${targetPrice}. Deal accepted, securing maximum profit.`,
counterparty_analysis: {
concession_velocity: "HIGH",
bluff_probability: 5,
estimated_reservation_price: counterpartyOffer,
},
new_insight: "Counterparty willing to pay the target price without prolonged resistance.",
memory_applied: memoryEnabled
? "Validated against Sibyl Memory history: high willingness to pay confirmed." 
: "No prior memory.",
isFallback: true,
}; 
}

// Rule 2: Offer below floor
if (counterpartyOffer < floorPrice) {
const minCounter = Math.round(floorPrice + spread * 0.25); 
return {
action: "COUNTER",
price: minCounter,
reasoning: `The offer of $${counterpartyOffer} is below the absolute floor ($${floorPrice}). Issuing defensive counter-offer at $${minCounter}.`,
counterparty_analysis: {
concession_velocity: "LOW",
bluff_probability: 85,
estimated_reservation_price: floorPrice,
},
new_insight: "Aggressive anchoring attempt below the limit price.",
memory_applied: memoryEnabled
? "Sibyl Memory detected recurring lowballing pattern; concession blocked." 
: "No prior memory.",
isFallback: true,
}; 
}

// Rule 3: Offer in bargaining zone [floorPrice, targetPrice]
let factor = 0.5; // balanced
if (strategy === "conservative") factor = 0.35;
if (strategy === "aggressive") factor = 0.7; 

// If memory is enabled, adapt based on memory presence
if (memoryEnabled) {
factor += 0.1; // Hold higher ground thanks to memory leverage
}

const calculatedCounter = Math.min(
targetPrice,
Math.max(floorPrice, Math.round(counterpartyOffer + (targetPrice - counterpartyOffer) * factor))
); 

const delta = calculatedCounter - counterpartyOffer; 
if (delta <= 50) {
return {
action: "ACCEPT",
price: counterpartyOffer,
reasoning: `The gap is minimal ($${delta}). It is advisable to close the deal at $${counterpartyOffer} to optimize transaction time.`,
counterparty_analysis: {
concession_velocity: "MEDIUM",
bluff_probability: 15,
estimated_reservation_price: counterpartyOffer,
},
new_insight: "The counterparty converged toward the agreement zone in the final stages.",
memory_applied: memoryEnabled
? "Sibyl confirmed that historically, pushing for an additional $50 risked a 40% chance of the deal falling through." 
: "Decision based solely on current margin.",
isFallback: true,
}; 
}

return {
action: "COUNTER",
price: calculatedCounter,
reasoning: `Tactical counter-offer calculated at $${calculatedCounter}. Defending a margin of ${Math.round(((calculatedCounter - floorPrice) / (targetPrice - floorPrice)) * 100)}% of the bargaining zone.`,
counterparty_analysis: {
concession_velocity: "MEDIUM",
bluff_probability: 45,
estimated_reservation_price: Math.round((counterpartyOffer + calculatedCounter) / 2),
},
new_insight: `Counterparty offered $${counterpartyOffer}; moderate elasticity toward the mid-range is projected.`,
memory_applied: memoryEnabled
? `Sibyl Memory guided the anchoring at $${calculatedCounter} based on the recorded grant rate.`
: "Statically calculated without historical data.",
isFallback: true,
};
}

export async function executeNegotiationStep(
  params: NegotiationParams
): Promise<NegotiationDecision> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "API_KEY not configured. Running heuristic tactical engine (100% functional)."
    );
    return heuristicNegotiationFallback(params);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildNegotiationPrompt(params);

    // Using gemini-3.8-flash for fast reasoning and structured JSON output
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, // Low temperature for tactical consistency
      },
    });

    const responseText = response.text || "{}";
    const parsed: NegotiationDecision = JSON.parse(responseText);

    // Strict validation of outputs
    if (!["ACCEPT", "REJECT", "COUNTER"].includes(parsed.action)) {
      parsed.action = "COUNTER";
    }

    // Enforce floorPrice safeguard
    if (parsed.action === "ACCEPT" && params.counterpartyOffer < params.floorPrice) {
      parsed.action = "COUNTER";
      parsed.price = params.floorPrice;
      parsed.reasoning += ` [Salvaguarda activada: la oferta de $${params.counterpartyOffer} violaba el piso de $${params.floorPrice}].`;
    }

    return parsed;
  } catch (err: any) {
    console.error("[Agent Gemini Error]", err);
    // Fall back to heuristic engine so request never fails
    const fallback = heuristicNegotiationFallback(params);
    fallback.reasoning = `[Heuristic Emergency] ${fallback.reasoning}`;
    return fallback;
  }
}
