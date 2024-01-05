# jotai-x

## 1.2.1

### Patch Changes

- [#6](https://github.com/udecode/jotai-x/pull/6) by [@12joan](https://github.com/12joan) – Fix: Provider prop types expect atoms instead of values for stores created with custom atoms

## 1.2.0

### Minor Changes

- [#4](https://github.com/udecode/jotai-x/pull/4) by [@12joan](https://github.com/12joan) – Add `warnIfNoStore` option to `UseAtomOptions`

## 1.1.0

### Minor Changes

- [#2](https://github.com/udecode/jotai-x/pull/2) by [@12joan](https://github.com/12joan) –
  - Atoms other than `atom` can now be passed in the `initialState` argument to `createAtomStore`. Primitive values use `atom` by default
  - Added an `extend` option to `createAtomStore` that lets you add derived atoms to the store
  - New accessors on `UseStoreApi`
    - `useMyStore().store()` returns the `JotaiStore` for the current context, or undefined if no store exists
    - `useMyStore().{get,set,use}.atom(someAtom)` accesses `someAtom` through the store
  - Types: remove exports for some internal types
    - `GetRecord`
    - `SetRecord`
    - `UseRecord`

## 1.0.1

### Patch Changes

- [`099d310`](https://github.com/udecode/jotai-x/commit/099d310cdec35767aeaa2616634cb2502ccbc5e7) by [@zbeyens](https://github.com/zbeyens) – Fix: add React as peer dependency.
