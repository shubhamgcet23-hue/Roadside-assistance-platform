import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Card } from './ui/index.js';
import { requestService } from '../services/requests.js';
import { getErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency, formatDateTime } from '../utils/format.js';

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 text-[15px]"><dt className="text-ink-600">{label}</dt><dd className="text-right font-medium">{value}</dd></div>
);

/** On-screen service summary (the Phase 1 stand-in for an invoice) with a PDF download. */
export default function ServiceSummary({ invoice, requestId }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try { await requestService.downloadInvoicePdf(requestId, invoice.invoiceNo); } catch (e) { toast.error(getErrorMessage(e, 'Could not download the PDF.')); } finally { setBusy(false); }
  };
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 border-b border-ink-100 pb-3">
        <div><p className="font-display text-3xl font-bold leading-none">{invoice.brand}</p><p className="text-ink-600">{invoice.title} &middot; {invoice.invoiceNo}</p></div>
        <Button size="sm" variant="secondary" icon={Download} loading={busy} onClick={download}>Download PDF</Button>
      </div>
      <dl className="mt-3 divide-y divide-ink-100">
        <Row label="Customer" value={invoice.customer?.name || '-'} />
        <Row label="Vehicle" value={invoice.vehicle} />
        <Row label="Service" value={invoice.service} />
        <Row label="Mechanic" value={invoice.partner} />
        <Row label="Location" value={invoice.location} />
        <Row label="Date" value={formatDateTime(invoice.date)} />
        <Row label="Service cost" value={formatCurrency(invoice.baseCost)} />
        <Row label={`Distance charge (${invoice.distanceKm} km)`} value={formatCurrency(invoice.distanceCharge)} />
        {invoice.adjustment !== 0 && <Row label="Adjustment" value={formatCurrency(invoice.adjustment)} />}
        <div className="flex items-end justify-between pt-3"><dt className="font-semibold">{invoice.isFinal ? 'Total amount' : 'Total estimated amount'}</dt><dd className="font-display text-3xl font-semibold leading-none">{formatCurrency(invoice.total)}</dd></div>
        <Row label="Payment status" value={invoice.paymentStatus} />
      </dl>
      {invoice.note && <p className="mt-3 text-xs text-ink-500">{invoice.note}</p>}
    </Card>
  );
}
