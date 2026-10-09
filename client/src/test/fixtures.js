export const SERVICES = [
  { _id: 's1', code: 'BREAKDOWN_REPAIR', name: 'Breakdown Repair', description: 'On-spot repair by a mechanic', basePrice: 299, pricePerKm: 10 },
  { _id: 's2', code: 'TOWING', name: 'Towing', description: 'Tow your vehicle to a garage', basePrice: 599, pricePerKm: 25 },
  { _id: 's3', code: 'BATTERY_JUMPSTART', name: 'Battery Jump-Start', description: 'Quick jump-start', basePrice: 199, pricePerKm: 8 },
  { _id: 's4', code: 'FLAT_TIRE', name: 'Flat Tire Repair', description: 'Tire change or puncture repair', basePrice: 149, pricePerKm: 8 },
  { _id: 's5', code: 'FUEL_DELIVERY', name: 'Fuel Delivery', description: 'Fuel brought to you', basePrice: 99, pricePerKm: 10 },
];

export const VEHICLE = { _id: 'v1', type: 'CAR', make: 'Hyundai', model: 'i20', registrationNumber: 'UP16AB1000', year: 2020, fuelType: 'PETROL', isDefault: true };

export const PARTNER = {
  partnerId: 'p1', name: 'Ramesh Kumar', verified: true, rating: 4.5, reviews: 8, jobsCompleted: 12, availability: 'AVAILABLE',
  services: ['TOWING'], distanceKm: 2.4, etaMinutes: 5,
  pricing: { baseCost: 599, distanceKm: 2.4, distanceCharge: 60, total: 659 },
};
