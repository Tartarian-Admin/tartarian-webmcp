/*
 * Tartarian WebMCP 0D fixture smoke STARTER.
 * Codex must align imports/exports to the exact post-0C source and validate
 * the real gameplay_activation_controller success/failure shape.
 */
import assert from "node:assert/strict";

import {
  createTartarianWebMcpBridge,
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL,
  TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL
} from "../src/webmcp/tartarian_webmcp_bridge.js";

import {
  installTartarianWebMcp
} from "../src/webmcp/tartarian_webmcp_tools.js";

const wood = {
  id: "overworld:node-0055",
  kind: "resource",
  label: "Wood",
  tile: { x: 61, y: 45 },
  sourceKind: "resource",
  activationTool: "extract"
};

const state = {
  movement: {
    backendStateLoaded: true,
    pending: false,
    agentId: "qa.operator",
    tile: { x: 61, y: 45 },
    zone: { zoneId: "overworld" }
  },
  selected: {
    kind: "gameplay_object",
    targetType: "gameplay_object",
    id: wood.id,
    objectId: wood.id,
    label: wood.label,
    tile: wood.tile,
    activationTool: wood.activationTool,
    gameplayObject: wood
  }
};

let interactionCalls = 0;
let commandCalls = 0;

const bridge = createTartarianWebMcpBridge({
  getOperatorSession: () => ({
    authenticated: true,
    agentId: "qa.operator",
    worldInstanceId: "tartarian-alpha"
  }),
  getMovementState: () => state.movement,
  getProvinceWindow: () => ({
    ok: true,
    zoneId: "overworld",
    center: state.movement.tile,
    radius: 8,
    objects: [wood]
  }),
  getSelectedTarget: () => state.selected,
  moveToTile: async () => ({ ok: false, error: "not_used" }),
  selectTargetById: async ({ targetId }) => ({
    ok: targetId === wood.id,
    selected: state.selected
  }),
  activateCommandSlot: async () => {
    commandCalls += 1;
    return { ok: false, error: "should_not_be_called" };
  },
  activateSelectedTarget: async () => {
    interactionCalls += 1;
    return {
      ok: true,
      accepted: true,
      tool: "extract",
      resource_kind: "wood",
      quantity: 1,
      inventory_revision: 42,
      message: "Wood extracted."
    };
  }
});

const registrations = [];
const fakeDocument = {
  modelContext: {
    async registerTool(tool, options) {
      registrations.push({ tool, options });
    }
  }
};

const runtime = await installTartarianWebMcp({
  documentRef: fakeDocument,
  bridge,
  enableMove: true,
  enableActionTools: true,
  enableWorldInteraction: true
});

assert.deepEqual(runtime.getState().tools, [
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL,
  TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL
]);

const tools = Object.fromEntries(
  registrations.map(({ tool }) => [tool.name, tool])
);

const observed = JSON.parse(
  await tools[TARTARIAN_WEBMCP_OBSERVE_TOOL].execute({})
);
const observedWood = observed.nearby.find((row) => row.id === wood.id);

assert.ok(observedWood);
assert.equal(observedWood.activation_tool, "extract");
assert.equal(
  observedWood.tool_hints.world_interaction,
  TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL
);
assert.equal(observedWood.tool_hints.command_bar, null);

const activated = JSON.parse(
  await tools[TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL].execute({})
);

assert.equal(activated.ok, true);
assert.equal(activated.accepted, true);
assert.equal(activated.activation_tool, "extract");
assert.equal(interactionCalls, 1);
assert.equal(commandCalls, 0);

runtime.dispose();
for (const row of registrations) {
  assert.equal(row.options.signal.aborted, true);
}

console.log(JSON.stringify({
  ok: true,
  patch: "TARTARIAN_WEBMCP_PLAY_BRIDGE_0D_WORLD_INTERACTION_SKILL_HARDENING",
  tools: 5,
  worldInteraction: "pass",
  commandSeparation: "pass",
  resourceHint: "pass"
}, null, 2));
