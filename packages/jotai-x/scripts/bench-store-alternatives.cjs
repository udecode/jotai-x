const { writeFileSync } = require('node:fs');
const Module = require('node:module');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { performance } = require('node:perf_hooks');

const rootRequire = createRequire(resolve(__dirname, '../../../package.json'));

const sharedModules = {
  '@testing-library/react': rootRequire('@testing-library/react'),
  jotai: rootRequire('jotai'),
  'jotai/utils': rootRequire('jotai/utils'),
  'jotai/vanilla': rootRequire('jotai/vanilla'),
  react: rootRequire('react'),
  'react-dom': rootRequire('react-dom'),
  'react-dom/client': rootRequire('react-dom/client'),
  'react/jsx-dev-runtime': rootRequire('react/jsx-dev-runtime'),
  'react/jsx-runtime': rootRequire('react/jsx-runtime'),
};

const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  if (request in sharedModules) {
    return sharedModules[request];
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { JSDOM } = rootRequire('jsdom');
const React = sharedModules.react;
const { render, cleanup } = sharedModules['@testing-library/react'];
const {
  atom,
  Provider: JotaiProvider,
  useAtomValue,
} = sharedModules.jotai;
const { selectAtom } = sharedModules['jotai/utils'];
const { createStore } = sharedModules['jotai/vanilla'];

const {
  createAtomProvider,
  createAtomStore,
  useAtomStore,
} = require('../dist/index.js');

const dom = new JSDOM('<!doctype html><html><body></body></html>');

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.MutationObserver = dom.window.MutationObserver;
global.IS_REACT_ACT_ENVIRONMENT = true;

const BENCH_COUNTS = [250, 1000];
const WARMUP_ITERATIONS = 2;
const SAMPLE_ITERATIONS = 8;

const createBenchRecords = (count, valueOffset = 0) => {
  return Array.from({ length: count }, (_, index) => ({
    entry: {
      label: `node-${index + valueOffset}`,
      value: index + valueOffset,
    },
    path: [index],
    selected: (index + valueOffset) % 3 === 0,
  }));
};

const recordsByCount = new Map(
  BENCH_COUNTS.map((count) => [count, createBenchRecords(count)])
);

const updatedRecordsByCount = new Map(
  BENCH_COUNTS.map((count) => [count, createBenchRecords(count, 1_000_000)])
);

const selectEntryScore = (entry) =>
  entry ? entry.value + entry.label.length : -1;

const BenchTree = ({ Consumer, Provider, records }) =>
  React.createElement(
    'div',
    null,
    records.map((record) =>
      React.createElement(
        Provider,
        {
          key: record.path[0],
          record,
        },
        Consumer ? React.createElement(Consumer) : null
      )
    )
  );

const PlainContext = React.createContext(null);

const usePlainRecord = () => {
  const context = React.useContext(PlainContext);

  if (!context) {
    throw new Error('Missing PlainContext provider.');
  }

  return context;
};

const PlainContextProvider = ({ children, record }) =>
  React.createElement(PlainContext.Provider, { value: record }, children);

const PlainValueConsumer = () => {
  const record = usePlainRecord();

  void record.entry.value;

  return null;
};

const PlainSelectorConsumer = () => {
  const record = usePlainRecord();
  const score = selectEntryScore(record.entry);

  void score;

  return null;
};

const rawEntryAtom = atom(null);
const rawPathAtom = atom(null);
const rawSelectedAtom = atom(false);

const seedRawStore = (store, record) => {
  store.set(rawEntryAtom, record.entry);
  store.set(rawPathAtom, record.path);
  store.set(rawSelectedAtom, record.selected);
};

const RawJotaiProvider = ({ children, record }) => {
  const [store] = React.useState(() => {
    const nextStore = createStore();

    seedRawStore(nextStore, record);

    return nextStore;
  });

  React.useLayoutEffect(() => {
    seedRawStore(store, record);
  }, [record, store]);

  return React.createElement(JotaiProvider, { store }, children);
};

const RawValueConsumer = () => {
  const entry = useAtomValue(rawEntryAtom);

  void entry && entry.value;

  return null;
};

const RawSelectorConsumer = () => {
  const selectorAtom = React.useMemo(
    () => selectAtom(rawEntryAtom, selectEntryScore, Object.is),
    []
  );
  const score = useAtomValue(selectorAtom);

  void score;

  return null;
};

const directAtoms = {
  entry: atom(null),
  path: atom(null),
  selected: atom(false),
};

const DirectProvider = createAtomProvider('benchDirect', directAtoms);

const JotaiXProviderProvider = ({ children, record }) =>
  React.createElement(
    DirectProvider,
    {
      entry: record.entry,
      path: record.path,
      selected: record.selected,
    },
    children
  );

const useDirectStore = () => {
  const store = useAtomStore('benchDirect', undefined, false);

  if (!store) {
    throw new Error('Missing benchDirect store.');
  }

  return store;
};

const DirectValueConsumer = () => {
  const store = useDirectStore();
  const entry = useAtomValue(directAtoms.entry, { store });

  void entry && entry.value;

  return null;
};

const DirectSelectorConsumer = () => {
  const store = useDirectStore();
  const selectorAtom = React.useMemo(
    () => selectAtom(directAtoms.entry, selectEntryScore, Object.is),
    []
  );
  const score = useAtomValue(selectorAtom, { store });

  void score;

  return null;
};

const benchStore = createAtomStore(
  {
    entry: null,
    path: null,
    selected: false,
  },
  {
    name: 'benchStore',
    suppressWarnings: true,
  }
);

const BenchStoreProvider = benchStore.BenchStoreProvider;

const JotaiXStoreApiProvider = ({ children, record }) =>
  React.createElement(
    BenchStoreProvider,
    {
      entry: record.entry,
      path: record.path,
      selected: record.selected,
    },
    children
  );

const StoreApiValueConsumer = () => {
  const entry = benchStore.useBenchStoreStore().useEntryValue();

  void entry && entry.value;

  return null;
};

const StoreApiSelectorConsumer = () => {
  const score = benchStore.useBenchStoreStore().useEntryValue(
    selectEntryScore,
    [selectEntryScore]
  );

  void score;

  return null;
};

const KeyHookValueConsumer = () => {
  const entry = benchStore.useBenchStoreValue('entry');

  void entry && entry.value;

  return null;
};

const KeyHookSelectorConsumer = () => {
  const score = benchStore.useBenchStoreValue(
    'entry',
    {
      selector: selectEntryScore,
    },
    [selectEntryScore]
  );

  void score;

  return null;
};

const renderAndUnmount = (element) => {
  const rendered = render(element);

  rendered.unmount();
  cleanup();
};

const renderUpdateAndUnmount = (initialElement, updatedElement) => {
  const rendered = render(initialElement);

  rendered.rerender(updatedElement);
  rendered.unmount();
  cleanup();
};

const runMountCase = ({ Consumer, Provider, records }) => {
  renderAndUnmount(
    React.createElement(BenchTree, {
      Consumer,
      Provider,
      records,
    })
  );
};

const runUpdateCase = ({
  Consumer,
  Provider,
  records,
  updatedRecords,
}) => {
  renderUpdateAndUnmount(
    React.createElement(BenchTree, {
      Consumer,
      Provider,
      records,
    }),
    React.createElement(BenchTree, {
      Consumer,
      Provider,
      records: updatedRecords,
    })
  );
};

const measureSamples = ({ run }) => {
  for (let iteration = 0; iteration < WARMUP_ITERATIONS; iteration += 1) {
    run();
  }

  const samplesMs = [];

  for (let iteration = 0; iteration < SAMPLE_ITERATIONS; iteration += 1) {
    const start = performance.now();

    run();

    samplesMs.push(performance.now() - start);
  }

  return samplesMs;
};

const summarizeSamples = (samplesMs) => {
  const sortedSamples = [...samplesMs].sort((a, b) => a - b);
  const meanMs =
    samplesMs.reduce((total, sample) => total + sample, 0) / samplesMs.length;

  return {
    maxMs: sortedSamples.at(-1),
    meanMs,
    minMs: sortedSamples[0],
    p95Ms:
      sortedSamples[Math.max(0, Math.ceil(sortedSamples.length * 0.95) - 1)],
    samplesMs,
  };
};

const createCases = ({ records, updatedRecords }) => [
  {
    alternative: 'plain-context',
    run: () =>
      runMountCase({
        Provider: PlainContextProvider,
        records,
      }),
    scenario: 'provider-only',
  },
  {
    alternative: 'raw-jotai-seeded',
    run: () =>
      runMountCase({
        Provider: RawJotaiProvider,
        records,
      }),
    scenario: 'provider-only',
  },
  {
    alternative: 'jotai-x-provider',
    run: () =>
      runMountCase({
        Provider: JotaiXProviderProvider,
        records,
      }),
    scenario: 'provider-only',
  },
  {
    alternative: 'jotai-x-store-api',
    run: () =>
      runMountCase({
        Provider: JotaiXStoreApiProvider,
      records,
      }),
    scenario: 'provider-only',
  },
  {
    alternative: 'jotai-x-key-hook',
    run: () =>
      runMountCase({
        Provider: JotaiXStoreApiProvider,
        records,
      }),
    scenario: 'provider-only',
  },
  {
    alternative: 'plain-context',
    run: () =>
      runMountCase({
        Consumer: PlainValueConsumer,
        Provider: PlainContextProvider,
        records,
      }),
    scenario: 'value-consumer',
  },
  {
    alternative: 'raw-jotai-seeded',
    run: () =>
      runMountCase({
        Consumer: RawValueConsumer,
        Provider: RawJotaiProvider,
        records,
      }),
    scenario: 'value-consumer',
  },
  {
    alternative: 'jotai-x-provider',
    run: () =>
      runMountCase({
        Consumer: DirectValueConsumer,
        Provider: JotaiXProviderProvider,
        records,
      }),
    scenario: 'value-consumer',
  },
  {
    alternative: 'jotai-x-store-api',
    run: () =>
      runMountCase({
        Consumer: StoreApiValueConsumer,
        Provider: JotaiXStoreApiProvider,
        records,
      }),
    scenario: 'value-consumer',
  },
  {
    alternative: 'jotai-x-key-hook',
    run: () =>
      runMountCase({
        Consumer: KeyHookValueConsumer,
        Provider: JotaiXStoreApiProvider,
        records,
      }),
    scenario: 'value-consumer',
  },
  {
    alternative: 'plain-context',
    run: () =>
      runMountCase({
        Consumer: PlainSelectorConsumer,
        Provider: PlainContextProvider,
        records,
      }),
    scenario: 'selector-consumer',
  },
  {
    alternative: 'raw-jotai-seeded',
    run: () =>
      runMountCase({
        Consumer: RawSelectorConsumer,
        Provider: RawJotaiProvider,
        records,
      }),
    scenario: 'selector-consumer',
  },
  {
    alternative: 'jotai-x-provider',
    run: () =>
      runMountCase({
        Consumer: DirectSelectorConsumer,
        Provider: JotaiXProviderProvider,
        records,
      }),
    scenario: 'selector-consumer',
  },
  {
    alternative: 'jotai-x-store-api',
    run: () =>
      runMountCase({
        Consumer: StoreApiSelectorConsumer,
        Provider: JotaiXStoreApiProvider,
        records,
      }),
    scenario: 'selector-consumer',
  },
  {
    alternative: 'jotai-x-key-hook',
    run: () =>
      runMountCase({
        Consumer: KeyHookSelectorConsumer,
        Provider: JotaiXStoreApiProvider,
        records,
      }),
    scenario: 'selector-consumer',
  },
  {
    alternative: 'plain-context',
    run: () =>
      runUpdateCase({
        Consumer: PlainSelectorConsumer,
        Provider: PlainContextProvider,
        records,
        updatedRecords,
      }),
    scenario: 'mount+update selector-consumer',
  },
  {
    alternative: 'raw-jotai-seeded',
    run: () =>
      runUpdateCase({
        Consumer: RawSelectorConsumer,
        Provider: RawJotaiProvider,
        records,
        updatedRecords,
      }),
    scenario: 'mount+update selector-consumer',
  },
  {
    alternative: 'jotai-x-provider',
    run: () =>
      runUpdateCase({
        Consumer: DirectSelectorConsumer,
        Provider: JotaiXProviderProvider,
        records,
        updatedRecords,
      }),
    scenario: 'mount+update selector-consumer',
  },
  {
    alternative: 'jotai-x-store-api',
    run: () =>
      runUpdateCase({
        Consumer: StoreApiSelectorConsumer,
        Provider: JotaiXStoreApiProvider,
        records,
        updatedRecords,
      }),
    scenario: 'mount+update selector-consumer',
  },
  {
    alternative: 'jotai-x-key-hook',
    run: () =>
      runUpdateCase({
        Consumer: KeyHookSelectorConsumer,
        Provider: JotaiXStoreApiProvider,
        records,
        updatedRecords,
      }),
    scenario: 'mount+update selector-consumer',
  },
];

const collectGroupResults = (count) => {
  const records = recordsByCount.get(count);
  const updatedRecords = updatedRecordsByCount.get(count);
  const results = [];

  for (const testCase of createCases({ records, updatedRecords })) {
    let summary;

    try {
      summary = summarizeSamples(
        measureSamples({
          run: testCase.run,
        })
      );
    } catch (error) {
      throw new Error(
        `Failed perf case '${testCase.scenario} :: ${testCase.alternative}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    results.push({
      alternative: testCase.alternative,
      relativeToPlainContextMs: 0,
      scenario: testCase.scenario,
      ...summary,
    });
  }

  const plainContextMeans = new Map(
    results
      .filter((result) => result.alternative === 'plain-context')
      .map((result) => [result.scenario, result.meanMs])
  );

  return {
    count,
    results: results.map((result) => ({
      ...result,
      relativeToPlainContextMs:
        result.meanMs - plainContextMeans.get(result.scenario),
    })),
  };
};

const groups = BENCH_COUNTS.map((count) => collectGroupResults(count));
const outputPath = resolve(__dirname, '../store-alternatives.perf.json');

writeFileSync(
  outputPath,
  JSON.stringify(
    {
      counts: BENCH_COUNTS,
      generatedAt: new Date().toISOString(),
      groups,
      runtime: 'node+jsdom+testing-library',
      sampleIterations: SAMPLE_ITERATIONS,
      warmupIterations: WARMUP_ITERATIONS,
    },
    null,
    2
  )
);

process.stdout.write(`${outputPath}\n`);
