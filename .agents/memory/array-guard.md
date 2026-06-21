---
name: Array guard pattern
description: API hooks returning non-array truthy values — defensive guard required
---

When react-query data is expected to be an array, using `data || []` is NOT safe. If `data` is a truthy non-array (e.g. an error object that slipped through, or a cached stale shape), the `|| []` fallback won't kick in and `.map()` / `.slice()` will throw "is not a function".

**Rule:** Always guard with `Array.isArray(data)`:
```tsx
// WRONG
{!data || data.length === 0 ? <Empty /> : data.map(...)}

// CORRECT
{!Array.isArray(data) || data.length === 0 ? <Empty /> : data.map(...)}
```

**Why:** Affected pages: dashboard (activities), sub-accounts, referrals, transfers. Fixed by replacing `||[]` guards with `Array.isArray()` checks.

**How to apply:** Whenever rendering a list from a react-query hook, use `Array.isArray()` guard instead of truthiness check.
