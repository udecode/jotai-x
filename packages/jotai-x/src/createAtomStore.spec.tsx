import '@testing-library/jest-dom';

import React, { ReactNode, useState } from 'react';
import { act, queryByText, render, renderHook } from '@testing-library/react';
import { atom, PrimitiveAtom, useAtomValue } from 'jotai';
import { splitAtom } from 'jotai/utils';

import { createAtomStore } from './createAtomStore';

describe('createAtomStore', () => {
  describe('single provider', () => {
    type MyTestStoreValue = {
      name: string;
      age: number;
    };

    const INITIAL_NAME = 'John';
    const INITIAL_AGE = 42;

    const initialTestStoreValue: MyTestStoreValue = {
      name: INITIAL_NAME,
      age: INITIAL_AGE,
    };

    const { useMyTestStoreStore, MyTestStoreProvider } = createAtomStore(
      initialTestStoreValue,
      { name: 'myTestStore' as const }
    );

    const ReadOnlyConsumer = () => {
      const name = useMyTestStoreStore().get.name();
      const age = useMyTestStoreStore().get.age();

      return (
        <div>
          <span>{name}</span>
          <span>{age}</span>
        </div>
      );
    };

    const WRITE_ONLY_CONSUMER_AGE = 99;

    const WriteOnlyConsumer = () => {
      const setAge = useMyTestStoreStore().set.age();

      return (
        <button type="button" onClick={() => setAge(WRITE_ONLY_CONSUMER_AGE)}>
          consumerSetAge
        </button>
      );
    };

    const MUTABLE_PROVIDER_INITIAL_AGE = 19;
    const MUTABLE_PROVIDER_NEW_AGE = 20;

    const MutableProvider = ({ children }: { children: ReactNode }) => {
      const [age, setAge] = useState(MUTABLE_PROVIDER_INITIAL_AGE);

      return (
        <>
          <MyTestStoreProvider age={age}>{children}</MyTestStoreProvider>

          <button
            type="button"
            onClick={() => setAge(MUTABLE_PROVIDER_NEW_AGE)}
          >
            providerSetAge
          </button>
        </>
      );
    };

    beforeEach(() => {
      renderHook(() => useMyTestStoreStore().set.name()(INITIAL_NAME));
      renderHook(() => useMyTestStoreStore().set.age()(INITIAL_AGE));
    });

    it('passes default values from provider to consumer', () => {
      const { getByText } = render(
        <MyTestStoreProvider>
          <ReadOnlyConsumer />
        </MyTestStoreProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(INITIAL_AGE)).toBeInTheDocument();
    });

    it('passes non-default values from provider to consumer', () => {
      const { getByText } = render(
        <MyTestStoreProvider name="Jane" age={94}>
          <ReadOnlyConsumer />
        </MyTestStoreProvider>
      );

      expect(getByText('Jane')).toBeInTheDocument();
      expect(getByText('94')).toBeInTheDocument();
    });

    it('propagates updates from provider to consumer', () => {
      const { getByText } = render(
        <MutableProvider>
          <ReadOnlyConsumer />
        </MutableProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('providerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_NEW_AGE)).toBeInTheDocument();
    });

    it('propagates updates between consumers', () => {
      const { getByText } = render(
        <MyTestStoreProvider>
          <ReadOnlyConsumer />
          <WriteOnlyConsumer />
        </MyTestStoreProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();
    });

    it('prefers the most recent update', () => {
      const { getByText } = render(
        <MutableProvider>
          <ReadOnlyConsumer />
          <WriteOnlyConsumer />
        </MutableProvider>
      );

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_INITIAL_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();

      act(() => getByText('providerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(MUTABLE_PROVIDER_NEW_AGE)).toBeInTheDocument();

      act(() => getByText('consumerSetAge').click());

      expect(getByText(INITIAL_NAME)).toBeInTheDocument();
      expect(getByText(WRITE_ONLY_CONSUMER_AGE)).toBeInTheDocument();
    });
  });

  describe('scoped providers', () => {
    type MyScopedTestStoreValue = { age: number | null };

    const initialScopedTestStoreValue: MyScopedTestStoreValue = {
      age: null,
    };

    const { useMyScopedTestStoreStore, MyScopedTestStoreProvider } =
      createAtomStore(initialScopedTestStoreValue, {
        name: 'myScopedTestStore' as const,
      });

    const ReadOnlyConsumer = ({ scope }: { scope: string }) => {
      const age = useMyScopedTestStoreStore().get.age({ scope });

      return (
        <div>
          <span>{JSON.stringify(age)}</span>
        </div>
      );
    };

    const ReadOnlyConsumerWithScopeShorthand = ({
      scope,
    }: {
      scope: string;
    }) => {
      const age = useMyScopedTestStoreStore(scope).get.age();

      return (
        <div>
          <span>{JSON.stringify(age)}</span>
        </div>
      );
    };

    it('returns value of first ancestor when scope matches no provider', () => {
      const { getByText } = render(
        <MyScopedTestStoreProvider scope="scope1" age={1}>
          <MyScopedTestStoreProvider scope="scope2" age={2}>
            <ReadOnlyConsumer scope="scope3" />
          </MyScopedTestStoreProvider>
        </MyScopedTestStoreProvider>
      );

      expect(getByText('2')).toBeInTheDocument();
    });

    it('returns value of first matching ancestor provider', () => {
      const { getByText } = render(
        <MyScopedTestStoreProvider scope="scope1" age={1}>
          <MyScopedTestStoreProvider scope="scope2" age={2}>
            <MyScopedTestStoreProvider scope="scope3" age={3}>
              <MyScopedTestStoreProvider scope="scope2" age={4}>
                <MyScopedTestStoreProvider scope="scope2" age={5} />
                <MyScopedTestStoreProvider scope="scope1" age={6}>
                  <ReadOnlyConsumer scope="scope2" />
                </MyScopedTestStoreProvider>
                <MyScopedTestStoreProvider scope="scope2" age={7} />
              </MyScopedTestStoreProvider>
            </MyScopedTestStoreProvider>
          </MyScopedTestStoreProvider>
        </MyScopedTestStoreProvider>
      );

      expect(getByText('4')).toBeInTheDocument();
    });

    it('allows shorthand to specify scope', () => {
      const { getByText } = render(
        <MyScopedTestStoreProvider scope="scope1" age={1}>
          <MyScopedTestStoreProvider scope="scope2" age={2}>
            <MyScopedTestStoreProvider scope="scope3" age={3}>
              <MyScopedTestStoreProvider scope="scope2" age={4}>
                <MyScopedTestStoreProvider scope="scope2" age={5} />
                <MyScopedTestStoreProvider scope="scope1" age={6}>
                  <ReadOnlyConsumerWithScopeShorthand scope="scope2" />
                </MyScopedTestStoreProvider>
                <MyScopedTestStoreProvider scope="scope2" age={7} />
              </MyScopedTestStoreProvider>
            </MyScopedTestStoreProvider>
          </MyScopedTestStoreProvider>
        </MyScopedTestStoreProvider>
      );

      expect(getByText('4')).toBeInTheDocument();
    });
  });

  describe('multiple unrelated stores', () => {
    type MyFirstTestStoreValue = { name: string };
    type MySecondTestStoreValue = { age: number };

    const initialFirstTestStoreValue: MyFirstTestStoreValue = {
      name: 'My name',
    };

    const initialSecondTestStoreValue: MySecondTestStoreValue = {
      age: 72,
    };

    const { useMyFirstTestStoreStore, MyFirstTestStoreProvider } =
      createAtomStore(initialFirstTestStoreValue, {
        name: 'myFirstTestStore' as const,
      });

    const { useMySecondTestStoreStore, MySecondTestStoreProvider } =
      createAtomStore(initialSecondTestStoreValue, {
        name: 'mySecondTestStore' as const,
      });

    const FirstReadOnlyConsumer = () => {
      const name = useMyFirstTestStoreStore().get.name();

      return (
        <div>
          <span>{name}</span>
        </div>
      );
    };

    const SecondReadOnlyConsumer = () => {
      const age = useMySecondTestStoreStore().get.age();

      return (
        <div>
          <span>{age}</span>
        </div>
      );
    };

    it('returns the value for the correct store', () => {
      const { getByText } = render(
        <MyFirstTestStoreProvider name="Jane" scope="firstScope">
          <MySecondTestStoreProvider age={98} scope="secondScope">
            <FirstReadOnlyConsumer />
            <SecondReadOnlyConsumer />
          </MySecondTestStoreProvider>
        </MyFirstTestStoreProvider>
      );

      expect(getByText('Jane')).toBeInTheDocument();
      expect(getByText('98')).toBeInTheDocument();
    });
  });

  describe('extended stores', () => {
    type User = {
      name: string;
      age: number;
    };

    const initialUser: User = {
      name: 'Jane',
      age: 98,
    };

    const { userStore, useUserStore, UserProvider } = createAtomStore(
      initialUser,
      {
        name: 'user' as const,
        extend: ({ name, age }) => ({
          bio: atom((get) => `${get(name)} is ${get(age)} years old`),
        }),
      }
    );

    const ReadOnlyConsumer = () => {
      const bio = useUserStore().get.bio();

      return <div>{bio}</div>;
    };

    it('includes extended atom in store object', () => {
      const { result } = renderHook(() => useAtomValue(userStore.atom.bio));
      expect(result.current).toBe('Jane is 98 years old');
    });

    it('includes extended atom in get hooks', () => {
      const { result } = renderHook(() => useUserStore().get.bio());
      expect(result.current).toBe('Jane is 98 years old');
    });

    it('does not include extended atom in set hooks', () => {
      const { result } = renderHook(() => Object.keys(useUserStore().set));
      expect(result.current).not.toContain('bio');
    });

    it('does not include extended atom in use hooks', () => {
      const { result } = renderHook(() => Object.keys(useUserStore().use));
      expect(result.current).not.toContain('bio');
    });

    it('computes extended atom based on current state', () => {
      const { getByText } = render(
        <UserProvider name="John" age={42}>
          <ReadOnlyConsumer />
        </UserProvider>
      );

      expect(getByText('John is 42 years old')).toBeInTheDocument();
    });
  });

  describe('custom createAtom function', () => {
    type CustomAtom<T> = PrimitiveAtom<T> & {
      isCustomAtom: true;
    };

    const createCustomAtom = <T,>(value: T): CustomAtom<T> => ({
      ...atom(value),
      isCustomAtom: true,
    });

    const { customStore } = createAtomStore(
      {
        x: 5,
      },
      {
        name: 'custom' as const,
        createAtom: createCustomAtom,
      }
    );

    it('uses custom createAtom function', () => {
      const myAtom = customStore.atom.x as CustomAtom<number>;
      expect(myAtom.isCustomAtom).toBe(true);
    });
  });

  describe('arbitrary atom accessors', () => {
    type User = {
      name: string;
    };

    const initialUser: User = {
      name: 'Jane',
    };

    const { userStore, useUserStore, UserProvider } = createAtomStore(
      initialUser,
      {
        name: 'user' as const,
      }
    );

    const derivedAtom = atom((get) => `My name is ${get(userStore.atom.name)}`);

    const DerivedAtomConsumer = () => {
      const message = useUserStore().get.atom(derivedAtom);

      return <div>{message}</div>;
    };

    it('accesses arbitrary atom within store', () => {
      const { getByText } = render(
        <UserProvider name="John">
          <DerivedAtomConsumer />
        </UserProvider>
      );

      expect(getByText('My name is John')).toBeInTheDocument();
    });
  });

  describe('splitAtoms using todoStore.atom.items', () => {
    const initialState = {
      items: [] as {
        task: string;
        done: boolean;
      }[],
    };

    const { todoStore, useTodoStore, TodoProvider } = createAtomStore(
      initialState,
      {
        name: 'todo' as const,
      }
    );

    const todoAtomsAtom = splitAtom(todoStore.atom.items);

    type TodoType = (typeof initialState)['items'][number];

    const TodoItem = ({
      todoAtom,
      remove,
    }: {
      todoAtom: PrimitiveAtom<TodoType>;
      remove: () => void;
    }) => {
      const [todo, setTodo] = useTodoStore().use.atom(todoAtom);

      return (
        <div>
          <label>{todo.task}</label>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => {
              setTodo((oldValue) => ({ ...oldValue, done: !oldValue.done }));
            }}
          />
          {/* eslint-disable-next-line react/button-has-type */}
          <button onClick={remove}>remove {todo.task}</button>
        </div>
      );
    };

    const TodoList = () => {
      const [todoAtoms, dispatch] = useTodoStore().use.atom(todoAtomsAtom);
      return (
        <ul>
          {todoAtoms.map((todoAtom) => (
            <TodoItem
              key={`${todoAtom}`}
              todoAtom={todoAtom}
              remove={() => dispatch({ type: 'remove', atom: todoAtom })}
            />
          ))}
        </ul>
      );
    };

    it('should work', () => {
      const { getByText, container } = render(
        <TodoProvider
          initialValues={{
            items: [
              {
                task: 'help the town',
                done: false,
              },
              {
                task: 'feed the dragon',
                done: false,
              },
            ],
          }}
        >
          <TodoList />
        </TodoProvider>
      );

      expect(getByText('help the town')).toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();

      act(() => getByText('remove help the town').click());

      expect(queryByText(container, 'help the town')).not.toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();
    });
  });

  describe('splitAtoms using extend', () => {
    const initialState = {
      items: [] as {
        task: string;
        done: boolean;
      }[],
    };

    const { useTodoStore, TodoProvider } = createAtomStore(initialState, {
      name: 'todo' as const,
      extend: ({ items }) => ({
        itemAtoms: splitAtom(items),
      }),
    });

    type TodoType = (typeof initialState)['items'][number];

    const TodoItem = ({
      todoAtom,
      remove,
    }: {
      todoAtom: PrimitiveAtom<TodoType>;
      remove: () => void;
    }) => {
      const [todo, setTodo] = useTodoStore().use.atom(todoAtom);

      return (
        <div>
          <label>{todo.task}</label>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => {
              setTodo((oldValue) => ({ ...oldValue, done: !oldValue.done }));
            }}
          />
          {/* eslint-disable-next-line react/button-has-type */}
          <button onClick={remove}>remove {todo.task}</button>
        </div>
      );
    };

    const TodoList = () => {
      const [todoAtoms, dispatch] = useTodoStore().use.itemAtoms();

      return (
        <ul>
          {todoAtoms.map((todoAtom) => (
            <TodoItem
              key={`${todoAtom}`}
              todoAtom={todoAtom}
              remove={() => dispatch({ type: 'remove', atom: todoAtom })}
            />
          ))}
        </ul>
      );
    };

    it('should work', () => {
      const { getByText, container } = render(
        <TodoProvider
          initialValues={{
            items: [
              {
                task: 'help the town',
                done: false,
              },
              {
                task: 'feed the dragon',
                done: false,
              },
            ],
          }}
        >
          <TodoList />
        </TodoProvider>
      );

      expect(getByText('help the town')).toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();

      act(() => getByText('remove help the town').click());

      expect(queryByText(container, 'help the town')).not.toBeInTheDocument();
      expect(getByText('feed the dragon')).toBeInTheDocument();
    });
  });
});
