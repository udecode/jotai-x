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

export type GetRecord<O> = {
  [K in keyof O]: (options?: UseAtomOptionsOrScope) => O[K];
};
export type SetRecord<O> = {
  [K in keyof O]: (options?: UseAtomOptionsOrScope) => (value: O[K]) => void;
};
export type UseRecord<O> = {
  [K in keyof O]: (
    options?: UseAtomOptionsOrScope
  ) => [O[K], (value: O[K]) => void];
};

export type SimpleWritableAtom<T> = WritableAtom<T, [T], void>;

export type WritableAtomRecord<O> = {
  [K in keyof O]: SimpleWritableAtom<O[K]>;
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
  atom: WritableAtomRecord<T> & E;
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
  get: GetRecord<
    T & {
      [key in keyof E]: E[key] extends Atom<infer U> ? U : never;
    }
  >;
  set: SetRecord<T>;
  use: UseRecord<T>;
  getAtom: GetAtomFn;
  setAtom: SetAtomFn;
  useAtom: UseAtomFn;
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
  extend?: (primitiveAtoms: WritableAtomRecord<T>) => E;
  createAtom?: <V>(value: V) => SimpleWritableAtom<V>;
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
  {
    name,
    delay: delayRoot,
    effect,
    extend,
    createAtom = atom,
  }: CreateAtomStoreOptions<T, E, N>
): AtomStoreApi<T, E, N> => {
  const providerIndex = getProviderIndex(name) as NameProvider<N>;
  const useStoreIndex = getUseStoreIndex(name) as UseNameStore<N>;
  const storeIndex = getStoreIndex(name) as NameStore<N>;

  const getAtoms = {} as ReturnType<UseStoreApi<T, E>>['get'];
  const setAtoms = {} as ReturnType<UseStoreApi<T, E>>['set'];
  const useAtoms = {} as ReturnType<UseStoreApi<T, E>>['use'];
  const primitiveAtoms = {} as WritableAtomRecord<T>;

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

  for (const key of Object.keys(initialState)) {
    const atomConfig = createAtom(initialState[key as keyof T]);

    (primitiveAtoms as any)[key] = atomConfig;

    (setAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
      useSetAtomWithStore(atomConfig, optionsOrScope);

    (useAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
      useAtomWithStore(atomConfig, optionsOrScope);
  }

  const atoms = {
    ...primitiveAtoms,
    ...(extend ? extend(primitiveAtoms) : {}),
  } as WritableAtomRecord<T> & E;

  for (const key of Object.keys(atoms)) {
    const atomConfig = atoms[key as keyof T & keyof E];

    (getAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) =>
      useAtomValueWithStore(atomConfig, optionsOrScope);
  }

  const Provider: FC<ProviderProps<T>> = createAtomProvider(
    name,
    primitiveAtoms,
    { effect }
  );

  const storeApi: StoreApi<T, E, N> = {
    atom: atoms,
    name,
  };

  const useStoreApi: UseStoreApi<T, E> = (defaultOptions = {}) => ({
    get: withDefaultOptions(getAtoms, convertScopeShorthand(defaultOptions)),
    set: withDefaultOptions(setAtoms, convertScopeShorthand(defaultOptions)),
    use: withDefaultOptions(useAtoms, convertScopeShorthand(defaultOptions)),
    getAtom: (atomConfig, options) =>
      useAtomValueWithStore(atomConfig, {
        ...convertScopeShorthand(defaultOptions),
        ...convertScopeShorthand(options),
      }),
    setAtom: (atomConfig, options) =>
      useSetAtomWithStore(atomConfig, {
        ...convertScopeShorthand(defaultOptions),
        ...convertScopeShorthand(options),
      }),
    useAtom: (atomConfig, options) =>
      useAtomWithStore(atomConfig, {
        ...convertScopeShorthand(defaultOptions),
        ...convertScopeShorthand(options),
      }),
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
