#!/usr/bin/env python3
"""
Sibyl Memory Engine Python Bridge.
Executed by Node.js backend using Sibyl's virtualenv Python.
Communicates via JSON stdin/stdout.
"""

import sys
import json
import os
from pathlib import Path

# Ensure UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

try:
    from sibyl_memory_mcp.server import _open_client
except ImportError:
    try:
        from sibyl_memory_client import MemoryClient
        _open_client = lambda: MemoryClient.local("~/.sibyl-memory/memory.db")
    except Exception as e:
        sys.stderr.write(f"Failed to import Sibyl: {e}\n")
        sys.exit(1)


def get_client():
    return _open_client()


def cmd_recall(counterparty_id: str):
    client = get_client()
    try:
        entity = client.get_entity("counterparty", counterparty_id)
        # Read recent journal events for this counterparty
        all_events = client.read_events(limit=20)
        counterparty_events = [
            ev for ev in all_events
            if isinstance(ev.get("extra"), dict) and ev["extra"].get("name") == counterparty_id
        ]
        return {
            "status": "success",
            "found": True,
            "counterparty_id": counterparty_id,
            "entity": entity.get("body") if entity else None,
            "metadata": {
                "created_at": entity.get("created_at") if entity else None,
                "updated_at": entity.get("updated_at") if entity else None,
            },
            "recent_events": counterparty_events[:5]
        }
    except Exception as e:
        # If not found or error
        return {
            "status": "success",
            "found": False,
            "counterparty_id": counterparty_id,
            "entity": None,
            "recent_events": [],
            "message": str(e)
        }


def cmd_remember(counterparty_id: str, payload: dict):
    client = get_client()
    # Fetch existing entity body to merge
    try:
        existing = client.get_entity("counterparty", counterparty_id)
        current_body = existing.get("body", {}) if existing else {}
    except Exception:
        current_body = {}

    # Merge insights
    existing_insights = current_body.get("insights", [])
    new_insights = payload.get("insights", [])
    if isinstance(new_insights, str):
        new_insights = [new_insights]
    for ins in new_insights:
        if ins and ins not in existing_insights:
            existing_insights.append(ins)

    # Merge history / concessions
    history = current_body.get("history", [])
    if "turn" in payload:
        history.append(payload["turn"])

    updated_body = {
        "name": payload.get("name", current_body.get("name", counterparty_id)),
        "type": payload.get("type", current_body.get("type", "standard")),
        "insights": existing_insights,
        "history": history[-15:],  # keep last 15 turns
        "concession_pattern": payload.get("concession_pattern", current_body.get("concession_pattern", "UNKNOWN")),
        "estimated_reservation_price": payload.get("estimated_reservation_price", current_body.get("estimated_reservation_price", None)),
        "trust_score": payload.get("trust_score", current_body.get("trust_score", 50)),
        "total_deals_closed": current_body.get("total_deals_closed", 0) + (1 if payload.get("deal_closed") else 0),
        "last_interaction": payload.get("timestamp", None)
    }

    client.set_entity("counterparty", counterparty_id, updated_body)

    # Record event in cold-tier journal
    try:
        client.write_event(
            acted={
                "action": payload.get("action", "NEGOTIATE_ROUND"),
                "offer": payload.get("offer"),
                "agent_response": payload.get("agent_response"),
                "insight": new_insights[-1] if new_insights else None
            },
            extra={"category": "counterparty", "name": counterparty_id}
        )
    except Exception as e:
        sys.stderr.write(f"Warning writing event to journal: {e}\n")

    return {
        "status": "success",
        "saved": True,
        "counterparty_id": counterparty_id,
        "entity": updated_body
    }


def cmd_list():
    client = get_client()
    try:
        entities = client.list_entities("counterparty")
        result = []
        for ent in entities:
            result.append({
                "id": ent.get("name"),
                "body": ent.get("body", {}),
                "updated_at": ent.get("updated_at")
            })
        return {"status": "success", "counterparties": result}
    except Exception as e:
        return {"status": "error", "message": str(e), "counterparties": []}


def cmd_stats():
    client = get_client()
    tenant = getattr(client, "tenant_id", None)
    if tenant is None and hasattr(client, "get_tenant"):
        tenant = client.get_tenant()
    tier = getattr(client, "tier", None)
    if tier is None and hasattr(client, "get_tier"):
        tier = client.get_tier()
    
    db_path = str(getattr(client.storage, "path", "~/.sibyl-memory/memory.db"))
    db_size = 0
    expanded_path = os.path.expanduser(db_path)
    if os.path.exists(expanded_path):
        db_size = os.path.getsize(expanded_path)

    # Count entities
    count = 0
    try:
        entities = client.list_entities("counterparty")
        count = len(entities)
    except Exception:
        pass

    return {
        "status": "success",
        "tenant_id": tenant,
        "tier": tier or "stake",
        "db_path": db_path,
        "db_size_bytes": db_size,
        "counterparty_count": count
    }


def cmd_reset(counterparty_id: str):
    client = get_client()
    try:
        client.delete_entity("counterparty", counterparty_id)
        return {"status": "success", "deleted": True, "counterparty_id": counterparty_id}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "recall":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Missing counterparty_id"}))
            sys.exit(1)
        res = cmd_recall(sys.argv[2])
        print(json.dumps(res, ensure_ascii=False))

    elif cmd == "remember":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Missing counterparty_id or payload"}))
            sys.exit(1)
        try:
            payload = json.loads(sys.argv[3])
        except Exception as e:
            print(json.dumps({"error": f"Invalid JSON payload: {e}"}))
            sys.exit(1)
        res = cmd_remember(sys.argv[2], payload)
        print(json.dumps(res, ensure_ascii=False))

    elif cmd == "list":
        res = cmd_list()
        print(json.dumps(res, ensure_ascii=False))

    elif cmd == "stats":
        res = cmd_stats()
        print(json.dumps(res, ensure_ascii=False))

    elif cmd == "reset":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Missing counterparty_id"}))
            sys.exit(1)
        res = cmd_reset(sys.argv[2])
        print(json.dumps(res, ensure_ascii=False))

    else:
        print(json.dumps({"error": f"Unknown command: {cmd}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
