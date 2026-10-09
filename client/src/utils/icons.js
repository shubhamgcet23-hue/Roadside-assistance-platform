import { Wrench, Truck, BatteryCharging, CircleDot, Fuel } from 'lucide-react';

export const SERVICE_ICONS = {
  BREAKDOWN_REPAIR: Wrench,
  TOWING: Truck,
  BATTERY_JUMPSTART: BatteryCharging,
  FLAT_TIRE: CircleDot,
  FUEL_DELIVERY: Fuel,
};
export const serviceIcon = (code) => SERVICE_ICONS[code] || Wrench;

export const SERVICE_LABELS = {
  BREAKDOWN_REPAIR: 'Breakdown Repair',
  TOWING: 'Towing',
  BATTERY_JUMPSTART: 'Battery Jump-Start',
  FLAT_TIRE: 'Flat Tire Repair',
  FUEL_DELIVERY: 'Fuel Delivery',
};
export const serviceLabel = (code) => SERVICE_LABELS[code] || code;
