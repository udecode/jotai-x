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

export type UseStoreApi<T, E> = (options?: UseAtomOptionsOrScope) => {
  get: GetRecord<
    T & {
      [key in keyof E]: E[key] extends Atom<infer U> ? U : never;
    }
  >;
  set: SetRecord<T>;
  use: UseRecord<T>;
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

const withDefaultOptions = <T, R>(
  fnRecord: { [key in keyof T]: (options?: UseAtomOptions) => R },
  defaultOptions: UseAtomOptions
): typeof fnRecord =>
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
  store?: UseAtomOptions['store'];
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

  for (const key of Object.keys(initialState)) {
    const atomConfig = createAtom(initialState[key as keyof T]);

    (primitiveAtoms as any)[key] = atomConfig;

    (setAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
      const options = convertScopeShorthand(optionsOrScope);
      const contextStore = useAtomStore(name, options.scope);

      return useSetAtom(atomConfig as any, {
        store: options.store ?? contextStore,
      });
    };

    (useAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
      const options = convertScopeShorthand(optionsOrScope);
      const contextStore = useAtomStore(name, options.scope);

      return useAtom(atomConfig, {
        store: options.store ?? contextStore,
        delay: options.delay ?? delayRoot,
      });
    };
  }

  const atoms = {
    ...primitiveAtoms,
    ...(extend ? extend(primitiveAtoms) : {}),
  } as WritableAtomRecord<T> & E;

  for (const key of Object.keys(atoms)) {
    const atomConfig = atoms[key as keyof T & keyof E];

    (getAtoms as any)[key] = (optionsOrScope: UseAtomOptionsOrScope = {}) => {
      const options = convertScopeShorthand(optionsOrScope);
      const contextStore = useAtomStore(name, options.scope, false);

      return useAtomValue(atomConfig, {
        store: options.store ?? contextStore,
        delay: options.delay ?? delayRoot,
      });
    };
  }

  return {
    [providerIndex]: createAtomProvider(name, primitiveAtoms, { effect }),
    [useStoreIndex]: (options: UseAtomOptionsOrScope = {}) => ({
      get: withDefaultOptions(getAtoms as any, convertScopeShorthand(options)),
      set: withDefaultOptions(setAtoms as any, convertScopeShorthand(options)),
      use: withDefaultOptions(useAtoms as any, convertScopeShorthand(options)),
    }),
    [storeIndex]: {
      atom: atoms,
      name,
    },
    name,
  } as any;
};
