import {
  TARTARIAN_WEBMCP_0A_PATCH_ID,
  TARTARIAN_WEBMCP_0B_PATCH_ID,
  TARTARIAN_WEBMCP_0C_PATCH_ID,
  TARTARIAN_WEBMCP_0D_PATCH_ID,
  TARTARIAN_WEBMCP_0E_PATCH_ID,
  TARTARIAN_WEBMCP_OBSERVE_TOOL,
  TARTARIAN_WEBMCP_MOVE_TOOL,
  TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
  TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL,
  TARTARIAN_WEBMCP_READ_INVENTORY_TOOL
} from "./tartarian_webmcp_bridge.js";

export function getTartarianWebMcpAvailability(
  documentRef =
    globalThis.document
) {
  const modelContext =
    documentRef?.modelContext ||
    null;

  return {
    available:
      !!modelContext &&
      typeof (
        modelContext
          .registerTool
      ) ===
      "function",

    can_list_tools:
      typeof (
        modelContext
          ?.getTools
      ) ===
      "function",

    can_execute_tools:
      typeof (
        modelContext
          ?.executeTool
      ) ===
      "function"
  };
}

export function createObserveWorldWebMcpTool({
  bridge
} = {}) {
  if (
    !bridge ||
    typeof bridge.observeWorld !==
      "function"
  ) {
    throw new Error(
      "WEBMCP_0A_OBSERVE_BRIDGE_REQUIRED"
    );
  }

  return {
    name:
      TARTARIAN_WEBMCP_OBSERVE_TOOL,

    title:
      "Observe Tartarian world",

    description:
      "Read the signed-in Tartarian operator's current authoritative " +
      "character location, province window, selected target, and nearby " +
      "rendered gameplay entities. This tool is read-only and does not " +
      "move, select, activate, attack, trade, or mutate world state.",

    inputSchema: {
      type:
        "object",

      properties: {},

      additionalProperties:
        false
    },

    annotations: {
      readOnlyHint:
        true,

      untrustedContentHint:
        true
    },

    execute:
      async () => {
        const result =
          bridge.observeWorld();

        return JSON.stringify(
          result,
          null,
          2
        );
      }
  };
}

export function createMoveWebMcpTool({
  bridge
} = {}) {
  if (
    !bridge ||
    typeof bridge.moveWorld !==
      "function"
  ) {
    throw new Error(
      "WEBMCP_0B_MOVE_BRIDGE_REQUIRED"
    );
  }

  return {
    name:
      TARTARIAN_WEBMCP_MOVE_TOOL,

    title:
      "Move Tartarian character",

    description:
      "Move the signed-in Tartarian operator character to one requested " +
      "world tile using the existing production movement controller and " +
      "normal Tartarian authority. Observe first and normally request an " +
      "adjacent tile. This 0B prototype always requests WALK. The tool " +
      "never teleports, retries, or directly changes Three.js position; " +
      "the existing movement controller and Sim remain authoritative.",

    inputSchema: {
      type:
        "object",

      properties: {
        x: {
          type:
            "integer",

          description:
            "Destination world X coordinate. Normally choose an adjacent tile returned from the current observation."
        },

        y: {
          type:
            "integer",

          description:
            "Destination world Y coordinate. Normally choose an adjacent tile returned from the current observation."
        }
      },

      required: [
        "x",
        "y"
      ],

      additionalProperties:
        false
    },

    annotations: {
      readOnlyHint:
        false
    },

    execute:
      async (
        input
      ) => {
        const result =
          await bridge.moveWorld({
            x:
              input?.x,

            y:
              input?.y
          });

        return JSON.stringify(
          result,
          null,
          2
        );
      }
  };
}

export function createReadInventoryWebMcpTool({ bridge } = {}) {
  if (!bridge || typeof bridge.readWorldInventory !== "function") {
    throw new Error("WEBMCP_0E_INVENTORY_BRIDGE_REQUIRED");
  }
  return {
    name: TARTARIAN_WEBMCP_READ_INVENTORY_TOOL,
    title: "Read Tartarian inventory",
    description:
      "Read the signed-in Tartarian operator's current authoritative carried " +
      "inventory without changing game state. Use this when current carried " +
      "goods matter; do not infer inventory from Command Bar bindings or prior conversation state.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async () => JSON.stringify(await bridge.readWorldInventory(), null, 2)
  };
}

export function createSelectTargetWebMcpTool({ bridge } = {}) {
  if (!bridge || typeof bridge.selectWorldTarget !== "function") {
    throw new Error("WEBMCP_0C_SELECT_TARGET_BRIDGE_REQUIRED");
  }
  return {
    name: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
    title: "Select Tartarian target",
    description:
      "Select one currently observed Tartarian world entity by the exact " +
      "target_id returned by tartarian_observe_world. This changes normal " +
      "live-page target selection only; it does not attack or move.",
    inputSchema: {
      type: "object",
      properties: {
        target_id: { type: "string", minLength: 1, maxLength: 128 }
      },
      required: ["target_id"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: async (input) => JSON.stringify(
      await bridge.selectWorldTarget({ targetId: input?.target_id }),
      null,
      2
    )
  };
}

export function createActivateCommandWebMcpTool({ bridge } = {}) {
  if (!bridge || typeof bridge.activateWorldCommand !== "function") {
    throw new Error("WEBMCP_0C_ACTIVATE_COMMAND_BRIDGE_REQUIRED");
  }
  return {
    name: TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
    title: "Activate Tartarian command",
    description:
      "Activate one existing Tartarian Command Bar key using the same " +
      "production Command Bar path as human input. It does not bypass " +
      "target, combat, item, inventory, Drive, Order, or Sim authority.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "integer", minimum: 1, maximum: 9 }
      },
      required: ["key"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false },
    execute: async (input) => JSON.stringify(
      await bridge.activateWorldCommand({ key: input?.key }),
      null,
      2
    )
  };
}

export function createActivateTargetWebMcpTool({ bridge } = {}) {
  if (!bridge || typeof bridge.activateWorldTarget !== "function") {
    throw new Error("WEBMCP_0D_ACTIVATE_TARGET_BRIDGE_REQUIRED");
  }
  return {
    name: TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL,
    title: "Activate selected Tartarian world target",
    description: "Use the selected Tartarian world object's normal primary interaction. For resources and world objects with a world_interaction hint, select the exact target then use this tool. This is not a Command Bar action.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: async () => JSON.stringify(await bridge.activateWorldTarget(), null, 2)
  };
}

function createUnavailableRuntime({
  bridge,
  reason,
  availability
}) {
  return {
    bridge,

    getState() {
      return {
        ok: false,

        patch: TARTARIAN_WEBMCP_0C_PATCH_ID,

        available:
          availability
            ?.available ===
          true,

        installed:
          false,

        reason:
          String(
            reason ||
            "webmcp_unavailable"
          ),

        tools: []
      };
    },

    dispose() {
      return {
        ok: true,

        disposed:
          false,

        reason:
          "not_installed"
      };
    }
  };
}

export async function installTartarianWebMcp({
  documentRef =
    globalThis.document,

  bridge,

  logger =
    console,

  /*
   * Compatibility law:
   *
   * Default false means the historical 0A smoke can still install only
   * tartarian_observe_world without changing its fixture.
   *
   * Production app_boot.js MUST pass enableMove:true in 0B.
   */
  enableMove =
    false,

  enableActionTools =
    false,

  enableWorldInteraction =
    false,

  enableInventoryRead =
    false
} = {}) {
  const availability =
    getTartarianWebMcpAvailability(
      documentRef
    );

  if (
    !availability.available
  ) {
    return createUnavailableRuntime({
      bridge,

      reason:
        "document_model_context_unavailable",

      availability
    });
  }

  const controller =
    new AbortController();

  const tools = [
    createObserveWorldWebMcpTool({
      bridge
    })
  ];

  if (enableInventoryRead === true) {
    tools.push(createReadInventoryWebMcpTool({ bridge }));
  }

  if (
    enableMove ===
    true
  ) {
    tools.push(
      createMoveWebMcpTool({
        bridge
      })
    );
  }

  if (enableActionTools === true) {
    tools.push(createSelectTargetWebMcpTool({ bridge }));
    if (enableInventoryRead !== true) {
      tools.push(createActivateCommandWebMcpTool({ bridge }));
    }
  }

  if (enableWorldInteraction === true) {
    tools.push(createActivateTargetWebMcpTool({ bridge }));
  }

  if (enableActionTools === true && enableInventoryRead === true) {
    tools.push(createActivateCommandWebMcpTool({ bridge }));
  }

  const registered = [];

  let installed =
    false;

  let lastError =
    null;

  try {
    for (
      const tool
      of
      tools
    ) {
      await documentRef
        .modelContext
        .registerTool(
          tool,
          {
            signal:
              controller.signal
          }
        );

      registered.push(
        tool.name
      );
    }

    installed =
      true;
  } catch (error) {
    lastError =
      String(
        error?.message ||
        error
      );

    /*
     * Never leave a half-installed 0B registry.
     * The one AbortController owns every registration in this install.
     */
    controller.abort();

    registered.length =
      0;

    logger
      ?.warn
      ?.(
        "[tartarian-webmcp] registration failed",
        {
          patch: enableInventoryRead
            ? TARTARIAN_WEBMCP_0E_PATCH_ID
            : enableWorldInteraction
            ? TARTARIAN_WEBMCP_0D_PATCH_ID
            : enableActionTools
            ? TARTARIAN_WEBMCP_0C_PATCH_ID
            : enableMove
              ? TARTARIAN_WEBMCP_0B_PATCH_ID
              : TARTARIAN_WEBMCP_0A_PATCH_ID,

          error:
            lastError
        }
      );
  }

  return {
    bridge,

    getState() {
      return {
        ok:
          installed &&
          !controller
            .signal
            .aborted,

        patch: enableInventoryRead
          ? TARTARIAN_WEBMCP_0E_PATCH_ID
          : enableWorldInteraction
          ? TARTARIAN_WEBMCP_0D_PATCH_ID
          : enableActionTools
          ? TARTARIAN_WEBMCP_0C_PATCH_ID
          : enableMove
            ? TARTARIAN_WEBMCP_0B_PATCH_ID
            : TARTARIAN_WEBMCP_0A_PATCH_ID,

        available:
          true,

        installed:
          installed &&
          !controller
            .signal
            .aborted,

        can_list_tools:
          availability
            .can_list_tools,

        can_execute_tools:
          availability
            .can_execute_tools,

        move_enabled:
          enableMove ===
          true,

        action_tools_enabled:
          enableActionTools ===
          true,

        world_interaction_enabled:
          enableWorldInteraction ===
          true,

        inventory_read_enabled:
          enableInventoryRead ===
          true,

        error:
          lastError,

        tools:
          installed &&
          !controller
            .signal
            .aborted
            ?
            registered
              .slice()
            :
            []
      };
    },

    dispose() {
      const wasInstalled =
        installed &&
        !controller
          .signal
          .aborted;

      const priorTools =
        registered
          .slice();

      controller.abort();

      installed =
        false;

      registered.length =
        0;

      return {
        ok: true,

        disposed:
          wasInstalled,

        tools:
          priorTools
      };
    }
  };
}
