/**
 * Extra line items from finalize "Add Service" (amount + line tax), not part of packageCalculations.
 */

export function sumBillableAdditionalServices(services) {
  if (!Array.isArray(services)) return 0;
  return services.reduce((sum, s) => {
    if (String(s?.included || "").toLowerCase() !== "yes") return sum;
    const t = Number(s?.totalAmount);
    return sum + (Number.isFinite(t) ? t : 0);
  }, 0);
}
