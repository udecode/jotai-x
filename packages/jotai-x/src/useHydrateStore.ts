import React from 'react';
import { useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

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

    // eslint-disable-next-line react-compiler/react-compiler
    const set = useSetAtom(atom, { store });

    // eslint-disable-next-line react-compiler/react-compiler
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        set(value);
      }
    }, [set, value]);
  }
};
