# Sibyl Autonomous Negotiator

A commercial negotiation agent that evaluates incoming offers, calculates tactical counter-proposals, and adapts its strategy based on accumulated knowledge of each counterparty across sessions.

The core mechanic is persistent memory. Before every negotiation turn, the agent retrieves the counterparty's behavioral profile from Sibyl Memory — concession velocity, estimated reservation price, historical bluff patterns. After each turn, it persists newly detected insights back to the same store. Without that retrieval step, the agent has no strategic context and negotiates blind, which is the intended behavior of the Litmus Test toggle in the interface.

## Architecture

The system has three layers that communicate in sequence on every negotiation turn.

**Frontend (Next.js App Router)** — A single-page dashboard with three panels: tactical parameter controls on the left (asset, target price, floor price, counterparty selection, aggression strategy), the live negotiation feed in the center where offers and counter-offers appear in sequence, and the Sibyl Memory Connectome on the right showing exactly what was recalled from persistent storage and what new insight was written after each turn.

**Negotiation Engine (Next.js API Routes)** — The `POST /api/negotiate` endpoint orchestrates each turn in three steps: call `recallContext` to load the counterparty profile from Sibyl Memory, send the tactical prompt with that context to Google Gemini (`gemini-2.5-flash`) requesting a structured JSON response, then call `rememberInsight` to persist the agent's new observations to Sibyl before returning the decision to the client.

**Memory Layer (Sibyl Memory Engine)** — A local SQLite database managed by `sibyl-memory-mcp`. Counterparty profiles are stored as entities under the category `counterparty`. Each negotiation round appends a cold-tier journal event via `write_event`. The `scripts/sibyl_bridge.py` script wraps the SDK and is invoked by the Node.js backend as a child process using the Sibyl virtualenv Python binary.

## Where Sibyl Memory is Load-Bearing

This section exists to satisfy the judge panel's two-minute lookup requirement.

**Read path:** `lib/sibyl.ts` → `recallContext()` → `scripts/sibyl_bridge.py recall <counterparty_id>` → `MemoryClient.get_entity("counterparty", id)` and `read_events(limit=20)`.

**Write path:** `lib/sibyl.ts` → `rememberInsight()` → `scripts/sibyl_bridge.py remember <counterparty_id> <json>` → `MemoryClient.set_entity(...)` and `MemoryClient.write_event(...)`.

**API integration point:** `app/api/negotiate/route.ts`, lines where `recallContext` is awaited before Gemini is called and `rememberInsight` is awaited after the decision is returned.

**Deletion test:** Remove the `recallContext` call in `route.ts`. The agent now receives no historical profile. It cannot account for the counterparty's documented tendency to lowball, their detected reservation price, or any concession pattern observed in prior sessions. The offer it generates is calibrated against the current offer only, with no tactical leverage. A counterparty who has been tested before and whose price ceiling is known gets the same treatment as a stranger.

## How Memory Made This Possible

A negotiation agent without memory is a calculator with opinions. It can apply a formula to the spread between target and floor, but it cannot reason about the specific person across the table.

With Sibyl Memory, the agent builds a persistent behavioral dossier on each counterparty. After three sessions with an aggressive lowballer, the agent has a documented pattern, an estimated reservation price derived from prior rounds, and a count of how many times firm resistance forced a concession. That knowledge does not live in the conversation context — it survives session termination and reappears on cold start, which is demonstrated in the demo video.

## Running Locally

Prerequisites: WSL2 Debian, Node.js via nvm, Bun, Sibyl Memory installed in `~/.sibyl-memory/venv`.

```bash
# Clone and install
git clone <repo>
cd sibyl-autonomous
npm install

# Set your Gemini API key (optional — heuristic engine runs without it)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start development server
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Litmus Test toggle in the header switches between Sibyl Memory active and stateless mode. Use it to demonstrate the behavioral difference that the Gate criterion requires.

## Seeding Demo Profiles

The interface includes two preset counterparty profiles that pre-populate Sibyl Memory with realistic behavioral data for the demo video:

- **Titan Procurement** — an aggressive lowballer with a documented pattern of opening 35% below target and conceding sharply when met with sustained resistance. Estimated reservation price: $12,800.
- **Apex Global Tech** — a cooperative partner with high concession velocity and a history of closed deals. Useful for demonstrating the acceptance path.

The `/api/memory` endpoint handles seeding, resetting, and inspecting stored profiles.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.4 (App Router) |
| Language | TypeScript, Python |
| Styles | Tailwind |
| Icons | react-icons v5 |
| LLM | Google Gemini via `@google/genai` v2.21 |
| Memory | Sibyl Memory Engine (`sibyl-memory-mcp`, `sibyl-memory-client`) |
| Memory Transport | Child process invoking `scripts/sibyl_bridge.py` via Sibyl virtualenv |
| Runtime | Node.js v22 / Bun 1.3 |

## License

MIT

## Prior Work Declaration

This project was built for the Sibyl Labs Hackathon (September 2026). No prior implementations of this negotiation agent exist. The Sibyl Memory integration follows the patterns documented at [docs.sibyllabs.org/memory/integrations](https://docs.sibyllabs.org/memory/integrations). All code in this repository was written during the hackathon period.
