import assert from "node:assert/strict";

import {
  createTartarianWebMcpBridge,
  TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL,
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_READ_INVENTORY_TOOL,
  TARTARIAN_WEBMCP_SELECT_TARGET_TOOL
} from "../src/webmcp/tartarian_webmcp_bridge.js";
import { installTartarianWebMcp } from "../src/webmcp/tartarian_webmcp_tools.js";

const wood = {
  id: "overworld:wood-0055",
  kind: "resource",
  label: "Wood",
  tile: { x: 61, y: 45 },
  sourceKind: "resource",
  activationTool: "extract"
};

const inventoryFixture = {
  ok: true,
  authority: { active: true, inventory_revision: 42, session_token: "must-not-leak" },
  capacity: { slots_used: 2, slots_total: 27 },
  slots: [
    { slot_index: 1, item_key: "wood", label: "Wood", quantity: 6 },
    { slot_index: 2, item_key: "iron_ore", label: "Iron Ore", quantity: 4 },
    ...Array.from({ length: 25 }, (_, index) => ({ slot_index: index + 3, occupied: false }))
  ]
};

const state = {
  movement: {
    backendStateLoaded: true,
    pending: false,
    agentId: "qa.operator",
    tile: { x: 61, y: 45 },
    zone: { zoneId: "overworld" }
  },
  selected: null
};

let commandCalls = 0;
let interactionCalls = 0;
const bridge = createTartarianWebMcpBridge({
  getOperatorSession: () => ({ authenticated: true, agentId: "qa.operator", worldInstanceId: "tartarian-alpha" }),
  getMovementState: () => state.movement,
  getProvinceWindow: () => ({ ok: true, zoneId: "overworld", center: state.movement.tile, radius: 8, objects: [wood] }),
  getSelectedTarget: () => state.selected,
  readInventory: async () => inventoryFixture,
  moveToTile: async ({ x, y }) => {
    if (x !== 62 || y !== 45) return { ok: true, movementApplied: false, simAckOk: false, error: "GAIT_PACED_MOVE_REQUIRES_ADJACENT_TARGET" };
    state.movement = { ...state.movement, tile: { x, y } };
    return { ok: true, reason: "backend_move", movementApplied: true, simAckOk: true };
  },
  selectTargetById: async ({ targetId }) => {
    if (targetId !== wood.id) return { ok: false, error: "TARGET_NOT_VISIBLE" };
    state.selected = { id: wood.id, objectId: wood.id, gameplayObject: wood };
    return { ok: true, selected: state.selected };
  },
  activateSelectedTarget: async () => {
    interactionCalls += 1;
    return { ok: true, accepted: true, tool: "extract", resource_kind: "wood", quantity: 1, inventory_revision: 43 };
  },
  activateCommandSlot: async ({ slotIndex }) => {
    commandCalls += 1;
    return slotIndex === 1
      ? { ok: true, accepted: true, command: "basic_strike", message: "Basic Strike accepted." }
      : { ok: false, error: "command_slot_empty" };
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
  enableWorldInteraction: true,
  enableInventoryRead: true
});

assert.deepEqual(runtime.getState().tools, [
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_READ_INVENTORY_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL,
  TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL
]);
assert.equal(registrations.length, 6);
assert.equal(new Set(registrations.map((row) => row.options.signal)).size, 1);

const tools = Object.fromEntries(registrations.map(({ tool }) => [tool.name, tool]));
assert.equal(tools[TARTARIAN_WEBMCP_OBSERVE_TOOL].annotations.readOnlyHint, true);
assert.equal(tools[TARTARIAN_WEBMCP_READ_INVENTORY_TOOL].annotations.readOnlyHint, true);
for (const toolName of [TARTARIAN_WEBMCP_MOVE_TOOL, TARTARIAN_WEBMCP_SELECT_TARGET_TOOL, TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL, TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL]) {
  assert.equal(tools[toolName].annotations.readOnlyHint, false);
}

const inventory = JSON.parse(await tools[TARTARIAN_WEBMCP_READ_INVENTORY_TOOL].execute({}));
assert.equal(inventory.ok, true);
assert.deepEqual(inventory.inventory, {
  capacity: 27,
  occupied_slots: 2,
  free_slots: 25,
  inventory_revision: 42,
  items: [
    { slot: 1, item_key: "wood", label: "Wood", quantity: 6 },
    { slot: 2, item_key: "iron_ore", label: "Iron Ore", quantity: 4 }
  ]
});
assert.equal(JSON.stringify(inventory).includes("must-not-leak"), false);

const moved = JSON.parse(await tools[TARTARIAN_WEBMCP_MOVE_TOOL].execute({ x: 62, y: 45 }));
assert.equal(moved.ok, true);
const rejectedMove = JSON.parse(await tools[TARTARIAN_WEBMCP_MOVE_TOOL].execute({ x: 70, y: 70 }));
assert.equal(rejectedMove.ok, false);
const selected = JSON.parse(await tools[TARTARIAN_WEBMCP_SELECT_TARGET_TOOL].execute({ target_id: wood.id }));
assert.equal(selected.ok, true);
const invalidSelection = JSON.parse(await tools[TARTARIAN_WEBMCP_SELECT_TARGET_TOOL].execute({ target_id: "not-real" }));
assert.equal(invalidSelection.ok, false);
const activated = JSON.parse(await tools[TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL].execute({}));
assert.equal(activated.ok, true);
assert.equal(interactionCalls, 1);
assert.equal(commandCalls, 0);
const command = JSON.parse(await tools[TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL].execute({ key: 1 }));
assert.equal(command.ok, true);
assert.equal(commandCalls, 1);

const unauthenticatedBridge = createTartarianWebMcpBridge({
  getOperatorSession: () => ({ authenticated: false }),
  getMovementState: () => state.movement,
  getProvinceWindow: () => null,
  readInventory: async () => inventoryFixture
});
const unauthenticatedInventory = await unauthenticatedBridge.readWorldInventory();
assert.equal(unauthenticatedInventory.ok, false);
assert.equal(unauthenticatedInventory.error, "OPERATOR_SESSION_REQUIRED");

runtime.dispose();
for (const { options } of registrations) assert.equal(options.signal.aborted, true);

console.log(JSON.stringify({ ok: true, patch: "TARTARIAN_WEBMCP_PLAY_BRIDGE_0E_INVENTORY_DEMO_FREEZE", tools: 6 }, null, 2));
