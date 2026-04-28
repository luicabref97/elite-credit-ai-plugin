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
