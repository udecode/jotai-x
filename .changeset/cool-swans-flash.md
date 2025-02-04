---
'jotai-x': minor
---

- `createAtomStore` now returns new utility hooks to provide a more direct way to access store atoms without having to call `useStore()` first:
  - `use<Name>State(key, storeOptions)` - Get/set state for a specific key
  - `use<Name>Value(key, options, deps)` - Get value for a specific key with optional selector and equality function
  - `use<Name>Set(key, storeOptions)` - Get setter for a specific key
