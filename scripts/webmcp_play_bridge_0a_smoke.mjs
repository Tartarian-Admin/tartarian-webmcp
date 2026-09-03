import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createTartarianWebMcpBridge,
  TARTARIAN_WEBMCP_0A_PATCH_ID,
  TARTARIAN_WEBMCP_OBSERVE_TOOL
} from "../src/webmcp/tartarian_webmcp_bridge.js";

import {
  getTartarianWebMcpAvailability,
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

const appBootPath =
  path.join(
    dashboardRoot,
    "src",
    "app_boot.js"
  );

const bridgePath =
  path.join(
    dashboardRoot,
    "src",
    "webmcp",
    "tartarian_webmcp_bridge.js"
  );

assert.deepEqual(
  getTartarianWebMcpAvailability({}),
  {
    available: false,
    can_list_tools: false,
    can_execute_tools: false
  }
);

const fixture = {
  operatorSession: {
    authenticated: true,
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
      auth_token:
        "must-not-leak"
    }
  },

  province: {
    ok: true,
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
        1,
      resource:
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
          "ambient_actor",
        activationTool:
          "basic_strike"
      },
      {
        id:
          "resource:001",
        kind:
          "resource",
        label:
          "Iron Vein",
        tile: {
          x: 43,
          y: 42
        },
        sourceKind:
          "resource",
        activationTool:
          "extract"
      }
    ]
  },

  selected: {
    id:
      "ambient:001",
    kind:
      "ambient_actor",
    label:
      "Clockwork Drifter",
    tile: {
      x: 41,
      y: 42
    }
  }
};

const bridge =
  createTartarianWebMcpBridge({
    getOperatorSession:
      () =>
        fixture.operatorSession,
    getMovementState:
      () =>
        fixture.movement,
    getProvinceWindow:
      () =>
        fixture.province,
    getSelectedTarget:
      () =>
        fixture.selected
  });

const observed =
  bridge.observeWorld();

assert.equal(
  observed.ok,
  true
);

assert.equal(
  observed.patch,
  TARTARIAN_WEBMCP_0A_PATCH_ID
);

assert.equal(
  observed.tool,
  TARTARIAN_WEBMCP_OBSERVE_TOOL
);

assert.equal(
  observed.read_only,
  true
);

assert.deepEqual(
  observed.character.coord,
  {
    x: 40,
    y: 42
  }
);

assert.equal(
  observed.nearby[0].id,
  "ambient:001"
);

assert.equal(
  observed.nearby[0].distance,
  1
);

const serialized =
  JSON.stringify(
    observed
  );

assert.equal(
  serialized.includes(
    "must-not-leak"
  ),
  false
);

assert.equal(
  serialized.includes(
    "example.invalid"
  ),
  false
);

const registrations =
  [];

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
    },

    async executeTool() {
      throw new Error(
        "not_needed_for_smoke"
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
      console
  });

assert.equal(
  runtime.getState().ok,
  true
);

assert.equal(
  registrations.length,
  1
);

const registration =
  registrations[0];

assert.equal(
  registration.tool.name,
  TARTARIAN_WEBMCP_OBSERVE_TOOL
);

assert.equal(
  registration.tool.annotations.readOnlyHint,
  true
);

assert.equal(
  registration.tool.annotations.untrustedContentHint,
  true
);

assert.equal(
  registration.options.signal.aborted,
  false
);

const toolResult =
  JSON.parse(
    await registration
      .tool
      .execute({})
  );

assert.equal(
  toolResult.ok,
  true
);

runtime.dispose();

assert.equal(
  registration.options.signal.aborted,
  true
);

const bridgeSource =
  fs.readFileSync(
    bridgePath,
    "utf8"
  );

for (
  const forbidden
  of
  [
    ".setTile(",
    "postMoveIntent(",
    "setTartarySelectedTarget(",
    "activateInteractionTarget(",
    "fetch("
  ]
) {
  assert.equal(
    bridgeSource.includes(
      forbidden
    ),
    false,
    `0A bridge must remain read-only: ${forbidden}`
  );
}

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
      "createTartarianWebMcpBridge"
    ),
    true,
    "app_boot.js imports/uses WebMCP bridge"
  );

  assert.equal(
    appBoot.includes(
      "installTartarianWebMcp"
    ),
    true,
    "app_boot.js installs WebMCP runtime"
  );

  const stateLoadIndex =
    appBoot.indexOf(
      "await movementController.loadInitialState();"
    );

  const installIndex =
    appBoot.indexOf(
      "installTartarianWebMcp"
    );

  assert.equal(
    stateLoadIndex >= 0,
    true
  );

  /*
   * There is also an import occurrence, so find the call
   * after authoritative boot.
   */
  const installCallIndex =
    appBoot.indexOf(
      "await installTartarianWebMcp",
      stateLoadIndex
    );

  assert.equal(
    installCallIndex > stateLoadIndex,
    true,
    "WebMCP installs only after initial authoritative state load"
  );
}

console.log(
  JSON.stringify(
    {
      ok:
        true,
      patch:
        TARTARIAN_WEBMCP_0A_PATCH_ID,
      tool:
        TARTARIAN_WEBMCP_OBSERVE_TOOL,
      readOnly:
        true,
      registered:
        registrations.length
    },
    null,
    2
  )
);
