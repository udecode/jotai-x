---
'jotai-x': patch
---

Synchronize provider props in a layout effect before consumer passive effects run. This prevents stale prop snapshots and update-depth errors during native input bursts. Server rendering retains a passive effect.
