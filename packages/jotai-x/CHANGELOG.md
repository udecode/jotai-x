# jotai-x

## 2.1.0

### Minor Changes

- [#20](https://github.com/udecode/jotai-x/pull/20) by [@yf-yang](https://github.com/yf-yang) – Add alternative selector and equalityFn support to `useValue`

## 2.0.0

### Major Changes

- [#17](https://github.com/udecode/jotai-x/pull/17) by [@yf-yang](https://github.com/yf-yang) – 1. Rename `get` to `useValue`, `set` to `useSet`, `use` to `useState`. 2. `use<Name>Store().store()` -> `use<Name>Store().store`. 3. `use<Name>Store().get.value(option)` and `use<Name>Store().set.value(option)`'s `option` parameters are no longer supported. Pass the option to `use<Name>Store()` instead. 4. Rename APIs:
  - `use<Name>Store().get.key()` -> `use<Name>Store().useKeyValue()`
  - `use<Name>Store().get.key()` -> `use<Name>Store().useValue('key')`
  - `use<Name>Store().set.key()` -> `use<Name>Store().useSetKey()`
  - `use<Name>Store().set.key()` -> `use<Name>Store().useSet('key')`
  - `use<Name>Store().use.key()` -> `use<Name>Store().useKeyState()`
  - `use<Name>Store().use.key()` -> `use<Name>Store().useState('key')`
  - `use<Name>Store().get.atom(atomConfig)` -> `use<Name>Store().useAtomValue(atomConfig)`
  - `use<Name>Store().set.atom(atomConfig)` -> `use<Name>Store().useSetAtom(atomConfig)`
  - `use<Name>Store().use.atom(atomConfig)` -> `use<Name>Store().useAtomState(atomConfig)`
  5. More APIs to directly get/set/subscribe atom states:
  - `use<Name>Store().getKey()`
  - `use<Name>Store().get('key')`
  - `use<Name>Store().setKey(...args)`
  - `use<Name>Store().set('key', ...args)`
  - `use<Name>Store().subscribeKey(...args)`
  - `use<Name>Store().subscribe('key', ...args)`
  - `use<Name>Store().getAtom(atomConfig)`
  - `use<Name>Store().setAtom(atomConfig, ...args)`
  - `use<Name>Store().subscribeAtom(atomConfig, ...args)`

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
