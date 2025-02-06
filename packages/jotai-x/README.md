# Jotai X

An extension for [Jotai](https://github.com/pmndrs/jotai) that auto-generates type-safe hooks and utilities for your state. Built with TypeScript and React in mind.

## Features

- Auto-generated type-safe hooks for each state field
- Simple patterns: `use<StoreName>Value('name')` and `use<StoreName>Set('name', value)`
- Extend your store with computed values using `extend`
- Built-in support for hydration, synchronization, and scoped providers

## Why

Built on top of `jotai`, `jotai-x` offers a better developer experience with less boilerplate. Create and interact with stores faster using a more intuitive API.

> Looking for global state management instead of React Context-based state? Check out [Zustand X](https://github.com/udecode/zustand-x) - same API, different state model.

## Installation

```bash
pnpm add jotai jotai-x
```

## Quick Start

Here's how to create a simple store:

```tsx
import { createAtomStore } from 'jotai-x';

// Create a store with an initial state
// Store name is used as prefix for all returned hooks (e.g., `useAppStore`, `useAppValue` for `name: 'app'`)
const { useAppStore, useAppValue, useAppSet, useAppState, AppProvider } =
  createAtomStore(
    {
      name: 'JotaiX',
      stars: 0,
    },
    {
      name: 'app',
    }
  );

// Use it in your components
function RepoInfo() {
  const name = useAppValue('name');
  const stars = useAppValue('stars');

  return (
    <div>
      <h1>{name}</h1>
      <p>{stars} stars</p>
    </div>
  );
}

function AddStarButton() {
  const setStars = useAppSet('stars');

  return <button onClick={() => setStars((s) => s + 1)}>Add star</button>;
}
```

## Core Concepts

### Store Configuration

The store is where everything begins. Configure it with type-safe options:

```ts
import { createAtomStore } from 'jotai-x';

// Types are inferred, including options
const { useUserValue, useUserSet, useUserState, UserProvider } =
  createAtomStore(
    {
      name: 'Alice',
      loggedIn: false,
    },
    {
      name: 'user',
      delay: 100, // Optional delay for state updates
      effect: EffectComponent, // Optional effect component
      extend: (atoms) => ({
        // Optional derived atoms
        intro: atom((get) => `My name is ${get(atoms.name)}`),
      }),
      infiniteRenderDetectionLimit: 100, // Optional render detection limit
    }
  );
```

Available options:

```ts
{
  name: string;
  delay?: number;
  effect?: React.ComponentType;
  extend?: (atoms: Atoms) => DerivedAtoms;
  infiniteRenderDetectionLimit?: number;
}
```

### Store API

The `createAtomStore` function returns an object with the following:

```ts
const {
  // Store name used as prefix
  name: string,

  // Store hook returning all utilities
  useAppStore: () => StoreApi,

  // Direct hooks for state management
  useAppValue: (key: string, options?) => Value,
  useAppSet: (key: string) => SetterFn,
  useAppState: (key: string) => [Value, SetterFn],

  // Provider component
  AppProvider: React.FC<ProviderProps>,

  // Record of all atoms in the store
  appStore: {
    atom: Record<string, Atom>
  }
} = createAtomStore({ ... }, { name: 'app' });
```

### Reading and Writing State

There are three ways to interact with the store state:

#### 1. Hooks (Recommended)

The most straightforward way using hooks returned by `createAtomStore`:

```ts
// Get value
const name = useAppValue('name');
const stars = useAppValue('stars');

// Set value
const setName = useAppSet('name');
const setStars = useAppSet('stars');

// Get both value and setter
const [name, setName] = useAppState('name');
const [stars, setStars] = useAppState('stars');

// With selector and deps
const upperName = useAppValue('name', {
  selector: (name) => name.toUpperCase(),
}, []);
```

#### 2. Store Instance Methods

Using the store instance from `useAppStore()`:

```ts
const store = useAppStore();

// By key
store.get('name'); // Get value
store.set('name', 'value'); // Set value
store.subscribe('name', (value) => console.log(value)); // Subscribe to changes

// Direct access
store.getName(); // Get value
store.setName('value'); // Set value
store.subscribeName((value) => console.log(value)); // Subscribe to changes
```

#### 3. Raw Atom Access

For advanced use cases, you can work directly with atoms:

```ts
const store = useAppStore();

// Access atoms
store.getAtom(someAtom); // Get atom value
store.setAtom(someAtom, 'value'); // Set atom value
store.subscribeAtom(someAtom, (value) => {}); // Subscribe to atom

// Access underlying Jotai store
const jotaiStore = store.store;
```

### Hook API Reference

#### `use<Name>Value(key, options?)`

Subscribe to a single value with optional selector and deps:

```ts
// Basic usage
const name = useAppValue('name');

// With selector
const upperName = useAppValue('name', {
  selector: (name) => name.toUpperCase(),
}, [] // if selector is not memoized, provide deps array
);

// With equality function
const name = useAppValue('name', {
  selector: (name) => name,
  equalityFn: (prev, next) => prev.length === next.length
}, []);
```

#### `use<Name>Set(key)`

Get a setter function for a value:

```ts
const setName = useAppSet('name');
setName('new value');
setName((prev) => prev.toUpperCase());
```

#### `use<Name>State(key)`

Get both value and setter, like React's `useState`:

```tsx
function UserForm() {
  const [name, setName] = useAppState('name');
  const [email, setEmail] = useAppState('email');

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
    </form>
  );
}
```

### Provider-Based Store Hydration

The provider component handles store initialization and state synchronization:

```tsx
type ProviderProps<T> = {
  // Initial values for atoms, hydrated once on mount
  initialValues?: Partial<T>;

  // Dynamic values for controlled state
  ...Partial<T>;

  // Optional custom store instance
  store?: JotaiStore;

  // Optional scope for nested providers
  scope?: string;

  // Optional key to reset the store
  resetKey?: any;

  children: React.ReactNode;
};

function App() {
  return (
    <UserProvider
      // Initial values hydrated on mount
      initialValues={{
        name: 'Alice',
        email: 'alice@example.com'
      }}

      // Controlled values that sync with the store
      name="Bob"

      // Optional scope for nested providers
      scope="user1"

      // Optional key to reset store state
      resetKey={version}
    >
      <UserProfile />
    </UserProvider>
  );
}
```

### Scoped Providers

Create multiple instances of the same store with different scopes:

```tsx
function App() {
  return (
    <UserProvider scope="parent" name="Parent User">
      <UserProvider scope="child" name="Child User">
        <UserProfile />
      </UserProvider>
    </UserProvider>
  );
}

function UserProfile() {
  // Get parent scope
  const parentName = useUserValue('name', { scope: 'parent' });
  // Get closest scope
  const name = useUserValue('name');
}
```

### Derived Atoms

Two ways to create derived atoms:

```ts
// 1. Using extend
const { useUserValue } = createAtomStore(
  {
    name: 'Alice',
  },
  {
    name: 'user',
    extend: (atoms) => ({
      intro: atom((get) => `My name is ${get(atoms.name)}`),
    }),
  }
);

// Access the derived value using the store name
const intro = useUserValue('intro');

// 2. External atoms
const { userStore, useUserStore } = createAtomStore(
  {
    name: 'Alice',
  },
  {
    name: 'user',
  }
);

// Create an external atom
const introAtom = atom((get) => `My name is ${get(userStore.atom.name)}`);

// Create a writable external atom
const countAtom = atom(
  (get) => get(userStore.atom.name).length,
  (get, set, newCount: number) => {
    set(userStore.atom.name, 'A'.repeat(newCount));
  }
);

// Get the store instance
const store = useUserStore();

// Access external atoms using store-based atom hooks
const intro = useAtomValue(store, introAtom); // Read-only atom
const [count, setCount] = useAtomState(store, countAtom); // Read-write atom
const setCount2 = useSetAtom(store, countAtom); // Write-only

// With selector and deps
const upperIntro = useAtomValue(
  store,
  introAtom,
  (intro) => intro.toUpperCase(),
  [] // Optional deps array for selector
);

// With selector and equality function
const intro2 = useAtomValue(
  store,
  introAtom,
  (intro) => intro,
  (prev, next) => prev.length === next.length // Optional equality function
);
```

The store-based atom hooks provide more flexibility when working with external atoms:

- `useAtomValue(store, atom, selector?, equalityFnOrDeps?, deps?)`: Subscribe to a read-only atom value
  - `selector`: Transform the atom value (must be memoized or use deps)
  - `equalityFnOrDeps`: Custom comparison function or deps array
  - `deps`: Dependencies array when using both selector and equalityFn
- `useSetAtom(store, atom)`: Get a setter function for a writable atom
- `useAtomState(store, atom)`: Get both value and setter for a writable atom, like React's `useState`

## Troubleshooting

### Infinite Render Detection

When using value hooks with selectors, ensure they are memoized:

```tsx
// ❌ Wrong - will cause infinite renders
useUserValue('name', { selector: (name) => name.toUpperCase() });

// ✅ Correct - memoize with useCallback
const selector = useCallback((name) => name.toUpperCase(), []);
useUserValue('name', { selector });

// ✅ Correct - provide deps array
useUserValue('name', { selector: (name) => name.toUpperCase() }, []);

// ✅ Correct - no selector
useUserValue('name');
```

## Migration from v1 to v2

```ts
// Before
const { useAppStore } = createAtomStore({ name: 'Alice' }, { name: 'app' });
const name = useAppStore().get.name();
const setName = useAppStore().set.name();
const [name, setName] = useAppStore().use.name();

// Now
const { useAppStore, useAppValue, useAppSet, useAppState } = createAtomStore({ name: 'Alice' }, { name: 'app' });
const name = useAppValue('name');
const setName = useAppSet('name');
const [name, setName] = useAppState('name');
```

## License

[MIT](./LICENSE)
