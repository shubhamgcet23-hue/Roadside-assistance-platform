/** estimatedCost = basePrice + distance x pricePerKm. A partner may override the base price per service. */
export function estimatePrice(service, distanceKm, baseOverride) {
  const baseCost = Number.isFinite(baseOverride) ? baseOverride : service.basePrice;
  const distance = Math.round(distanceKm * 10) / 10;
  const distanceCharge = Math.round(distance * service.pricePerKm);
  return { baseCost, distanceKm: distance, distanceCharge, total: baseCost + distanceCharge };
}

export const partnerBasePrice = (profile, code) => profile?.pricing?.find((p) => p.serviceCode === code)?.basePrice;
