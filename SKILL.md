---
name: tartarian-webmcp-operator
description: Operate the live Tartarian.ai world collaboratively with a human through Tartarian WebMCP Site Tools. Use this skill for world observation, navigation, inventory awareness, resource gathering, world interaction, targeting, and Command Bar actions.
---

# Tartarian WebMCP Operator

You operate the character currently authenticated in the open `play.tartarian.ai` world.

You use the human operator's current live page session.

You do **not** own a separate autonomous Tartarian MCP identity in this workflow.

# Operating principle

Tartarian is a persistent authoritative world.

Your job is to:

```text
observe current truth
→ understand the available affordance
→ request an appropriate action
→ inspect Tartarian's result
→ continue from the resulting world state
```

Do not make an action merely appear successful.

Never invent:

- coordinates;
- target IDs;
- inventory contents;
- item quantities;
- movement results;
- extraction results;
- combat results;
- interaction success.

Tartarian's current structured Site Tool results are authoritative.

# Tool authority

Prefer Tartarian Site Tools over generic browser clicking or synthetic keyboard/mouse input.

Use the rendered world for visual context.

Use Site Tool results for structured world truth.

The Site Tool's current description, schema, and result contract take precedence over this Skill if they ever differ.

This Skill teaches operating doctrine.

The live Site Tools define the exact available actions and arguments.

# Tartarian Site Tools

The current Tartarian WebMCP surface may include:

- `tartarian_observe_world`
- `tartarian_move`
- `tartarian_select_target`
- `tartarian_activate_target`
- `tartarian_activate_command`

Use only tools currently exposed by the live Tartarian page.

Do not invent unavailable tools.

# Observe before acting

`tartarian_observe_world` is the primary world read.

Observe before beginning a meaningful action.

Observe again after:

- movement;
- extraction;
- world interaction;
- combat;
- a human operator action;
- a failed action where world state may have changed.

Nearby world rows may include information such as:

- `id`
- `kind`
- `label`
- `tile`
- `distance`
- `source_kind`
- `activation_tool`
- `tool_hints`

Treat entity IDs as identity.

Treat coordinates as current-position snapshots.

This distinction is especially important for moving actors.

# Inventory awareness

Use the current Tartarian structured inventory state when it is available through the live page or Site Tool results.

When the human asks what they are carrying:

1. read the current available inventory state;
2. report the items and quantities actually present;
3. distinguish occupied inventory from empty slots when that information is available;
4. do not infer an item merely from a Command Bar binding;
5. do not assume an earlier inventory snapshot is still current after gathering, trading, consuming, equipping, or other inventory-changing actions.

If current inventory information is unavailable, say that it is unavailable rather than reconstructing it from memory.

A Command Bar item and an inventory item are related concepts but are not interchangeable evidence.

# Human collaboration

The human operator can move, select, interact, or otherwise change the world between any two of your calls.

After the human acts, discard stale positional and selection assumptions.

Observe again before continuing a multi-step plan.

Do not assume the character remains on the same tile because it occupied that tile earlier in the conversation.

# Action families

The most important operational distinction is:

> **Selection is not activation. World interaction is not Command Bar activation.**

Tartarian has different action families.

## World interaction

Use `tartarian_activate_target` for the selected world object's normal primary interaction.

Typical examples include:

- resource extraction;
- normal object activation;
- gates and transitions when permitted;
- structures and other interactive world objects;
- other world interactions represented by the target's current interaction contract.

If observation shows:

```text
activation_tool: extract
```

or a hint such as:

```text
tool_hints.world_interaction:
tartarian_activate_target
```

the intended sequence is:

```text
select_target
→
activate_target
```

Do **not** use a Command Bar key merely because the selected object is a resource.

A Field Shovel Command Bar binding is not a generic extraction command.

## Command Bar actions

Use `tartarian_activate_command` for prepared Command Bar actions.

These can represent:

- Basic Strike;
- equipped or prepared item actions;
- abilities;
- other current Command Bar bindings.

Key 1 commonly provides the current Basic Strike fallback when not replaced by another binding.

Other keys represent whatever is currently bound.

Never assume the meaning of a Command Bar key from an old conversation when current state can determine it.

# Movement doctrine

`tartarian_move` requests movement toward a world coordinate through Tartarian's existing movement authority.

The Sim is the final judge of whether the requested destination is legal.

Do **not** assume every movement request must be exactly one tile.

## Ordinary travel to a static destination

For a known static destination such as:

- a resource;
- a gate;
- a structure;
- a landmark;
- a fixed world coordinate;

prefer an efficient larger movement request toward or to the destination when Tartarian accepts it.

Do not unnecessarily walk one tile at a time across open terrain.

Preferred travel loop:

```text
observe
→
identify static destination
→
request a useful larger move toward or to it
→
observe
→
correct remaining distance
```

If Tartarian accepts the larger request, continue from the resulting coordinate.

If Tartarian rejects the request because it is too far, blocked, non-adjacent under the current rule, or otherwise illegal:

```text
observe current state
→
reduce or correct the movement request
→
continue
```

Never claim movement occurred unless the structured result confirms it.

## Precision movement

Use smaller corrective movement when:

- approaching the exact tile of a resource;
- entering interaction range;
- entering combat range;
- navigating around an obstacle;
- crossing constrained terrain;
- the larger movement request is rejected;
- exact final positioning matters.

Example:

```text
large travel move
→
observe
→
resource is now nearby
→
smaller corrective move
→
observe
→
stand on required tile
→
select
→
activate_target
```

## Movement strategy

Prefer:

```text
STATIC + FAR
→ larger efficient movement

STATIC + CLOSE
→ precision movement

MOVING TARGET
→ move, observe, reacquire

MOVE REJECTED
→ observe, reduce/correct, retry deliberately
```

Do not mechanically choose one-tile movement unless the current situation or Tartarian authority requires it.

# Resource gathering

For a visible resource such as Wood:

```text
observe_world
→
locate the desired resource ID and current tile
→
make an efficient movement request toward it
→
observe_world
→
correct position as needed
→
confirm the same resource ID is still present
→
move onto or within the required interaction position
→
observe_world
→
select_target using the exact resource ID
→
activate_target
→
inspect the structured result
→
observe_world again
```

Use larger travel movement while the resource is distant.

Use precision movement as you approach the resource.

If extraction succeeds, report only what Tartarian confirms.

If the result provides quantity or inventory information, use it.

If it does not, do not invent a quantity.

After successful gathering, refresh current inventory information before answering questions about the new inventory state.

If extraction is rejected because of position or range, correct position according to current world truth and try again.

If the same unchanged extraction attempt fails repeatedly for the same reason, stop repeating it and explain the blocker.

## Resource interaction is not combat

If a resource produces:

```text
target_actor_not_found
```

after a Command Bar action, the wrong action family was used.

Return to:

```text
observe
→
select resource
→
activate_target
```

Do not repeatedly swing a weapon or Command Bar tool at a normal resource unless Tartarian explicitly defines that as the correct interaction.

# Target selection

Use exact target IDs returned by current observation.

Do not invent target IDs.

Do not select by screen coordinates.

`tartarian_select_target` changes focus only.

It does not automatically:

- move;
- extract;
- enter;
- attack;
- activate an object.

After selection, determine the correct action family.

Typical rule:

```text
world_interaction hint
→
activate_target

prepared combat/item action
→
activate_command
```

# World activation

`tartarian_activate_target` operates the currently selected target through Tartarian's normal world interaction contract.

It does not mean:

```text
attack selected target
```

It does not mean:

```text
press Key 2
```

It does not mean:

```text
extract regardless of position
```

Normal world authority remains active.

If activation is rejected, read the actual reason and adjust only when that reason supports an adjustment.

# Combat

For combat:

```text
observe_world
→
identify a current combat actor
→
move into legal range if necessary
→
observe_world
→
select_target using the exact actor ID
→
activate_command using the appropriate prepared key
→
observe_world again
```

If Tartarian reports:

```text
Too far to strike. Move within 1 tile.
```

do not immediately repeat the strike.

Move closer according to current world state.

Then observe again before attacking.

If a combat action is rejected, preserve Tartarian's actual reason.

Do not turn a rejection into an apparent success.

# Chasing moving actors

Moving actors require different movement behavior from static destinations.

The critical rule is:

> **Preserve the actor ID. Discard its old coordinate.**

A moving actor's identity may remain stable while its position changes continuously.

Use this loop:

```text
observe
→
find the desired target ID
→
read its CURRENT tile
→
make a useful movement request toward it
→
observe again
→
find the SAME target ID
→
read its NEW tile
→
recompute distance
→
continue
```

Do not commit to long travel toward a coordinate belonging to a moving actor unless a fresh observation still supports that destination.

As distance decreases, use shorter movement corrections so you can react to changes in the actor's position.

Never attack merely because you reached the actor's previous tile.

Attack only when a fresh observation shows the same target ID currently within legal range.

## Lost targets

If the same moving target ID disappears:

1. observe once more;
2. do not silently switch to a different actor;
3. if the original ID remains absent, report that the target was lost.

If the human asks you to reacquire an actor by name or type, a new target ID may be chosen only from a fresh observation.

Do not present the new actor as though it were the original target.

## Unproductive pursuit

Do not chase indefinitely.

If repeated movement and fresh observations are not reducing the distance to a moving actor, explain that the target cannot currently be intercepted reliably with the available movement loop.

The human can then choose whether to continue, change targets, or take another action.

# Command activation

`tartarian_activate_command` activates one existing Command Bar slot.

It does not automatically:

- choose a target;
- move toward a target;
- change Command Bar bindings;
- convert world interaction into combat;
- bypass range;
- bypass inventory rules;
- bypass Drive;
- bypass Order restrictions;
- bypass Sim authority.

Use current target and world state before choosing a command.

# Failure discipline

Never reinterpret rejection as success.

React to structured failures according to their meaning.

Examples:

```text
Too far to strike
→
observe and move closer

target_actor_not_found
→
selected object is not a valid current combat actor
or combat identity became stale

TARGET_NOT_VISIBLE
→
observe current world truth

MOVEMENT_BUSY
→
allow current movement to settle
then observe again

interaction_contract_not_activatable
→
selected object does not currently support normal world activation

missing_selected_target
→
observe and select an explicit current target
```

Do not blindly repeat an unchanged action that has already failed for the same reason.

Change something relevant first or report the blocker.

# Efficient planning

Avoid unnecessary tool calls when a safe larger action is available.

At the same time, do not sacrifice current world truth for speed.

A useful general pattern is:

```text
far + static
→ act efficiently

near + precise
→ act carefully

moving
→ refresh frequently

failed
→ diagnose before retrying
```

# Communication

Keep the human informed of meaningful outcomes.

For simple successful actions, concise confirmation is enough.

For failures, include the real Tartarian reason when useful.

When asked for current state such as:

- location;
- nearby entities;
- selected target;
- inventory;

read current structured state rather than relying on conversation memory.

# Security

Never ask the human to paste into chat:

- Tartarian session cookies;
- magic-link tokens;
- bearer tokens;
- private authentication material.

Authentication belongs to the human's Tartarian browser session.

Site Tools operate through that authorized page session.

# Final rule

Tartarian is a living authoritative world.

Observe what is true now.

Choose the correct existing affordance.

Use movement efficiently when the destination is stable.

Re-observe frequently when the world is changing.

Request the action.

Then report what Tartarian actually did.
