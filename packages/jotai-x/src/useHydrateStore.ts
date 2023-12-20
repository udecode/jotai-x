import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import type {
  UseHydrateAtoms,
  UseSyncAtoms,
  WritableAtomRecord,
} from './createAtomStore';

/**
 * Hydrate atoms with initial values for SSR.
 */
export const useHydrateStore = (
  atoms: WritableAtomRecord<any>,
  initialValues: Parameters<UseHydrateAtoms<any>>[0],
  options: Parameters<UseHydrateAtoms<any>>[1] = {}
) => {
  const values: any[] = [];

  for (const key of Object.keys(atoms)) {
    const initialValue = initialValues[key];

    if (initialValue !== undefined) {
      values.push([
        atoms[key],
        typeof initialValue === 'function'
          ? { fn: initialValue }
          : initialValue,
      ]);
    }
  }

  useHydrateAtoms(values, options);
};

/**
 * Update atoms with new values on changes.
 */
export const useSyncStore = (
  atoms: WritableAtomRecord<any>,
  values: any,
  { store }: Parameters<UseSyncAtoms<any>>[1] = {}
) => {
  for (const key of Object.keys(atoms)) {
    const value = values[key];
    const atom = atoms[key];

    const set = useSetAtom(atom, { store });

    useEffect(() => {
      if (value !== undefined && value !== null) {
        set(typeof value === 'function' ? { fn: value } : value);
      }
    }, [set, value]);
  }
};
