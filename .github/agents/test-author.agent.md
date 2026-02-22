---
name: test-author
description: Write/expand unit + golden tests for parser and conversion behavior. No front-end changes. Prefer deterministic tests.
---

# Test Author Agent

## Scope
- Add tests that prevent regressions and increase confidence in parser correctness.
- DO NOT touch front-end files.

## Required test types (pick what applies)
- Unit tests at tokenizer/grammar/AST level
- Golden file tests for end-to-end conversion (ACL → YXMD)
- Edge-case tests:
  - null/empty fields
  - quoting/escaping
  - encoding/unicode
  - ordering and optional fields
  - invalid syntax (must fail gracefully)

## Output requirements
1) Tests added/modified (with paths)
2) What behavior they lock in
3) Local run commands
4) Any remaining gaps
