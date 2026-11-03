# Native input / provider prop synchronization

A controlled React input and a jotai-x provider reproduce React error #185 during a finite native input burst. There are no application services, mocks of React/Jotai, or user data.

The fixture pins React/React DOM 19.3.1, Jotai 3.0.1, jotai-x 2.3.4, esbuild 0.28.2 and Playwright 1.61.1. The same symptom also occurs on React 19.3.0-canary-278794d7-20261002.

Use Node.js 22.12 or newer for this fixture's Jotai 3 dependency. From the repository root:

```sh
npm install --prefix reproductions/native-input --workspaces=false
cd reproductions/native-input
npx playwright install chromium
node probe.cjs
```

The published-package run is expected to exit 1. In the verified run, 1,200 native `Input.insertText` events produced 22 minified React #185 errors and final input/mirror text different from the expected text.

To test a local source change, first run `yarn build` at the repository root, then run both emitted entry points from this directory:

```sh
JOTAI_X_BUNDLE=../../packages/jotai-x/dist/index.mjs node probe.cjs
JOTAI_X_BUNDLE=../../packages/jotai-x/dist/index.js node probe.cjs
```

With provider prop synchronization moved to a layout effect, both entry points produce zero errors and exact 1,200-character input/mirror text. The script consumes the built bundle as-is; it does not rewrite dependency source. Each browser is closed in `finally`.

The unit regression in `elementAtom.spec.tsx` checks the underlying ordering: consumer passive effects must see the updated provider props. The Node-environment SSR test checks that server rendering does not invoke a layout effect.
