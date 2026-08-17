# Decisions — <feature>

Status: open | drained

The interrogation. The agent asks. The human answers. The agent does not write the feature here.

Its job is to find the questions the human has not asked. Keep going until the agent runs out.
Twenty minutes is normal.

**This file is drained at the DECIDE stage.** Each answer that had more than one defensible
option becomes an ADR. After that, nobody reads this file again. That is success, not waste.

---

## Questions

**Q:** <question>
**A:** <answer>

**Q:** <follow-up that the answer opened>
**A:** <answer>

---

## Good questions to ask on any feature

- Who is authoritative for this data if two systems can write it?
- What happens on the reversal path — cancel, refund, expire, undo?
- What does a user see when this fails halfway?
- Can two people do this at the same time? What should happen?
- Is anything held or reserved? For how long? What releases it?
- What is locked at the time of the action, and what is recomputed later?
- What must never happen, at any cost?
- What is explicitly out of scope, and who decided that?

---

## Drained to

| Answer | Became |
|---|---|
| <answer> | ADR-NNNN |
| <answer> | SSOT rule XX-N |
| <answer> | out of scope, recorded in the SSOT boundaries section |
