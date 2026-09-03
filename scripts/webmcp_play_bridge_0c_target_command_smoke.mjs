import assert from "node:assert/strict";

import {
  createTartarianWebMcpBridge,
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL,
  TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL
} from "../src/webmcp/tartarian_webmcp_bridge.js";

import {
  installTartarianWebMcp
} from "../src/webmcp/tartarian_webmcp_tools.js";

const state = {
  selected:
    null,

  movement: {
    backendStateLoaded:
      true,

    pending:
      false,

    agentId:
      "qa.operator",

    tile: {
      x:
        40,

      y:
        42
    },

    zone: {
      zoneId:
        "overworld"
    }
  }
};

const object = {
  id:
    "ambient:001",

  kind:
    "ambient_actor",

  label:
    "Clockwork Drifter",

  tile: {
    x:
      41,

    y:
      42
  },

  sourceKind:
    "ambient_actor",

  ambientInstanceId:
    "ambient:001"
};

const bridge =
  createTartarianWebMcpBridge({
    getOperatorSession:
      () => ({
        authenticated:
          true,

        agentId:
          "qa.operator",

        worldInstanceId:
          "tartarian-alpha"
      }),

    getMovementState:
      () =>
        state.movement,

    getProvinceWindow:
      () => ({
        ok:
          true,

        zoneId:
          "overworld",

        center: {
          x:
            40,

          y:
            42
        },

        radius:
          8,

        objects: [
          object
        ]
      }),

    getSelectedTarget:
      () =>
        state.selected,

    moveToTile:
      async ({
        x,
        y
      }) => {
        if (
          x ===
            41 &&
          y ===
            42
        ) {
          state.movement = {
            ...state.movement,

            tile: {
              x:
                41,

              y:
                42
            }
          };

          /*
           * Real BackendMovementController success shape includes
           * reason:"backend_move".
           *
           * WebMCP must NOT treat that as an error.
           */
          return {
            ok:
              true,

            reason:
              "backend_move",

            movementApplied:
              true,

            to: {
              x:
                41,

              y:
                42
            }
          };
        }

        return {
          ok:
            true,

          movementApplied:
            false,

          simAckOk:
            false,

          error:
            "GAIT_PACED_MOVE_REQUIRES_ADJACENT_TARGET"
        };
      },

    selectTargetById:
      async ({
        targetId
      }) => {
        if (
          targetId !==
          object.id
        ) {
          return {
            ok:
              false,

            error:
              "TARGET_NOT_VISIBLE"
          };
        }

        state.selected = {
          kind:
            "gameplay_object",

          targetType:
            "gameplay_object",

          id:
            object.id,

          objectId:
            object.id,

          label:
            object.label,

          tile:
            object.tile,

          gameplayObject:
            object
        };

        return {
          ok:
            true,

          selected:
            state.selected
        };
      },

    activateCommandSlot:
      async ({
        slotIndex
      }) => {
        if (
          slotIndex ===
          1
        ) {
          return {
            ok:
              true,

            accepted:
              true,

            command:
              "basic_strike",

            message:
              "Basic Strike accepted."
          };
        }

        return {
          ok:
            false,

          error:
            "command_slot_empty",

          message:
            `Command Key ${slotIndex} is empty.`
        };
      }
  });

const registrations = [];

const fakeDocument = {
  modelContext: {
    async registerTool(
      tool,
      options
    ) {
      registrations.push({
        tool,
        options
      });
    },

    async getTools() {
      return registrations.map(
        (row) =>
          row.tool
      );
    }
  }
};

const runtime =
  await installTartarianWebMcp({
    documentRef:
      fakeDocument,

    bridge,

    enableMove:
      true,

    enableActionTools:
      true
  });

assert.deepEqual(
  runtime
    .getState()
    .tools,
  [
    TARTARIAN_WEBMCP_OBSERVE_TOOL,
    TARTARIAN_WEBMCP_MOVE_TOOL,
    TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
    TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL
  ]
);

const tools =
  Object.fromEntries(
    registrations.map(
      ({
        tool
      }) => [
        tool.name,
        tool
      ]
    )
  );

assert.equal(
  tools[
    TARTARIAN_WEBMCP_OBSERVE_TOOL
  ].annotations.readOnlyHint,
  true
);

assert.equal(
  tools[
    TARTARIAN_WEBMCP_MOVE_TOOL
  ].annotations.readOnlyHint,
  false
);

assert.equal(
  tools[
    TARTARIAN_WEBMCP_SELECT_TARGET_TOOL
  ].annotations.readOnlyHint,
  false
);

assert.equal(
  tools[
    TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL
  ].annotations.readOnlyHint,
  false
);

/*
 * 0B-R1:
 * successful controller lifecycle reason "backend_move"
 * must no longer become a WebMCP failure.
 */
const moved =
  JSON.parse(
    await tools[
      TARTARIAN_WEBMCP_MOVE_TOOL
    ].execute({
      x:
        41,

      y:
        42
    })
  );

assert.equal(
  moved.ok,
  true
);

assert.equal(
  moved.movement_applied,
  true
);

assert.equal(
  moved.sim_ack_ok,
  true
);

assert.deepEqual(
  moved.new_coord,
  {
    x:
      41,

    y:
      42
  }
);

/*
 * Historical hostile wrapper still fails honestly.
 */
const rejectedMove =
  JSON.parse(
    await tools[
      TARTARIAN_WEBMCP_MOVE_TOOL
    ].execute({
      x:
        50,

      y:
        50
    })
  );

assert.equal(
  rejectedMove.ok,
  false
);

assert.equal(
  rejectedMove.movement_applied,
  false
);

/*
 * Select exact observed target.
 */
const selected =
  JSON.parse(
    await tools[
      TARTARIAN_WEBMCP_SELECT_TARGET_TOOL
    ].execute({
      target_id:
        "ambient:001"
    })
  );

assert.equal(
  selected.ok,
  true
);

assert.equal(
  selected.selection_applied,
  true
);

assert.equal(
  selected.selected_target.id,
  "ambient:001"
);

/*
 * Invalid target may not silently fall back.
 */
const invalidSelection =
  JSON.parse(
    await tools[
      TARTARIAN_WEBMCP_SELECT_TARGET_TOOL
    ].execute({
      target_id:
        "not-real"
    })
  );

assert.equal(
  invalidSelection.ok,
  false
);

assert.equal(
  invalidSelection.error,
  "TARGET_NOT_VISIBLE"
);

/*
 * Key 1 reaches injected production-command seam.
 */
const command =
  JSON.parse(
    await tools[
      TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL
    ].execute({
      key:
        1
    })
  );

assert.equal(
  command.ok,
  true
);

assert.equal(
  command.accepted,
  true
);

assert.equal(
  command.command,
  "basic_strike"
);

/*
 * Empty command fails honestly.
 */
const empty =
  JSON.parse(
    await tools[
      TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL
    ].execute({
      key:
        3
    })
  );

assert.equal(
  empty.ok,
  false
);

assert.equal(
  empty.error,
  "command_slot_empty"
);

for (
  const row
  of
  registrations
) {
  assert.equal(
    row.options.signal.aborted,
    false
  );
}

runtime.dispose();

for (
  const row
  of
  registrations
) {
  assert.equal(
    row.options.signal.aborted,
    true
  );
}

console.log(
  JSON.stringify(
    {
      ok:
        true,

      patch:
        "TARTARIAN_WEBMCP_PLAY_BRIDGE_0C_TARGET_COMMAND",

      tools:
        4,

      move_truth_fix:
        "pass",

      target_selection:
        "pass",

      command_activation:
        "pass"
    },
    null,
    2
  )
);
