# jotai-x

## 1.2.4

### Patch Changes

- [`24a1de7`](https://github.com/udecode/jotai-x/commit/24a1de747cea2ecc89b3005877527a7805a0eb87) by [@zbeyens](https://github.com/zbeyens) – doc

## 1.2.3

### Patch Changes

- [#11](https://github.com/udecode/jotai-x/pull/11) by [@12joan](https://github.com/12joan) – Do not render jotai's Provider component as part of jotai-x's provider. Jotai's Provider is unnecessary and interferes with vanilla jotai atoms.

- [#13](https://github.com/udecode/jotai-x/pull/13) by [@zbeyens](https://github.com/zbeyens) – use client in createAtomProvider

## 1.2.2

### Patch Changes

- [#8](https://github.com/udecode/jotai-x/pull/8) by [@zbeyens](https://github.com/zbeyens) – Fix React imports for SSR

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
