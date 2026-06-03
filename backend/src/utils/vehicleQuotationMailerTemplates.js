const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

const DEFAULT_PAYMENT_POLICY = [
  "At the time of reservation, a non-refundable booking amount of 20% of package cost + 5% GST is required.",
  "20% at reservation + 100% Flight / Train cost",
  "60% after booking confirmation",
  "Balance before departure",
];

const DEFAULT_INCLUSIONS = [
  "Pick-up & drop from / to the airport or railway station as per the itinerary",
  "All sightseeing & transfers in a well-maintained Private AC/Non-AC vehicle (sedan / SUV / tempo traveller/similar as per group size)",
  "Driver's batta (allowance), fuel charges, parking fees, toll taxes & state permit charges",
  "Vehicle available from 08:00 AM to 08:00 PM daily (extended hours on extra charges)",
  "Note: AC will be switched off in hilly areas & during steep ascents/descents for safety",
];

const DEFAULT_EXCLUSIONS = [
  "Travel insurance",
  "Emergency evacuation",
  "Trip cancellation costs",
  "Personal Expenses: Laundry, Room service, Tips, Shopping, Medical expenses",
  "Flight / Train tickets",
  "Entry fees to sightseeing places",
  "Camera / video charges",
  "Ropeway / boating / adventure activities",
  "Meals: Lunch / Dinner / Snacks / Beverages (unless specifically mentioned)",
  "Any extra costs due to unavoidable circumstances (natural calamities, strikes, lockdowns, bad weather, etc.)",
  "Anything not mentioned in Inclusions",
];

const DEFAULT_TERMS_AND_CONDITIONS = ["https://www.iconicyatra.com/terms-conditions"];

const safe = (v, fallback = "") =>
  v === undefined || v === null || String(v).trim() === ""
    ? fallback
    : String(v).trim();

const toNum = (v) => {
  if (v === undefined || v === null) return 0;
  const normalized = String(v).replace(/[^0-9.-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

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

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const summarizeGuests = (lead = {}) => {
  const members = lead?.tourDetails?.members || {};
  const adults = toNum(members.adults);
  const children = toNum(members.children);
  return `${adults + children} Pax (${adults} Adults, ${children} Children)`;
};

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
      return `${particulars}`;
    });
};

const excludedAdditionalServiceLines = (additionalServices = []) => {
  return (Array.isArray(additionalServices) ? additionalServices : [])
    .filter((s) => String(s?.included || "").toLowerCase() === "no")
    .map((s) => {
      const particulars = safe(s?.particulars, "Additional Service");
      const totalAmount = toNum(s?.totalAmount || s?.amount);
      return `${particulars} (Extra: INR ${INR.format(totalAmount)})`;
    });
};

const isHttpUrlString = (v) => {
  const s = safe(v, "");
  return s.length > 0 && /^https?:\/\//i.test(s);
};

const termsAndConditionsLine = (value) => {
  const arr = Array.isArray(value) ? value : [value].filter(Boolean);
  if (arr.length === 0) return "";
  
  const first = safe(arr[0], "");
  if (isHttpUrlString(first)) {
    return `<p style="margin-bottom:10px;">
      <b>As per company terms and conditions - </b><br/>
      <a href="${first}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">
        ${first}
      </a>
    </p>`;
  }
  
  return `<p style="margin-bottom:10px;">${arr.join("<br/>")}</p>`;
};

const cancellationPolicyUrlLine = (url) => {
  const u = safe(url, "");
  if (!isHttpUrlString(u)) return "";
  return `<p style="margin-bottom:10px;">
    <b>As per company cancellation policy -</b><br/>
    <a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">${u}</a>
  </p>`;
};

const companyPaymentLinkLine = (url) => {
  const u = safe(url, "");
  if (!isHttpUrlString(u)) return "";
  return `<p style="margin-bottom:10px;">
    <b>Payment link: </b>
    <a href="${u}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">${u}</a>
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
const itineraryLines = (itinerary = []) =>
  (itinerary || [])
    .map(
      (d, i) => `
                <div style="margin-bottom:12px;">
                    <div style="color:#000; font-weight:bold;">
                        Day ${i + 1}: ${safe(d?.title || d?.dayTitle, "")}
                    </div>
                    <div style="color:#000;">
                        ${safe(d?.description || d?.dayNote, "")}
                    </div>
                </div>
            `,
    )
    .join("");

const vehicleTotals = (vehicle = {}) => {
  const totalCost = toNum(vehicle?.costDetails?.totalCost);
  const discount = toNum(vehicle?.discount);
  const subtotal = Math.max(0, totalCost - discount);
  const gstPercent = toNum(vehicle?.tax?.applyGst) || 5;
  const taxAmount = (subtotal * gstPercent) / 100;
  return {
    beforeTax: subtotal,
    taxPercent: gstPercent,
    taxAmount,
    total: subtotal + taxAmount,
  };
};

export function buildVehicleQuotationPdfPreviewEmail(vehicleData, customText = {}) {
  const vehicle = vehicleData?.vehicle || {};
  const basics = vehicle?.basicsDetails || {};
  const totals = vehicleTotals(vehicle);
  const companyName = safe(customText?.companyName, "Iconic Travel");
  const companyWebsite = safe(customText?.companyWebsite);
  const policies = vehicle?.policies || {};
  const inclusionFromPolicies = toPolicyArray(policies?.inclusionPolicy);
  const inclusionFromVehicle = Array.isArray(vehicle?.inclusions) ? vehicle.inclusions.map(String).filter(Boolean) : [];
  const baseInclusions = inclusionFromVehicle.length > 0
    ? inclusionFromVehicle
    : inclusionFromPolicies.length > 0
    ? inclusionFromPolicies
    : DEFAULT_INCLUSIONS;
  const inclusionWithAdditional = [
    ...baseInclusions,
    ...includedAdditionalServiceLines(vehicle?.additionalServices),
  ];
  const exclusionFromPolicies = toPolicyArray(policies?.exclusionPolicy);
  const exclusionFromVehicle = Array.isArray(vehicle?.exclusions) ? vehicle.exclusions.map(String).filter(Boolean) : [];
  const baseExclusions = exclusionFromVehicle.length > 0
    ? exclusionFromVehicle
    : exclusionFromPolicies.length > 0
    ? exclusionFromPolicies
    : DEFAULT_EXCLUSIONS;
  const exclusionCombined = [
    ...baseExclusions,
    ...excludedAdditionalServiceLines(vehicle?.additionalServices),
  ];
  const paymentCombinedRaw = toPolicyArray(policies?.paymentPolicy);
  const paymentCombined = paymentCombinedRaw.length > 0 ? paymentCombinedRaw : DEFAULT_PAYMENT_POLICY;
  const termsFromPolicies = toPolicyArray(policies?.termsAndConditions);
  const termsFromCompany = toPolicyArray(customText?.termsAndConditions);
  const termsValue = termsFromPolicies.length > 0 
    ? termsFromPolicies 
    : termsFromCompany.length > 0 
      ? termsFromCompany 
      : DEFAULT_TERMS_AND_CONDITIONS;
  const cancellationPolicyUrl = customText?.cancellationPolicyUrl;
  const bankDetails = Array.isArray(customText?.bankDetails)
    ? customText.bankDetails
    : [];
  const paymentLink = customText?.paymentLink || "";

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
            <b>Official Website Visit @</b><br/>
            <a href="${companyWebsite}" target="_blank" style="font-weight:bold; color:#1976d2; text-decoration:none;">
                ${companyWebsite}
            </a>
        </p>
        <p>
            This is referenced in our discussion regarding your forthcoming Vehicle Tour to the
            <span style="color:#003366; font-weight:bold;"> ${safe(
              basics?.clientName,
              "Guest",
            )}</span>.
        </p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 16px;">
            ##PACKAGE COST FOR ALL PERSON = INR ${INR.format(totals.total)} As of now
        </p>
        <p style="color:#000; font-weight:bold;">
            SPECIAL DISCOUNTED TOUR PACKAGE VALID FOR 24Hrs only..
        </p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">INCLUSIONS:</p>
        <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">EXCLUSIONS:</p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">TERMS & CONDITIONS:</p>
        ${termsAndConditionsLine(termsValue)}
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">CANCELLATION POLICY:</p>
        ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT POLICY:</p>
        <p>${policyLines(paymentCombined).replace(/\n/g, "<br/>")}</p>
        ${bankHtmlSection(bankDetails, paymentLink).replace(/#d32f2f/g, "#003366")}
        <p>${safe(customText.signature, `Warm Regards<br/><b>${companyName}</b>`)}</p>
    </div>
  `;
}

export function buildVehicleQuotationBookingEmail(vehicleData, customText = {}) {
  const vehicle = vehicleData?.vehicle || {};
  const lead = vehicleData?.lead || {};
  const basics = vehicle?.basicsDetails || {};
  const pickupDrop = vehicle?.pickupDropDetails || {};
  const tourPickupDrop = lead?.tourDetails?.pickupDrop || {};
  const totals = vehicleTotals(vehicle);
  const companyName = safe(customText?.companyName, "Iconic Travel");
  const policies = vehicle?.policies || {};
  const inclusionFromPolicies2 = toPolicyArray(policies?.inclusionPolicy);
  const inclusionFromVehicle2 = Array.isArray(vehicle?.inclusions) ? vehicle.inclusions.map(String).filter(Boolean) : [];
  const baseInclusions2 = inclusionFromVehicle2.length > 0
    ? inclusionFromVehicle2
    : inclusionFromPolicies2.length > 0
    ? inclusionFromPolicies2
    : DEFAULT_INCLUSIONS;
  const inclusionWithAdditional = [
    ...baseInclusions2,
    ...includedAdditionalServiceLines(vehicle?.additionalServices),
  ];
  const exclusionFromPolicies2 = toPolicyArray(policies?.exclusionPolicy);
  const exclusionFromVehicle2 = Array.isArray(vehicle?.exclusions) ? vehicle.exclusions.map(String).filter(Boolean) : [];
  const baseExclusions2 = exclusionFromVehicle2.length > 0
    ? exclusionFromVehicle2
    : exclusionFromPolicies2.length > 0
    ? exclusionFromPolicies2
    : DEFAULT_EXCLUSIONS;
  const exclusionCombined = [
    ...baseExclusions2,
    ...excludedAdditionalServiceLines(vehicle?.additionalServices),
  ];
  const paymentCombinedRaw = toPolicyArray(policies?.paymentPolicy);
  const paymentCombined = paymentCombinedRaw.length > 0 ? paymentCombinedRaw : DEFAULT_PAYMENT_POLICY;
  const termsFromPolicies2 = toPolicyArray(policies?.termsAndConditions);
  const termsFromCompany2 = toPolicyArray(customText?.termsAndConditions);
  const termsValue = termsFromPolicies2.length > 0 
    ? termsFromPolicies2 
    : termsFromCompany2.length > 0 
      ? termsFromCompany2 
      : DEFAULT_TERMS_AND_CONDITIONS;
  const cancellationPolicyUrl = customText?.cancellationPolicyUrl;
  const bankDetails = Array.isArray(customText?.bankDetails)
    ? customText.bankDetails
    : [];
  const paymentLink = customText?.paymentLink || "";
  const receivedAmount = toNum(customText.receivedAmount);
  const dueAmount =
    customText.dueAmount !== undefined
      ? toNum(customText.dueAmount)
      : Math.max(0, totals.total - receivedAmount);
  const nextPayableAmount =
    customText.nextPayableAmount !== undefined
      ? toNum(customText.nextPayableAmount)
      : dueAmount;

  const vehiclesHtml = basics?.vehiclesSameOrDifferent === "Different" && Array.isArray(vehicle.multipleVehicles) && vehicle.multipleVehicles.length > 0
    ? vehicle.multipleVehicles.map((mv, i) => `
        <div style="margin-bottom: 8px; padding: 10px; border: 1px solid #ccc; border-left: 4px solid #003366; border-radius: 4px; background-color: #f9f9f9;">
          <p style="margin: 4px 0;"><b>Vehicle ${i + 1}:</b> ${safe(mv?.vehicleType, "-")}</p>
          <p style="margin: 4px 0;"><b>Trip Type:</b> ${safe(mv?.tripType, "-")}</p>
          <p style="margin: 4px 0;"><b>No. of Days:</b> ${safe(mv?.noOfDays, "-")}</p>
        </div>
      `).join("")
    : `
      <p><b>Vehicle:</b> ${safe(basics?.vehicleType, "As per itinerary")}</p>
      <p><b>Trip Type:</b> ${safe(basics?.tripType, "-")}</p>
      <p><b>No. of Days:</b> ${safe(basics?.noOfDays, "-")}</p>
    `;

  return `
    <div style="font-family: 'Georgia', serif; font-size:15px; color:#333; line-height:1.6;">
      <p style="color:#003366; font-weight:bold; font-size: 16px;">
        ${safe(customText.greeting, `Dear ${safe(basics?.clientName, "Guest")},`)}
      </p>
      <p style="color:#003366; font-weight:bold; font-size: 18px;">
        ${safe(customText.opening, `BOOKING CONFIRMATION FROM ${companyName.toUpperCase()}!!!`)}
      </p>
      <p>${safe(
        customText.thankYou,
        `Thank you for choosing ${companyName}. Your booking has been confirmed.`,
      )}</p>
      <p style="color:#003366; font-weight:bold; font-size: 16px;">BOOKING ID: ${safe(
        customText.bookingId,
        vehicle?.bookingId || vehicle?.vehicleQuotationId,
      )}</p>
      <p><b>Client:</b> ${safe(basics?.clientName, "Guest")}</p>
      <br/>
      ${vehiclesHtml}
      <br/>
      <p><b>No. of Pax:</b> ${summarizeGuests(lead)}</p>
      <p><b>Arrival Date:</b> ${
        pickupDrop?.pickupArrivalNote
          ? safe(pickupDrop.pickupArrivalNote.replace(/^(Arrival|Arrival Date):\s*/i, ""))
          : `${safe(tourPickupDrop?.arrivalCity)} ${safe(pickupDrop?.pickupLocation)} (${fmtDate(pickupDrop?.pickupDate)}) ${(pickupDrop?.pickupTime && fmtTime(pickupDrop.pickupTime).toLowerCase() !== "05:30 am") ? `, Time: ${fmtTime(pickupDrop.pickupTime)}` : ""}`
      }</p>
      <p><b>Departure Date:</b> ${
        pickupDrop?.pickupDepartureNote
          ? safe(pickupDrop.pickupDepartureNote.replace(/^(Departure|Departure Date):\s*/i, ""))
          : `${safe(tourPickupDrop?.departureCity)} ${safe(pickupDrop?.dropLocation)} (${fmtDate(pickupDrop?.dropDate)}) ${(pickupDrop?.dropTime && fmtTime(pickupDrop.dropTime).toLowerCase() !== "05:30 am") ? `, Time: ${fmtTime(pickupDrop.dropTime)}` : ""}`
      }</p>
      <br/>
      <br/>
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT STATUS:</p>
      <p><b>Package Cost (excluding GST):</b> INR ${INR.format(totals.beforeTax)}</p>
      <p><b>GST (${totals.taxPercent}%):</b> INR ${INR.format(totals.taxAmount)}</p>
      <p><b>Package Cost (including GST):</b> INR ${INR.format(totals.total)}</p>
      <p><b>Payment received:</b> INR ${INR.format(receivedAmount)}</p>
      <p><b>The remaining payment:</b> INR ${INR.format(dueAmount)}</p>
      <p><b>Next Payable Amount:</b> INR ${INR.format(nextPayableAmount)}</p>
      ${
        customText?.dueDate
          ? `<p><b>Payment Due Date:</b> ${safe(customText.dueDate)}</p>`
          : ""
      }
      <br/>
      ${
        vehicle?.itinerary && vehicle.itinerary.length > 0
          ? `
            <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">DAY WISE ITINERARY</p>
            <div>${itineraryLines(vehicle.itinerary)}</div>
            <br/>
          `
          : ""
      }
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">INCLUSIONS:</p>
      <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">EXCLUSIONS:</p>
      <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">TERMS & CONDITIONS:</p>
      ${termsAndConditionsLine(termsValue)}
      <br/>
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">CANCELLATION POLICY:</p>
      ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
      <br/>
      <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT POLICY:</p>
      <p>${policyLines(paymentCombined).replace(/\n/g, "<br/>")}</p>
      ${bankHtmlSection(bankDetails, paymentLink).replace(/#d32f2f/g, "#003366")}
      <p>
          <span style="color:#003366; font-weight:bold;">NOTE:</span>
          <span style="color:#000; font-weight:bold;">
              All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
              For more details, contact your Tour Expert.
          </span>
      </p>
      <br/>
      <p>${safe(customText.signature, `Warm Regards<br/><b>${companyName}</b>`)}</p>
    </div>
  `;
}
