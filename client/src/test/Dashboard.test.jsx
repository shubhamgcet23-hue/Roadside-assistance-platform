import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import UserDashboard from '../pages/user/Dashboard.jsx';
import { catalogService } from '../services/catalog.js';
import { requestService } from '../services/requests.js';
import { vehicleService } from '../services/vehicles.js';
import { SERVICES } from './fixtures.js';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { name: 'Aarav Sharma', role: 'USER' } }) }));
vi.mock('../hooks/useRequestLive.js', () => ({ useRequestLive: () => {}, REQUEST_EVENTS: [] }));
vi.mock('../services/catalog.js', () => ({ catalogService: { list: vi.fn() } }));
vi.mock('../services/requests.js', () => ({ requestService: { active: vi.fn(), list: vi.fn() } }));
vi.mock('../services/vehicles.js', () => ({ vehicleService: { list: vi.fn() } }));

const Where = () => { const l = useLocation(); return <div data-testid="where">{l.pathname + l.search}</div>; };

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<UserDashboard />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('User dashboard', () => {
  beforeEach(() => {
    catalogService.list.mockResolvedValue(SERVICES);
    requestService.active.mockResolvedValue(null);
    requestService.list.mockResolvedValue({ requests: [] });
    vehicleService.list.mockResolvedValue([]);
  });

  it('renders the emergency call to action and all five services', async () => {
    renderDashboard();
    expect(screen.getByText('Need roadside assistance?')).toBeInTheDocument();
    expect(screen.getByText('Hello, Aarav')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request assistance/i })).toHaveAttribute('href', '/app/request');
    for (const s of SERVICES) expect(await screen.findByTestId(`service-${s.code}`)).toBeInTheDocument();
  });

  it('shows helpful empty states with a call to action', async () => {
    renderDashboard();
    expect(await screen.findByText('No vehicles yet')).toBeInTheDocument();
    expect(await screen.findByText('No service history')).toBeInTheDocument();
    expect(screen.queryByText('Active request')).not.toBeInTheDocument();
  });

  it('shows the active request with a Track link', async () => {
    requestService.active.mockResolvedValue({ _id: 'r9', serviceType: 'TOWING', status: 'ACCEPTED', partnerId: { name: 'Ramesh Kumar' } });
    renderDashboard();
    expect(await screen.findByText('Active request')).toBeInTheDocument();
    expect(screen.getByText(/Ramesh Kumar assigned/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Track' })).toHaveAttribute('href', '/app/active/r9');
  });

  it('starts the wizard with the chosen service preselected', async () => {
    renderDashboard();
    await userEvent.click(await screen.findByRole('button', { name: 'Request Towing' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/app/request?service=TOWING');
  });
});
