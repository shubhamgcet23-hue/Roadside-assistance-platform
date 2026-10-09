import PDFDocument from 'pdfkit';

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

/** Build the plain-data service summary from a populated ServiceRequest. */
export function buildInvoice(request) {
  const r = request.toObject ? request.toObject() : request;
  const pricing = r.pricing || {};
  const completed = r.status === 'COMPLETED';
  const total = completed ? (r.finalCost ?? pricing.total ?? r.estimatedCost ?? 0) : (pricing.total ?? r.estimatedCost ?? 0);
  const baseCost = pricing.baseCost ?? r.estimatedCost ?? 0;
  const distanceCharge = pricing.distanceCharge ?? 0;
  const adjustment = total - (baseCost + distanceCharge);
  const v = r.vehicleId;
  return {
    invoiceNo: `RAAA-${String(r._id).slice(-8).toUpperCase()}`,
    brand: 'RoadsideAAA',
    title: 'Service Summary',
    date: r.completedAt || r.createdAt,
    status: r.status,
    isFinal: completed,
    customer: { name: r.userId?.name, phone: r.userId?.phone },
    vehicle: v?.make ? `${v.make} ${v.model} (${v.registrationNumber})` : '-',
    service: r.serviceId?.name || r.serviceType,
    partner: r.partnerId?.name || 'Not assigned',
    location: r.breakdownLocation?.address || `${r.breakdownLocation?.latitude}, ${r.breakdownLocation?.longitude}`,
    distanceKm: pricing.distanceKm ?? 0,
    baseCost,
    distanceCharge,
    adjustment,
    total,
    paymentStatus: 'Offline / Pay at service',
    note: completed ? undefined : 'Estimated price. Final price may vary depending on actual service requirements.',
  };
}

export function streamInvoicePdf(invoice, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo}.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 90).fill('#101418');
  doc.fillColor('#FFC400').fontSize(26).font('Helvetica-Bold').text('RoadsideAAA', 50, 30);
  doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica').text('Fast Help. Right Where You Are.', 50, 62);
  doc.fillColor('#101418').fontSize(18).font('Helvetica-Bold').text(invoice.title, 50, 120);
  doc.fontSize(10).font('Helvetica').fillColor('#555').text(`Reference ${invoice.invoiceNo}`, 50, 144);

  const rows = [
    ['Customer', `${invoice.customer.name || '-'} (${invoice.customer.phone || '-'})`],
    ['Vehicle', invoice.vehicle],
    ['Service', invoice.service],
    ['Mechanic', invoice.partner],
    ['Location', invoice.location],
    ['Date', new Date(invoice.date).toLocaleString('en-IN')],
    ['Status', invoice.status],
  ];
  let y = 180;
  rows.forEach(([k, v]) => {
    doc.fillColor('#777').font('Helvetica').fontSize(10).text(k, 50, y, { width: 110 });
    doc.fillColor('#101418').font('Helvetica-Bold').text(String(v), 170, y, { width: 375 });
    y += doc.heightOfString(String(v), { width: 375 }) + 10;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#DDD').stroke();
  y += 14;
  const line = (label, value, bold = false) => {
    doc.fillColor('#101418').font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 13 : 11).text(label, 50, y);
    doc.text(value, 400, y, { width: 145, align: 'right' });
    y += bold ? 26 : 20;
  };
  line('Service cost', money(invoice.baseCost));
  line(`Distance charge (${invoice.distanceKm} km)`, money(invoice.distanceCharge));
  if (invoice.adjustment) line('Adjustment', money(invoice.adjustment));
  y += 4;
  line(invoice.isFinal ? 'Total amount' : 'Total estimated amount', money(invoice.total), true);

  doc.fillColor('#101418').font('Helvetica').fontSize(11).text('Payment status:', 50, y + 6);
  doc.font('Helvetica-Bold').text(invoice.paymentStatus, 150, y + 6);
  if (invoice.note) doc.fillColor('#777').font('Helvetica-Oblique').fontSize(9).text(invoice.note, 50, y + 36, { width: 495 });
  doc.end();
}
