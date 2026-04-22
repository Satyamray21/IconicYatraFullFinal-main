/**
 * Extra line items from finalize "Add Service" (amount + line tax), not part of packageCalculations.
 */

export function sumBillableAdditionalServices(services) {
  if (!Array.isArray(services)) return 0;
  return services.reduce((sum, s) => {
    // Business rule: included="yes" means already included in package (do not add again).
    // included="no" means extra charge to be added.
    if (String(s?.included || "").toLowerCase() !== "no") return sum;
    const t = Number(s?.totalAmount);
    return sum + (Number.isFinite(t) ? t : 0);
  }, 0);
}

/** Persist only server-safe fields (no React row id). */
export function serializeAdditionalServicesForApi(services) {
  if (!Array.isArray(services)) return [];
  return services.map((s) => ({
    included: String(s.included || "no").toLowerCase() === "yes" ? "yes" : "no",
    particulars: String(s.particulars || "").trim(),
    amount: Number(s.amount) || 0,
    taxRate: Number(s.taxRate) || 0,
    taxAmount: Number(s.taxAmount) || 0,
    totalAmount: Number(s.totalAmount) || 0,
    taxLabel: String(s.taxLabel || ""),
  }));
}

/**
 * Payable total for quick quotations: package/base total + billable add-ons.
 * Prefers draft rows from UI; falls back to saved API rows.
 */
export function effectiveQuickPayableTotal(quick, localServices = []) {
  if (!quick) return null;
  const qd = quick.packageSnapshot?.quotationDetails || {};
  const tc = Number(quick.totalCost);
  const isFinalized = String(quick?.finalizeStatus || "").toLowerCase() === "finalized";
  // For finalized quick quotations, backend totalCost is the source of truth
  // (it may be manually edited at finalize time).
  if (isFinalized && Number.isFinite(tc) && tc > 0) return tc;
  const finalizedTier = String(quick?.finalizedPackage || "")
    .trim()
    .toLowerCase();
  const packageCalculations = qd.packageCalculations || {};
  const calcTierTotal = Number(packageCalculations?.[finalizedTier]?.finalTotal);
  const std = Number(packageCalculations?.standard?.finalTotal);
  const hasLocal = Array.isArray(localServices) && localServices.length > 0;
  const localSum = sumBillableAdditionalServices(localServices);
  const apiSum = sumBillableAdditionalServices(qd.additionalServices);
  const servicesSum = hasLocal ? localSum : apiSum;
  if (Number.isFinite(calcTierTotal)) return calcTierTotal + servicesSum;
  if (Number.isFinite(std)) return std + servicesSum;

  const tierCost = Number(qd?.[`${finalizedTier}Cost`]);
  if (Number.isFinite(tierCost) && tierCost > 0) return tierCost + servicesSum;
  const stdCost = Number(qd.standardCost);
  if (Number.isFinite(stdCost) && stdCost > 0) return stdCost + servicesSum;
  const delCost = Number(qd.deluxeCost);
  if (Number.isFinite(delCost) && delCost > 0) return delCost + servicesSum;
  const supCost = Number(qd.superiorCost);
  if (Number.isFinite(supCost) && supCost > 0) return supCost + servicesSum;

  if (Number.isFinite(tc) && tc > 0) return tc + servicesSum;
  return servicesSum > 0 ? servicesSum : 0;
}

export function mapApiAdditionalServicesToState(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((s, i) => ({
    id: s._id || `svc-${i}-${s.particulars || ""}`,
    included: String(s.included || "no").toLowerCase() === "yes" ? "yes" : "no",
    particulars: s.particulars || "",
    amount: Number(s.amount) || 0,
    taxRate: Number(s.taxRate) || 0,
    taxAmount: Number(s.taxAmount) || 0,
    totalAmount: Number(s.totalAmount) || 0,
    taxLabel: s.taxLabel || "Non",
    taxType:
      s.taxRate === 5
        ? "gst5"
        : s.taxRate === 18
          ? "gst18"
          : "non",
  }));
}
