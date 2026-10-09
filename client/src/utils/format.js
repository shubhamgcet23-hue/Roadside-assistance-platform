const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatCurrency = (n) => inr.format(Number(n) || 0);
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const formatTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '-');
export const formatDateTime = (d) => (d ? `${formatDate(d)}, ${formatTime(d)}` : '-');
export const formatDistance = (km) => {
  if (km == null || Number.isNaN(km)) return '-';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Number(km).toFixed(1)} km`;
};
export const formatEta = (min) => {
  if (min == null || Number.isNaN(min)) return '-';
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};
export const humanize = (s) => (s ? s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export const timeAgo = (d) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return formatDate(d);
};
export const idOf = (x) => String(x?._id ?? x ?? '');
