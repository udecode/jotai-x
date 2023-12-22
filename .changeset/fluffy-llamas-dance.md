---
'jotai-x': major
---

- Atoms can now be passed in the `initialState` argument to `createAtomStore`
- Added an `extend` option to `createAtomStore` that lets you add derived atoms to the store
- New accessors on `UseStoreApi`
  - `useMyStore().store()` returns the `JotaiStore` for the current context, or undefined if no store exists
  - `useMyStore().{get,set,use}.atom(someAtom)` accesses `someAtom` through the store
- Remove exports for some internal types
  - `GetRecord`
  - `SetRecord`
  - `UseRecord`
