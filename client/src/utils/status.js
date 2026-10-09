export const STATUS_META = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  SEARCHING: { label: 'Finding a partner', tone: 'warning' },
  ACCEPTED: { label: 'Partner assigned', tone: 'info' },
  ON_THE_WAY: { label: 'On the way', tone: 'info' },
  ARRIVED: { label: 'Arrived', tone: 'info' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};
export const VERIFICATION_META = {
  PENDING: { label: 'Pending review', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
};
export const AVAILABILITY_META = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  BUSY: { label: 'Busy', tone: 'warning' },
  OFFLINE: { label: 'Offline', tone: 'neutral' },
};
export const COMPLAINT_META = {
  OPEN: { label: 'Open', tone: 'warning' },
  UNDER_REVIEW: { label: 'Under review', tone: 'info' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};
export const PRIORITY_META = {
  LOW: { label: 'Low', tone: 'neutral' },
  MEDIUM: { label: 'Medium', tone: 'warning' },
  HIGH: { label: 'High', tone: 'danger' },
};

// What the assigned partner does next. Order matches the server lifecycle.
export const NEXT_ACTION = {
  ACCEPTED: { to: 'ON_THE_WAY', label: "I'm on the way" },
  ON_THE_WAY: { to: 'ARRIVED', label: "I've arrived" },
  ARRIVED: { to: 'IN_PROGRESS', label: 'Start service' },
  IN_PROGRESS: { to: 'COMPLETED', label: 'Complete service' },
};

export const ACTIVE_STATUSES = ['PENDING', 'SEARCHING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'];
export const CANCELLABLE = ['PENDING', 'SEARCHING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'];
