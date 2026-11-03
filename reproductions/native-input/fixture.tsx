import React, { useState } from 'react';
import { createAtomStore } from 'jotai-x';
import { createRoot } from 'react-dom/client';

const { MirrorProvider, useMirrorValue } = createAtomStore(
  { value: '' },
  { name: 'mirror' }
);
function Mirror() {
  const value = useMirrorValue('value');
  return <output>{value}</output>;
}
function App() {
  const [value, setValue] = useState('');
  return (
    <>
      <input value={value} onChange={(event) => setValue(event.target.value)} />
      <MirrorProvider value={value}>
        <Mirror />
      </MirrorProvider>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
