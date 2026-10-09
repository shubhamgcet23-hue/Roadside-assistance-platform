import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ServiceStep from '../pages/user/request/ServiceStep.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { SERVICES } from './fixtures.js';

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Service selection', () => {
  it('renders one card per service with its starting price', () => {
    wrap(<ServiceStep services={SERVICES} value="" onChange={() => {}} />);
    SERVICES.forEach((s) => expect(screen.getByTestId(`service-${s.code}`)).toBeInTheDocument());
    expect(screen.getByText('Towing')).toBeInTheDocument();
    expect(screen.getAllByText(/₹/).length).toBeGreaterThanOrEqual(SERVICES.length);
  });

  it('reports the chosen service code', async () => {
    const onChange = vi.fn();
    wrap(<ServiceStep services={SERVICES} value="" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose Towing' }));
    expect(onChange).toHaveBeenCalledWith('TOWING');
  });

  it('marks the selected service', () => {
    wrap(<ServiceCard service={SERVICES[1]} selected onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /Towing/ })).toHaveTextContent('Selected');
  });
});
