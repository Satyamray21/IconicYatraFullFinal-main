/**
 * Last *completed* wizard step (1–6) for custom quotations when `currentStep`
 * is missing on legacy documents or not yet backfilled.
 */
export function inferLastCompletedCustomStep(raw) {
  if (!raw || typeof raw !== "object") return 1;

  const stored = Number(raw.currentStep);
  if (Number.isFinite(stored) && stored >= 1 && stored <= 6) return stored;

  let s = 1;

  const pd = raw.pickupDrop;
  const hasRealPickup =
    Array.isArray(pd) &&
    pd.some(
      (p) =>
        p?.cityName &&
        String(p.cityName).trim() !== "" &&
        String(p.cityName).toUpperCase() !== "TBC",
    );
  if (hasRealPickup) s = 2;

  const td = raw.tourDetails || {};
  const qd = td.quotationDetails || {};

  const dest = qd.destinations;
  if (Array.isArray(dest) && dest.some((d) => d?.cityName)) s = Math.max(s, 3);

  if (td.bannerImage) s = Math.max(s, 3);

  if (Array.isArray(td.itinerary) && td.itinerary.length > 0) s = Math.max(s, 4);

  const vd = td.vehicleDetails || {};
  const totalCost = Number(vd.costDetails?.totalCost);
  if (Number.isFinite(totalCost) && totalCost > 0) s = Math.max(s, 5);

  const pkg = qd.packageCalculations;
  if (
    pkg &&
    (Number(pkg.standard?.finalTotal) > 0 ||
      Number(pkg.deluxe?.finalTotal) > 0 ||
      Number(pkg.superior?.finalTotal) > 0)
  ) {
    s = Math.max(s, 6);
  }

  return Math.min(Math.max(s, 1), 6);
}

/** Next wizard step to show (2–6) given last completed step */
export function inferNextCustomWizardStep(raw) {
  const last = inferLastCompletedCustomStep(raw);
  return Math.min(last + 1, 6);
}

/**
 * Quotation table status: Finalized vs draft+step. "Completed"/"Confirmed" from legacy `status` field.
 */
export function formatCustomQuotationListStatus(item) {
  const fs = String(item?.finalizeStatus || "").toLowerCase();
  const st = String(item?.status || "").toLowerCase();

  if (fs === "finalized") {
    return "Finalized";
  }
  if (st === "confirmed" || st === "completed") {
    return "Completed";
  }

  const last = inferLastCompletedCustomStep(item);
  const next = inferNextCustomWizardStep(item);
  if (last >= 6) {
    return "Draft (Finalize)";
  }
  return `Draft (Step ${next})`;
}

/**
 * Quick quotation row: after DB create, remaining work is finalize screen (no step field on model).
 */
export function formatQuickQuotationListStatus(item) {
  const fs = String(item?.finalizeStatus || "").toLowerCase();
  const st = String(item?.status || "").toLowerCase();
  if (fs === "finalized") {
    return "Finalized";
  }
  if (st === "confirmed" || st === "completed") {
    return "Completed";
  }
  return "Draft (Finalize)";
}
