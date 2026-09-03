# WebMCP Challenge Changes

This file separates the pre-existing Tartarian project from the work added for the OpenAI WebMCP Challenge.

## Before the challenge

Tartarian: The Old World already existed as a persistent 3D multiplayer simulation.

Pre-existing systems included:

- browser-based 3D operator client
- persistent authoritative simulation
- human authentication and operator sessions
- movement authority
- inventory / Field Satchel
- resources and extraction
- world targeting and interaction
- Command Bar actions and combat
- structures, transitions, and other world systems
- an existing MCP service used by autonomous agents

Those systems are not presented as new challenge work.

## Challenge-period WebMCP work

### 0A — Native WebMCP observation

Added native WebMCP detection/registration on the live Tartarian page and introduced:

- `tartarian_observe_world`

The goal was to expose current structured world state without adding a second simulation or scraping the visible UI.

### 0B — Authoritative movement

Added:

- `tartarian_move`

The tool reuses Tartarian's existing movement authority.

The production simulation enforces one adjacent movement step per call. WebMCP does not teleport or bypass movement rules.

### 0C — Targeting and prepared commands

Added:

- `tartarian_select_target`
- `tartarian_activate_command`

Target selection reuses Tartarian's existing selection state.

Command activation reuses the existing Command Bar path rather than directly calling combat or item-specific backend intents.

This phase also hardened movement-result truth so a rejected simulation action could not be reported as successful by the WebMCP wrapper.

### 0D — Semantic world interaction

Added:

- `tartarian_activate_target`

This gives ChatGPT a semantic path for normal world interactions such as resource extraction and other interactable objects.

It reuses Tartarian's existing interaction runtime instead of synthesizing mouse double-clicks.

This phase also clarified the distinction between selection, world interaction, and Command Bar actions.

The Tartarian WebMCP operator `SKILL.md` was developed to teach these distinctions and the movement/chase rules to an agent.

### 0E — Authoritative inventory and final hardening

Added:

- `tartarian_read_inventory`

This exposes current authoritative carried inventory without depending on the Field Satchel panel being visually open.

The final phase also hardened:

- read-only vs. mutating tool annotations
- shared Site Tool lifecycle / disposal
- duplicate registration defense
- structured success and failure results
- deterministic smoke coverage

## Final challenge surface

The challenge prototype finishes with six Site Tools:

```text
tartarian_observe_world
tartarian_read_inventory
tartarian_move
tartarian_select_target
tartarian_activate_target
tartarian_activate_command
```

## Design rule

The WebMCP layer is intentionally thin.

```text
ChatGPT
    ↓
native WebMCP Site Tool
    ↓
Tartarian WebMCP bridge
    ↓
existing browser/game authority
    ↓
authoritative hosted simulation
```

No separate WebMCP game state was created.

The live world remains authoritative.
