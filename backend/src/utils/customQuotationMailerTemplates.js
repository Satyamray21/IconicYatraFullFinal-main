import { sumBillableAdditionalServices } from "./quotationAdditionalServices.js";

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

const toNum = (v) => {
  if (v === undefined || v === null) return 0;
  const normalized = String(v).replace(/[^0-9.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

const safe = (v, fallback = "") =>
  v === undefined || v === null || String(v).trim() === ""
    ? fallback
    : String(v).trim();

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const guestSummary = (qd = {}) => {
  const adults = toNum(qd.adults);
  const children = toNum(qd.children);
  const kids = toNum(qd.kids);
  const infants = toNum(qd.infants);
  const total = adults + children + kids + infants;

  return `${total} Pax (${adults} Adults, ${children} Children, ${kids} Kids, ${infants} Infants)`;
};

const pkgKey = (q = {}) => {
  const p = safe(q.finalizedPackage, "").toLowerCase();
  return ["standard", "deluxe", "superior"].includes(p) ? p : "standard";
};

export const packageTotals = (q = {}) => {
  const qd = q?.tourDetails?.quotationDetails || {};
  const calc = qd.packageCalculations || {};
  const key = pkgKey(q);

  const packageFinal = toNum(calc?.[key]?.finalTotal);
  const extras = sumBillableAdditionalServices(qd.additionalServices);
  const total = packageFinal + extras;
  const beforeTax = toNum(calc?.[key]?.afterDiscount);
  const taxPercent = toNum(qd?.taxes?.taxPercent);

  return {
    total,
    beforeTax,
    taxPercent,
    taxAmount: Math.max(0, total - beforeTax),
  };
};

const nightsAndDays = (destinations = []) => {
  const nights = (destinations || []).reduce(
    (sum, d) => sum + toNum(d?.nights),
    0,
  );
  return {
    nights,
    days: nights + 1,
  };
};

const hotelLines = (destinations = [], key = "standard") => {
  const map = {
    standard: "standardHotels",
    deluxe: "deluxeHotels",
    superior: "superiorHotels",
  };
  const field = map[key] || map.standard;

  return (destinations || [])
    .map(
      (d, i) =>
        `${i + 1}. ${safe((d?.[field] || [])[0], "Hotel similar")} in ${safe(
          d?.cityName,
          "City",
        )}`,
    )
    .join("\n");
};

const itineraryLines = (itinerary = []) =>
  (itinerary || [])
    .map(
      (d) => `
                <div style="margin-bottom:12px;">
                    
                    <div style="color:#2e7d32; font-weight:600;">
                        ${safe(d?.dayTitle, "")}
                    </div>

                    <div style="color:#000;">
                        ${safe(d?.dayNote, "")}
                    </div>

                </div>
            `,
    )
    .join("");

const policyLines = (arr = []) =>
  (arr || [])
    .map((x) => safe(x))
    .filter(Boolean)
    .join("\n");

const includedAdditionalServiceLines = (additionalServices = []) => {
  return (Array.isArray(additionalServices) ? additionalServices : [])
    .filter((s) => String(s?.included || "").toLowerCase() === "yes")
    .map((s) => {
      const particulars = safe(s?.particulars, "Additional Service");
      const totalAmount = toNum(s?.totalAmount || s?.amount);
      return `${particulars}: INR ${INR.format(totalAmount)}`;
    });
};

/** No http(s) URLs or <a> tags in PAYMENT POLICY email body (clients should not get clickable payment links there). */
const sanitizePaymentPolicyLine = (text) => {
  let t = safe(text, "");
  if (!t) return "";
  t = t.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "");
  t = t.replace(/https?:\/\/[^\s<>"')\]]+/gi, "");
  return t.replace(/\s{2,}/g, " ").trim();
};

const paymentPolicyLinesForEmail = (arr = []) =>
  (arr || [])
    .map((x) => sanitizePaymentPolicyLine(x))
    .filter(Boolean);

const toPolicyArray = (value) => {
  if (Array.isArray(value)) return value.map((x) => safe(x)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((x) => safe(x))
      .filter(Boolean);
  }
  return [];
};

const mergePolicies = (...items) => [...new Set(items.flat().filter(Boolean))];

/** Prefer quotation policies when set; avoids repeating the same HTML as global defaults (common for quick quotations). */
const quotationPoliciesOrGlobal = (quotationValue, globalValue) => {
  const q = toPolicyArray(quotationValue);
  if (q.length > 0) return mergePolicies(q);
  return mergePolicies(toPolicyArray(globalValue));
};

const isHttpUrlString = (v) => {
  const s = safe(v, "");
  return s.length > 0 && /^https?:\/\//i.test(s);
};

/** Shown directly under the CANCELLATION POLICY heading when company stores an http(s) URL. */
const cancellationPolicyUrlLine = (url) => {
  const u = safe(url, "");
  if (!isHttpUrlString(u)) return "";
  return `<p style="margin-bottom:10px;">
    <b>As per company cancellation policy -</b><br/>
    <a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">${u}</a>
  </p>`;
};

const stripPickupDropMeta = (value) => {
  const raw = safe(value, "");
  if (!raw) return "";
  return raw
    .replace(/\(([^)]*)\)/g, "")
    .replace(/^(arrival|departure)\s*:\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const companyPaymentLinkLine = (url) => {
  const u = safe(url, "");
  if (!isHttpUrlString(u)) return "";
  return `<p style="margin-bottom:10px;">
    <b>Payment link: </b>
    <a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">${u}</a>
  </p>`;
};

const termsAndConditionsLine = (value) => {
  const t = safe(value, "");
  if (!t) return "";
  if (!isHttpUrlString(t)) {
    return `<p style="margin-bottom:10px;">${t}</p>`;
  }
  return `<p style="margin-bottom:10px;">
    <b>As per company terms and conditions - </b>
    <a href="${t}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">
      View Terms & Conditions
    </a>
  </p>`;
};

const bankHtmlSection = (bankDetails = [], paymentLink = "") => {
  const hasBanks = Array.isArray(bankDetails) && bankDetails.length > 0;
  const paymentLinkHtml = companyPaymentLinkLine(paymentLink);
  if (!hasBanks && !paymentLinkHtml) return "";
  return `
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">NET BANKING PAYMENT DETAILS:</p>
        ${paymentLinkHtml}
        ${(bankDetails || [])
          .map(
            (b, i) => `
                    <div style="margin-bottom:8px;">
                        <b>${i + 1}. ${safe(b?.bankName, "Bank")} (${safe(
                          b?.branchName,
                          "Branch",
                        )})</b><br/>
                        Account Holder: ${safe(b?.accountHolderName, "-")}<br/>
                        Account Number: ${safe(b?.accountNumber, "-")}<br/>
                        IFSC: ${safe(b?.ifscCode, "-")}
                    </div>
                `,
          )
          .join("")}
    `;
};

const bankTextSection = (bankDetails = []) => {
  if (!Array.isArray(bankDetails) || bankDetails.length === 0) return "";

  return [
    "NET BANKING DETAILS:",
    ...bankDetails.map(
      (b, i) =>
        `${i + 1}. ${safe(b?.bankName, "Bank")} (${safe(
          b?.branchName,
          "Branch",
        )}) | A/C Holder: ${safe(
          b?.accountHolderName,
          "-",
        )} | A/C No: ${safe(b?.accountNumber, "-")} | IFSC: ${safe(
          b?.ifscCode,
          "-",
        )}`,
    ),

    // ✅ FIXED (HTML as string)
    `<p>
            <span style="color:#d32f2f; font-weight:bold;">NOTE:</span>
            <span style="color:#2e7d32;">
                All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
                For more details, contact your Tour Expert.
            </span>
        </p>`,
  ].join("\n");
};

/* =========================================================
   NORMAL QUOTATION EMAIL
========================================================= */
export const buildCustomQuotationNormalEmail = (
  quotation,
  customText = {},
  options = {},
) => {
  const td = quotation?.tourDetails || {};
  const qd = td?.quotationDetails || {};
  const rooms = qd?.rooms || {};
  const vehicle = td?.vehicleDetails || {};
  const pd = vehicle?.pickupDropDetails || {};
  const destinations = qd?.destinations || [];
  const termsandCondition = safe(
    options?.companyTermsConditions,
    safe(options?.globalTermsAndConditions),
  );
  const duration = nightsAndDays(destinations);
  const totals = packageTotals(quotation);
  const key = pkgKey(quotation);
  const companyName = safe(options?.companyName, "Iconic Travel");
  const companyWebsite = safe(options?.companyWebsite);
  const paymentCombined = quotationPoliciesOrGlobal(
    td?.policies?.paymentPolicy,
    options?.globalPaymentPolicy,
  );
  const additionalInclusionLines = includedAdditionalServiceLines(
    qd?.additionalServices,
  );
  const inclusionCombined = quotationPoliciesOrGlobal(
    td?.policies?.inclusionPolicy,
    options?.globalInclusions,
  );
  const inclusionWithAdditional = [
    ...inclusionCombined,
    ...additionalInclusionLines,
  ];
  const exclusionCombined = quotationPoliciesOrGlobal(
    td?.policies?.exclusionPolicy,
    options?.globalExclusions,
  );
  const cancellationCombined = quotationPoliciesOrGlobal(
    td?.policies?.cancellationPolicy,
    options?.globalCancellationPolicy,
  );
  const bankDetails = options?.bankDetails || [];
  const cancellationPolicyUrl = safe(options?.companyCancellationPolicyUrl, "");
  const paymentLink = safe(options?.companyPaymentLink, "");

  return `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#333; line-height:1.6;">

        <p style="color:red; font-weight:bold;">
            ${safe(customText.greeting, "Dear Sir/Ma'am,")}
        </p>

        <p style="color:red; font-weight:bold;">
    ${safe(customText.opening, `GREETING FROM ${companyName.toUpperCase()}!!!`)}
</p>
 <p>${safe(
   customText.intro,
   "As per discussed with you short while ago please see the below packages and let us know.",
 )}</p>
   <p style="color:#000;">
    <b>Official Website Visit @</b> <br/>
    <a href="${companyWebsite}" target="_blank" style="font-weight:bold; color:#1976d2; text-decoration:none;">
        ${companyWebsite}
    </a>
    <p>
This is referenced in our discussion regarding your forthcoming Tour to the 
<span style="color:#d32f2f; font-weight:bold;">
    ${td.quotationTitle}
</span>. It is my pleasure to have this opportunity to serve you. We are always here to assist you. The brief itinerary of your tour would like to as follows: please have a look...
</p>


       

        <br/>
        <p style="color:#d32f2f; font-weight:bold;">
    ##PACKAGE COST FOR ALL PERSON = INR ${INR.format(totals.total)} As of now
</p>

<p style="color:#000; font-weight:bold;">
    SPECIAL DISCOUNTED TOUR PACKAGE VALID FOR 24Hrs only..
</p>
        <p style="color:#d32f2f; font-weight:bold;">
        DETAILS OF TOUR PACKAGE:
        </p>
        
        

        <p><b>Destination:</b> ${td.quotationTitle}</p>

        <p><b>No. of Pax:</b> ${guestSummary(qd)}</p>

        <p><b>No. of Room:</b> ${toNum(rooms.numberOfRooms)} ${safe(
          rooms.sharingType,
          "",
        )}</p>
         <p><b>Transportation:</b> ${safe(
           vehicle?.basicsDetails?.vehicleType,
           "As per itinerary",
         )}</p>
        <p><b>Tour Duration:</b> ${duration.nights} Nights ${duration.days} Days</p>
        

        

        <p><b>Arrival Date:</b> ${fmtDate(td.arrivalDate)} ${
          pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""
        }</p>

        <p><b>Departure Date:</b> ${fmtDate(td.departureDate)} ${
          pd.dropTime ? `, Time: ${pd.dropTime}` : ""
        }</p>
        <p><b>Pick Up Point:</b> ${safe(pd.pickupLocation, "As per itinerary")}</p>
        <p><b>Drop Point:</b> ${safe(pd.dropLocation, "As per itinerary")}</p>
        
        <p><b>Meal Plan:</b> ${safe(qd.mealPlan, "CP Plan")}</p>

       

        <br/>

       
       <p style="color:#d32f2f; font-weight:bold;"><b>HOTEL NAMES/SIMILAR</b></p>
        <p><b>${hotelLines(destinations, key).replace(/\n/g, "<br/>")}</b></p><br/>

        <p style="color:#d32f2f; font-weight:bold;">
    DAY WISE ITINERARY
</p>

<div>
    ${itineraryLines(td?.itinerary)}
</div>


        <br/>
        
        <p style="color:#d32f2f; font-weight:bold;" ><b>INCLUSIONS:</b></p>
        <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>

        <br/>
         <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
        ${termsAndConditionsLine(termsandCondition)}
<br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
        ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
        

        <br/>

        <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
        <p>${policyLines(paymentPolicyLinesForEmail(paymentCombined)).replace(/\n/g, "<br/>")}</p>

        <br/>

       


        ${bankHtmlSection(bankDetails, paymentLink)}
        <p>
    <span style="color:#d32f2f; font-weight:bold;">NOTE:</span>
    <span style="color:#2e7d32;">
        All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
        For more details, contact your Tour Expert.
    </span>
</p>
        <br/>

        <p>
            ${safe(
              customText.signature,
              `Warm Regards<br/>Reservation Team<br/>${companyName}`,
            ).replace(/\n/g, "<br/>")}
        </p>

    </div>
    `;
};

export const buildCustomQuotationPdfPreviewEmail = (
  quotation,
  customText = {},
  options = {},
) => {
  const td = quotation?.tourDetails || {};
  const totals = packageTotals(quotation);
  const companyName = safe(options?.companyName, "Iconic Travel");
  const companyWebsite = safe(options?.companyWebsite);

  return `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#333; line-height:1.6;">

        <p style="color:red; font-weight:bold;">
            ${safe(customText.greeting, "Dear Sir/Ma'am,")}
        </p>

        <p style="color:red; font-weight:bold;">
    ${safe(customText.opening, `GREETING FROM ${companyName.toUpperCase()}!!!`)}
</p>
 <p>${safe(
   customText.intro,
   "As per discussed with you short while ago please see the below packages and let us know.",
 )}</p>
   <p style="color:#000;">
    <b>Official Website Visit @</b> <br/>
    <a href="${companyWebsite}" target="_blank" style="font-weight:bold; color:#1976d2; text-decoration:none;">
        ${companyWebsite}
    </a>
    <p>
This is referenced in our discussion regarding your forthcoming Tour to the 
<span style="color:#d32f2f; font-weight:bold;">
    ${td.quotationTitle}
</span>. It is my pleasure to have this opportunity to serve you. We are always here to assist you. The brief itinerary of your tour would like to as follows: please have a look...
</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">
    ##PACKAGE COST FOR ALL PERSON = INR ${INR.format(totals.total)} As of now
</p>

<p style="color:#000; font-weight:bold;">
    SPECIAL DISCOUNTED TOUR PACKAGE VALID FOR 24Hrs only..
</p>
    </div>
    `;
};

/* =========================================================
   BOOKING CONFIRMATION EMAIL
========================================================= */
export function buildCustomQuotationBookingEmail(quotation, customText = {}) {
  const td = quotation?.tourDetails || {};
  const qd = td?.quotationDetails || {};
  const rooms = qd?.rooms || {};
  const vehicle = td?.vehicleDetails || {};
  const pd = vehicle?.pickupDropDetails || {};
  const destinations = qd?.destinations || [];
  const termsandCondition = safe(
    customText?.companyTermsConditions,
    safe(customText?.globalTermsAndConditions),
  );
  const guests = guestSummary(qd);
  const duration = nightsAndDays(destinations);
  const companyName = safe(customText.companyName, "Iconic Travel");
  const companyWebsite = safe(customText?.companyWebsite);
  const key = pkgKey(quotation);
  const totals = packageTotals(quotation);
  const total = totals.total;
  const taxPercent = totals.taxPercent;
  const beforeTax = totals.beforeTax;
  const taxAmount = totals.taxAmount;
  const receivedAmount = toNum(customText.receivedAmount);
  const dueAmount =
    customText.dueAmount !== undefined
      ? toNum(customText.dueAmount)
      : Math.max(0, total - receivedAmount);
  const nextPayableAmount =
    customText.nextPayableAmount !== undefined
      ? toNum(customText.nextPayableAmount)
      : dueAmount;
  const paymentDueDate = safe(
    customText.dueDate,
    safe(customText.paymentDueDate),
  );
  const bankDetails = customText?.bankDetails || [];
  const paymentCombined = quotationPoliciesOrGlobal(
    td?.policies?.paymentPolicy,
    customText.globalPaymentPolicy,
  );
  const additionalInclusionLines = includedAdditionalServiceLines(
    qd?.additionalServices,
  );
  const inclusionCombined = quotationPoliciesOrGlobal(
    td?.policies?.inclusionPolicy,
    customText.globalInclusions,
  );
  const inclusionWithAdditional = [
    ...inclusionCombined,
    ...additionalInclusionLines,
  ];
  const exclusionCombined = quotationPoliciesOrGlobal(
    td?.policies?.exclusionPolicy,
    customText.globalExclusions,
  );
  const cancellationCombined = quotationPoliciesOrGlobal(
    td?.policies?.cancellationPolicy,
    customText.globalCancellationPolicy,
  );
  const cancellationPolicyUrl = safe(
    customText?.companyCancellationPolicyUrl,
    "",
  );
  const paymentLink = safe(customText?.companyPaymentLink, "");

  return `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#333; line-height:1.6;">
        <p style="color:red; font-weight:bold;">
            ${safe(customText.greeting, `Dear ${safe(quotation?.clientDetails?.clientName, "Guest")},`)}
        </p>
        <p style="color:red; font-weight:bold;">
            ${safe(customText.opening, `BOOKING CONFIRMATION FROM ${companyName.toUpperCase()}!!!`)}
        </p>
        <p>${safe(
          customText.thankYou,
          `Thank you for choosing ${companyName}. Your booking has been confirmed. We are pleased to inform you to start planning your way for the following to be confirmed successfully.`,
        )}</p>
        
        
       
        <p style="color:#00FF00; font-weight:bold;"> ${td.quotationTitle}</p>
        <p style="color:#d32f2f; font-weight:bold;">DETAILS OF TOUR PACKAGE:</p>
         <p style="color:#d32f2f; font-weight:bold;">
            BOOKING ID: ${safe(customText.bookingId, quotation?.quotationId)}
        </p>
        
        <p><b>No. of Pax:</b> ${guests}</p>
        <p><b>No. of Room:</b> ${toNum(rooms.numberOfRooms)} ${safe(rooms.sharingType, "")}</p>
        <p><b>Transportation:</b> ${safe(vehicle?.basicsDetails?.vehicleType, "As per itinerary")}</p>
        <p><b>Tour Duration:</b> ${duration.nights} Nights ${duration.days} Days</p>
        <p><b>Arrival Date:</b> ${fmtDate(td.arrivalDate)} ${pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""}</p>
        <p><b>Departure Date:</b> ${fmtDate(td.departureDate)} ${pd.dropTime ? `, Time: ${pd.dropTime}` : ""}</p>
        <p><b>Pick Up Point:</b> ${safe(pd.pickupLocation, "As per itinerary")}</p>
        <p><b>Drop Point:</b> ${safe(pd.dropLocation, "As per itinerary")}</p>
        <p><b>Meal Plan:</b> ${safe(qd.mealPlan, "CP Plan")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">PAYMENT STATUS:</p>
        <p><b>Package Cost (excluding GST %%):</b> INR ${INR.format(beforeTax)}</p>
        <p><b>Goods & Services Tax(5%) on Package Cost:  (${taxPercent}%):</b> INR ${INR.format(taxAmount)}</p>
        <p><b>Package Cost (including 5% GST):</b> INR ${INR.format(total)}</p>
        <p><b>Payment received:</b> INR ${INR.format(receivedAmount)}${customText.receivedDate ? ` (paid on ${customText.receivedDate})` : ""}</p>
        <p><b>The remaining payment for the tour package:</b> INR ${INR.format(dueAmount)}</p>
        <p><b>Next Payable Amount:</b> INR ${INR.format(nextPayableAmount)}</p>
        ${paymentDueDate ? `<p><b>Payment Due Date:</b> ${paymentDueDate}</p>` : ""}
        <p style="color:#d32f2f; font-weight:bold;">Please clear your all dues as per the payment policy.</p>
        <p style="color:#2e7d32; font-weight:bold;">Kindly pay the next amount as per due date to avoid penalty or fine (10% on remaining amount).</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>HOTEL NAMES/SIMILAR</b></p>
        <p><b>${hotelLines(destinations, key).replace(/\n/g, "<br/>")}</b></p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">DAY WISE ITINERARY</p>
        <div>${itineraryLines(td?.itinerary)}</div>
        <br/>
        
        <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
        <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
        ${termsAndConditionsLine(termsandCondition)}
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
        ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
       
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
        <p>${policyLines(paymentPolicyLinesForEmail(paymentCombined)).replace(/\n/g, "<br/>")}</p>
        ${bankHtmlSection(bankDetails, paymentLink)}
        <p>
            <span style="color:#d32f2f; font-weight:bold;">NOTE:</span>
            <span style="color:#2e7d32;">
                All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
                For more details, contact your Tour Expert.
            </span>
        </p>
        <br/>
        <p>
            ${safe(
              customText.signature,
              `Warm Regards<br/>Reservation Team<br/>${companyName}`,
            ).replace(/\n/g, "<br/>")}
        </p>
    </div>
    `;
}

const hotelsForCategoryNight = (nightBlock, cat) => {
  const c = String(cat).toLowerCase();
  return (nightBlock?.hotels || [])
    .filter(
      (h) =>
        String(h.category).toLowerCase() === c &&
        h.hotelName &&
        !/^TBD$/i.test(String(h.hotelName).trim()),
    )
    .map((h) => String(h.hotelName).trim());
};

/**
 * Maps a QuickQuotation lean document into the shape expected by
 * {@link buildCustomQuotationNormalEmail} / {@link buildCustomQuotationBookingEmail}
 * (hotels from destinationNights, itinerary from package days, totals from totalCost).
 */
export function adaptQuickQuotationForCustomMailer(quick = {}) {
  const snap =
    quick.packageSnapshot && typeof quick.packageSnapshot === "object"
      ? quick.packageSnapshot
      : {};
  const pid =
    quick.packageId &&
    typeof quick.packageId === "object" &&
    !Array.isArray(quick.packageId)
      ? quick.packageId
      : {};
  const pkg = {
    ...pid,
    ...snap,
    days:
      Array.isArray(snap.days) && snap.days.length
        ? snap.days
        : Array.isArray(pid.days)
          ? pid.days
          : [],
    destinationNights:
      Array.isArray(snap.destinationNights) && snap.destinationNights.length
        ? snap.destinationNights
        : pid.destinationNights,
    stayLocations:
      Array.isArray(snap.stayLocations) && snap.stayLocations.length
        ? snap.stayLocations
        : pid.stayLocations,
  };
  const policy = quick.policy || pkg.policy || {};
  const total = toNum(quick.totalCost);
  const approxBeforeTax =
    total > 0 ? Math.round((total / 1.05) * 100) / 100 : 0;

  const qdSnap =
    snap.quotationDetails && typeof snap.quotationDetails === "object"
      ? snap.quotationDetails
      : {};
  const additionalServicesFromSnapshot = Array.isArray(qdSnap.additionalServices)
    ? qdSnap.additionalServices
    : [];
  const finalizedPackage = safe(quick.finalizedPackage, "Standard");
  const finalizedKey = ["standard", "deluxe", "superior"].includes(
    String(finalizedPackage).toLowerCase(),
  )
    ? String(finalizedPackage).toLowerCase()
    : "standard";
  const finalizedKeyCap =
    finalizedKey.charAt(0).toUpperCase() + finalizedKey.slice(1);
  const resolvedArrivalDate =
    qdSnap.arrivalDate ||
    snap.arrivalDate ||
    quick.arrivalDate ||
    pkg.arrivalDate ||
    pkg.validFrom ||
    quick.createdAt;
  const resolvedDepartureDate =
    qdSnap.departureDate ||
    snap.departureDate ||
    quick.departureDate ||
    pkg.departureDate ||
    pkg.validTill ||
    pkg.validFrom ||
    quick.createdAt;
  const deriveTimeFromDate = (value) => {
    const raw = String(value || "");
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    // Keep time blank for date-only values that default to midnight.
    return hh === "00" && mm === "00" ? "" : `${hh}:${mm}`;
  };
  const parseDateAndTimeFromPointText = (value) => {
    const raw = safe(value, "");
    if (!raw) return { date: "", time: "" };

    // Example supported: "Arrival: At Airport (03/06/2026 at 15:30)"
    const m = raw.match(
      /\((\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+at\s+(\d{1,2}):(\d{2}))?\)/i,
    );
    if (!m) return { date: "", time: "" };

    const dd = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    const yyyy = String(m[3]).length === 2 ? `20${m[3]}` : String(m[3]);
    const hh = m[4] ? String(m[4]).padStart(2, "0") : "";
    const min = m[5] ? String(m[5]).padStart(2, "0") : "";
    const iso = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    return {
      date: Number.isNaN(new Date(iso).getTime()) ? "" : iso,
      time: hh && min ? `${hh}:${min}` : "",
    };
  };
  const calcSnap = qdSnap.packageCalculations || {};
  const billableExtras = sumBillableAdditionalServices(additionalServicesFromSnapshot);
  const tierFromCalc = Number(calcSnap?.[finalizedKey]?.finalTotal);
  const tierFromQuotedCost = Number(
    qdSnap?.[`${finalizedKey}Cost`] ?? pkg?.[`final${finalizedKeyCap}Cost`],
  );
  const quickTotal = toNum(quick.totalCost);
  const resolvedTierFinalTotal =
    quickTotal > 0
      ? Math.max(0, quickTotal - billableExtras)
      : Number.isFinite(tierFromCalc) && tierFromCalc > 0
        ? tierFromCalc
        : Number.isFinite(tierFromQuotedCost) && tierFromQuotedCost > 0
          ? tierFromQuotedCost
          : 0;
  const resolvedTierAfterDiscount =
    resolvedTierFinalTotal > 0
      ? Math.round((resolvedTierFinalTotal / 1.05) * 100) / 100
      : 0;
  const normalizedCalcSnap = {
    standard: {
      ...(calcSnap?.standard || {}),
      finalTotal:
        finalizedKey === "standard"
          ? resolvedTierFinalTotal
          : toNum(calcSnap?.standard?.finalTotal),
      afterDiscount:
        finalizedKey === "standard"
          ? toNum(calcSnap?.standard?.afterDiscount) || resolvedTierAfterDiscount
          : toNum(calcSnap?.standard?.afterDiscount),
    },
    deluxe: {
      ...(calcSnap?.deluxe || {}),
      finalTotal:
        finalizedKey === "deluxe"
          ? resolvedTierFinalTotal
          : toNum(calcSnap?.deluxe?.finalTotal),
      afterDiscount:
        finalizedKey === "deluxe"
          ? toNum(calcSnap?.deluxe?.afterDiscount) || resolvedTierAfterDiscount
          : toNum(calcSnap?.deluxe?.afterDiscount),
    },
    superior: {
      ...(calcSnap?.superior || {}),
      finalTotal:
        finalizedKey === "superior"
          ? resolvedTierFinalTotal
          : toNum(calcSnap?.superior?.finalTotal),
      afterDiscount:
        finalizedKey === "superior"
          ? toNum(calcSnap?.superior?.afterDiscount) || resolvedTierAfterDiscount
          : toNum(calcSnap?.superior?.afterDiscount),
    },
  };
  const stdSnap = Number(calcSnap.standard?.finalTotal);
  const hasDetailedPricing =
    Number.isFinite(stdSnap) ||
    Number.isFinite(Number(calcSnap.deluxe?.finalTotal)) ||
    Number.isFinite(Number(calcSnap.superior?.finalTotal));

  let destinations = [];
  if (Array.isArray(pkg.destinationNights) && pkg.destinationNights.length) {
    destinations = pkg.destinationNights.map((d) => {
      let standardHotels = hotelsForCategoryNight(d, "standard");
      const deluxeHotels = hotelsForCategoryNight(d, "deluxe");
      const superiorHotels = hotelsForCategoryNight(d, "superior");
      const firstAny = (d.hotels || []).find(
        (h) => h.hotelName && !/^TBD$/i.test(String(h.hotelName).trim()),
      );
      if (!standardHotels.length && firstAny) {
        standardHotels = [String(firstAny.hotelName).trim()];
      }
      return {
        cityName: safe(d.destination, "City"),
        nights: toNum(d.nights),
        standardHotels,
        deluxeHotels,
        superiorHotels,
      };
    });
  } else if (Array.isArray(pkg.stayLocations) && pkg.stayLocations.length) {
    destinations = pkg.stayLocations.map((l) => ({
      cityName: safe(l.city, "City"),
      nights: toNum(l.nights),
      standardHotels: ["Premium Deluxe Hotel (3★ Category)"],
      deluxeHotels: [],
      superiorHotels: [],
    }));
  }

  const itinerarySource =
    Array.isArray(pkg.days) && pkg.days.length
      ? pkg.days
      : Array.isArray(snap.itinerary)
        ? snap.itinerary
        : [];
  const itinerary = itinerarySource.map((day, index) => {
    const rawTitle = safe(day.dayTitle || day.title, "");
    const hasDayPrefix = /^day\s*\d+/i.test(rawTitle);
    const dayPrefix = `Day ${index + 1}`;
    const dayTitle = rawTitle
      ? hasDayPrefix
        ? rawTitle
        : `${dayPrefix}: ${rawTitle}`
      : dayPrefix;

    return {
      dayTitle,
      dayNote: safe(day.notes || day.description || day.aboutCity, ""),
    };
  });

  const arrivalFromText = parseDateAndTimeFromPointText(quick.pickupPoint);
  const departureFromText = parseDateAndTimeFromPointText(quick.dropPoint);
  const pickupTimeResolved = safe(
    quick.pickupTime,
    safe(quick?.packageSnapshot?.quotationDetails?.pickupTime, ""),
  );
  const dropTimeResolved = safe(
    quick.dropTime,
    safe(quick?.packageSnapshot?.quotationDetails?.dropTime, ""),
  );

  return {
    quotationId: String(quick._id || ""),
    clientDetails: { clientName: safe(quick.customerName, "Guest") },
    finalizedPackage,
    tourDetails: {
      quotationTitle: safe(
        pkg.displayTitle,
        safe(pkg.title, safe(pkg.sector, "Tour Package")),
      ),
      arrivalDate: resolvedArrivalDate,
      departureDate: resolvedDepartureDate,
      policies: {
        inclusionPolicy: toPolicyArray(policy.inclusionPolicy),
        exclusionPolicy: toPolicyArray(policy.exclusionPolicy),
        paymentPolicy: toPolicyArray(policy.paymentPolicy),
        cancellationPolicy: toPolicyArray(policy.cancellationPolicy),
        termsAndConditions: toPolicyArray(policy.termsAndConditions),
      },
      itinerary,
      quotationDetails: hasDetailedPricing
        ? {
            adults: toNum(quick.adults),
            children: toNum(quick.children),
            kids: toNum(quick.kids),
            infants: toNum(quick.infants),
            mealPlan: safe(qdSnap.mealPlan || pkg.mealPlan?.planType, "CP"),
            rooms:
              qdSnap.rooms && typeof qdSnap.rooms === "object"
                ? qdSnap.rooms
                : { numberOfRooms: 1, sharingType: "Double sharing" },
            destinations:
              Array.isArray(qdSnap.destinations) && qdSnap.destinations.length
                ? qdSnap.destinations
                : destinations,
            companyMargin: qdSnap.companyMargin,
            discount: qdSnap.discount,
            taxes:
              qdSnap.taxes && typeof qdSnap.taxes === "object"
                ? qdSnap.taxes
                : { taxPercent: 5, applyGST: true, gstOn: "Full" },
            packageCalculations: normalizedCalcSnap,
            additionalServices: additionalServicesFromSnapshot,
          }
        : {
            adults: toNum(quick.adults),
            children: toNum(quick.children),
            kids: toNum(quick.kids),
            infants: toNum(quick.infants),
            mealPlan: safe(pkg.mealPlan?.planType, "CP"),
            rooms: { numberOfRooms: 1, sharingType: "Double sharing" },
            destinations,
            packageCalculations: normalizedCalcSnap,
            taxes: { taxPercent: 5, applyGST: true, gstOn: "package" },
            additionalServices: additionalServicesFromSnapshot,
          },
      vehicleDetails: {
        basicsDetails: {
          vehicleType: safe(
            quick.transportation || pkg.transportation,
            "As per itinerary",
          ),
        },
        pickupDropDetails: {
          pickupLocation: safe(
            stripPickupDropMeta(quick.pickupPoint),
            "As per itinerary",
          ),
          dropLocation: safe(
            stripPickupDropMeta(quick.dropPoint),
            "As per itinerary",
          ),
          pickupDate: arrivalFromText.date || resolvedArrivalDate,
          dropDate: departureFromText.date || resolvedDepartureDate,
          pickupTime:
            pickupTimeResolved ||
            arrivalFromText.time ||
            deriveTimeFromDate(resolvedArrivalDate),
          dropTime:
            dropTimeResolved ||
            departureFromText.time ||
            deriveTimeFromDate(resolvedDepartureDate),
        },
      },
    },
  };
}
