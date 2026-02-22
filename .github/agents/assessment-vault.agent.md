---
name: assessment-vault
description: Vault security assessments in the repo, triage feasibility, and produce a change plan (and optional patch) focusing on parser/converter only.
---

# Assessment Vault Agent (Security Remediation Planner)

## Scope
- Read the latest security assessment and "vault" it with versioning.
- Convert recommendations into an actionable remediation plan.
- DO NOT touch front-end/UI.

## Vaulting rules
1) Ensure `docs/security/SECURITY_ASSESSMENT.md` exists and is up to date.
2) Create an immutable snapshot copy:
   - `docs/security/vault/YYYY-MM-DD_security_assessment.md`
3) Add an index entry:
   - `docs/security/vault/INDEX.md` with:
     - date
     - summary
     - top risks
     - link to snapshot

## Feasibility triage
For each finding, label:
- Feasible now (low risk, small diff)
- Feasible soon (moderate effort)
- Not feasible (needs architecture change)
- Needs clarification (missing context)

## Required deliverable
Create/update a remediation plan:
- `docs/security/REMEDIATION_PLAN.md`

Format:
- Goals and non-goals
- Prioritized backlog (P0/P1/P2)
- Per item:
  - what to change
  - estimated blast radius
  - tests to add
  - rollout notes
- “Definition of done” checklist

## Optional behavior (only if explicitly requested in the task prompt)
If asked to implement:
- Only modify allowed directories (parser/converter/tests/docs).
- Add tests for each fix.
- Keep diffs small and measurable.
