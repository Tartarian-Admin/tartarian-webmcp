# Tartarian.ai — WebMCP MMO Prototype

Native WebMCP integration for **Tartarian: The Old World**, a persistent 3D multiplayer simulation where ChatGPT can share the human operator's live browser session and act through the same authoritative world.

**Live application:** https://play.tartarian.ai  
**Demo video:** https://www.youtube.com/watch?v=pMOGRGImsEU  
**Challenge:** OpenAI WebMCP Challenge

> Judge login credentials are supplied privately through the Devpost submission. No credentials or magic-link tokens are stored in this repository.

## What this repository contains

Tartarian existed before the WebMCP Challenge. The broader game, simulation backend, database, authentication services, and autonomous-agent MCP service are not being open-sourced by this repository.

This repository contains the **WebMCP browser integration added for the challenge**, including the Site Tool definitions, the thin bridge into Tartarian's existing browser authorities, smoke tests, integration wiring, and the optional Tartarian operator `SKILL.md`.

The hosted Tartarian services used by the live demo are external dependencies.

## WebMCP Site Tools

The prototype exposes six semantic Site Tools from the signed-in Tartarian page:

- `tartarian_observe_world` — observe the current surrounding world
- `tartarian_read_inventory` — read the operator's authoritative Field Satchel inventory
- `tartarian_move` — request one legal adjacent movement step
- `tartarian_select_target` — focus an exact observed world target
- `tartarian_activate_target` — use the selected object's normal world interaction
- `tartarian_activate_command` — activate a prepared Command Bar action

The tools are registered through the browser's `document.modelContext` WebMCP interface.

## Architecture

```text
Human operator + ChatGPT
          |
          v
  live play.tartarian.ai page
          |
          v
  native WebMCP Site Tools
          |
          v
  Tartarian WebMCP bridge
          |
          v
existing browser/game authorities
          |
          v
authoritative hosted simulation
```

WebMCP does not create a second game state or bypass Tartarian's rules.

If movement is illegal, the simulation rejects it. If a resource is depleted, the agent must find another one. Inventory, movement, world interaction, and Command Bar actions remain governed by Tartarian's existing authority.

## Repository layout

```text
tartarian-webmcp/
├─ README.md
├─ LICENSE
├─ SKILL.md
├─ CONTEST_CHANGES.md
├─ package.json
├─ src/
│  └─ webmcp/
│     ├─ tartarian_webmcp_bridge.js
│     └─ tartarian_webmcp_tools.js
├─ integration/
│  └─ app_boot_webmcp_wiring.js
├─ scripts/
│  └─ webmcp_*_smoke.mjs
└─ docs/
   └─ WEBMCP_ARCHITECTURE.md
```

The exact exported smoke-test filenames may reflect the production challenge phases.

## Operator Skill

`SKILL.md` is optional.

The WebMCP tools work without it, but the Skill gives an agent concise Tartarian operating doctrine: movement is one adjacent step per call, selection is not activation, world interaction is distinct from Command Bar activation, inventory should be read from current state, and moving targets require fresh observation.

## Validation

The exported challenge code includes deterministic, fixture-driven smoke tests for the WebMCP bridge and Site Tool layer.

The tests cover the challenge surface without connecting to production secrets, user accounts, or private backend infrastructure.

See `package.json` and `scripts/` for the exported test commands.

## Existing project vs. challenge work

Tartarian's 3D browser client and persistent simulation existed before the challenge.

The native WebMCP browser layer, Site Tools, WebMCP interaction semantics, inventory read tool, lifecycle hardening, smoke coverage, and operator Skill were added during the WebMCP Challenge submission period.

See [`CONTEST_CHANGES.md`](CONTEST_CHANGES.md) for the phase-by-phase breakdown.

## Security and private infrastructure

This repository intentionally contains no:

- production `.env` files
- API keys or bearer tokens
- session cookies or magic-link tokens
- database credentials
- Railway secrets
- private simulation backend source
- private autonomous MCP service source
- judge credentials

The public browser integration talks to the same hosted Tartarian services used by the live application.

## License

The code in this repository is released under the [MIT License](LICENSE).

Tartarian game content, branding, lore, hosted services, and assets outside this repository remain subject to their existing rights and terms.
