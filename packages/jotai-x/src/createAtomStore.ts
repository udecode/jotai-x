import React from 'react';
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';



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

type UseRecord<O> = {
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

type SetAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  store?: JotaiStore,
  options?: UseAtomOptionsOrScope
) => (...args: A) => R;

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

export type UseStoreApi<T, E> = (options?: UseAtomOptionsOrScope) => {
  useValue: UseValueRecord<StoreAtoms<T, E>> & {
    atom: <V>(atom: Atom<V>) => V;
  };
  get: GetRecord<StoreAtoms<T, E>> & { atom: <V>(atom: Atom<V>) => V };
  useSet: UseSetRecord<WritableStoreAtoms<T, E>> & {
    atom: <V, A extends unknown[], R>(
      atom: WritableAtom<V, A, R>
    ) => (...args: A) => R;
  };
  set: SetRecord<WritableStoreAtoms<T, E>> & {
    atom: <V, A extends unknown[], R>(
      atom: WritableAtom<V, A, R>
    ) => (...args: A) => R;
  };
  use: UseRecord<WritableStoreAtoms<T, E>> & {
    atom: <V, A extends unknown[], R>(
      atom: WritableAtom<V, A, R>
    ) => [V, (...args: A) => R];
  };
  subscribe: SubscribeRecord<StoreAtoms<T, E>> & {
    atom: <V>(atom: Atom<V>) => (callback: (newValue: V) => void) => () => void;
  };
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

const capitalizeFirstLetter = (str = '') =>
  str.length > 0 ? str[0].toUpperCase() + str.slice(1) : '';
const getProviderIndex = (name = '') =>
  `${capitalizeFirstLetter(name)}Provider`;
const getStoreIndex = (name = '') =>
  name.length > 0 ? `${name}Store` : 'store';
const getUseStoreIndex = (name = '') =>
  `use${capitalizeFirstLetter(name)}Store`;

const isAtom = (possibleAtom: unknown): boolean =>
  !!possibleAtom &&
  typeof possibleAtom === 'object' &&
  'read' in possibleAtom &&
  typeof possibleAtom.read === 'function';

const withStoreAndOptions = <T extends object>(
  fnRecord: T,
  store: JotaiStore | undefined,
  options: UseAtomOptions
): T =>
  Object.fromEntries(
    Object.entries(fnRecord).map(([key, fn]) => [
      key,
      (...args: any[]) => (fn as any)(store, options, ...args),
    ])
  ) as any;

const convertScopeShorthand = (
  optionsOrScope: UseAtomOptionsOrScope = {}
): UseAtomOptions =>
  typeof optionsOrScope === 'string'
    ? { scope: optionsOrScope }
    : optionsOrScope;

export interface CreateAtomStoreOptions<
  T extends object,
  E extends AtomRecord<object>,
  N extends string,
> {
  name: N;
  delay?: UseAtomOptions['delay'];
  effect?: React.FC;
  extend?: (atomsWithoutExtend: StoreAtomsWithoutExtend<T>) => E;
}

/**
 * Create an atom store from an initial value.
 * Each property will have a getter and setter.
 *
 * @example
 * const { exampleStore, useExampleStore } = createAtomStore({ count: 1, say: 'hello' }, { name: 'example' as const })
 * const [count, setCount] = useExampleStore().use.count()
 * const say = useExampleStore().get.say()
 * const setSay = useExampleStore().set.say()
 * setSay('world')
 * const countAtom = exampleStore.atom.count
 */
export const createAtomStore = <
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
>(
  initialState: T,
  { name, delay: delayRoot, effect, extend }: CreateAtomStoreOptions<T, E, N>
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

  const useValueAtoms = {} as UseValueRecord<MyStoreAtoms>;
  const getAtoms = {} as GetRecord<MyStoreAtoms>;
  const useSetAtoms = {} as UseSetRecord<MyWritableStoreAtoms>;
  const setAtoms = {} as SetRecord<MyWritableStoreAtoms>;
  const useAtoms = {} as UseRecord<MyWritableStoreAtoms>;
  const subscribeAtoms = {} as SubscribeRecord<MyStoreAtoms>;

  const useStore = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
    const {
      scope,
      store,
      warnIfNoStore = true,
    } = convertScopeShorthand(optionsOrScope);
    const contextStore = useAtomStore(name, scope, !store && warnIfNoStore);
    return store ?? contextStore;
  };

  const useAtomValueWithStore: GetAtomFn = (
    atomConfig,
    store,
    optionsOrScope
  ) => {
    const options = convertScopeShorthand(optionsOrScope);
    return useAtomValue(atomConfig, {
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

  const setAtomWithStore: SetAtomFn = (atomConfig, store, _optionsOrScope) => {
    return (...args) =>
      (store ?? (getDefaultStore() as NonNullable<typeof store>)).set(
        atomConfig,
        ...args
      );
  };

  const useAtomWithStore: UseAtomFn = (atomConfig, store, optionsOrScope) => {
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

    (useValueAtoms as any)[key] = (
      store: JotaiStore | undefined,
      optionsOrScope: UseAtomOptionsOrScope = {}
    ) => useAtomValueWithStore(atomConfig, store, optionsOrScope);

    (getAtoms as any)[key] = (
      store: JotaiStore | undefined,
      optionsOrScope: UseAtomOptionsOrScope = {}
    ) => getAtomWithStore(atomConfig, store, optionsOrScope);

    (subscribeAtoms as any)[key] = (
      store: JotaiStore | undefined,
      optionsOrScope: UseAtomOptionsOrScope = {},
      callback: (newValue: any) => void
    ) => subscribeAtomWithStore(atomConfig, store, optionsOrScope)(callback);

    if (isWritable) {
      (useSetAtoms as any)[key] = (
        store: JotaiStore | undefined,
        optionsOrScope: UseAtomOptionsOrScope = {}
      ) =>
        useSetAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          store,
          optionsOrScope
        );

      (setAtoms as any)[key] = (
        store: JotaiStore | undefined,
        optionsOrScope: UseAtomOptionsOrScope = {},
        ...args: any[]
      ) =>
        setAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          store,
          optionsOrScope
        )(...args);

      (useAtoms as any)[key] = (
        store: JotaiStore | undefined,
        optionsOrScope: UseAtomOptionsOrScope = {}
      ) =>
        useAtomWithStore(
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
      useValue: {
        ...withStoreAndOptions(useValueAtoms, store, scopedOptions),
        atom: (atomConfig) =>
          useAtomValueWithStore(atomConfig, store, scopedOptions),
      },
      get: {
        ...withStoreAndOptions(getAtoms, store, scopedOptions),
        atom: (atomConfig) =>
          getAtomWithStore(atomConfig, store, scopedOptions),
      },
      useSet: {
        ...withStoreAndOptions(useSetAtoms, store, scopedOptions),
        atom: (atomConfig) =>
          useSetAtomWithStore(atomConfig, store, scopedOptions),
      },
      set: {
        ...withStoreAndOptions(setAtoms, store, scopedOptions),
        atom: <V, A extends unknown[], R>(atomConfig: WritableAtom<V, A, R>) =>
          setAtomWithStore(atomConfig, store, scopedOptions),
      },
      use: {
        ...withStoreAndOptions(useAtoms, store, scopedOptions),
        atom: (atomConfig) =>
          useAtomWithStore(atomConfig, store, scopedOptions),
      },
      subscribe: {
        ...withStoreAndOptions(subscribeAtoms, store, scopedOptions),
        atom: <V>(atomConfig: Atom<V>) =>
          subscribeAtomWithStore(atomConfig, store, scopedOptions),
      },
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