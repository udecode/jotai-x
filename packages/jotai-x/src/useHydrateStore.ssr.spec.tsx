// @vitest-environment node
import React from 'react';
import { renderToString } from 'react-dom/server';

import { createAtomStore } from './createAtomStore';

it('keeps provider synchronization safe during server rendering', () => {
  const { ProfileProvider, useProfileValue } = createAtomStore(
    { name: '' },
    { name: 'profile' }
  );
  const Profile = () => <span>{useProfileValue('name')}</span>;
  vi.mocked(console.error).mockClear();

  const html = renderToString(
    <ProfileProvider name="Jane">
      <Profile />
    </ProfileProvider>
  );

  expect(html).toBe('<span>Jane</span>');
  expect(console.error).not.toHaveBeenCalled();
});
