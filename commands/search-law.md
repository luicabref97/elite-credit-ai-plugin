---
description: Search the 756-chunk FCRA/FDCPA/state-law legal knowledge base by query and category
---

Search the Elite Credit AI **756-chunk legal knowledge base** for credit law information across 17 federal laws and 5 state laws, plus jurisprudence and dispute frameworks.

If no query is provided, ask the user what they want to search for.

## Execution

If the Elite Credit API is connected (MCP server `elite-credit-api`):

```
POST /api/rag/search
Authorization: Bearer <ELITE_CREDIT_API_KEY>
Content-Type: application/json

{
  "query": "<user's search>",
  "categories": ["LEGAL_INTERPRETATION", "JURISPRUDENCE"],   // optional
  "top_k": 20
}
```

Rate limit: 120/min.

The API uses TF-IDF with pre-computed L2-normalized cosine similarity (~1-3 ms per query). It always prepends a 9-chunk fixed pack (foundational consumer-law context) and then appends top_k TF-IDF results.

## Valid Categories (13)

| Category | When to use |
|----------|-------------|
| `LEGAL_INTERPRETATION` | "What does the law say about X?" — the 17 federal + 5 state laws interpreted in Spanish |
| `JURISPRUDENCE` | "What court cases support X?" — federal court rulings |
| `LEGAL` | Pure legal-text excerpts (statutes verbatim) |
| `STRATEGY` | Operational playbooks per negative type |
| `EXECUTION` | Step-by-step execution guides |
| `SEQUENCE` | Round 1 → 2 → 3 sequencing logic |
| `LETTER_TEMPLATE` | Per-letter scaffolds (round 1/2/3, validation, etc.) |
| `LETTER_FRAMEWORK` | Raiyan / DAMAGES-FACTS-PENALTY / SoyDA structures |
| `DUAL_STATUTE` | FCRA + FDCPA combined claim approach |
| `DAMAGES` | Damages calculation per statute |
| `EDUCATION` | Educational primers (scoring, basics, Spanish-language guides) |
| `METHODOLOGY` | Methodologies (Raiyan, MDP/SoyDA, dual-statute) |
| `TECHNICAL` | Layer 2 / Metro2 technical references |

If no API is connected, use Claude's general FCRA / FDCPA knowledge to answer the legal question and note that more detailed citations are available when the API is connected.

## Example Queries (with category recommendations)

| User asks (Spanish or English) | Recommended query / categories |
|--------------------------------|--------------------------------|
| "Que dice la FCRA sobre cuentas mas de 7 anos?" | query: "FCRA 605 obsolescence 7 years"; categories: `["LEGAL_INTERPRETATION"]` |
| "Como me defiendo si un colector me llama de mas?" | query: "Reg F 7 in 7 cap call frequency"; categories: `["LEGAL_INTERPRETATION", "STRATEGY"]` |
| "Hay caso federal sobre re-aging?" | query: "DOFD changed re-aging case law"; categories: `["JURISPRUDENCE", "LEGAL"]` |
| "Cuanto puedo recuperar si gano una demanda FCRA?" | query: "FCRA 616 617 statutory damages"; categories: `["DAMAGES", "JURISPRUDENCE"]` |
| "Como disputo una coleccion medica en California?" | query: "California medical debt SB 1061 dispute"; categories: `["LEGAL_INTERPRETATION", "STRATEGY"]` |
| "Plantilla de carta para cease and desist a cobrador" | query: "cease desist FDCPA 1692c"; categories: `["LETTER_TEMPLATE", "LETTER_FRAMEWORK"]` |
| "Como funciona FICO 8 con colecciones pagadas?" | query: "FICO 8 paid collections threshold $100"; categories: `["EDUCATION"]` |
| "Que dice Texas sobre recoger DOFD?" | query: "Texas Finance Code 392.307 DOFD reset"; categories: `["LEGAL_INTERPRETATION"]` |
| "Que es el framework Raiyan?" | query: "Raiyan DAMAGES FACTS PENALTY"; categories: `["METHODOLOGY", "LETTER_FRAMEWORK"]` |

## Output

For each result:

- `chunk_id`
- `category`
- `topics` (list of tags)
- `source` (the vault `source_id`)
- `content` excerpt

The full response includes `total_results` and `fixed_pack_included` (count of fixed-pack chunks that survived deduplication).

## Note on language

Most chunks are in Spanish (`language: ES` in the vault frontmatter). Some EDUCATION and TECHNICAL chunks are in English. The TF-IDF index works on both languages — query in whichever the consumer is using and the search returns relevant chunks regardless of language.
