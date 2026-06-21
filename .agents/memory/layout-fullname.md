---
name: layout.tsx fullName optional chain
description: user.fullName can be undefined even after user null-check
---

In `artifacts/bank-mondial/src/components/layout.tsx`, the `user` object is checked (`if (!user) return null`) but `user.fullName` can still be undefined at runtime (e.g. during registration or when the API returns a partial user).

**Rule:** Always use `user.fullName?.charAt(0)?.toUpperCase() ?? "?"` in the avatar initials rendering.

**Why:** `user.fullName.charAt(0)` crashes at runtime when fullName is undefined, even though the TypeScript type marks it as required — there can be a mismatch between the DB state and the type.
