---
name: API server zod imports
description: Why zod cannot be imported directly in api-server routes and what to use instead.
---

## Rule
Never write `import { z } from "zod"` or `import { z } from "zod/v4"` inside `artifacts/api-server/src/routes/*.ts`.

**Why:** esbuild bundles the api-server and cannot resolve `zod` as it is not a direct declared dependency of the api-server package. It only exists transitively via `@workspace/api-zod`. The build fails with "Could not resolve 'zod'".

**How to apply:**
- For routes that need request body validation: write a plain manual parsing helper function (e.g. `function parseBody(body: any): Result | null`). Check types with `typeof`, use `parseFloat`/`parseInt`, guard on falsy/NaN.
- If you need zod schemas, import them from `@workspace/api-zod` (pre-generated from the OpenAPI spec) — those are already externalized and work fine.
- The scratchpad in replit.md notes this pattern is intentional; new routes must follow it.
