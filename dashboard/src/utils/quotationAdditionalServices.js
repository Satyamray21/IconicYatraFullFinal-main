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
  const std = Number(qd.packageCalculations?.standard?.finalTotal);
  const hasLocal = Array.isArray(localServices) && localServices.length > 0;
  const localSum = sumBillableAdditionalServices(localServices);
  const apiSum = sumBillableAdditionalServices(qd.additionalServices);
  const servicesSum = hasLocal ? localSum : apiSum;
  if (Number.isFinite(std)) return std + servicesSum;

  const tc = Number(quick.totalCost) || 0;
  return tc + servicesSum;
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
