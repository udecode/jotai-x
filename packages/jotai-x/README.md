# JotaiX

[Migrating from v1 to v2](#migrate-from-v1-to-v2)

JotaiX is a custom extension of [Jotai](https://github.com/pmndrs/jotai), a primitive and flexible state management library for React. Jotai offers a
minimalistic API to manage global, derived, or async states in React, solving common issues such as unnecessary
re-renders or complex context management. JotaiX builds upon this foundation, providing enhanced utilities and patterns
for more efficient and streamlined state management in larger and more complex applications.

`jotai-x`, built on top of `jotai`, is providing a powerful store factory
which solves these challenges, so you can focus on your app.

```bash
yarn add jotai jotai-x
```

For further details and API documentation, visit [jotai-x.udecode.dev](https://jotai-x.udecode.dev).

## **Why Choose `jotai-x`?**

- Reduces boilerplate: Simplifies state management with concise and powerful utilities.
- Enhanced modular state management: Offers advanced features like atom stores, hydration utilities, and more.
- Improved developer experience: Strong TypeScript support ensures type safety and better developer tooling.
- Seamless integration with Jotai: Builds on top of Jotai's API, making it easy for existing Jotai users to adopt.

## **Core Features**

### **Creating a Store**

JotaiX allows for the creation of structured stores with ease, integrating seamlessly with Jotai's atom concept.

```tsx
import { createAtomStore } from 'jotai-x';

// Notice how it uses the name of the store in the returned object.
export const { useElementStore, ElementProvider } = createAtomStore({ 
  element: null
}, { 
  name: 'element'
});
```

The **`createAtomStore`** function simplifies the process of creating and managing atom-based states.

#### Function Signature

```tsx
createAtomStore<T extends object>(initialState: T, options?: CreateAtomStoreOptions): AtomStoreApi;
```

- **`initialState`**: This is an object representing the initial state of your store. Each key-value pair in this object is used to create an individual atom. This is required even if you want to set the initial value from the provider, otherwise the atom would not be created. 
- **`options`**: Optional. This parameter allows you to pass additional configuration options for the store creation.

#### Options

The **`options`** object can include several properties to customize the behavior of your store:

- **`name`**: A string representing the name of the store, which can be helpful for debugging or when working with multiple stores.
- **`delay`**: If you need to introduce a delay in state updates, you can specify it here. Optional.
- **`effect`**: A React component that can be used to run effects inside the provider. Optional.
- **`extend`**: Extend the store with derived atoms based on the store state. Optional.

#### Return Value

The **`createAtomStore`** function returns an object (**`AtomStoreApi`**) containing the following properties and methods for interacting with the store:

- **`use<Name>Store`**: 
  - A function that returns the following objects: **`useValue`**, **`useSet`**, **`useState`**, where values are hooks for each state defined in the store, and **`get`**, **`set`**, **`subscribe`**, **`store`**, where values are direct get/set accessors to modify each state.
  - **`useValue`**: Hooks for accessing a state within a component, ensuring re-rendering when the state changes. See [useAtomValue](https://jotai.org/docs/core/use-atom#useatomvalue).
    ``` js
      const store = useElementStore();
      const element = store.useElementValue();
      // alternative
      const element = useElementStore().useValue('element');
    ```
    - Advanced: `useValue` supports parameters `selector`, which is a function that takes the current value and returns a new value and parameter `equalityFn`, which is a function that compares the previous and new values and only re-renders if they are not equal. Internally, it uses [selectAtom](https://jotai.org/docs/utilities/select#selectatom)
    - If you want to use selector and equalityFn, **Don't forget to memoize the selector and equalityFn via `useCallback`**.
    ``` js
      const store = useElementStore();
      const toUpperCase = useCallback((element) => element.toUpperCase(), []);
      // Now it will only re-render if the uppercase value changes
      const element = store.useElementValue(toUpperCase);
      // alternative
      const element = useElementStore().useValue('element', toUpperCase);
    ```
  - **`useSet`**: Hooks for setting a state within a component. See [useSetAtom](https://jotai.org/docs/core/use-atom#usesetatom).
    ``` js
      const store = useElementStore();
      const element = store.useSetElement();
      // alternative
      const element = useElementStore().useSet('element');
    ```
  - **`useState`**: Hooks for accessing and setting a state within a component, ensuring re-rendering when the state changes. See [useAtom](https://jotai.org/docs/core/use-atom).
    ``` js
      const store = useElementStore();
      const element = store.useElementState();
      // alternative
      const element = useElementStore().useState('element');
    ```
  - **`get`**: Directly get the state. Not a hook so it could be used in event handlers or other hooks, and the component won't re-render if the state changes. See [createStore](https://jotai.org/docs/core/store#createstore)
    ``` js
      const store = useElementStore();
      useEffect(() => { console.log(store.getElement()) }, []);
      // alternative
      useEffect(() => { console.log(store.get('element')) }, []);
    ```
  - **`set`**: Directly set the state. Not a hook so it could be used in event handlers or other hooks. See [createStore](https://jotai.org/docs/core/store#createstore)
    ``` js
      const store = useElementStore();
      useEffect(() => { store.setElement('div') }, []);
      // alternative
      useEffect(() => { store.set('element', 'div') }, []);
    ```
  - **`subscribe`**: Subscribe to the state change. . See [createStore](https://jotai.org/docs/core/store#createstore)
    - NOTE: The subscribed callback will fire whenever the atom state or dependent atom states change. There is no equality check.
    ``` js
      const store = useElementStore();
      useEffect(() => store.subscribeElement((newElement) => console.log(newElement)), []);
      // alternative
      useEffect(() => store.subscribe('element', (newElement) => console.log(newElement)), []);
    ```
  - **`store`**: The [JotaiStore](https://jotai.org/docs/core/store) for the current context.
    ``` js
      const store = useElementStore();
      const jotaiStore = store.store;
    ```
- **`<Name>Provider`**:
  - The API includes dynamically generated provider components for each defined store. This allows  scoped state management within your application. More information in the next section.
- **`<name>Store`**:
  - **`atom`**: Access the atoms used by the store, including derived atoms defined using `extend`. See [atom](https://jotai.org/docs/core/atom).
  
### **Provider-Based Store Hydration and Synchronization**

**`createAtomStore`** generates a provider component (`<Name>Provider`) for a Jotai store. This provider not only supplies the store to its child components but also handles hydrating and syncing the store's state. Here's how it works:

- **Hydration**: Hydrates atoms with initial values. It's particularly useful for SSR, ensuring that the client-side state aligns with what was rendered on the server. Use `initialValues` prop.
- **Synchronization**: Updates atoms with new values as external changes occur, maintaining consistency across the application. Use `<state>` props: there is one for each state defined in the store.

### Scoped Providers and Context Management

JotaiX creates scoped providers, enabling more granular control over different segments of state within your application. `createAtomStore` sets up a context for each store, which can be scoped using the **`scope`** prop. This is particularly beneficial in complex applications where nested providers are needed.

### Derived Atoms

There are two ways of creating derived atoms from your JotaiX store.

#### Derived Atoms Using `extend`

Atoms defined using the `extend` option are made available in the same places as other values in the store.

```ts
const { useUserStore } = createAtomStore({
  username: 'Alice',
}, {
  name: 'user',
  extend: (atoms) => ({
    intro: atom((get) => `My name is ${get(atoms.username)}`),
  }),
});

const userStore = useUserStore();
const intro = userStore.useIntroValue();
```

#### Externally Defined Derived Atoms

Derived atoms can also be defined externally by accessing the store's atoms through the `<name>Store` API. Externally defined atoms can be accessed through the store using special hooks:
`useAtomValue`, `useSetAtom`, `useAtomState`, `getAtom`, `setAtom`, `subscribeAtom`.

```ts
const { userStore, useUserStore } = createAtomStore({
  username: 'Alice',
}, { name: 'user' });

const introAtom = atom((get) => `My name is ${get(userStore.atom.username)}`);

const userStore = useUserStore();
const intro = userStore.useAtomValue(introAtom);
```

### Example Usage

#### 1. Create a store

```tsx
import { createAtomStore } from 'jotai-x';

export type AppStore = {
  name: string;
  onUpdateName: (name: string) => void;
};

const initialState: Nullable<AppStore> = {
  name: null,
  onUpdateName: null,
};

export const { useAppStore, AppProvider } = createAtomStore(
  initialState as AppStore,
  { name: 'app' }
);
```

#### 2. Use the store in a component

```tsx
// ...

const App = () => {
  return (
    <AppProvider 
      initialValues={{
        onUpdateName: (name: string) => console.log(name)
      }}
      // Either here or in initialValues
      name="John Doe"
    >
      <Component />
    </AppProvider>
  );
};

const Component = () => {
  const appStore = useAppStore();
  const [name, setName] = store.useNameState();
  const onUpdateName = store.useOnUpdateNameValue();

  useEffect(() => store.subscribe.name((newName) => {
    console.log(`Name updated to: ${newName}`);
    // An alternative to `appStore.useNameState()`, won't rerender when the state changes
    assert.ok(newName === appStore.getName());
    if (newName.includes('#')) {
      // Equivalent to `appStore.useSetName()`'s return
      appStore.setName('invalid');
      onUpdateName('invalid');
    }
  }), [appStore])
  
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => onUpdateName(name)}>Update</button>
    </div>
  );
};
```

#### Scoped Providers

```tsx
const App = () => {
  return (
    // Parent scope
    <AppProvider 
      scope="parent"
      initialValues={{
        onUpdateName: (name: string) => console.log("Parent:", name)
      }}
      name="Parent User"
    >
      <div>
        <h1>Parent Component</h1>
        <Component />
        {/* Child scope */}
        <AppProvider 
          scope="child"
          initialValues={{
            onUpdateName: (name: string) => console.log("Child:", name)
          }}
          name="Child User"
        >
          <div>
            <h2>Child Component</h2>
            <Component />
          </div>
        </AppProvider>
      </div>
    </AppProvider>
  );
};

// Accessing state from the specified scope.
const Component = () => {
  // Here, we get the state from the parent scope
  const parentAppStore = useAppStore('parent');
  const [name, setName] = parentScope.useNameState();
  // Here, we get the state from the closest scope (default)
  const appStore = useAppStore();
  const onUpdateName = appStore.useOnUpdateNameValue();

  return (
    <div>
      <input value={name || ''} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => onUpdateName(name)}>Update Name</button>
    </div>
  );
};
```

## Migrate from v1 to v2

1. Return of `use<Name>Store`: `get` is renamed to `use<Key>Value`, `set` is renamed to `useSet<Key>`, `use` is renamed to `useState`.
``` diff
- const name = useAppStore().get.name();
- const setName = useAppStore().set.name();
- const [name, setName] = useAppStore().use.name();

+ const appStore = useAppStore();
+ const name = appStore.useNameValue();
+ const setName = appStore.useSetName();
+ const [name, setName] = appStore.useNameState();

+ // alternative
+ const name = appStore.useValue('name');
+ const setName = appStore.useSet('name');
+ const [name, setName] = appStore.useState('name');
```

2. Rename `.atom()` APIs:
``` diff
- const atomValue = useAppStore().get.atom(atomConfig);
- const setAtomValue = useAppStore().set.atom(atomConfig);
- const [atomValue, setAtomValue] = useAppStore().use.atom(atomConfig);

+ const appStore = useAppStore();
+ const atomValue = appStore.useAtomValue(atomConfig);
+ const setAtomValue = appStore.useSetAtom(atomConfig);
+ const [atomValue, setAtomValue] = appStore.useAtomState(atomConfig);
```
NOTE: Try to avoid using the key "atom" as the store state key because
  1. `useValue('atom')` and `useSet('atom')` and `useState('atom')` are not supported. They are only valid if the key "atom" is presented in the store.
  2. On the other hand, `useAtomValue()`, `useSetAtom()`, and `useAtomState()` cannot access the state if the key "atom" is presented in the store. 

3. Return of `use<Name>Store`: `store` is no longer a function. Now it is a direct property.
``` diff
- const store = useAppStore().store();

+ const appStore = useAppStore();
+ const jotaiStore = appStore.store;
```

4. Return of `use<Name>Store`: `option` is no longer a valid parameter of `useValue` and `useSet`. To control the behavior, directly pass the options to `createAtomStore` or `use<Name>Store`.
``` diff
- const scope1Name = useAppStore().useValue.name(scope1Options);
- const scope2Name = useAppStore().useValue.name(scope2Options);

+ const scope1AppStore = useAppStore(scope1Options);
+ const scope1Name = scope1AppStore.useNameValue();
+ const scope2AppStore = useAppStore(scope2Options);
+ const scope2Name = scope2AppStore.useNameValue();
```

## Contributing

### Ideas and discussions

[Discussions](https://github.com/udecode/jotai-x/discussions) is the best
place for bringing opinions and contributions. Letting us know if we're
going in the right or wrong direction is great feedback and will be much
appreciated!

#### [Become a Sponsor!](https://github.com/sponsors/zbeyens)

### Contributors

🌟 Stars and 📥 Pull requests are welcome! Don't hesitate to **share
your feedback** here. Read our
[contributing guide](https://github.com/udecode/jotai-x/blob/main/CONTRIBUTING.md)
to get started.

<p>
<a href="https://www.netlify.com">
  <img src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg" alt="Deploys by Netlify" />
</a>
</p>

## License

[MIT](https://github.com/udecode/jotai-x/blob/main/LICENSE)
