import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequestWizard from '../pages/user/request/RequestWizard.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { vehicleService } from '../services/vehicles.js';
import { catalogService } from '../services/catalog.js';
import { partnerService } from '../services/partners.js';
import { requestService } from '../services/requests.js';
import { PARTNER, SERVICES, VEHICLE } from './fixtures.js';

vi.mock('../services/vehicles.js', () => ({ vehicleService: { list: vi.fn() } }));
vi.mock('../services/catalog.js', () => ({ catalogService: { list: vi.fn() } }));
vi.mock('../services/partners.js', () => ({ partnerService: { nearby: vi.fn() } }));
vi.mock('../services/requests.js', () => ({ requestService: { create: vi.fn() } }));
// The real picker needs a map and GPS; a stub that "picks" a location keeps this test about the wizard.
vi.mock('../components/LocationPicker.jsx', () => ({
  recallLocation: () => null,
  rememberLocation: () => {},
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ latitude: 28.47, longitude: 77.5, address: 'Test road, Greater Noida' })}>Use test location</button>
  ),
}));

const step = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
const next = () => userEvent.click(screen.getByRole('button', { name: /continue/i }));

function renderWizard() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/app/request']}>
        <Routes>
          <Route path="/app/request" element={<RequestWizard />} />
          <Route path="/app/active/:id" element={<div>Tracking page</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe('Request assistance wizard', () => {
  beforeEach(() => {
    vehicleService.list.mockResolvedValue([VEHICLE]);
    catalogService.list.mockResolvedValue(SERVICES);
    partnerService.nearby.mockResolvedValue({ partners: [PARTNER] });
    requestService.create.mockReset();
    requestService.create.mockResolvedValue({ request: { _id: 'r1' } });
  });

  it('walks through all six steps and creates the request', async () => {
    renderWizard();
    await screen.findByRole('progressbar');
    expect(step()).toBe(1);

    await next(); // vehicle is pre-selected (default)
    expect(step()).toBe(2);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled(); // no service yet
    await userEvent.click(screen.getByRole('button', { name: 'Choose Towing' }));

    await next();
    expect(step()).toBe(3);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled(); // no location yet
    await userEvent.click(screen.getByRole('button', { name: 'Use test location' }));

    await next();
    expect(step()).toBe(4);
    await next();
    expect(step()).toBe(5);
    expect((await screen.findAllByText('Ramesh Kumar')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Estimated price\. Final price may vary/)).toBeInTheDocument();

    await next();
    expect(step()).toBe(6);
    await userEvent.click(screen.getByRole('button', { name: /send request/i }));

    await waitFor(() => expect(requestService.create).toHaveBeenCalledTimes(1));
    expect(requestService.create).toHaveBeenCalledWith(expect.objectContaining({
      vehicleId: 'v1', serviceType: 'TOWING', emergencyLevel: 'MEDIUM',
      location: expect.objectContaining({ latitude: 28.47, longitude: 77.5 }),
    }));
    expect(await screen.findByText('Tracking page')).toBeInTheDocument();
  });

  it('shows an empty state when no partners are nearby', async () => {
    partnerService.nearby.mockResolvedValue({ partners: [] });
    renderWizard();
    await screen.findByRole('progressbar');
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Choose Towing' }));
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Use test location' }));
    await next();
    await next();
    expect(await screen.findByText('No mechanics available nearby.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('shows an error toast when the request cannot be created', async () => {
    requestService.create.mockRejectedValue({ response: { data: { message: 'You already have an active request' } } });
    renderWizard();
    await screen.findByRole('progressbar');
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Choose Towing' }));
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Use test location' }));
    await next(); // details
    await next(); // estimate
    await screen.findAllByText('Ramesh Kumar');
    await next(); // confirm
    await userEvent.click(screen.getByRole('button', { name: /send request/i }));
    expect(await screen.findByText('You already have an active request')).toBeInTheDocument();
    expect(screen.queryByText('Tracking page')).not.toBeInTheDocument();
  });
});
