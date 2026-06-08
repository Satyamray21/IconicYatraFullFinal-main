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
  
  let taxPercent = toNum(qd?.taxes?.taxPercent) || 5;
  if (qd?.taxes?.applyGST === false || qd?.taxes?.gstOn === "None") {
    taxPercent = 0;
  }

  let beforeTax = total;
  if (taxPercent > 0) {
    const taxMultiplier = 1 + (taxPercent / 100);
    beforeTax = total > 0 ? Math.round((total / taxMultiplier) * 100) / 100 : 0;
  }

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
                    
                    <div style="color:#000; font-weight:bold;">
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
    .map((s) => {
      const particulars = safe(s?.particulars, "Additional Service");
      const included = String(s?.included || "").toLowerCase() === "yes";
      const totalAmount = toNum(s?.totalAmount || s?.amount);
      if (included) return `${particulars}: Included`;
      return `${particulars}: INR ${INR.format(totalAmount)}`;
    });
};

const splitAdditionalServicePolicyLines = (additionalServices = []) => {
  const services = Array.isArray(additionalServices) ? additionalServices : [];
  const inclusionLines = [];
  const exclusionLines = [];
  services.forEach((s) => {
    const particulars = safe(s?.particulars, "Additional Service");
    if (!particulars) return;
    const included = String(s?.included || "").toLowerCase() === "yes";
    const totalAmount = toNum(s?.totalAmount || s?.amount);
    if (included) inclusionLines.push(`${particulars}: Included`);
    else exclusionLines.push(`${particulars}: INR ${INR.format(totalAmount)}`);
  });
  return { inclusionLines, exclusionLines };
};

const stripHtmlText = (value = "") =>
  decodeBasicHtmlEntities(String(value || "")).replace(/<[^>]+>/g, " ");

const removeGstExtraExclusionLine = (lines = [], quotation = {}) => {
  const qd = quotation?.tourDetails?.quotationDetails || {};
  const taxes = qd?.taxes || {};
  const gstIncludedInFinalAmount =
    taxes?.gstIncludedInFinalAmount === true ||
    String(taxes?.gstMode || "").toLowerCase() === "with_gst";
  const normalized = normalizePolicyLinesForEmail(
    Array.isArray(lines) ? lines : [],
  );
  if (!gstIncludedInFinalAmount) return normalized;
  return normalized.filter((line) => {
    const s = stripHtmlText(line)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    // Remove only the specific "GST is extra on total package cost" exclusion sentence.
    return !/govt\.?\s*tax\s*gst\s*5%?\s*is\s*extra\s*on\s*total\s*package\s*cost/.test(
      s,
    );
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

const decodeBasicHtmlEntities = (text = "") =>
  String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

/** Convert HTML policy blocks (<p>..</p>) into plain text lines for robust email rendering. */
const normalizePolicyLinesForEmail = (arr = []) =>
  (Array.isArray(arr) ? arr : [])
    .flatMap((item) =>
      String(item || "")
        .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/li>\s*<li[^>]*>/gi, "\n")
        .replace(/<li[^>]*>/gi, "")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .split("\n"),
    )
    .map((line) => decodeBasicHtmlEntities(line).replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);

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
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">NET BANKING PAYMENT DETAILS:</p>
        ${paymentLinkHtml}
        <div style="text-align:center;">
        ${(bankDetails || [])
          .map(
            (b, i) => `
                    <div style="margin-bottom:12px;">
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
        </div>
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
            <span style="color:#003366; font-weight:bold;">NOTE:</span>
            <span style="color:#000; font-weight:bold;">
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
  const {
    inclusionLines: additionalInclusionLines,
    exclusionLines: additionalExclusionLines,
  } = splitAdditionalServicePolicyLines(qd?.additionalServices);
  const inclusionCombined = quotationPoliciesOrGlobal(
    td?.policies?.inclusionPolicy,
    options?.globalInclusions,
  );
  const inclusionWithAdditional = [
    ...normalizePolicyLinesForEmail(inclusionCombined),
    ...additionalInclusionLines,
  ];
  const exclusionCombinedBase = quotationPoliciesOrGlobal(
    td?.policies?.exclusionPolicy,
    options?.globalExclusions,
  );
  const exclusionCombined = [
    ...removeGstExtraExclusionLine(exclusionCombinedBase, quotation),
    ...additionalExclusionLines,
  ];
  const cancellationCombined = quotationPoliciesOrGlobal(
    td?.policies?.cancellationPolicy,
    options?.globalCancellationPolicy,
  );
  const bankDetails = options?.bankDetails || [];
  const cancellationPolicyUrl = safe(options?.companyCancellationPolicyUrl, "");
  const paymentLink = safe(options?.companyPaymentLink, "");

  return `
    <div style="font-family: 'Georgia', serif; font-size:15px; color:#333; line-height:1.6;">

        <p style="color:#003366; font-weight:bold; font-size: 16px;">
            ${safe(customText.greeting, "Dear Sir/Ma'am,")}
        </p>

        <p style="color:#003366; font-weight:bold; font-size: 18px;">
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
<span style="color:#003366; font-weight:bold;">
    ${td.quotationTitle}
</span>. It is my pleasure to have this opportunity to serve you. We are always here to assist you. The brief itinerary of your tour would like to as follows: please have a look...
</p>


       

        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 16px;">
    ##PACKAGE COST FOR ALL PERSON = INR ${INR.format(totals.total)} As of now
</p>

<p style="color:#000; font-weight:bold;">
    SPECIAL DISCOUNTED TOUR PACKAGE VALID FOR 24Hrs only..
</p>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">
        DETAILS OF TOUR PACKAGE:
        </p>
        
        

        <p><b>Destination:</b> ${td.quotationTitle}</p>

        <p><b>No. of Pax:</b> ${guestSummary(qd)}</p>

        <p><b>No. of Room:</b> ${toNum(rooms.numberOfRooms)} Room(s) - ${safe(
          rooms.sharingType,
          "Double sharing",
        )}${toNum(rooms.numberOfMattress) > 0 ? ` + ${toNum(rooms.numberOfMattress)} Extra Mattress(es)` : ""}</p>
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

       
       <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">HOTEL NAMES/SIMILAR</p>
        <p><b>${hotelLines(destinations, key).replace(/\n/g, "<br/>")}</b></p><br/>

        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">
    DAY WISE ITINERARY
</p>

<div>
    ${itineraryLines(td?.itinerary)}
</div>


        <br/>
        
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;" >INCLUSIONS:</p>
        <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">EXCLUSIONS:</p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>

        <br/>
         <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">TERMS & CONDITIONS:</p>
        ${termsAndConditionsLine(termsandCondition)}
<br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">CANCELLATION POLICY:</p>
        ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
        

        <br/>

        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT POLICY:</p>
        <p>${policyLines(paymentPolicyLinesForEmail(paymentCombined)).replace(/\n/g, "<br/>")}</p>

        <br/>

       


        ${bankHtmlSection(bankDetails, paymentLink).replace(/#d32f2f/g, "#003366")}
        <p>
    <span style="color:#003366; font-weight:bold;">NOTE:</span>
    <span style="color:#000; font-weight:bold;">
        All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
        For more details, contact your Tour Expert.
    </span>
</p>
        <br/>

        <p>
            ${safe(
              customText.signature,
              `Warm Regards<br/><b>${companyName}</b>`,
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
    <div style="font-family: 'Georgia', serif; font-size:15px; color:#333; line-height:1.6;">

        <p style="color:#003366; font-weight:bold; font-size: 16px;">
            ${safe(customText.greeting, "Dear Sir/Ma'am,")}
        </p>

        <p style="color:#003366; font-weight:bold; font-size: 18px;">
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
<span style="color:#003366; font-weight:bold;">
    ${td.quotationTitle}
</span>. It is my pleasure to have this opportunity to serve you. We are always here to assist you. The brief itinerary of your tour would like to as follows: please have a look...
</p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 16px;">
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
  const {
    inclusionLines: additionalInclusionLines,
    exclusionLines: additionalExclusionLinesForBooking,
  } =
    splitAdditionalServicePolicyLines(qd?.additionalServices);
  const inclusionCombined = quotationPoliciesOrGlobal(
    td?.policies?.inclusionPolicy,
    customText.globalInclusions,
  );
  const inclusionWithAdditional = [
    ...normalizePolicyLinesForEmail(inclusionCombined),
    ...additionalInclusionLines,
  ];
  const exclusionCombinedBase = quotationPoliciesOrGlobal(
    td?.policies?.exclusionPolicy,
    customText.globalExclusions,
  );
  const exclusionCombined = [
    ...removeGstExtraExclusionLine(exclusionCombinedBase, quotation),
    ...additionalExclusionLinesForBooking,
  ];
  const cancellationCombined = quotationPoliciesOrGlobal(
    td?.policies?.cancellationPolicy,
    customText.globalCancellationPolicy,
  );
  const cancellationPolicyUrl = safe(
    customText?.companyCancellationPolicyUrl,
    "",
  );
  const paymentLink = safe(customText?.companyPaymentLink, "");

  const confirmedHotels = quotation.confirmedHotels || [];
  let hotelSectionHtml = "";
  if (confirmedHotels && confirmedHotels.length > 0) {
    hotelSectionHtml = `
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">HOTEL NAMES</p>
      <p><b>${confirmedHotels.map((h, i) => `${i + 1}. ${safe(h.hotelName)} in ${safe(h.city)} (${h.nights || 1} Night)`).join("<br/>")}</b></p>
    `;
  } else {
    hotelSectionHtml = `
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">HOTEL NAMES/SIMILAR</p>
      <p><b>${hotelLines(destinations, key).replace(/\n/g, "<br/>")}</b></p>
    `;
  }

  return `
    <div style="font-family: 'Georgia', serif; font-size:15px; color:#333; line-height:1.6;">
        <p style="color:#003366; font-weight:bold; font-size: 16px;">
            ${safe(customText.greeting, `Dear ${safe(quotation?.clientDetails?.clientName, "Guest")},`)}
        </p>
        <p style="color:#003366; font-weight:bold; font-size: 18px;">
            ${safe(customText.opening, `BOOKING CONFIRMATION FROM ${companyName.toUpperCase()}!!!`)}
        </p>
        <p>${safe(
          customText.thankYou,
          `Thank you for choosing ${companyName}. Your booking has been confirmed. We are pleased to inform you to start planning your way for the following to be confirmed successfully.`,
        )}</p>
        
        
       
        <p style="color:#000; font-weight:bold;"> ${td.quotationTitle}</p>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">DETAILS OF TOUR PACKAGE:</p>
        <br/>
         <p style="color:#003366; font-weight:bold; font-size: 16px;">
            BOOKING ID: ${safe(customText.bookingId, quotation?.bookingId || quotation?.quickQuotationId || quotation?.quotationId)}
        </p>
        
        <p><b>No. of Pax:</b> ${guests}</p>
        <p><b>No. of Room:</b> ${toNum(rooms.numberOfRooms)} Room(s) - ${safe(
          rooms.sharingType,
          "Double sharing",
        )}${toNum(rooms.numberOfMattress) > 0 ? ` + ${toNum(rooms.numberOfMattress)} Extra Mattress(es)` : ""}</p>
        <p><b>Transportation:</b> ${safe(vehicle?.basicsDetails?.vehicleType, "As per itinerary")}</p>
        <p><b>Tour Duration:</b> ${duration.nights} Nights ${duration.days} Days</p>
        <p><b>Arrival Date:</b> ${fmtDate(td.arrivalDate)} ${(pd.pickupTime && pd.pickupTime !== "05:30" && pd.pickupTime !== "05:30 AM") ? `, Time: ${pd.pickupTime}` : ""}</p>
        <p><b>Departure Date:</b> ${fmtDate(td.departureDate)} ${(pd.dropTime && pd.dropTime !== "05:30" && pd.dropTime !== "05:30 AM") ? `, Time: ${pd.dropTime}` : ""}</p>
        <p><b>Pick Up Point:</b> ${safe(pd.pickupLocation, "As per itinerary")}</p>
        <p><b>Drop Point:</b> ${safe(pd.dropLocation, "As per itinerary")}</p>
        <p><b>Meal Plan:</b> ${safe(qd.mealPlan, "CP Plan")}</p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT STATUS:</p>
        <p><b>Package Cost (excluding GST):</b> INR ${INR.format(beforeTax)}</p>
        <p><b>Goods & Services Tax (${taxPercent}%) on Package Cost:</b> INR ${INR.format(taxAmount)}</p>
        <p><b>Package Cost (including 5% GST):</b> INR ${INR.format(total)}</p>
        <p><b>Payment received:</b> INR ${INR.format(receivedAmount)}${customText.receivedDate ? ` (paid on ${customText.receivedDate})` : ""}</p>
        <p><b>The remaining payment for the tour package:</b> INR ${INR.format(dueAmount)}</p>
        <p><b>Next Payable Amount:</b> INR ${INR.format(nextPayableAmount)}</p>
        ${paymentDueDate ? `<p><b>Payment Due Date:</b> ${paymentDueDate}</p>` : ""}
        <p style="color:#003366; font-weight:bold;">Please clear your all dues as per the payment policy.</p>
        <p style="color:#000; font-weight:bold;">Kindly pay the next amount as per due date to avoid penalty or fine (10% on remaining amount).</p>
        <br/>
        ${hotelSectionHtml}
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">DAY WISE ITINERARY</p>
        <div>${itineraryLines(td?.itinerary)}</div>
        <br/>
        
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">INCLUSIONS:</p>
        <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">EXCLUSIONS:</p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">TERMS & CONDITIONS:</p>
        ${termsAndConditionsLine(termsandCondition)}
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">CANCELLATION POLICY:</p>
        ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
       
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT POLICY:</p>
        <p>${policyLines(paymentPolicyLinesForEmail(paymentCombined)).replace(/\n/g, "<br/>")}</p>
        ${bankHtmlSection(bankDetails, paymentLink).replace(/#d32f2f/g, "#003366")}
        <p>
            <span style="color:#003366; font-weight:bold;">NOTE:</span>
            <span style="color:#000; font-weight:bold;">
                All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
                For more details, contact your Tour Expert.
            </span>
        </p>
        <br/>
        <p>
            ${safe(
              customText.signature,
              `Warm Regards<br/><b>${companyName}</b>`,
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

  const qdSnap =
    snap.quotationDetails && typeof snap.quotationDetails === "object"
      ? snap.quotationDetails
      : {};
  const taxes = qdSnap.taxes || { taxPercent: 5, applyGST: true, gstOn: "Full" };
  const taxMultiplier = 1 + (toNum(taxes.taxPercent) || 5) / 100;

  const approxBeforeTax =
    total > 0 ? Math.round((total / taxMultiplier) * 100) / 100 : 0;

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
      ? Math.round((resolvedTierFinalTotal / taxMultiplier) * 100) / 100
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
    quotationId: String(quick.quickQuotationId || quick._id || ""),
    quickQuotationId: String(quick.quickQuotationId || ""),
    bookingId: safe(quick.bookingId, ""),
    clientDetails: { clientName: safe(quick.customerName, "Guest") },
    finalizedPackage,
    confirmedHotels: quick.confirmedHotels || [],
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
            rooms: {
              numberOfRooms: toNum(
                quick.noOfRooms ||
                  qdSnap.noOfRooms ||
                  qdSnap.numberOfRooms ||
                  snap.noOfRooms ||
                  qdSnap.rooms?.numberOfRooms ||
                  quick.numberOfRooms ||
                  1,
              ),
              sharingType: safe(
                quick.roomType ||
                  qdSnap.roomType ||
                  qdSnap.sharingType ||
                  snap.sharingType ||
                  qdSnap.rooms?.sharingType ||
                  "Double sharing",
              ),
              numberOfMattress: toNum(
                quick.noOfMattress ||
                  qdSnap.noOfMattress ||
                  qdSnap.rooms?.numberOfMattress ||
                  0,
              ),
            },
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
            rooms: {
              numberOfRooms: toNum(
                quick.noOfRooms ||
                  qdSnap.noOfRooms ||
                  qdSnap.numberOfRooms ||
                  snap.noOfRooms ||
                  qdSnap.rooms?.numberOfRooms ||
                  quick.numberOfRooms ||
                  1,
              ),
              sharingType: safe(
                quick.roomType ||
                  qdSnap.roomType ||
                  qdSnap.sharingType ||
                  snap.sharingType ||
                  qdSnap.rooms?.sharingType ||
                  "Double sharing",
              ),
              numberOfMattress: toNum(
                quick.noOfMattress ||
                  qdSnap.noOfMattress ||
                  qdSnap.rooms?.numberOfMattress ||
                  0,
              ),
            },
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
export function buildHotelConfirmationEmail(quotation, options = {}) {
  const td = quotation?.tourDetails || {};
  const qd = td?.quotationDetails || {};
  const pkg = adaptQuickQuotationForCustomMailer(quotation); // Use adapter for consistency if needed
  const companyName = safe(options.companyName, "Iconic Travel");
  const companyWebsite = safe(options.companyWebsite, "http://iconictravel.in");
  const companyMobile = safe(options.companyMobile, "+91-8130883907");
  const companyAddress = safe(options.companyAddress, "2nd floor, B Block B-25 Sector- 64, Noida Uttar Pradesh 201301");
  
  const guestName = safe(quotation?.clientDetails?.clientName || quotation?.customerName, "Guest");
  const bookingId = safe(quotation?.bookingId || quotation?.quotationId || quotation?.quickQuotationId, "Booking Id");
  const adults = toNum(quotation?.adults || qd?.adults);
  const children = toNum(quotation?.children || qd?.children);
  const kids = toNum(quotation?.kids || qd?.kids || qd?.kidsWithoutMattress);
  const infants = toNum(quotation?.infants || qd?.infants);
  
  let guestsParts = [`${adults} Adults`];
  if (children > 0) guestsParts.push(`${children} Children`);
  if (kids > 0) guestsParts.push(`${kids} Kids (Without Mattress)`);
  if (infants > 0) guestsParts.push(`${infants} Infants`);
  const guestsLine = guestsParts.join(", ");

  const resolvedNumberOfRooms = toNum(
    quotation?.noOfRooms ||
      qd?.rooms?.numberOfRooms ||
      qd?.noOfRooms ||
      1
  );
  const resolvedSharingType = safe(
    quotation?.roomType ||
      qd?.rooms?.sharingType ||
      qd?.roomType ||
      "Double sharing"
  );
  const resolvedNumberOfMattress = toNum(
    quotation?.noOfMattress ||
      qd?.rooms?.numberOfMattress ||
      qd?.noOfMattress ||
      0
  );

  const roomsLine = `${resolvedNumberOfRooms} Room(s) - ${resolvedSharingType}${resolvedNumberOfMattress > 0 ? ` + ${resolvedNumberOfMattress} Extra Mattress(es)` : ""}`;
  const packageType = safe(quotation?.finalizedPackage || "Family Tour Package");
  
  const destinations = qd?.destinations || pkg?.destinationNights || [];
  const duration = nightsAndDays(destinations);
  
  const arrivalDate = fmtDate(td?.arrivalDate || quotation?.arrivalDate);
  const departureDate = fmtDate(td?.departureDate || quotation?.departureDate);
  const pickupPoint = safe(td?.vehicleDetails?.pickupDropDetails?.pickupLocation || quotation?.pickupPoint, "Siliguri Airport/Railway Station**");
  const dropPoint = safe(td?.vehicleDetails?.pickupDropDetails?.dropLocation || quotation?.dropPoint, "Siliguri Airport/Railway Station**");
  const mealPlan = safe(qd?.mealPlan || quotation?.mealPlan, "CPI Plan (Breakfast only)");

  const confirmedHotels = quotation.confirmedHotels || [];
  
  const hotelSections = confirmedHotels.map((h, i) => `
    <div style="margin-bottom: 20px;">
        <p style="font-weight: bold; margin-bottom: 5px;">${i + 1}: ${safe(h.hotelName)} in ${safe(h.city)} (${h.nights || 1} Night)</p>
        <p style="margin: 2px 0;"><b>Address -</b> ${safe(h.hotelAddress)}</p>
        <p style="margin: 2px 0;"><b>Guest Name -</b> ${guestName}</p>
        <p style="margin: 2px 0;"><b>Person -</b> ${guestsLine}</p>
        <p style="margin: 2px 0;"><b>Rooms -</b> ${safe(h.noOfRooms)}</p>
        <p style="margin: 2px 0;"><b>Booking PNR -</b> ${safe(h.bookingPnr, "Iconic Travel (for Confirmation)")}</p>
        <p style="margin: 2px 0;"><b>Check-in Date -</b> ${safe(h.checkInDate)}, Time – 12: 00 PM</p>
        <p style="margin: 2px 0;"><b>Check Out Date -</b> ${safe(h.checkOutDate)}, Time – 11:00 AM</p>
        <p style="margin: 2px 0;"><b>Room Type -</b> ${safe(h.roomType)}</p>
        <p style="margin: 2px 0;"><b>Contact No -</b> ${safe(h.contactNo)} (Manager)</p>
    </div>
  `).join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #333; line-height: 1.5; max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a237e; margin: 0; font-size: 24px; text-transform: uppercase;">Hotel Confirmation Voucher</h1>
            <p style="color: #666; margin: 5px 0;">${companyName}</p>
        </div>

        <p>Dear ${guestName},</p>
        <p>Thank you for choosing ${companyName}, we are pleased to inform you to start planning your way for the following to be confirmed successfully.</p>
        
        ${options.additionalNote ? `<div style="background-color: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0;"><b>Note:</b> ${options.additionalNote}</div>` : ''}

        <p style="font-weight: bold; font-size: 16px; color: #1a237e; margin-top: 20px;">
            ${td.quotationTitle || "Tour Package"}
        </p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="font-weight: bold; color: #d32f2f; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">INCLUSIONS OF PACKAGE:</p>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 3px 0; width: 180px;"><b>Guest Name -</b></td><td>${guestName}</td></tr>
                <tr><td style="padding: 3px 0;"><b>Booking Id -</b></td><td>${bookingId}</td></tr>
                <tr><td style="padding: 3px 0;"><b>Persons -</b></td><td>${guestsLine}</td></tr>
                <tr><td style="padding: 3px 0;"><b>No of Rooms -</b></td><td>${roomsLine}</td></tr>
                <tr><td style="padding: 3px 0;"><b>Package Type -</b></td><td>${packageType}</td></tr>
                <tr><td style="padding: 3px 0;"><b>Duration -</b></td><td>${duration.nights} Nights ${duration.days} Days</td></tr>
                <tr><td style="padding: 3px 0;"><b>Date of Journey -</b></td><td>${arrivalDate}, Time - standard**</td></tr>
                <tr><td style="padding: 3px 0;"><b>Tour End Date -</b></td><td>${departureDate}, Time - standard**</td></tr>
                <tr><td style="padding: 3px 0;"><b>Pick Up Point -</b></td><td>${pickupPoint}</td></tr>
                <tr><td style="padding: 3px 0;"><b>Drop Point -</b></td><td>${dropPoint}</td></tr>
                <tr><td style="padding: 3px 0;"><b>Meal Plan -</b></td><td>${mealPlan}</td></tr>
            </table>
        </div>

        <p style="font-weight: bold; color: #d32f2f; font-size: 16px; margin-top: 25px; border-bottom: 2px solid #d32f2f; padding-bottom: 5px;">FINAL HOTEL NAMES WITH CONFIRMATION</p>
        
        ${hotelSections || '<p style="font-style: italic; color: #888;">No hotels confirmed yet.</p>'}

        <div style="background-color: #fffde7; padding: 15px; border-radius: 5px; margin-top: 25px; border: 1px solid #fff59d;">
            <p style="margin: 0; font-size: 13px;"><b>Child Policy -</b> Above 05y Childs are payable and this depends on the hotel if they charge or not if not included in room sharing.</p>
        </div>

        <div style="margin-top: 20px; font-size: 13px; color: #555;">
            <p style="margin: 5px 0;"><b>NOTE -</b> ALL AMENDMENTS ARE PAYABLE BY GUEST WHEN RESERVATION TEAM WILL SENT TO YOU.</p>
            <p style="margin: 5px 0;"><b>NOTE -</b> if any hotels do not provide Meals Breakfast/Lunch/Dinner, which are given in your booking then we will provide refunds as per company policy and If any Extra Meals provided by hotel then charges applicable & payable by guest to the company with GST (5%) extra. Thanks</p>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            ${safe(options.signature, `
                <p style="margin: 2px 0;"><b>Warm & Regards,</b></p>
                <p style="margin: 2px 0; font-weight: bold; color: #1a237e;">${companyName}</p>
                <p style="margin: 2px 0;">Reservation Team</p>
                <p style="margin: 2px 0;">Mobile: ${companyMobile} (WhatsApp)</p>
                <p style="margin: 2px 0;">Website: <a href="${companyWebsite}" style="color: #1976d2; text-decoration: none;">${companyWebsite}</a></p>
                <p style="margin: 2px 0; font-size: 12px; color: #777;">Reg. Address & Corporate Office: ${companyAddress}</p>
            `).replace(/\n/g, "<br/>")}
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-weight: bold; color: #1a237e;">
            THANK YOU FOR CHOOSING ${companyName.toUpperCase()}!!!
        </div>
    </div>
  `;
}
