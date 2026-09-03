/*
 * Public challenge excerpt from Tartarian's production app_boot.js.
 * Contains only the WebMCP integration seam.
 * The full production client and hosted backend are external/private dependencies.
 */

import { createTartarianWebMcpBridge } from "../src/webmcp/tartarian_webmcp_bridge.js";
import { installTartarianWebMcp } from "../src/webmcp/tartarian_webmcp_tools.js";

/*
 * The production boot owns these dependencies. This excerpt keeps the injection
 * boundary visible without including gameplay, auth, UI, or backend source.
 */
export async function installProductionWebMcpExcerpt({
  getOperatorSession,
  movementController,
  interactionRuntime,
  getSelectedTarget,
  gameplayObjectPass,
  setSelectedTarget,
  commandBarRuntime,
  isCommandUiBlocked,
  activateCommandSlot,
  currentCommandBarAgentId,
  getInventoryState,
  getTargetContext,
  activateInteractionTarget,
  fetchAuthoritativeInventory,
  logger = console,
  previousRuntime = null,
  windowRef = globalThis.window
} = {}) {
  const bridge = createTartarianWebMcpBridge({
    getOperatorSession,
    getMovementState: () => movementController?.getState?.() || null,
    getProvinceWindow: () => interactionRuntime?.getProvinceObjectWindowStatus?.() || null,
    getSelectedTarget,
    moveToTile: async ({ x, y, requestedGait }) =>
      await movementController.moveToTile({ x, y }, { requestedGait: requestedGait || "walk" }),
    selectTargetById: async ({ targetId }) => {
      const safeTargetId = String(targetId || "").trim();
      const object = (gameplayObjectPass?.listObjects?.() || [])
        .find((row) => String(row?.id || "") === safeTargetId) || null;
      if (!object) return { ok: false, error: "TARGET_NOT_VISIBLE" };
      const target = {
        kind: "gameplay_object",
        targetType: "gameplay_object",
        id: object.id,
        objectId: object.id,
        label: object.label || object.id,
        tile: object.tile || null,
        activationTool: object.activationTool || null,
        gameplayObject: object
      };
      return { ok: true, selected: setSelectedTarget(target, "webmcp-select-target") };
    },
    activateCommandSlot: async ({ slotIndex }) => {
      if (commandBarRuntime?.ok !== true) return { ok: false, error: "command_bar_runtime_unavailable" };
      if (isCommandUiBlocked?.() === true) return { ok: false, error: "command_ui_blocked" };
      return await activateCommandSlot(currentCommandBarAgentId(), Number(slotIndex), {
        getInventoryState,
        getTargetContext,
        getSelectedTarget
      });
    },
    activateSelectedTarget: async (options = {}) => {
      const selected = getSelectedTarget?.() || null;
      if (!selected) return { ok: false, reason: "missing_selected_target" };
      return await activateInteractionTarget(selected, {
        doubleClick: options.doubleClick !== false,
        force: options.force !== false,
        allowVisualFallback: false,
        shiftKey: false,
        source: "webmcp-activate-target"
      });
    },
    readInventory: async ({ agentId } = {}) => {
      const safeAgentId = String(agentId || currentCommandBarAgentId() || "").trim();
      if (!safeAgentId) return { ok: false, error: "inventory_agent_unresolved" };
      return await fetchAuthoritativeInventory(safeAgentId);
    }
  });

  previousRuntime?.dispose?.();
  const runtime = await installTartarianWebMcp({
    bridge,
    logger,
    enableMove: true,
    enableActionTools: true,
    enableWorldInteraction: true,
    enableInventoryRead: true
  });

  windowRef?.addEventListener?.("pagehide", () => runtime.dispose?.(), { once: true });
  return { bridge, runtime };
}
