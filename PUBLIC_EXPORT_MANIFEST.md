# Public WebMCP Export Manifest

Production baseline: `2ec9ffe98aec67016e1b71e241fb3de46ef9dec6` (`webmcp 0e inventory support`).

| Production source | Public export | Treatment |
| --- | --- | --- |
| `dashboard/public/src/webmcp/tartarian_webmcp_bridge.js` | `src/webmcp/tartarian_webmcp_bridge.js` | Exact copy |
| `dashboard/public/src/webmcp/tartarian_webmcp_tools.js` | `src/webmcp/tartarian_webmcp_tools.js` | Exact copy |
| `dashboard/public/src/app_boot.js` WebMCP seam | `integration/app_boot_webmcp_wiring.js` | Narrow public excerpt |
| `dashboard/scripts/webmcp_play_bridge_0a_smoke.mjs` | `scripts/webmcp_play_bridge_0a_smoke.mjs` | Exact copy |
| `dashboard/scripts/webmcp_play_bridge_0b_move_smoke.mjs` | `scripts/webmcp_play_bridge_0b_move_smoke.mjs` | Exact copy |
| `dashboard/scripts/webmcp_play_bridge_0c_target_command_smoke.mjs` | `scripts/webmcp_play_bridge_0c_target_command_smoke.mjs` | Exact copy |
| `dashboard/scripts/webmcp_play_bridge_0d_world_interaction_smoke.mjs` | `scripts/webmcp_play_bridge_0d_world_interaction_smoke.mjs` | Exact copy |
| `dashboard/scripts/webmcp_play_bridge_0e_inventory_freeze_smoke.mjs` | `scripts/webmcp_play_bridge_0e_inventory_freeze_smoke.mjs` | Exact copy |

`integration/app_boot_webmcp_wiring.js` is a public-only adaptation. It converts the production boot-local variables into explicit injected dependencies while preserving the same authority seams: movement controller, visible-object selection, Command Bar activation, normal target interaction, and the existing authoritative inventory reader. The five smoke tests have one mechanical public-layout adaptation: their production `../public/src/...` imports and static-inspection paths are changed to `../src/...`; fixture logic and assertions are otherwise exact copies.

No production backend source, Sim source, autonomous MCP service source, secrets, credentials, production configuration, database data, or Git history is included.

The exported smoke tests are fixture-driven and do not contact a hosted service.
