import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath
} from "node:url";

import {
  createTartarianWebMcpBridge,
  TARTARIAN_WEBMCP_0B_PATCH_ID,
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL
} from "../src/webmcp/tartarian_webmcp_bridge.js";

import {
  installTartarianWebMcp
} from "../src/webmcp/tartarian_webmcp_tools.js";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const dashboardRoot =
  path.resolve(
    __dirname,
    ".."
  );

const bridgePath =
  path.join(
    dashboardRoot,
    "src",
    "webmcp",
    "tartarian_webmcp_bridge.js"
  );

const toolsPath =
  path.join(
    dashboardRoot,
    "src",
    "webmcp",
    "tartarian_webmcp_tools.js"
  );

const appBootPath =
  path.join(
    dashboardRoot,
    "src",
    "app_boot.js"
  );

const state = {
  operatorSession: {
    authenticated:
      true,

    agentId:
      "qa.operator",

    worldInstanceId:
      "tartarian-alpha",

    raw: {
      email:
        "must-not-leak@example.invalid",

      token:
        "must-not-leak"
    }
  },

  movement: {
    backendStateLoaded:
      true,

    pending:
      false,

    agentId:
      "qa.operator",

    tile: {
      x: 40,
      y: 42
    },

    zone: {
      zoneId:
        "overworld"
    },

    agentState: {
      world_instance_id:
        "tartarian-alpha",

      token:
        "must-not-leak"
    }
  },

  province: {
    zoneId:
      "overworld",

    center: {
      x: 40,
      y: 42
    },

    radius:
      8,

    source:
      "province_radius_8",

    counts: {
      ambient_actor:
        1
    },

    objects: [
      {
        id:
          "ambient:001",

        kind:
          "ambient_actor",

        label:
          "Clockwork Drifter",

        tile: {
          x: 41,
          y: 42
        },

        sourceKind:
          "ambient_actor"
      }
    ]
  }
};

const moveCalls = [];

const bridge =
  createTartarianWebMcpBridge({
    getOperatorSession:
      () =>
        state
          .operatorSession,

    getMovementState:
      () =>
        state
          .movement,

    getProvinceWindow:
      () =>
        state
          .province,

    getSelectedTarget:
      () =>
        null,

    moveToTile:
      async (
        request
      ) => {
        moveCalls.push(
          {
            ...request
          }
        );

        if (
          request.x ===
          41
          &&
          request.y ===
          42
        ) {
          state.movement = {
            ...state.movement,

            tile: {
              x: 41,
              y: 42
            }
          };

          return {
            ok:
              true,

            status:
              "accepted",

            movementApplied:
              true,

            simAckOk:
              true
          };
        }

        /*
         * Deliberately reproduce the historical dangerous wrapper shape:
         * top-level ok:true while the actual movement acknowledgement failed.
         *
         * 0B MUST still return ok:false.
         */
        return {
          ok:
            true,

          status:
            400,

          movementApplied:
            false,

          simAckOk:
            false,

          error:
            "GAIT_PACED_MOVE_REQUIRES_ADJACENT_TARGET",

          detail:
            "GAIT_PACED_MOVE_REQUIRES_ADJACENT_TARGET"
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
      return registrations
        .map(
          (
            row
          ) =>
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

    logger:
      console,

    enableMove:
      true
  });

assert.equal(
  runtime.getState().ok,
  true
);

assert.equal(
  runtime.getState().patch,
  TARTARIAN_WEBMCP_0B_PATCH_ID
);

assert.deepEqual(
  runtime.getState().tools,
  [
    TARTARIAN_WEBMCP_OBSERVE_TOOL,
    TARTARIAN_WEBMCP_MOVE_TOOL
  ]
);

assert.equal(
  registrations.length,
  2
);

const observeTool =
  registrations
    .find(
      (
        row
      ) =>
        row.tool.name ===
        TARTARIAN_WEBMCP_OBSERVE_TOOL
    )
    ?.tool;

const moveTool =
  registrations
    .find(
      (
        row
      ) =>
        row.tool.name ===
        TARTARIAN_WEBMCP_MOVE_TOOL
    )
    ?.tool;

assert.ok(
  observeTool
);

assert.ok(
  moveTool
);

assert.equal(
  observeTool
    .annotations
    .readOnlyHint,
  true
);

assert.equal(
  moveTool
    .annotations
    .readOnlyHint,
  false
);

const before =
  bridge
    .observeWorld();

assert.deepEqual(
  before
    .character
    .coord,
  {
    x: 40,
    y: 42
  }
);

const moved =
  JSON.parse(
    await moveTool
      .execute({
        x: 41,
        y: 42
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
    x: 41,
    y: 42
  }
);

assert.deepEqual(
  moveCalls[0],
  {
    x: 41,
    y: 42,
    requestedGait:
      "walk",
    source:
      "webmcp"
  }
);

const rejected =
  JSON.parse(
    await moveTool
      .execute({
        x: 50,
        y: 50
      })
  );

assert.equal(
  rejected.ok,
  false
);

assert.equal(
  rejected.movement_applied,
  false
);

assert.equal(
  rejected.sim_ack_ok,
  false
);

assert.equal(
  rejected.error,
  "GAIT_PACED_MOVE_REQUIRES_ADJACENT_TARGET"
);

assert.deepEqual(
  rejected.new_coord,
  {
    x: 41,
    y: 42
  }
);

const leaked =
  JSON.stringify(
    [
      before,
      moved,
      rejected
    ]
  );

assert.equal(
  leaked.includes(
    "must-not-leak"
  ),
  false
);

assert.equal(
  leaked.includes(
    "example.invalid"
  ),
  false
);

for (
  const row
  of
  registrations
) {
  assert.equal(
    row
      .options
      .signal
      .aborted,
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
    row
      .options
      .signal
      .aborted,
    true
  );
}

const bridgeSource =
  fs.readFileSync(
    bridgePath,
    "utf8"
  );

const toolsSource =
  fs.readFileSync(
    toolsPath,
    "utf8"
  );

/*
 * 0B is allowed ONE injected movement authority callback.
 * It is still forbidden to invent a second transport or mutate graphics.
 */
for (
  const forbidden
  of
  [
    "postMoveIntent(",
    ".position.set(",
    ".position.x =",
    ".position.z =",
    "dispatchEvent(new KeyboardEvent",
    "document.querySelector("
  ]
) {
  assert.equal(
    bridgeSource.includes(
      forbidden
    ),
    false,
    `0B bridge forbidden token: ${forbidden}`
  );
}

assert.equal(
  bridgeSource.includes(
    "await moveToTile({"
  ),
  true
);

assert.equal(
  toolsSource.includes(
    "enableMove"
  ),
  true
);

assert.equal(
  toolsSource.includes(
    "createMoveWebMcpTool"
  ),
  true
);

if (
  fs.existsSync(
    appBootPath
  )
) {
  const appBoot =
    fs.readFileSync(
      appBootPath,
      "utf8"
    );

  assert.equal(
    appBoot.includes(
      "enableMove:"
    ),
    true,
    "app_boot.js must opt production into 0B movement"
  );

  assert.equal(
    appBoot.includes(
      "moveToTile:"
    ),
    true,
    "app_boot.js must inject existing movement authority"
  );
}

console.log(
  JSON.stringify(
    {
      ok:
        true,

      patch:
        TARTARIAN_WEBMCP_0B_PATCH_ID,

      tools: [
        TARTARIAN_WEBMCP_OBSERVE_TOOL,
        TARTARIAN_WEBMCP_MOVE_TOOL
      ],

      legalMove:
        "pass",

      rejectionHonesty:
        "pass",

      directMovementTransport:
        false
    },
    null,
    2
  )
);
