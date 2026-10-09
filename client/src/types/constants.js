export const PARTNER_ROLES = ['MECHANIC', 'TOWING_PARTNER'];
export const isPartner = (role) => PARTNER_ROLES.includes(role);

export const HOME_BY_ROLE = { USER: '/app', MECHANIC: '/partner', TOWING_PARTNER: '/partner', ADMIN: '/admin' };
export const homeFor = (role) => HOME_BY_ROLE[role] || '/';

export const SERVICE_CODES = ['BREAKDOWN_REPAIR', 'TOWING', 'BATTERY_JUMPSTART', 'FLAT_TIRE', 'FUEL_DELIVERY'];

export const VEHICLE_TYPES = [
  { value: 'CAR', label: 'Car' }, { value: 'BIKE', label: 'Bike' }, { value: 'SCOOTER', label: 'Scooter' },
  { value: 'SUV', label: 'SUV' }, { value: 'COMMERCIAL', label: 'Commercial vehicle' }, { value: 'OTHER', label: 'Other' },
];
export const FUEL_TYPES = [
  { value: 'PETROL', label: 'Petrol' }, { value: 'DIESEL', label: 'Diesel' }, { value: 'CNG', label: 'CNG' },
  { value: 'ELECTRIC', label: 'Electric' }, { value: 'HYBRID', label: 'Hybrid' },
];

export const EMERGENCY_LEVELS = [
  { value: 'LOW', label: 'Can wait', hint: 'Parked somewhere safe' },
  { value: 'MEDIUM', label: 'Need help soon', hint: 'Stuck but not in danger' },
  { value: 'HIGH', label: 'Urgent', hint: 'Unsafe spot or time-critical' },
];

export const COMPLAINT_CATEGORIES = [
  { value: 'OVERCHARGING', label: 'Charged more than estimated' }, { value: 'DELAY', label: 'Arrived late' },
  { value: 'BEHAVIOUR', label: 'Partner behaviour' }, { value: 'POOR_SERVICE', label: 'Poor service quality' },
  { value: 'OTHER', label: 'Something else' },
];

export const PRIORITIES = [{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }];

// Order drives the live progress timeline.
export const TIMELINE = [
  { status: 'SEARCHING', label: 'Request submitted', hint: 'Finding a partner near you' },
  { status: 'ACCEPTED', label: 'Mechanic assigned', hint: 'A partner accepted your request' },
  { status: 'ON_THE_WAY', label: 'Mechanic on the way', hint: 'Heading to your location' },
  { status: 'ARRIVED', label: 'Mechanic arrived', hint: 'Your partner is with you' },
  { status: 'IN_PROGRESS', label: 'Service in progress', hint: 'Work is under way' },
  { status: 'COMPLETED', label: 'Service completed', hint: 'You are back on the road' },
];

export const TOKEN_KEY = 'roadside_token';
export const LOCATION_KEY = 'roadside_last_location';
