import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import { createAtomProvider, useAtomStore } from './createAtomProvider';

import type { ProviderProps } from './createAtomProvider';
import type { FC } from 'react';
import type { Atom, createStore, WritableAtom } from 'jotai/vanilla';

export type JotaiStore = ReturnType<typeof createStore>;

export type UseAtomOptions = {
  scope?: string;
  store?: JotaiStore;
  delay?: number;
};

type UseAtomOptionsOrScope = UseAtomOptions | string;

type GetRecord<O> = {
  [K in keyof O]: O[K] extends Atom<infer V>
    ? (options?: UseAtomOptionsOrScope) => V
    : never;
};

type SetRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer _V, infer A, infer R>
    ? (options?: UseAtomOptionsOrScope) => (...args: A) => R
    : never;
};

type UseRecord<O> = {
  [K in keyof O]: O[K] extends WritableAtom<infer V, infer A, infer R>
    ? (options?: UseAtomOptionsOrScope) => [V, (...args: A) => R]
    : never;
};

type StoreAtomsWithoutExtend<T> = {
  [K in keyof T]: T[K] extends Atom<any> ? T[K] : SimpleWritableAtom<T[K]>;
};

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

type GetAtomFn = <V>(atom: Atom<V>, options?: UseAtomOptionsOrScope) => V;

type SetAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  options?: UseAtomOptionsOrScope
) => (...args: A) => R;

type UseAtomFn = <V, A extends unknown[], R>(
  atom: WritableAtom<V, A, R>,
  options?: UseAtomOptionsOrScope
) => [V, (...args: A) => R];

export type UseStoreApi<T, E> = (options?: UseAtomOptionsOrScope) => {
  get: GetRecord<StoreAtoms<T, E>> & { atom: GetAtomFn };
  set: SetRecord<WritableStoreAtoms<T, E>> & { atom: SetAtomFn };
  use: UseRecord<WritableStoreAtoms<T, E>> & { atom: UseAtomFn };
  store: (options?: UseAtomOptionsOrScope) => JotaiStore | undefined;
};

export type AtomStoreApi<
  T extends object,
  E extends AtomRecord<object>,
  N extends string = '',
> = {
  name: N;
} & {
  [key in keyof Record<NameProvider<N>, object>]: FC<ProviderProps<T>>;
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

const withDefaultOptions = <T extends object>(
  fnRecord: T,
  defaultOptions: UseAtomOptions
): T =>
  Object.fromEntries(
    Object.entries(fnRecord).map(([key, fn]) => [
      key,
      (options: UseAtomOptions = {}) =>
        (fn as any)({ ...defaultOptions, ...options }),
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
  effect?: FC;
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

  const providerIndex = getProviderIndex(name) as NameProvider<N>;
  const useStoreIndex = getUseStoreIndex(name) as UseNameStore<N>;
  const storeIndex = getStoreIndex(name) as NameStore<N>;

  const atomsWithoutExtend = {} as MyStoreAtomsWithoutExtend;
  const writableAtomsWithoutExtend = {} as MyWritableStoreAtomsWithoutExtend;
  const atomIsWritable = {} as Record<keyof MyStoreAtoms, boolean>;

  for (const [key, atomOrValue] of Object.entries(initialState)) {
    const atomConfig: Atom<unknown> = isAtom(atomOrValue)
      ? atomOrValue
      : atom(atomOrValue);
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

  const getAtoms = {} as GetRecord<MyStoreAtoms>;
  const setAtoms = {} as SetRecord<MyWritableStoreAtoms>;
  const useAtoms = {} as UseRecord<MyWritableStoreAtoms>;

  const useStore = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
    const { scope, store } = convertScopeShorthand(optionsOrScope);
    const contextStore = useAtomStore(name, scope);
    return store ?? contextStore;
  };

  const useAtomValueWithStore: GetAtomFn = (atomConfig, optionsOrScope) => {
    const store = useStore(optionsOrScope);
    const { delay = delayRoot } = convertScopeShorthand(optionsOrScope);
    return useAtomValue(atomConfig, { store, delay });
  };

  const useSetAtomWithStore: SetAtomFn = (atomConfig, optionsOrScope) => {
    const store = useStore(optionsOrScope);
    return useSetAtom(atomConfig, { store });
  };

  const useAtomWithStore: UseAtomFn = (atomConfig, optionsOrScope) => {
    const store = useStore(optionsOrScope);
    const { delay = delayRoot } = convertScopeShorthand(optionsOrScope);
    return useAtom(atomConfig, { store, delay });
  };

  for (const key of Object.keys(atoms)) {
    const atomConfig = atoms[key as keyof MyStoreAtoms];
    const isWritable: boolean = atomIsWritable[key as keyof MyStoreAtoms];

    (getAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
      useAtomValueWithStore(atomConfig, optionsOrScope);

    if (isWritable) {
      (setAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
        useSetAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          optionsOrScope
        );

      (useAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
        useAtomWithStore(
          atomConfig as WritableAtom<any, any, any>,
          optionsOrScope
        );
    }
  }

  const Provider: FC<ProviderProps<T>> = createAtomProvider(
    name,
    writableAtomsWithoutExtend,
    { effect }
  );

  const storeApi: StoreApi<T, E, N> = {
    atom: atoms,
    name,
  };

  const useStoreApi: UseStoreApi<T, E> = (defaultOptions = {}) => ({
    get: {
      ...withDefaultOptions(getAtoms, convertScopeShorthand(defaultOptions)),
      atom: (atomConfig, options) =>
        useAtomValueWithStore(atomConfig, {
          ...convertScopeShorthand(defaultOptions),
          ...convertScopeShorthand(options),
        }),
    },
    set: {
      ...withDefaultOptions(setAtoms, convertScopeShorthand(defaultOptions)),
      atom: (atomConfig, options) =>
        useSetAtomWithStore(atomConfig, {
          ...convertScopeShorthand(defaultOptions),
          ...convertScopeShorthand(options),
        }),
    },
    use: {
      ...withDefaultOptions(useAtoms, convertScopeShorthand(defaultOptions)),
      atom: (atomConfig, options) =>
        useAtomWithStore(atomConfig, {
          ...convertScopeShorthand(defaultOptions),
          ...convertScopeShorthand(options),
        }),
    },
    store: (options) =>
      useStore({
        ...convertScopeShorthand(defaultOptions),
        ...convertScopeShorthand(options),
      }),
  });

  return {
    [providerIndex]: Provider,
    [useStoreIndex]: useStoreApi,
    [storeIndex]: storeApi,
    name,
  } as any;
};
