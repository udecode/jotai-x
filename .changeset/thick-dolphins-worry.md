---
'jotai-x': feat
---

1. Rename `get` to `useValue`, `set` to `useSet`.
2. `use<Name>Store().store()` -> `use<Name>Store().store`.
3. `use<Name>Store().useValue.value(option)` and `use<Name>Store().useSet.value(option)` are no longer supported.
4. Add non hook APIs: `use<Name>Store().get.value()`, `use<Name>Store().set.value(args)`,  `use<Name>Store().subscribe(listener)`.