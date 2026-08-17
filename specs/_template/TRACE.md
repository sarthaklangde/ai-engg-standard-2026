# Trace — <feature>

Status: draft | approved | shipped

A fake session log, written before the code exists. Real endpoints, real field names, real
values. No placeholders like `<id>` — write `bk_9k2`. Concrete values force real decisions.

**An agent drafts this in two minutes. A human reviews it for ten. The review is the point.**

Read every field name, every status code, every shape. Each one is a decision you accept or
reject. This is the cheapest checkpoint in the whole process.

---

## Flow: <the main happy path>

### 1. <what the user does>

```
GET /api/<resource>?<params>
→ 200
{ "field": "value" }
```

### 2. <the next step>

```
POST /api/<resource>
{ "field": "value" }
→ 201
{ "id": "abc_123", "status": "confirmed" }
```

### 3. <the observable effect>

```
GET /api/<resource>/abc_123
→ 200
{ "status": "confirmed" }
```

---

## Flow: <the reversal path>

Always trace the undo. Cancel, refund, expire, revert. Most bugs live here.

---

## Open blanks

List every place you could not write a concrete value. Sort each one into a kind.

| Blank | Kind | Action |
|---|---|---|
| what two simultaneous callers get | fact — do not know what would happen | probe it |
| whether the hold lives in a row or a cache | preference — do not know what we want | decide, write an ADR |

A trace with no open blanks is finished. Move to DECIDE.
