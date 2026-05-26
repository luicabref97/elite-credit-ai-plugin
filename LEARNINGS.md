# Elite Credit AI Plugin — Learnings Log

Every error corrected during development is documented here so agents and developers avoid repeating mistakes.
This follows Boris Cherny's agentic context engineering principle: auto-improvement via persistent error memory.

## Format

```
### [CATEGORY] Short description
- **Error:** What went wrong
- **Where:** File and line (or component)
- **Fix:** How it was corrected
- **Root cause:** Why it happened
- **Date:** YYYY-MM-DD
```

Categories: `[VALIDATION]`, `[FRONTMATTER]`, `[ARCHITECTURE]`, `[MCP]`, `[CONTENT]`

---

## Log

### [VALIDATION] Plugin failed Cowork validation — invalid color "gold"
- **Error:** Plugin installation in Cowork failed with validation error
- **Where:** `agents/credit-forensic-analyst.md` frontmatter
- **Fix:** Changed `color: gold` to `color: yellow`. Valid colors: blue, cyan, green, yellow, magenta, red
- **Root cause:** Brand color "gold" is not a valid Cowork agent color. Cowork only accepts 6 predefined colors.
- **Date:** 2026-03-27

### [FRONTMATTER] Skills rejected name and version fields
- **Error:** Plugin validation failed — skills had `name` and `version` in frontmatter
- **Where:** All 8 `skills/*/SKILL.md` files
- **Fix:** Removed `name` and `version` from all skill frontmatter. Only `description` is valid for plugin skills.
- **Root cause:** Assumed skill frontmatter matched Claude Code local skill format. Plugin skills have stricter rules — only `description`, `disable-model-invocation`, and `user-invocable` are valid.
- **Date:** 2026-03-29

### [FRONTMATTER] Agent tools must be comma-separated string, not JSON array
- **Error:** Plugin validation failed — agents had `tools: ["Read", "Write", "Bash"]`
- **Where:** All 3 `agents/*.md` files
- **Fix:** Changed to `tools: Read, Write, Bash` (comma-separated string)
- **Root cause:** Used JSON array syntax instead of YAML string format required by Cowork plugin validator.
- **Date:** 2026-03-29

### [FRONTMATTER] Commands only accept description field
- **Error:** Commands had `allowed-tools` and `model` fields that are not valid
- **Where:** All 5 `commands/*.md` files
- **Fix:** Removed `allowed-tools` and `model`. Only `description` is valid for plugin commands.
- **Root cause:** Confused Claude Code local command format (which may accept more fields) with plugin command format (strictly description only).
- **Date:** 2026-03-29

### [CONTENT] Local file paths in plugin files
- **Error:** Skills and commands referenced `backend/app/data/...` and `backend/app/services/layer2/config/...` which don't exist in the plugin
- **Where:** `commands/credit-qa.md`, `skills/metro2-transformer/SKILL.md`, `skills/credit-law-rag/references/key-statutes.md`, `skills/ui-ux-credit/SKILL.md`
- **Fix:** Replaced all local paths with API calls (`POST /api/rag/search`, `POST /api/audit/run`) or generic references
- **Root cause:** Plugin files were initially copied from local project skills which referenced the SaaS project structure. Plugin must be project-independent.
- **Date:** 2026-03-29

### [MCP] Cowork connector OAuth form unable to render fields when WWW-Authenticate lookup fails silently
- **Error:** User tried to install the elite-credit-api connector in Cowork. Form fields (Client ID, Client Secret) were not editable. Error: "Couldn't reach the MCP server. ... share this reference with support: 'ofid_*'". Identical fingerprint each time.
- **Where:** Cowork connector UI (upstream) interacting with `https://elite-credit-api-production.up.railway.app/mcp`
- **Fix:** Removed `Depends(verify_api_key)` from /mcp on the API side (see API repo ADR-011). Plugin connector now connects without OAuth handshake (the auth fields are present but functionally bypassed at the server). Documented in `docs/REENABLE_MCP_AUTH.md` in API repo with re-enable playbook.
- **Root cause:** Anthropic's claude.ai client does case-sensitive lookup of `WWW-Authenticate` header. HTTP/2 lowercases header names per RFC 7540 §8.1.2. Server emitted `WWW-Authenticate: Bearer ...` correctly; HTTP/2 framing converted to `www-authenticate: ...`; claude.ai's lookup missed it → OAuth discovery silently aborted → connector form's network layer failed → fields rendered un-editable. Issue: https://github.com/anthropics/claude-ai-mcp/issues/219.
- **Date:** 2026-05-09

### [VERSIONING] Plugin v3.2.0 release notes announced auth re-enable; v3.2.1 had to retract it
- **Error:** Bumped plugin to v3.2.0 with release notes "Bearer auth re-enabled on /mcp now that anthropics/claude-ai-mcp #219 is fixed". Within hours, user's actual Cowork install hit the same OAuth failure as before — rolled back API auth + had to issue v3.2.1 hotfix.
- **Where:** `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` version fields + git commit messages
- **Fix:** v3.2.1 release notes explicitly retract v3.2.0's claim: "rollback hotfix, /mcp back to no-auth pending broader Anthropic fix". This establishes the pattern: when a release retracts a prior release, the new release notes must explicitly mention the retraction (don't just bump and hope users figure it out from changelog).
- **Root cause:** Trusted a third-party "FIXED IT" post on GitHub issue #219 + a successful HTTP/2 OAuth trace from that tester. Did NOT verify against the user's actual Cowork install before bumping. The "fix" was partial — worked for some Cowork/Desktop versions but not all. Strengthened re-enable gate (4 conditions, see API repo ADR-012) to require direct user-install verification.
- **Date:** 2026-05-12

### [AGENT] dispute-strategist needs explicit category filters for new Raiyan vault chunks
- **Error:** After integrating Raiyan books (756 chunks across 17 categories), the dispute-strategist agent was previously aware of 11 categories. New categories (LETTER_WRITING_TACTICS, DIRECT_DISPUTES, DISTRIBUTION, PER_ACCOUNT_FLOWS, LETTER_REFRESH, DISPUTE_TIMING) wouldn't surface in rag_search without explicit category filtering hints.
- **Where:** `skills/dispute-strategist/SKILL.md` § Knowledge Base Access
- **Fix:** Updated the "Useful category filters" list in dispute-strategist with all 6 new categories + descriptions. Each agent that queries the RAG must keep its category awareness in sync with what `sync_vault.py` actually emits.
- **Root cause:** RAG categories are emitted by the API (via frontmatter in vault notes) but consumed by agents that hardcode category filter knowledge. Mismatch silently degrades search relevance. Fix pattern: any vault category change requires a parallel update to dispute-strategist's Knowledge Base Access list (and any other agent that uses category filters).
- **Date:** 2026-05-25

### [AGENT] Letter Composition Recipe needs structured pre-outline before generation
- **Error:** dispute-letter-generator was generating letters end-to-end in single pass. With 21 new tactical techniques in the RAG (7 openings, 4 facts, 6 closings, Heavy Metal sub-techniques, etc.), single-pass generation became incoherent — picked random techniques instead of round-appropriate ones, missed personalization, skipped consumer statement.
- **Where:** `agents/dispute-letter-generator.md` — new "## LETTER COMPOSITION RECIPE" section
- **Fix:** Appended Letter Composition Recipe section with structured pre-outline YAML template (per `vault/metodologia/pre-outline-technique.md`) + Round-Specific Opening/Closing Selection matrix + Style Guardrails (Plain English mandatory rules). Agent now picks techniques BEFORE composing, validates pre-outline against round number, then expands into letter draft.
- **Root cause:** Raiyan's full tactical toolkit requires SELECTION among many options per section (which opening of 7, which closing of 6, which damage chain center, which LOL signals, etc.). Without explicit selection-then-expand workflow, the agent defaults to picking the first option in the RAG retrieval results, which often isn't the round-appropriate choice. Pre-outline forces premeditated selection.
- **Date:** 2026-05-25

### [AGENT] CFPB timing rules differ for direct collector disputes vs CRA disputes
- **Error:** Initial Synchronized Distribution policy (CFPB 7-14d after mail) applies to CRA disputes. For DIRECT disputes to debt collectors (Big 3 strategy), the timing is different — CFPB is the PRIMARY channel filed Day 1, no mail.
- **Where:** `skills/dispute-strategist/SKILL.md` § Operational Policy + `agents/dispute-letter-generator.md` § rules
- **Fix:** Documented the exception in both files: "Direct disputes to debt collectors are the exception to the gap timing: CFPB is the PRIMARY channel filed Day 1 (no mail). Collectors evade certified mail. See big-3-debt-collector-strategy.md." Agent must check account type before applying Synchronized Distribution.
- **Root cause:** Two distinct channels (CRA dispute vs direct-to-collector dispute) require different optimal timing. Conflating them led to suggesting mail-first for direct disputes (which collectors evade by returning certified mail). Explicit per-channel timing rules avoid the confusion.
- **Date:** 2026-05-25
