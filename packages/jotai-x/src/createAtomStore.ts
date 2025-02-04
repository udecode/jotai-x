import React from 'react';
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { selectAtom, useHydrateAtoms } from 'jotai/utils';

import { atomWithFn } from './atomWithFn';
import { createAtomProvider, useAtomStore } from './createAtomProvider';

import type { ProviderProps } from './createAtomProvider';
import type { Atom, createStore, WritableAtom } from 'jotai/vanilla';

export type JotaiStore = ReturnType<typeof createStore>;

export type UseAtomOptions = {
  scope?: string;
  store?: JotaiStore;
  delay?: number;
  warnIfNoStore?: boolean;
};

type UseAtomOptionsOrScope = UseAtomOptions | string;

type UseValueRecord<O> = {
  [K in keyof O]: O[K] extends Atom<infer V> ? () => V : never;
};

type GetRecord<O> = UseValueRecord<O>;

type UseSetRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer _V, infer A, infer R>
    ? () => (...args: A) => R
    : never;
};

type SetRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer _V, infer A, infer R>
    ? (...args: A) => R
    : never;
};

type UseStateRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer V, infer A, infer R>
    ? () => [V, (...args: A) => R]
    : never;
};

type SubscribeRecord<O> = {
  [K in keyof O]: O[K] extends Atom<infer V>
    ? (callback: (newValue: V) => void) => () => void
    : never;
};

type StoreAtomsWithoutExtend<T> = {
  [K in keyof T]: T[K] extends Atom<any> ? T[K] : SimpleWritableAtom<T[K]>;
};

type ValueTypesForAtoms<T> = {
  [K in keyof T]: T[K] extends Atom<infer V> ? V : never;
};

type StoreInitialValues<T> = ValueTypesForAtoms<StoreAtomsWithoutExtend<T>>;

type StoreAtoms<T, E> = StoreAtomsWithoutExtend<T> & E;

type FilterWritableAtoms<T> = {
  [K in keyof T]-?: T[K] extends WritableAtom<any, any, any> ? T[K] : never;
};

type WritableStoreAtoms<T, E> = FilterWritableAtoms<StoreAtoms<T, E>>;

export type SimpleWritableAtom<T> = WritableAtom<T, [T], void>;

export type SimpleWritableAtomRecord<T> = {
  [K in keyof T]: SimpleWritableAtom<T[K]>;
};

export type AtomRecord<O> = {
  [K in keyof O]: Atom<O[K]>;
};

type UseNameStore<N extends string = ''> = `use${Capitalize<N>}Store`;
type NameStore<N extends string = ''> = N extends '' ? 'store' : `${N}Store`;
type NameProvider<N extends string = ''> = `${Capitalize<N>}Provider`;

type UseKeyValue<K extends string = ''> = `use${Capitalize<K>}Value`;
type GetKey<K extends string = ''> = `get${Capitalize<K>}`;
type UseSetKey<K extends string = ''> = `useSet${Capitalize<K>}`;
type SetKey<K extends string = ''> = `set${Capitalize<K>}`;
type UseKeyState<K extends string = ''> = `use${Capitalize<K>}State`;
type SubscribeKey<K extends string = ''> = `subscribe${Capitalize<K>}`;

export type UseHydrateAtoms<T> = (
  initialValues: Partial<Record<keyof T, any>>,
  options?: Parameters<typeof useHydrateAtoms>[1]
) => void;
export type UseSyncAtoms<T> = (
  values: Partial<Record<keyof T, any>>,
  options?: {
    store?: JotaiStore;
  }
) => void;

export type StoreApi<
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
> = {
  atom: StoreAtoms<T, E>;
  name: N;
};

type GetAtomFn = <V>(
  atom: Atom<V>,
  store?: JotaiStore,
  options?: UseAtomOptionsOrScope
) => V;

type UseAtomValueFn = <V, S = V>(
  atom: Atom<V>,
  store?: JotaiStore,
  options?: UseAtomOptionsOrScope,
  selector?: (v: V, prevSelectorOutput?: S) => S,
  equalityFnOrDeps?:
    | ((prevSelectorOutput: S, selectorOutput: S) => boolean)
    | unknown[],
  deps?: unknown[]
) => S;

type SetAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  store?: JotaiStore,
  options?: UseAtomOptionsOrScope
) => (...args: A) => R;

type UseSetAtomFn = SetAtomFn;

type UseAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  store?: JotaiStore,
  options?: UseAtomOptionsOrScope
) => [V, (...args: A) => R];

type SubscribeAtomFn = <V>(
  atom: Atom<V>,
  store?: JotaiStore,
  options?: UseAtomOptionsOrScope
) => (callback: (newValue: V) => void) => () => void;

// store.use<Key>Value()
export type UseKeyValueApis<O> = {
  [K in keyof O as UseKeyValue<K & string>]: {
    (): O[K] extends Atom<infer V> ? V : never;
    <S>(
      selector: O[K] extends Atom<infer V>
        ? (v: V, prevSelectorOutput?: S) => S
        : never,
      deps?: unknown[]
    ): S;
    <S>(
      selector:
        | (O[K] extends Atom<infer V>
            ? (v: V, prevSelectorOutput?: S) => S
            : never)
        | undefined,
      equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean,
      deps?: unknown[]
    ): S;
  };
};

// store.get<Key>()
export type GetKeyApis<O> = {
  [K in keyof O as GetKey<K & string>]: O[K] extends Atom<infer V>
    ? () => V
    : never;
};

// store.useSet<Key>()
export type UseSetKeyApis<O> = {
  [K in keyof O as UseSetKey<K & string>]: O[K] extends WritableAtom<
    infer _V,
    infer A,
    infer R
  >
    ? () => (...args: A) => R
    : never;
};

// store.set<Key>(...args)
export type SetKeyApis<O> = {
  [K in keyof O as SetKey<K & string>]: O[K] extends WritableAtom<
    infer _V,
    infer A,
    infer R
  >
    ? (...args: A) => R
    : never;
};

// store.use<Key>State()
export type UseKeyStateApis<O> = {
  [K in keyof O as UseKeyState<K & string>]: O[K] extends WritableAtom<
    infer V,
    infer A,
    infer R
  >
    ? () => [V, (...args: A) => R]
    : never;
};

// store.subscribe<Key>(callback)
export type SubscribeKeyApis<O> = {
  [K in keyof O as SubscribeKey<K & string>]: O[K] extends Atom<infer V>
    ? (callback: (newValue: V) => void) => () => void
    : never;
};

// store.useValue('key')
export type UseParamKeyValueApi<O> = {
  // abc
  <K extends keyof O>(key: K): O[K] extends Atom<infer V> ? V : never;
  <K extends keyof O, S>(
    key: K,
    selector: O[K] extends Atom<infer V>
      ? (v: V, prevSelectorOutput?: S) => S
      : never,
    deps?: unknown[]
  ): S;
  <K extends keyof O, S>(
    key: K,
    selector:
      | (O[K] extends Atom<infer V>
          ? (v: V, prevSelectorOutput?: S) => S
          : never)
      | undefined,
    equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean,
    deps?: unknown[]
  ): S;
};

// store.get('key')
export type GetParamKeyApi<O> = <K extends keyof O>(
  key: K
) => O[K] extends Atom<infer V> ? V : never;

// store.useSet('key')
export type UseSetParamKeyApi<O> = <K extends keyof O>(
  key: K
) => O[K] extends WritableAtom<infer _V, infer A, infer R>
  ? (...args: A) => R
  : never;
// store.set('key', ...args)
export type SetParamKeyApi<O> = <K extends keyof O, A extends unknown[]>(
  key: K,
  ...args: A
) => O[K] extends WritableAtom<infer _V, A, infer R> ? R : never;

// store.useState('key')
export type UseParamKeyStateApi<O> = <K extends keyof O>(
  key: K
) => O[K] extends WritableAtom<infer V, infer A, infer R>
  ? [V, (...args: A) => R]
  : never;

// store.subscribe('key', callback)
export type SubscribeParamKeyApi<O> = <K extends keyof O, V>(
  key: K,
  callback: (newValue: V) => void
) => O[K] extends Atom<V> ? () => void : never;

export type UseAtomParamValueApi = {
  <V>(atom: Atom<V>): V;
  <V, S = V>(
    atom: Atom<V>,
    selector: (v: V, prevSelectorOutput?: S) => S,
    deps?: unknown[]
  ): S;
  <V, S = V>(
    atom: Atom<V>,
    selector: ((v: V, prevSelectorOutput?: S) => S) | undefined,
    equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean,
    deps?: unknown[]
  ): S;
};
export type GetAtomParamApi = <V>(atom: Atom<V>) => V;
export type UseSetAtomParamApi = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>
) => (...args: A) => R;
export type SetAtomParamApi = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>
) => (...args: A) => R;
export type UseAtomParamStateApi = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>
) => [V, (...args: A) => R];
export type SubscribeAtomParamApi = <V>(
  atom: Atom<V>
) => (callback: (newValue: V) => void) => () => void;

export type ReturnOfUseStoreApi<T, E> = UseKeyValueApis<StoreAtoms<T, E>> &
  GetKeyApis<StoreAtoms<T, E>> &
  UseSetKeyApis<StoreAtoms<T, E>> &
  SetKeyApis<StoreAtoms<T, E>> &
  UseKeyStateApis<StoreAtoms<T, E>> &
  SubscribeKeyApis<StoreAtoms<T, E>> & {
    /**
     * When providing `selector`, the atom value will be transformed using the selector function.
     * The selector and equalityFn MUST be memoized.
     *
     * @see https://jotai.org/docs/utilities/select#selectatom
     *
     * @example
     *   const store = useStore()
     *   // only rerenders when the first element of the array changes
     *   const arrayFirst = store.useValue('array', array => array[0], [])
     *   // only rerenders when the first element of the array changes, but returns the whole array
     *   const array = store.useValue('array', undefined, (prev, next) => prev[0] === next[0], [])
     *   // without dependency array, then you need to memoize the selector and equalityFn yourself
     *   const cb = useCallback((array) => array[n], [n])
     *   const arrayNth = store.useValue('array', cb)
     *
     * @param key The key of the atom
     * @param selector A function that takes the atom value and returns the value to be used. Defaults to identity function that returns the atom value.
     * @param equalityFnOrDeps Dependency array or a function that compares the previous selector output and the new selector output. Defaults to comparing outputs of the selector function.
     * @param deps Dependency array for the selector and equalityFn
     */
    useValue: UseParamKeyValueApi<StoreAtoms<T, E>>;
    get: GetParamKeyApi<StoreAtoms<T, E>>;
    useSet: UseSetParamKeyApi<StoreAtoms<T, E>>;
    set: SetParamKeyApi<StoreAtoms<T, E>>;
    useState: UseParamKeyStateApi<StoreAtoms<T, E>>;
    subscribe: SubscribeParamKeyApi<StoreAtoms<T, E>>;
    /**
     * When providing `selector`, the atom value will be transformed using the selector function.
     * The selector and equalityFn MUST be memoized.
     *
     * @see https://jotai.org/docs/utilities/select#selectatom
     *
     * @example
     *   const store = useStore()
     *   // only rerenders when the first element of the array changes
     *   const arrayFirst = store.useAtomValue(arrayAtom, array => array[0])
     *   // only rerenders when the first element of the array changes, but returns the whole array
     *   const array = store.useAtomValue(arrayAtom, undefined, (prev, next) => prev[0] === next[0])
     *   // without dependency array, then you need to memoize the selector and equalityFn yourself
     *  const cb = useCallback((array) => array[n], [n])
     * const arrayNth = store.useAtomValue(arrayAtom, cb)
     *
     * @param atom The atom to use
     * @param selector A function that takes the atom value and returns the value to be used. Defaults to identity function that returns the atom value.
     * @param equalityFn Dependency array or a function that compares the previous selector output and the new selector output. Defaults to comparing outputs of the selector function.
     * @param deps Dependency array for the selector and equalityFn
     */
    useAtomValue: UseAtomParamValueApi;
    getAtom: GetAtomParamApi;
    useSetAtom: UseSetAtomParamApi;
    setAtom: SetAtomParamApi;
    useAtomState: UseAtomParamStateApi;
    subscribeAtom: SubscribeAtomParamApi;
    store: JotaiStore | undefined;
  };

export type AtomStoreApi<
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
> = {
  name: N;
} & {
  [key in keyof Record<NameProvider<N>, object>]: React.FC<
    ProviderProps<StoreInitialValues<T>>
  >;
} & {
  [key in keyof Record<NameStore<N>, object>]: StoreApi<T, E, N>;
} & {
  [key in keyof Record<UseNameStore<N>, object>]: UseStoreApi<T, E>;
};

export type UseStoreApi<T, E> = (
  options?: UseAtomOptionsOrScope
) => ReturnOfUseStoreApi<T, E>;

const capitalizeFirstLetter = (str = '') =>
  str.length > 0 ? str[0].toUpperCase() + str.slice(1) : '';
const getProviderIndex = (name = '') =>
  `${capitalizeFirstLetter(name)}Provider`;
const getStoreIndex = (name = '') =>
  name.length > 0 ? `${name}Store` : 'store';
const getUseStoreIndex = (name = '') =>
  `use${capitalizeFirstLetter(name)}Store`;

const getUseValueIndex = (key = '') => `use${capitalizeFirstLetter(key)}Value`;
const getGetIndex = (key = '') => `get${capitalizeFirstLetter(key)}`;
const getUseSetIndex = (key = '') => `useSet${capitalizeFirstLetter(key)}`;
const getSetIndex = (key = '') => `set${capitalizeFirstLetter(key)}`;
const getUseStateIndex = (key = '') => `use${capitalizeFirstLetter(key)}State`;
const getSubscribeIndex = (key = '') =>
  `subscribe${capitalizeFirstLetter(key)}`;

const isAtom = (possibleAtom: unknown): boolean =>
  !!possibleAtom &&
  typeof possibleAtom === 'object' &&
  'read' in possibleAtom &&
  typeof possibleAtom.read === 'function';

const withStoreAndOptions = <T extends object>(
  fnRecord: T,
  getIndex: (name?: string) => string,
  store: JotaiStore | undefined,
  options: UseAtomOptions
): any =>
  Object.fromEntries(
    Object.entries(fnRecord).map(([key, fn]) => [
      getIndex(key),
      (...args: any[]) => (fn as any)(store, options, ...args),
    ])
  );

const withKeyAndStoreAndOptions =
  <T extends object>(
    fnRecord: T,
    store: JotaiStore | undefined,
    options: UseAtomOptions
  ): any =>
  (key: keyof T, ...args: any[]) =>
    (fnRecord[key] as any)(store, options, ...args);

const convertScopeShorthand = (
  optionsOrScope: UseAtomOptionsOrScope = {}
): UseAtomOptions =>
  typeof optionsOrScope === 'string'
    ? { scope: optionsOrScope }
    : optionsOrScope;

const identity = (x: any) => x;

export interface CreateAtomStoreOptions<
  T extends object,
  E extends AtomRecord<object>,
  N extends string,
> {
  name: N;
  delay?: UseAtomOptions['delay'];
  effect?: React.FC;
  extend?: (atomsWithoutExtend: StoreAtomsWithoutExtend<T>) => E;
  infiniteRenderDetectionLimit?: number;
  suppressWarnings?: boolean;
}

/**
 * Create an atom store from an initial value.
 * Each property will have a getter and setter.
 *
 * @example
 * const { exampleStore, useExampleStore } = createAtomStore({ count: 1, say: 'hello' }, { name: 'example' as const })
 * const [count, setCount] = useExampleStore().useCountState()
 * const say = useExampleStore().useSayValue()
 * const setSay = useExampleStore().useSetSay()
 * setSay('world')
 * const countAtom = exampleStore.atom.count
 */
export const createAtomStore = <
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
>(
  initialState: T,
  {
    name,
    delay: delayRoot,
    effect,
    extend,
    infiniteRenderDetectionLimit = 100_000,
    suppressWarnings,
  }: CreateAtomStoreOptions<T, E, N>
): AtomStoreApi<T, E, N> => {
  type MyStoreAtoms = StoreAtoms<T, E>;
  type MyWritableStoreAtoms = WritableStoreAtoms<T, E>;
  type MyStoreAtomsWithoutExtend = StoreAtomsWithoutExtend<T>;
  type MyWritableStoreAtomsWithoutExtend =
    FilterWritableAtoms<MyStoreAtomsWithoutExtend>;
  type MyStoreInitialValues = StoreInitialValues<T>;

  const providerIndex = getProviderIndex(name) as NameProvider<N>;
  const useStoreIndex = getUseStoreIndex(name) as UseNameStore<N>;
  const storeIndex = getStoreIndex(name) as NameStore<N>;

  const atomsWithoutExtend = {} as MyStoreAtomsWithoutExtend;
  const writableAtomsWithoutExtend = {} as MyWritableStoreAtomsWithoutExtend;
  const atomIsWritable = {} as Record<keyof MyStoreAtoms, boolean>;

  for (const [key, atomOrValue] of Object.entries(initialState)) {
    const atomConfig: Atom<unknown> = isAtom(atomOrValue)
      ? atomOrValue
      : atomWithFn(atomOrValue);
    atomsWithoutExtend[key as keyof MyStoreAtomsWithoutExtend] =
      atomConfig as any;

    const writable = 'write' in atomConfig;
    atomIsWritable[key as keyof MyStoreAtoms] = writable;

    if (writable) {
      writableAtomsWithoutExtend[
        key as keyof MyWritableStoreAtomsWithoutExtend
      ] = atomConfig as any;
    }
  }

  const atoms = { ...atomsWithoutExtend } as MyStoreAtoms;

  if (extend) {
    const extendedAtoms = extend(atomsWithoutExtend);

    for (const [key, atomConfig] of Object.entries(extendedAtoms)) {
      atoms[key as keyof MyStoreAtoms] = atomConfig;
      atomIsWritable[key as keyof MyStoreAtoms] = 'write' in atomConfig;
    }
  }

  const atomsOfUseValue = {} as UseValueRecord<MyStoreAtoms>;
  const atomsOfGet = {} as GetRecord<MyStoreAtoms>;
  const atomsOfUseSet = {} as UseSetRecord<MyWritableStoreAtoms>;
  const atomsOfSet = {} as SetRecord<MyWritableStoreAtoms>;
  const atomsOfUseState = {} as UseStateRecord<MyWritableStoreAtoms>;
  const atomsOfSubscribe = {} as SubscribeRecord<MyStoreAtoms>;

  const useStore = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
    const {
      scope,
      store,
      warnIfNoStore = !suppressWarnings,
    } = convertScopeShorthand(optionsOrScope);
    const contextStore = useAtomStore(name, scope, !store && warnIfNoStore);
    return store ?? contextStore;
  };

  let renderCount = 0;

  const useAtomValueWithStore: UseAtomValueFn = (
    atomConfig,
    store,
    optionsOrScope,
    selector,
    equalityFnOrDeps,
    deps
  ) => {
    // If selector/equalityFn are not memoized, infinite loop will occur.
    if (process.env.NODE_ENV !== 'production') {
      renderCount += 1;
      if (renderCount > infiniteRenderDetectionLimit) {
        throw new Error(
          `
use<Key>Value/useValue has rendered ${infiniteRenderDetectionLimit} times in the same render.
It is very likely to have fallen into an infinite loop.
That is because you do not memoize the selector/equalityFn function param.
Please wrap them with useCallback or configure the deps array correctly.`
        );
      }
      // We need to use setTimeout instead of useEffect here, because when infinite loop happens,
      // the effect (fired in the next micro task) will execute before the rerender.
      setTimeout(() => {
        renderCount = 0;
      });
    }

    const options = convertScopeShorthand(optionsOrScope);
    selector ??= identity;
    const equalityFn =
      typeof equalityFnOrDeps === 'function' ? equalityFnOrDeps : undefined;
    deps = (typeof equalityFnOrDeps === 'function'
      ? deps
      : equalityFnOrDeps) ?? [selector, equalityFn];

    const [memoizedSelector, memoizedEqualityFn] = React.useMemo(
      () => [selector, equalityFn],
      deps
    );

    const selectorAtom = selectAtom(
      atomConfig,
      memoizedSelector,
      memoizedEqualityFn
    ) as Atom<any>;
    return useAtomValue(selectorAtom, {
      store,
      delay: options.delay ?? delayRoot,
    });
  };

  const getAtomWithStore: GetAtomFn = (atomConfig, store, _optionsOrScope) => {
    return (store ?? getDefaultStore()).get(atomConfig);
  };

  const useSetAtomWithStore: SetAtomFn = (
    atomConfig,
    store,
    _optionsOrScope
  ) => {
    return useSetAtom(atomConfig, { store });
  };

  const setAtomWithStore: UseSetAtomFn = (
    atomConfig,
    store,
    _optionsOrScope
  ) => {
    return (...args) =>
      (store ?? (getDefaultStore() as NonNullable<typeof store>)).set(
        atomConfig,
        ...args
      );
  };

  const useAtomStateWithStore: UseAtomFn = (
    atomConfig,
    store,
    optionsOrScope
  ) => {
    const { delay = delayRoot } = convertScopeShorthand(optionsOrScope);
    return useAtom(atomConfig, { store, delay });
  };

  const subscribeAtomWithStore: SubscribeAtomFn = (
    atomConfig,
    store,
    _optionsOrScope
  ) => {
    return (callback) => {
      store ??= getDefaultStore();
      const unsubscribe = store.sub(atomConfig, () => {
        callback(store!.get(atomConfig));
      });
      return () => unsubscribe();
    };
  };

  for (const key of Object.keys(atoms)) {
    const atomConfig = atoms[key as keyof MyStoreAtoms];
    const isWritable: boolean = atomIsWritable[key as keyof MyStoreAtoms];

    (atomsOfUseValue as any)[key] = (
      store: JotaiStore | undefined,
      optionsOrScope: UseAtomOptionsOrScope = {},
      selector?: (v: any, prevSelectorOutput?: any) => any,
      equalityFnOrDeps?:
        | ((prevSelectorOutput: any, selectorOutput: any) => boolean)
        | unknown[],
      deps?: unknown[]
    ) =>
      useAtomValueWithStore(
        atomConfig,
        store,
        optionsOrScope,
        selector,
        equalityFnOrDeps,
        deps
      );

    (atomsOfGet as any)[key] = (
      store: JotaiStore | undefined,
      optionsOrScope: UseAtomOptionsOrScope = {}
    ) => getAtomWithStore(atomConfig, store, optionsOrScope);

    (atomsOfSubscribe as any)[key] = (
      store: JotaiStore | undefined,
      optionsOrScope: UseAtomOptionsOrScope = {},
      callback: (newValue: any) => void
    ) => subscribeAtomWithStore(atomConfig, store, optionsOrScope)(callback);

    if (isWritable) {
      (atomsOfUseSet as any)[key] = (
        store: JotaiStore | undefined,
        optionsOrScope: UseAtomOptionsOrScope = {}
      ) =>
        useSetAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          store,
          optionsOrScope
        );

      (atomsOfSet as any)[key] = (
        store: JotaiStore | undefined,
        optionsOrScope: UseAtomOptionsOrScope = {},
        ...args: any[]
      ) =>
        setAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          store,
          optionsOrScope
        )(...args);

      (atomsOfUseState as any)[key] = (
        store: JotaiStore | undefined,
        optionsOrScope: UseAtomOptionsOrScope = {}
      ) =>
        useAtomStateWithStore(
          atomConfig as WritableAtom<any, any, any>,
          store,
          optionsOrScope
        );
    }
  }

  const Provider: React.FC<ProviderProps<MyStoreInitialValues>> =
    createAtomProvider<MyStoreInitialValues, N>(
      name,
      writableAtomsWithoutExtend,
      { effect }
    );

  const storeApi: StoreApi<T, E, N> = {
    atom: atoms,
    name,
  };

  const useStoreApi: UseStoreApi<T, E> = (options = {}) => {
    const scopedOptions = convertScopeShorthand(options);
    const store = useStore(scopedOptions);

    return {
      // store.use<Key>Value()
      ...(withStoreAndOptions(
        atomsOfUseValue,
        getUseValueIndex,
        store,
        scopedOptions
      ) as UseKeyValueApis<MyStoreAtoms>),
      // store.get<Key>()
      ...(withStoreAndOptions(
        atomsOfGet,
        getGetIndex,
        store,
        scopedOptions
      ) as GetKeyApis<MyStoreAtoms>),
      // store.useSet<Key>()
      ...(withStoreAndOptions(
        atomsOfUseSet,
        getUseSetIndex,
        store,
        scopedOptions
      ) as UseSetKeyApis<MyStoreAtoms>),
      // store.set<Key>(...args)
      ...(withStoreAndOptions(
        atomsOfSet,
        getSetIndex,
        store,
        scopedOptions
      ) as SetKeyApis<MyStoreAtoms>),
      // store.use<Key>State()
      ...(withStoreAndOptions(
        atomsOfUseState,
        getUseStateIndex,
        store,
        scopedOptions
      ) as UseKeyStateApis<MyStoreAtoms>),
      // store.subscribe<Key>(callback)
      ...(withStoreAndOptions(
        atomsOfSubscribe,
        getSubscribeIndex,
        store,
        scopedOptions
      ) as SubscribeKeyApis<MyStoreAtoms>),
      // store.useValue('key')
      useValue: withKeyAndStoreAndOptions(
        atomsOfUseValue,
        store,
        scopedOptions
      ) as UseParamKeyValueApi<MyStoreAtoms>,
      // store.get('key')
      get: withKeyAndStoreAndOptions(
        atomsOfGet,
        store,
        scopedOptions
      ) as GetParamKeyApi<MyStoreAtoms>,
      // store.useSet('key')
      useSet: withKeyAndStoreAndOptions(
        atomsOfUseSet,
        store,
        scopedOptions
      ) as UseSetParamKeyApi<MyStoreAtoms>,
      // store.set('key', ...args)
      set: withKeyAndStoreAndOptions(
        atomsOfSet,
        store,
        scopedOptions
      ) as SetParamKeyApi<MyStoreAtoms>,
      // store.useState('key')
      useState: withKeyAndStoreAndOptions(
        atomsOfUseState,
        store,
        scopedOptions
      ) as UseParamKeyStateApi<MyStoreAtoms>,
      // store.subscribe('key', callback)
      subscribe: withKeyAndStoreAndOptions(
        atomsOfSubscribe,
        store,
        scopedOptions
      ) as SubscribeParamKeyApi<MyStoreAtoms>,
      // store.useAtomValue(atomConfig)
      useAtomValue: ((atomConfig, selector, equalityFnOrDeps, deps) =>
        // eslint-disable-next-line react-compiler/react-compiler
        useAtomValueWithStore(
          atomConfig,
          store,
          scopedOptions,
          selector,
          equalityFnOrDeps,
          deps
        )) as UseAtomParamValueApi,
      // store.getAtom(atomConfig)
      getAtom: (atomConfig) =>
        getAtomWithStore(atomConfig, store, scopedOptions),
      // store.useSetAtom(atomConfig)
      useSetAtom: (atomConfig) =>
        // eslint-disable-next-line react-compiler/react-compiler
        useSetAtomWithStore(atomConfig, store, scopedOptions),
      // store.setAtom(atomConfig, ...args)
      setAtom: (atomConfig) =>
        setAtomWithStore(atomConfig, store, scopedOptions),
      // store.useAtomState(atomConfig)
      useAtomState: (atomConfig) =>
        // eslint-disable-next-line react-compiler/react-compiler
        useAtomStateWithStore(atomConfig, store, scopedOptions),
      // store.subscribeAtom(atomConfig, callback)
      subscribeAtom: (atomConfig) =>
        subscribeAtomWithStore(atomConfig, store, scopedOptions),
      store,
    };
  };

  return {
    [providerIndex]: Provider,
    [useStoreIndex]: useStoreApi,
    [storeIndex]: storeApi,
    name,
  } as any;
};

export function useStoreValue<T, E, K extends keyof StoreAtoms<T, E>>(
  store: ReturnOfUseStoreApi<T, E>,
  key: K
): StoreAtoms<T, E>[K] extends Atom<infer V> ? V : never;
export function useStoreValue<T, E, K extends keyof StoreAtoms<T, E>, S>(
  store: ReturnOfUseStoreApi<T, E>,
  key: K,
  selector: StoreAtoms<T, E>[K] extends Atom<infer V>
    ? (v: V, prevSelectorOutput?: S) => S
    : never,
  deps?: unknown[]
): S;
export function useStoreValue<T, E, K extends keyof StoreAtoms<T, E>, S>(
  store: ReturnOfUseStoreApi<T, E>,
  key: K,
  selector: StoreAtoms<T, E>[K] extends Atom<infer V>
    ? ((v: V, prevSelectorOutput?: S) => S) | undefined
    : never,
  equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean,
  deps?: unknown[]
): S;
export function useStoreValue<T, E, K extends keyof StoreAtoms<T, E>, S>(
  store: ReturnOfUseStoreApi<T, E>,
  key: K,
  selector?: StoreAtoms<T, E>[K] extends Atom<infer V>
    ? (v: V, prevSelectorOutput?: S) => S
    : never,
  equalityFnOrDeps?: any,
  deps?: unknown[]
) {
  return store.useValue(key, selector, equalityFnOrDeps, deps);
}

export function useStoreSet<T, E, K extends keyof StoreAtoms<T, E>>(
  store: ReturnOfUseStoreApi<T, E>,
  key: K
) {
  return store.useSet(key);
}

export function useStoreState<T, E, K extends keyof StoreAtoms<T, E>>(
  store: ReturnOfUseStoreApi<T, E>,
  key: K
) {
  return store.useState(key);
}

export function useStoreAtomValue<T, E, V>(
  store: ReturnOfUseStoreApi<T, E>,
  atom: Atom<V>
): V;
export function useStoreAtomValue<T, E, V, S>(
  store: ReturnOfUseStoreApi<T, E>,
  atom: Atom<V>,
  selector: (v: V, prevSelectorOutput?: S) => S,
  deps?: unknown[]
): S;
export function useStoreAtomValue<T, E, V, S>(
  store: ReturnOfUseStoreApi<T, E>,
  atom: Atom<V>,
  selector: ((v: V, prevSelectorOutput?: S) => S) | undefined,
  equalityFn: (prevSelectorOutput: S, selectorOutput: S) => boolean,
  deps?: unknown[]
): S;
export function useStoreAtomValue<T, E, V, S>(
  store: ReturnOfUseStoreApi<T, E>,
  atom: Atom<V>,
  selector?: (v: V, prevSelectorOutput?: S) => S,
  equalityFnOrDeps?: any,
  deps?: unknown[]
) {
  return store.useAtomValue(atom, selector, equalityFnOrDeps, deps);
}

export function useStoreSetAtom<T, E, V, A extends unknown[], R>(
  store: ReturnOfUseStoreApi<T, E>,
  atom: WritableAtom<V, A, R>
) {
  return store.useSetAtom(atom);
}

export function useStoreAtomState<T, E, V, A extends unknown[], R>(
  store: ReturnOfUseStoreApi<T, E>,
  atom: WritableAtom<V, A, R>
) {
  return store.useAtomState(atom);
}
