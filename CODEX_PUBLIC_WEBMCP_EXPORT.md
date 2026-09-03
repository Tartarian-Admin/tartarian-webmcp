# CODEX TASK — Export the WebMCP Challenge Surface for the Public Repository

## Mission

Create a **public-safe export package** from the current private Tartarian production source for:

```text
https://github.com/Tartarian-Admin/tartarian-webmcp
```

Do not modify production gameplay behavior.

Do not publish the full production Dashboard or backend.

The public repository should contain the actual challenge-period WebMCP source, the integration seam needed to understand it, and deterministic smoke tests.

## Critical safety rule

Treat the production source as the authority for exact current filenames, exports, imports, result shapes, and test scripts.

This task document does not have the latest source mounted.

Inspect first.

Export second.

Do not rewrite mature production code just to match assumptions in this document.

## Source areas to locate

Search the current Dashboard source for:

```text
document.modelContext
registerTool
tartarian_observe_world
tartarian_read_inventory
tartarian_move
tartarian_select_target
tartarian_activate_target
tartarian_activate_command
TARTARIAN_WEBMCP
installTartarianWebMcp
createTartarianWebMcpBridge
```

Expected challenge files are likely under a path similar to:

```text
dashboard/public/src/webmcp/
dashboard/scripts/
dashboard/public/src/app_boot.js
dashboard/package.json
```

Use the actual current paths.

## Required public export

Create a staging directory named exactly:

```text
tartarian-webmcp-export/
```

Inside it create:

```text
tartarian-webmcp-export/
├─ src/
│  └─ webmcp/
│     ├─ tartarian_webmcp_bridge.js
│     └─ tartarian_webmcp_tools.js
├─ integration/
│  └─ app_boot_webmcp_wiring.js
├─ scripts/
│  └─ <relevant WebMCP smoke tests>
├─ package.json
└─ PUBLIC_EXPORT_MANIFEST.md
```

### 1. Actual bridge/tool source

Copy the **exact current production WebMCP bridge and Site Tool modules**.

Preserve comments and current logic.

If those files import small, safe helper modules required for the WebMCP code/tests to load, either copy those safe helper modules while preserving their relative structure, or, for the public export only, make the smallest self-contained adaptation necessary and document the difference in `PUBLIC_EXPORT_MANIFEST.md`.

Do not alter the production copies.

### 2. Integration seam

Do **not** copy the entire production `app_boot.js` unless you have verified it is appropriate and public-safe.

Instead create:

```text
integration/app_boot_webmcp_wiring.js
```

This must contain the real challenge-relevant integration wiring extracted from current `app_boot.js`, including enough context to show:

- how the WebMCP bridge is created
- which existing browser authorities are dependency-injected
- how the six tools are enabled/installed
- lifecycle/disposal wiring if present

Add a header comment:

```javascript
/*
 * Public challenge excerpt from Tartarian's production app_boot.js.
 * Contains only the WebMCP integration seam.
 * The full production client and hosted backend are external/private dependencies.
 */
```

Do not include unrelated auth implementation, private configuration, admin code, secrets, or unrelated game boot logic.

### 3. Smoke tests

Export the relevant deterministic WebMCP smoke tests.

Prefer the current final 0E aggregate smoke plus earlier phase smokes if they are still useful and self-contained.

At minimum public review should be able to see coverage for:

- six tool registration
- readOnly annotations
- authentication/authority guard behavior using fixtures
- inventory read fixture
- movement success/rejection truth
- exact target selection
- world-interaction vs. command separation
- shared AbortSignal/lifecycle
- no DOM synthetic input in the WebMCP layer

Tests must remain fixture-driven.

Do not include production credentials or make tests contact the live service.

### 4. Minimal public package.json

Do not copy a production package file if it contains unrelated private scripts.

Create a minimal public `package.json` that runs the exported smoke tests with Node.

Use the exact exported script filenames.

Example shape only:

```json
{
  "name": "tartarian-webmcp",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node scripts/<FINAL_EXPORTED_SMOKE>.mjs"
  }
}
```

If multiple exported tests should run, create an appropriate `test` command that runs them sequentially.

Avoid unnecessary dependencies.

### 5. Public export manifest

Create:

```text
PUBLIC_EXPORT_MANIFEST.md
```

Include:

```text
production source path
→ public export path
→ copied exact / excerpt / public-only adaptation
```

Document any code difference introduced solely to make the challenge snapshot self-contained.

State explicitly that no production backend source or secrets are included.

## Forbidden public content

Before packaging, verify the staging directory contains no:

```text
.env
.env.*
DATABASE_URL
API keys
bearer tokens
session cookies
magic-link tokens
OAuth secrets
Railway secrets
production credentials
judge email/login credentials
private DB dumps
private Sim source
private autonomous MCP server source
Git history from the private production repository
node_modules
build caches
```

Do not copy the production `.git/` directory.

## Secret scan

Run a conservative text scan over the staging directory for patterns similar to:

```text
SECRET
PASSWORD
TOKEN
API_KEY
DATABASE_URL
PRIVATE_KEY
BEARER
COOKIE
MAGIC_LINK
AUTHORIZATION
```

Review matches manually. Variable names and failure-code strings can be harmless; actual secret values are forbidden.

Also inspect for:

```text
@yopmail.com
```

The judge mailbox names belong in Devpost's private testing field, not the public repository.

## Static validation

Run syntax checks for exported JavaScript:

```bash
node --check <each exported JS/MJS file>
```

Then run:

```bash
npm test
```

from `tartarian-webmcp-export/`.

All fixture-driven WebMCP tests must pass.

## Package

Create:

```text
tartarian-webmcp-export.zip
```

The ZIP root should contain the contents of `tartarian-webmcp-export/`, not an unrelated parent tree.

The user will unzip/copy this package into the local GitHub Desktop clone of:

```text
Tartarian-Admin/tartarian-webmcp
```

The root `README.md`, `LICENSE`, `SKILL.md`, `CONTEST_CHANGES.md`, and `docs/` files are being prepared separately, so do not overwrite them unless explicitly asked.

## Completion report

Return:

```text
PUBLIC WEBMCP EXPORT

PRODUCTION BASELINE
<commit>

ACTUAL WEBMCP SOURCE FILES
<paths>

EXPORTED
<list>

INTEGRATION EXCERPT
source:
<path>

public:
integration/app_boot_webmcp_wiring.js

SMOKE TESTS
<list>

npm test:
PASS / FAIL

SYNTAX:
PASS / FAIL

SECRET SCAN:
PASS / FAIL
reviewed matches:
<list>

YOPMAIL ADDRESSES PRESENT:
NO / YES

PRIVATE BACKEND SOURCE PRESENT:
NO / YES

PRODUCTION .GIT HISTORY PRESENT:
NO / YES

ZIP:
<absolute local path>

NOTES:
<any public-only adaptations>
```

## Stop conditions

STOP rather than guessing if:

- the WebMCP source cannot be cleanly separated from private secrets;
- required WebMCP modules contain embedded credentials;
- the public export would require publishing the private Sim/backend;
- the tests require live production credentials;
- exact current challenge files cannot be identified confidently.

Report the blocker and the smallest safe solution.
