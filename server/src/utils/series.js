/** UTC day keys (YYYY-MM-DD) for the last n days, oldest first. */
export function lastNDays(n, end = new Date()) {
  const days = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Fill gaps so charts show zero-days. rows: [{ _id: 'YYYY-MM-DD', ...values }] */
export function fillDays(rows, days, empty) {
  const byDay = new Map(rows.map((r) => [r._id, r]));
  return days.map((date) => {
    const r = byDay.get(date);
    const out = { date };
    for (const k of Object.keys(empty)) out[k] = r?.[k] ?? empty[k];
    return out;
  });
}
