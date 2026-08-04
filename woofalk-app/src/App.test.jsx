import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { test, expect } from 'vitest';
import App from './App';

test('renders without crashing', () => {
  const { container } = render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  expect(container).toBeInTheDocument();
});
