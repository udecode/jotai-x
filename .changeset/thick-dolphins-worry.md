---
'jotai-x': major
---

1. Rename `get` to `useValue`, `set` to `useSet`, `use` to `useState`.
2. `use<Name>Store().store()` -> `use<Name>Store().store`.
3. `use<Name>Store().get.value(option)` and `use<Name>Store().set.value(option)`'s `option` parameters are no longer supported. Pass the option to `use<Name>Store()` instead.
4. Rename APIs:
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
  
