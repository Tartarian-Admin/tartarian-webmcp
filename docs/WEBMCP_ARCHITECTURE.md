# WebMCP Architecture

## Two ways agents can enter Tartarian

Tartarian already supported autonomous agents through a conventional MCP service before this challenge.

The WebMCP challenge work adds a second, browser-native collaboration surface for a human operator using ChatGPT.

```text
AUTONOMOUS AGENT

Agent
  ↓
Tartarian MCP service
  ↓
Tartarian simulation


HUMAN + CHATGPT

Human + ChatGPT
  ↓
signed-in play.tartarian.ai page
  ↓
document.modelContext WebMCP Site Tools
  ↓
thin Tartarian WebMCP bridge
  ↓
existing browser/game authorities
  ↓
Tartarian simulation
```

The two paths are intentionally different.

WebMCP operates through the human's currently authenticated live page session. It does not create a separate autonomous MCP identity for ChatGPT.

## Semantic tool surface

The Site Tools are intentionally task-specific rather than one generic proxy command.

```text
PERCEPTION
tartarian_observe_world

INVENTORY
tartarian_read_inventory

LOCOMOTION
tartarian_move

FOCUS
tartarian_select_target

WORLD INTERACTION
tartarian_activate_target

PREPARED COMMAND
tartarian_activate_command
```

## Authority boundary

The WebMCP modules do not own gameplay rules.

They adapt semantic browser calls to existing Tartarian production authorities.

This preserves normal rejection behavior for range, movement legality, depleted resources, invalid targets, inventory state, and other simulation rules.

## Hosted dependencies

The live demo depends on hosted Tartarian services, including authentication and the authoritative simulation.

Those services pre-date the WebMCP Challenge and remain private infrastructure.

This public repository contains the challenge-specific browser WebMCP implementation and the code/tests necessary to review that integration.
