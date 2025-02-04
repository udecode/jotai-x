import '@testing-library/jest-dom';

vi.spyOn(global.console, 'warn').mockImplementation(() => vi.fn());
vi.spyOn(global.console, 'error').mockImplementation(() => vi.fn());
