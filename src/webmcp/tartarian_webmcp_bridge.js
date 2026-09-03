export const TARTARIAN_WEBMCP_0A_PATCH_ID =
  "TARTARIAN_WEBMCP_PLAY_BRIDGE_0A_OBSERVE_WORLD";

export const TARTARIAN_WEBMCP_0B_PATCH_ID =
  "TARTARIAN_WEBMCP_PLAY_BRIDGE_0B_MOVE";

export const TARTARIAN_WEBMCP_0B_R1_PATCH_ID =
  "TARTARIAN_WEBMCP_PLAY_BRIDGE_0B_R1_MOVE_RESULT_TRUTH_FIX";

export const TARTARIAN_WEBMCP_0C_PATCH_ID =
  "TARTARIAN_WEBMCP_PLAY_BRIDGE_0C_TARGET_COMMAND";

export const TARTARIAN_WEBMCP_0D_PATCH_ID =
  "TARTARIAN_WEBMCP_PLAY_BRIDGE_0D_WORLD_INTERACTION_SKILL_HARDENING";

export const TARTARIAN_WEBMCP_0E_PATCH_ID =
  "TARTARIAN_WEBMCP_PLAY_BRIDGE_0E_INVENTORY_DEMO_FREEZE";

export const TARTARIAN_WEBMCP_OBSERVE_TOOL =
  "tartarian_observe_world";

export const TARTARIAN_WEBMCP_MOVE_TOOL =
  "tartarian_move";

export const TARTARIAN_WEBMCP_SELECT_TARGET_TOOL =
  "tartarian_select_target";

export const TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL =
  "tartarian_activate_command";

export const TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL =
  "tartarian_activate_target";

export const TARTARIAN_WEBMCP_READ_INVENTORY_TOOL =
  "tartarian_read_inventory";

const MAX_NEARBY_ROWS = 64;
const MAX_TEXT_LENGTH = 160;
const WEBMCP_COMBAT_LIKE_KINDS = new Set(["ambient_actor", "ambient", "actor", "npc", "boss", "event_boss", "order_boss", "live_player", "player", "operator", "other_player"]);

function normalizeKind(value) {
  return String(value || "").trim().toLowerCase().replaceAll("-", "_");
}

function buildToolHints({ kind, sourceKind, activationTool } = {}) {
  const combatLike = WEBMCP_COMBAT_LIKE_KINDS.has(normalizeKind(kind)) || WEBMCP_COMBAT_LIKE_KINDS.has(normalizeKind(sourceKind));
  const interactionTool = safeString(activationTool, 96);
  return {
    select: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
    world_interaction: interactionTool ? TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL : null,
    world_interaction_kind: interactionTool,
    command_bar: combatLike ? TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL : null
  };
}

function safeString(value, maxLength = MAX_TEXT_LENGTH) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(
    0,
    Math.max(
      1,
      Number(maxLength) || MAX_TEXT_LENGTH
    )
  );
}

function safeInteger(value) {
  const number =
    Number(value);

  if (!Number.isInteger(number)) {
    return null;
  }

  return number;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return Math.trunc(number);
  }
  return null;
}

function compactInventory(raw) {
  if (!raw || typeof raw !== "object") return null;
  const source = raw.authoritativeSnapshot || raw.inventory || raw.data?.inventory || raw;
  const slots = Array.isArray(source?.slots) ? source.slots : [];
  const items = slots.map((slot, index) => {
    if (!slot || typeof slot !== "object") return null;
    const itemKey = safeString(slot.item_key || slot.itemKey || slot.item_id || slot.itemId, 128);
    if (slot.occupied === false || !itemKey) return null;
    return {
      slot: firstFiniteNumber(slot.slot_index, slot.slotIndex, index + 1),
      item_key: itemKey,
      label: safeString(slot.label || slot.item_label || slot.itemLabel || slot.name || itemKey, 128),
      quantity: Math.max(1, firstFiniteNumber(slot.quantity, slot.count, slot.stack_count, slot.stackCount, 1))
    };
  }).filter(Boolean);
  const capacity = firstFiniteNumber(
    source?.capacity?.slots_total,
    source?.slots_total,
    source?.slot_capacity,
    source?.max_slots,
    slots.length || null
  );
  const occupiedSlots = firstFiniteNumber(
    source?.capacity?.slots_used,
    source?.occupied_slots,
    source?.occupiedSlots,
    items.length
  );
  return {
    capacity,
    occupied_slots: occupiedSlots,
    free_slots: capacity === null || occupiedSlots === null ? null : Math.max(0, capacity - occupiedSlots),
    inventory_revision: firstFiniteNumber(source?.authority?.inventory_revision, source?.inventory_revision, raw?.authority?.inventory_revision),
    items
  };
}

function inventoryFailure({ error, detail = null } = {}) {
  return {
    ok: false,
    tool: TARTARIAN_WEBMCP_READ_INVENTORY_TOOL,
    patch: TARTARIAN_WEBMCP_0E_PATCH_ID,
    inventory: null,
    error: safeString(error, 180) || "INVENTORY_READ_FAILED",
    detail: safeString(detail, 240),
    next_actions: [TARTARIAN_WEBMCP_OBSERVE_TOOL]
  };
}

function safeCoord(value) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const x =
    safeInteger(
      value.x
    );

  const y =
    safeInteger(
      value.y
    );

  if (
    x === null ||
    y === null
  ) {
    return null;
  }

  return {
    x,
    y
  };
}

function sameCoord(left, right) {
  const a =
    safeCoord(left);

  const b =
    safeCoord(right);

  return (
    !!a &&
    !!b &&
    a.x === b.x &&
    a.y === b.y
  );
}

function safeCounts(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const out = {};

  for (
    const [
      key,
      rawCount
    ]
    of
    Object.entries(value)
  ) {
    const name =
      safeString(
        key,
        64
      );

    const count =
      Number(rawCount);

    if (
      !name ||
      !Number.isFinite(count) ||
      count < 0
    ) {
      continue;
    }

    out[name] =
      Math.trunc(count);
  }

  return out;
}

function distanceBetween(a, b) {
  const left =
    safeCoord(a);

  const right =
    safeCoord(b);

  if (
    !left ||
    !right
  ) {
    return null;
  }

  return (
    Math.abs(
      left.x -
      right.x
    )
    +
    Math.abs(
      left.y -
      right.y
    )
  );
}

function compactTarget(target) {
  if (
    !target ||
    typeof target !== "object"
  ) {
    return null;
  }

  const source =
    target.gameplayObject ||
    target.object ||
    target;

  const activationTool = safeString(source.activationTool || source.activation_tool || target.activationTool || target.activation_tool, 96);
  return {
    id:
      safeString(
        source.id ||
        source.objectId ||
        source.backendId ||
        source.actorAgentId
      ),

    kind:
      safeString(
        source.kind ||
        source.targetType ||
        source.sourceKind
      ),

    label:
      safeString(
        source.label ||
        source.displayLabel ||
        source.designation
      ),

    tile:
      safeCoord(
        source.tile ||
        source.coord
      ),

    source_kind:
      safeString(
        source.sourceKind
      ),
    activation_tool: activationTool,
    tool_hints: buildToolHints({ kind: source.kind || target.kind, sourceKind: source.sourceKind, activationTool })
  };
}

function selectedTargetId(target) {
  const source =
    target?.gameplayObject ||
    target?.object ||
    target ||
    null;

  return safeString(
    source?.id ||
    source?.objectId ||
    source?.backendId ||
    source?.actorAgentId ||
    target?.objectId ||
    target?.id,
    128
  );
}

function compactNearbyObject(
  row,
  origin
) {
  if (
    !row ||
    typeof row !== "object"
  ) {
    return null;
  }

  const id =
    safeString(
      row.id,
      128
    );

  const tile =
    safeCoord(
      row.tile
    );

  if (
    !id ||
    !tile
  ) {
    return null;
  }

  const activationTool = safeString(row.activationTool, 96);
  return {
    id,

    kind:
      safeString(
        row.kind,
        64
      ),

    label:
      safeString(
        row.label
      ),

    tile,

    distance:
      distanceBetween(
        origin,
        tile
      ),

    source_kind:
      safeString(
        row.sourceKind,
        64
      ),

    activation_tool: activationTool,
    tool_hints: buildToolHints({ kind: row.kind, sourceKind: row.sourceKind, activationTool })
  };
}

function observeFailure(
  error,
  detail = null
) {
  return {
    ok: false,

    tool:
      TARTARIAN_WEBMCP_OBSERVE_TOOL,

    patch:
      TARTARIAN_WEBMCP_0A_PATCH_ID,

    read_only:
      true,

    error:
      safeString(
        error,
        128
      )
      ||
      "observe_world_failed",

    detail:
      safeString(
        detail,
        240
      ),

    next_actions: [
      TARTARIAN_WEBMCP_OBSERVE_TOOL
    ]
  };
}

function readMoveFailureCode(
  result
) {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return null;
  }

  const hardFailureCandidates = [
    result.error,
    result.code,
    result.data?.error,
    result.data?.code,
    result.backend?.error,
    result.backend?.code
  ];

  for (
    const candidate
    of
    hardFailureCandidates
  ) {
    const text =
      safeString(
        candidate,
        180
      );

    if (text) {
      return text;
    }
  }

  // Successful controller reasons such as "backend_move" are lifecycle data.
  if (result.ok === false) {
    return (
      safeString(result.reason, 180) ||
      safeString(result.detail, 180) ||
      safeString(result.backend?.reason, 180) ||
      "MOVE_REJECTED"
    );
  }

  return null;
}

function readExplicitSimAck(result) {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return null;
  }

  const candidates = [
    result.simAckOk,
    result.sim_ack_ok,
    result.data?.simAckOk,
    result.data?.sim_ack_ok,
    result.backend?.simAckOk,
    result.backend?.sim_ack_ok
  ];

  for (
    const candidate
    of
    candidates
  ) {
    if (
      candidate === true ||
      candidate === false
    ) {
      return candidate;
    }
  }

  return null;
}

function readMovementApplied(
  result
) {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return null;
  }

  const candidates = [
    result.movementApplied,
    result.movement_applied,
    result.data?.movementApplied,
    result.data?.movement_applied,
    result.backend?.movementApplied,
    result.backend?.movement_applied
  ];

  for (
    const candidate
    of
    candidates
  ) {
    if (
      candidate === true ||
      candidate === false
    ) {
      return candidate;
    }
  }

  return null;
}

function moveFailure({
  error,
  detail = null,
  requestedCoord = null,
  fromCoord = null,
  newCoord = null,
  movementApplied = false,
  simAckOk = false,
  authorityResult = null
} = {}) {
  return {
    ok: false,

    tool:
      TARTARIAN_WEBMCP_MOVE_TOOL,

    patch:
      TARTARIAN_WEBMCP_0B_PATCH_ID,

    requested_gait:
      "walk",

    requested_coord:
      safeCoord(
        requestedCoord
      ),

    from_coord:
      safeCoord(
        fromCoord
      ),

    new_coord:
      safeCoord(
        newCoord
      ),

    movement_applied:
      movementApplied === true,

    sim_ack_ok:
      simAckOk === true,

    error:
      safeString(
        error,
        180
      )
      ||
      "MOVE_REJECTED",

    detail:
      safeString(
        detail,
        240
      ),

    authority_status:
      safeString(
        authorityResult?.status,
        80
      ),

    next_actions: [
      TARTARIAN_WEBMCP_OBSERVE_TOOL
    ]
  };
}

function actionFailure({ tool, error, detail = null, key = null, targetId = null, selectedTarget = null } = {}) {
  return {
    ok: false,
    tool,
    patch: TARTARIAN_WEBMCP_0C_PATCH_ID,
    ...(key !== null ? { key: safeInteger(key), accepted: false } : {}),
    ...(targetId !== null ? { target_id: safeString(targetId, 128), selection_applied: false } : {}),
    selected_target: compactTarget(selectedTarget),
    error: safeString(error, 180) || "ACTION_REJECTED",
    detail: safeString(detail, 240),
    next_actions: [TARTARIAN_WEBMCP_OBSERVE_TOOL]
  };
}

function commandFailureCode(result) {
  if (!result || typeof result !== "object") return "COMMAND_RESULT_UNAVAILABLE";
  for (const value of [result.error, result.code, result.body?.error, result.body?.code, result.result?.error, result.result?.code]) {
    const text = safeString(value, 180);
    if (text) return text;
  }
  if (result.ok === false || result.accepted === false) {
    return safeString(result.reason, 180) || safeString(result.message, 180) || "COMMAND_REJECTED";
  }
  return null;
}

export function createTartarianWebMcpBridge({
  getOperatorSession,
  getMovementState,
  getProvinceWindow,
  getSelectedTarget,
  moveToTile,
  selectTargetById,
  activateCommandSlot,
  activateSelectedTarget,
  readInventory
} = {}) {
  if (
    typeof getOperatorSession !== "function"
  ) {
    throw new Error(
      "WEBMCP_0A_REQUIRES_OPERATOR_SESSION_GETTER"
    );
  }

  if (
    typeof getMovementState !== "function"
  ) {
    throw new Error(
      "WEBMCP_0A_REQUIRES_MOVEMENT_STATE_GETTER"
    );
  }

  if (
    typeof getProvinceWindow !== "function"
  ) {
    throw new Error(
      "WEBMCP_0A_REQUIRES_PROVINCE_WINDOW_GETTER"
    );
  }

  function readAuthorityContext() {
    const session =
      getOperatorSession() ||
      null;

    if (
      session?.authenticated !== true
    ) {
      return {
        ok: false,
        error:
          "OPERATOR_SESSION_REQUIRED"
      };
    }

    const movement =
      getMovementState() ||
      null;

    if (!movement) {
      return {
        ok: false,
        error:
          "MOVEMENT_STATE_UNAVAILABLE"
      };
    }

    if (
      movement.backendStateLoaded !== true
    ) {
      return {
        ok: false,
        error:
          "AUTHORITATIVE_STATE_NOT_READY"
      };
    }

    const sessionAgentId =
      safeString(
        session.agentId,
        128
      );

    const movementAgentId =
      safeString(
        movement.agentId,
        128
      );

    if (
      !sessionAgentId ||
      !movementAgentId
    ) {
      return {
        ok: false,
        error:
          "ACTIVE_AGENT_ID_UNAVAILABLE"
      };
    }

    if (
      sessionAgentId !==
      movementAgentId
    ) {
      return {
        ok: false,

        error:
          "OPERATOR_AGENT_MISMATCH",

        detail:
          `session=${sessionAgentId} movement=${movementAgentId}`
      };
    }

    return {
      ok: true,
      session,
      movement,
      agentId:
        movementAgentId
    };
  }

  function observeWorld() {
    const authority =
      readAuthorityContext();

    if (
      authority.ok !== true
    ) {
      return observeFailure(
        authority.error,
        authority.detail
      );
    }

    const {
      session,
      movement,
      agentId
    } = authority;

    const tile =
      safeCoord(
        movement.tile ||
        movement.agentState?.coord
      );

    const zoneId =
      safeString(
        movement.zone?.zoneId ||
        movement.agentState?.zone_id ||
        movement.agentState?.zoneId,
        128
      );

    const province =
      getProvinceWindow() ||
      null;

    const rows =
      Array.isArray(
        province?.objects
      )
        ?
        province.objects
        :
        [];

    const nearby =
      rows
        .map(
          (
            row
          ) =>
            compactNearbyObject(
              row,
              tile
            )
        )
        .filter(Boolean)
        .sort(
          (
            left,
            right
          ) => {
            const leftDistance =
              Number.isFinite(
                left.distance
              )
                ?
                left.distance
                :
                Number.MAX_SAFE_INTEGER;

            const rightDistance =
              Number.isFinite(
                right.distance
              )
                ?
                right.distance
                :
                Number.MAX_SAFE_INTEGER;

            if (
              leftDistance !==
              rightDistance
            ) {
              return (
                leftDistance -
                rightDistance
              );
            }

            return String(
              left.label ||
              left.id
            ).localeCompare(
              String(
                right.label ||
                right.id
              )
            );
          }
        )
        .slice(
          0,
          MAX_NEARBY_ROWS
        );

    return {
      ok: true,

      tool:
        TARTARIAN_WEBMCP_OBSERVE_TOOL,

      patch:
        TARTARIAN_WEBMCP_0A_PATCH_ID,

      read_only:
        true,

      world_instance_id:
        safeString(
          session.worldInstanceId ||
          movement.agentState
            ?.world_instance_id,
          128
        ),

      character: {
        agent_id:
          agentId,

        coord:
          tile,

        zone_id:
          zoneId,

        backend_state_loaded:
          true,

        movement_pending:
          movement.pending === true
      },

      province: {
        zone_id:
          safeString(
            province?.zoneId ||
            zoneId,
            128
          ),

        center:
          safeCoord(
            province?.center
          ),

        radius:
          Number.isFinite(
            Number(
              province?.radius
            )
          )
            ?
            Math.max(
              0,
              Math.trunc(
                Number(
                  province.radius
                )
              )
            )
            :
            null,

        source:
          safeString(
            province?.source,
            128
          ),

        counts:
          safeCounts(
            province?.counts
          )
      },

      selected_target:
        typeof getSelectedTarget ===
        "function"
          ?
          compactTarget(
            getSelectedTarget()
          )
          :
          null,

      nearby,

      nearby_count:
        nearby.length,

      observed_at:
        new Date()
          .toISOString(),

      next_actions: [
        TARTARIAN_WEBMCP_MOVE_TOOL
      ]
    };
  }

  async function readWorldInventory() {
    const authority = readAuthorityContext();
    if (authority.ok !== true) {
      return inventoryFailure({ error: authority.error, detail: authority.detail });
    }
    if (typeof readInventory !== "function") {
      return inventoryFailure({ error: "INVENTORY_AUTHORITY_UNAVAILABLE" });
    }

    let raw;
    try {
      raw = await readInventory({ agentId: authority.agentId, source: "webmcp" });
    } catch (error) {
      return inventoryFailure({ error: "INVENTORY_AUTHORITY_THROW", detail: error?.message || error });
    }
    if (raw?.ok === false) {
      return inventoryFailure({ error: raw.error || raw.reason || "INVENTORY_READ_REJECTED", detail: raw.detail || raw.message });
    }

    const inventory = compactInventory(raw);
    if (!inventory) return inventoryFailure({ error: "INVENTORY_SNAPSHOT_UNAVAILABLE" });
    return {
      ok: true,
      tool: TARTARIAN_WEBMCP_READ_INVENTORY_TOOL,
      patch: TARTARIAN_WEBMCP_0E_PATCH_ID,
      agent_id: safeString(authority.agentId, 128),
      inventory,
      error: null,
      detail: null,
      next_actions: [TARTARIAN_WEBMCP_OBSERVE_TOOL]
    };
  }

  async function moveWorld({
    x,
    y
  } = {}) {
    const targetX =
      safeInteger(x);

    const targetY =
      safeInteger(y);

    if (
      targetX === null ||
      targetY === null
    ) {
      return moveFailure({
        error:
          "INVALID_MOVE_COORDINATE",
        detail:
          "x and y must both be integers"
      });
    }

    const requestedCoord = {
      x:
        targetX,
      y:
        targetY
    };

    const authority =
      readAuthorityContext();

    if (
      authority.ok !== true
    ) {
      return moveFailure({
        error:
          authority.error,
        detail:
          authority.detail,
        requestedCoord
      });
    }

    const before =
      authority.movement;

    const fromCoord =
      safeCoord(
        before.tile ||
        before.agentState?.coord
      );

    if (!fromCoord) {
      return moveFailure({
        error:
          "CURRENT_COORDINATE_UNAVAILABLE",
        requestedCoord
      });
    }

    if (
      before.pending === true
    ) {
      return moveFailure({
        error:
          "MOVEMENT_BUSY",
        detail:
          "The existing movement controller already has a movement pending.",
        requestedCoord,
        fromCoord,
        newCoord:
          fromCoord
      });
    }

    if (
      typeof moveToTile !==
      "function"
    ) {
      return moveFailure({
        error:
          "MOVEMENT_AUTHORITY_UNAVAILABLE",
        detail:
          "The WebMCP bridge is not bound to the existing movement controller.",
        requestedCoord,
        fromCoord,
        newCoord:
          fromCoord
      });
    }

    let authorityResult =
      null;

    try {
      /*
       * IMPORTANT:
       * This callback must be a thin adapter around the CURRENT production
       * BackendMovementController.moveToTile(...) call shape.
       *
       * It must not POST /api/intent itself and must not mutate Three.js.
       */
      authorityResult = await moveToTile({
        x: targetX,
        y: targetY,
        requestedGait: "walk",
        source: "webmcp"
      });
    } catch (error) {
      const after =
        getMovementState() ||
        before;

      return moveFailure({
        error:
          safeString(
            error?.code ||
            error?.message ||
            error,
            180
          )
          ||
          "MOVE_AUTHORITY_THROW",

        requestedCoord,

        fromCoord,

        newCoord:
          safeCoord(
            after.tile ||
            after.agentState?.coord
          )
          ||
          fromCoord,

        movementApplied:
          false,

        simAckOk:
          false
      });
    }

    const after =
      getMovementState() ||
      before;

    const newCoord =
      safeCoord(
        after.tile ||
        after.agentState?.coord
      )
      ||
      fromCoord;

    const reachedRequested =
      sameCoord(
        newCoord,
        requestedCoord
      );

    const explicitApplied =
      readMovementApplied(
        authorityResult
      );

    const explicitSimAck =
      readExplicitSimAck(
        authorityResult
      );

    const failureCode =
      readMoveFailureCode(
        authorityResult
      );

    /*
     * Error honesty law:
     *
     * - an explicit false acknowledgement always loses;
     * - an explicit movementApplied:false always loses;
     * - an error code always loses;
     * - the post-controller coordinate must actually equal the requested tile;
     * - an ok:true wrapper alone is never enough.
     */
    const movementApplied =
      explicitApplied === false
        ?
        false
        :
        reachedRequested;

    const simAckOk =
      explicitSimAck === false
        ?
        false
        :
        (
          failureCode
            ?
            false
            :
            (
              explicitSimAck === true
                ?
                true
                :
                (
                  authorityResult?.ok ===
                  true
                  &&
                  movementApplied
                )
            )
        );

    const ok =
      movementApplied === true
      &&
      simAckOk === true
      &&
      !failureCode;

    if (!ok) {
      return moveFailure({
        error:
          failureCode ||
          (
            explicitSimAck === false
              ?
              "SIM_MOVE_REJECTED"
              :
              (
                explicitApplied ===
                false
                  ?
                  "MOVE_NOT_APPLIED"
                  :
                  "MOVE_DESTINATION_NOT_REACHED"
              )
          ),

        detail:
          safeString(
            authorityResult
              ?.detail ||
            authorityResult
              ?.data
              ?.detail,
            240
          ),

        requestedCoord,

        fromCoord,

        newCoord,

        movementApplied,

        simAckOk,

        authorityResult
      });
    }

    return {
      ok: true,

      tool:
        TARTARIAN_WEBMCP_MOVE_TOOL,

      patch:
        TARTARIAN_WEBMCP_0B_PATCH_ID,

      requested_gait:
        "walk",

      requested_coord:
        requestedCoord,

      from_coord:
        fromCoord,

      new_coord:
        newCoord,

      movement_applied:
        true,

      sim_ack_ok:
        true,

      error:
        null,

      detail:
        null,

      authority_status:
        safeString(
          authorityResult?.status,
          80
        ),

      next_actions: [
        TARTARIAN_WEBMCP_OBSERVE_TOOL
      ]
    };
  }

  async function selectWorldTarget({ targetId } = {}) {
    const safeTargetId = safeString(targetId, 128);
    if (!safeTargetId) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
        error: "INVALID_TARGET_ID",
        targetId
      });
    }

    const authority = readAuthorityContext();
    const current = getSelectedTarget?.() || null;
    if (authority.ok !== true) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
        error: authority.error,
        detail: authority.detail,
        targetId: safeTargetId,
        selectedTarget: current
      });
    }
    if (typeof selectTargetById !== "function") {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
        error: "TARGET_SELECTION_AUTHORITY_UNAVAILABLE",
        targetId: safeTargetId,
        selectedTarget: current
      });
    }

    let result;
    try {
      result = await selectTargetById({ targetId: safeTargetId, source: "webmcp" });
    } catch (error) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
        error: "TARGET_SELECTION_THROW",
        detail: error?.message || error,
        targetId: safeTargetId,
        selectedTarget: getSelectedTarget?.() || null
      });
    }

    const selected = getSelectedTarget?.() || result?.selected || null;
    if (result?.ok === false || selectedTargetId(selected) !== safeTargetId) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
        error: result?.error || result?.reason || "TARGET_SELECTION_NOT_CONFIRMED",
        detail: result?.detail || result?.message,
        targetId: safeTargetId,
        selectedTarget: selected
      });
    }

    return {
      ok: true,
      tool: TARTARIAN_WEBMCP_SELECT_TARGET_TOOL,
      patch: TARTARIAN_WEBMCP_0C_PATCH_ID,
      target_id: safeTargetId,
      selection_applied: true,
      selected_target: compactTarget(selected),
      error: null,
      detail: null,
      next_actions: [
        TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
        TARTARIAN_WEBMCP_OBSERVE_TOOL
      ]
    };
  }

  async function activateWorldCommand({ key } = {}) {
    const slotIndex = safeInteger(key);
    const selected = getSelectedTarget?.() || null;
    if (slotIndex === null || slotIndex < 1 || slotIndex > 9) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
        error: "INVALID_COMMAND_KEY",
        key,
        selectedTarget: selected
      });
    }

    const authority = readAuthorityContext();
    if (authority.ok !== true || typeof activateCommandSlot !== "function") {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
        error: authority.ok === true ? "COMMAND_AUTHORITY_UNAVAILABLE" : authority.error,
        detail: authority.detail,
        key: slotIndex,
        selectedTarget: selected
      });
    }

    let result;
    try {
      result = await activateCommandSlot({ slotIndex, source: "webmcp" });
    } catch (error) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
        error: "COMMAND_AUTHORITY_THROW",
        detail: error?.message || error,
        key: slotIndex,
        selectedTarget: getSelectedTarget?.() || null
      });
    }

    const error = commandFailureCode(result);
    if (error || result?.ok !== true || result?.accepted === false) {
      return actionFailure({
        tool: TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
        error: error || "COMMAND_NOT_ACCEPTED",
        detail: result?.detail || result?.message,
        key: slotIndex,
        selectedTarget: getSelectedTarget?.() || null
      });
    }

    return {
      ok: true,
      tool: TARTARIAN_WEBMCP_ACTIVATE_COMMAND_TOOL,
      patch: TARTARIAN_WEBMCP_0C_PATCH_ID,
      key: slotIndex,
      accepted: true,
      command: safeString(result.command || result.defaultAction || result.action || result.body?.tool, 96),
      message: safeString(result.message || result.body?.message, 240),
      selected_target: compactTarget(getSelectedTarget?.() || null),
      error: null,
      detail: null,
      next_actions: [TARTARIAN_WEBMCP_OBSERVE_TOOL]
    };
  }

  async function activateWorldTarget() {
    const authority = readAuthorityContext();
    const selected = getSelectedTarget?.() || null;
    const activationTool = compactTarget(selected)?.activation_tool || null;
    const failure = (error, detail = null) => ({
      ok: false,
      tool: TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL,
      patch: TARTARIAN_WEBMCP_0D_PATCH_ID,
      accepted: false,
      selected_target: compactTarget(selected),
      activation_tool: activationTool,
      error,
      detail,
      outcome: null,
      next_actions: [TARTARIAN_WEBMCP_OBSERVE_TOOL]
    });
    if (authority.ok !== true) return failure(authority.error, authority.detail);
    if (!selected) return failure("MISSING_SELECTED_TARGET");
    if (typeof activateSelectedTarget !== "function") return failure("INTERACTION_AUTHORITY_UNAVAILABLE");
    let result;
    try {
      result = await activateSelectedTarget({ source: "webmcp", doubleClick: true, force: true, allowVisualFallback: false, shiftKey: false });
    } catch (error) {
      return failure("INTERACTION_AUTHORITY_THROW", error?.message || String(error));
    }
    const nested = result?.result || result?.data || result?.body || null;
    const error = result?.error || result?.code || nested?.error || nested?.code ||
      ((result?.ok === false || result?.accepted === false) ? (result?.reason || result?.message || "INTERACTION_REJECTED") : null);
    const accepted = !error && result?.ok === true && result?.accepted !== false;
    if (!accepted) return failure(error || "INTERACTION_NOT_ACCEPTED", result?.detail || result?.message || result?.reason || nested?.detail);
    return {
      ok: true,
      tool: TARTARIAN_WEBMCP_ACTIVATE_TARGET_TOOL,
      patch: TARTARIAN_WEBMCP_0D_PATCH_ID,
      accepted: true,
      selected_target: compactTarget(getSelectedTarget?.() || selected),
      activation_tool: activationTool,
      error: null,
      detail: null,
      outcome: {
        tool: safeString(result.tool || nested?.tool || nested?.activation_tool, 96),
        message: safeString(result.message || result.readableSummary || nested?.message || nested?.detail, 240),
        resource: safeString(result.resource_kind || nested?.resource_kind || nested?.resource, 96),
        quantity: Number.isFinite(Number(result.quantity ?? nested?.quantity ?? nested?.amount)) ? Number(result.quantity ?? nested?.quantity ?? nested?.amount) : null,
        inventory_revision: Number.isFinite(Number(result.inventory_revision ?? nested?.inventory_revision)) ? Number(result.inventory_revision ?? nested?.inventory_revision) : null
      },
      next_actions: [TARTARIAN_WEBMCP_OBSERVE_TOOL]
    };
  }

  return {
    patch: TARTARIAN_WEBMCP_0E_PATCH_ID,

    observeWorld,

    readWorldInventory,

    moveWorld,

    selectWorldTarget,

    activateWorldCommand,

    activateWorldTarget
  };
}
