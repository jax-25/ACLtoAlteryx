# ACLtoAlteryx

## Run Locally
ACLtoAlteryx converts legacy Audit Command Language (ACL) scripts into fully
documented Alteryx workflows. It automates translation, validation, and
documentation so audit teams can modernize analytics without months of manual
rebuilds.

**Prerequisites:**  Node.js
---

## Product Overview

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
<p align="center">
  <img src="https://github.com/user-attachments/assets/9511fdcd-93c7-4fe4-8989-398cc9924f17" alt="ACLtoAlteryx application interface" width="900">
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/4f662d40-dd3b-4370-a372-0d888fccde63" alt="Generated Alteryx workflow and results" width="900">
</p>

---

## Purpose

Audit organizations often maintain large libraries of ACL scripts that encode
years of institutional knowledge but are difficult to maintain, review, or
extend. Rebuilding these scripts as visual analytics workflows typically
requires substantial analyst time and introduces additional risk.

ACLtoAlteryx treats ACL as a source language and Alteryx as a target runtime,
providing a controlled, repeatable conversion path that preserves logic,
documentation, and audit traceability.

---

## Capabilities

- Ingests existing ACL scripts without requiring refactoring
- Converts ACL logic into a structured JSON specification
- Generates fully wired Alteryx `.yxmd` workflows
- Produces human-readable documentation for each analytic step
- Supports optional validation checks on generated workflows

---

## Architecture

1. ACL scripts are parsed and normalized into a JSON-based intermediate
   representation
2. The normalized model is used to construct Alteryx workflows with explicit
   tool configurations and connections
3. Documentation is generated alongside the workflow to support audit review
4. Optional validation steps confirm workflow integrity and expected outputs

---

## Technology

- Frontend: Next.js, React, TypeScript
- Backend: Node.js API routes
- Language understanding: Google Gemini
- Outputs: JSON specifications and Alteryx `.yxmd` workflows

---

## Running Locally

### Requirements

- Node.js (LTS)
- Gemini API key

### Setup

```bash
git clone https://github.com/jax-25/ACLtoAlteryx.git
cd ACLtoAlteryx
npm install
