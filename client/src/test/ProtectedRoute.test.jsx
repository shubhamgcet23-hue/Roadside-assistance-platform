import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute.jsx';

const auth = { user: null, loading: false };
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => auth }));

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/login" element={<div>Login page</div>} />
      <Route path="/app" element={<div>User home</div>} />
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><div>Admin area</div></ProtectedRoute>} />
    </Routes>
  </MemoryRouter>,
);

describe('ProtectedRoute', () => {
  it('sends anonymous visitors to the login page', () => {
    Object.assign(auth, { user: null, loading: false });
    renderAt('/admin');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('sends a vehicle owner away from the admin area', () => {
    Object.assign(auth, { user: { role: 'USER' }, loading: false });
    renderAt('/admin');
    expect(screen.getByText('User home')).toBeInTheDocument();
  });

  it('lets an admin in', () => {
    Object.assign(auth, { user: { role: 'ADMIN' }, loading: false });
    renderAt('/admin');
    expect(screen.getByText('Admin area')).toBeInTheDocument();
  });
});
