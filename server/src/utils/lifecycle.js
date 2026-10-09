// Pure request-lifecycle rules (no dependencies) so they can be unit tested anywhere.
export const STATUS = ['PENDING', 'SEARCHING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export const TRANSITIONS = {
  PENDING: ['SEARCHING', 'CANCELLED'],
  SEARCHING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const ACTIVE_STATUSES = ['PENDING', 'SEARCHING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'];
export const JOB_STATUSES = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'];

export const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;
