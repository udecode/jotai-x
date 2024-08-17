import { createEffect } from 'solid-js';
import { useSetAtom } from 'solid-jotai';
import { useHydrateAtoms } from 'solid-jotai/utils';

import {
  SimpleWritableAtomRecord,
  UseHydrateAtoms,
  UseSyncAtoms,
} from './createAtomStore';

/**
 * Hydrate atoms with initial values for SSR.
 */
export const useHydrateStore = (
  atoms: SimpleWritableAtomRecord<any>,
  initialValues: Parameters<UseHydrateAtoms<any>>[0],
  options: Parameters<UseHydrateAtoms<any>>[1] = {}
) => {
  const values: any[] = [];

  for (const key of Object.keys(atoms)) {
    const initialValue = initialValues[key];

    if (initialValue !== undefined) {
      values.push([atoms[key], initialValue]);
    }
  }

  useHydrateAtoms(values, options);
};

/**
 * Update atoms with new values on changes.
 */
export const useSyncStore = (
  atoms: SimpleWritableAtomRecord<any>,
  values: any,
  { store }: Parameters<UseSyncAtoms<any>>[1] = {}
) => {
  for (const key of Object.keys(atoms)) {
    const value = values[key];
    const atom = atoms[key];

    const set = useSetAtom(atom, { store });

    createEffect(() => {
      if (value !== undefined && value !== null) {
        set(value);
      }
    });
  }
};
