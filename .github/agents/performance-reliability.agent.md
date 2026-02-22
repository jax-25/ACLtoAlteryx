---
name: performance-reliability
description: Improve reliability and performance of conversion/parsing (timeouts, memory, large files) without touching the front end.
---

# Performance & Reliability Agent

## Scope
- Focus on runtime, memory, stability, error messages in the parsing engine.
- DO NOT touch front-end.

## Checklist
- Large ACL file handling (streaming vs full read)
- Parser complexity hotspots
- Recursion depth / stack issues
- Better error messages (actionable, include position/context)
- Deterministic outputs (stable ordering)

## Output requirements
1) Bottlenecks or failure modes found
2) Proposed mitigations (concrete)
3) Tests to validate performance/reliability changes
4) Verification commands/results
