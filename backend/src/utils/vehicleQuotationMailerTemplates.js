const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

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
      const totalAmount = toNum(s?.totalAmount || s?.amount);
      return `${particulars}: INR ${INR.format(totalAmount)}`;
    });
};

const isHttpUrlString = (v) => {
  const s = safe(v, "");
  return s.length > 0 && /^https?:\/\//i.test(s);
};

const termsAndConditionsLine = (value) => {
  const t = safe(value, "");
  if (!t) return "";
  if (!isHttpUrlString(t)) return `<p style="margin-bottom:10px;">${t}</p>`;
  return `<p style="margin-bottom:10px;">
    <b>As per company terms and conditions - </b>
    <a href="${t}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">
      View Terms & Conditions
    </a>
  </p>`;
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
  const inclusionWithAdditional = [
    ...toPolicyArray(policies?.inclusionPolicy),
    ...includedAdditionalServiceLines(vehicle?.additionalServices),
  ];
  const exclusionCombined = toPolicyArray(policies?.exclusionPolicy);
  const paymentCombined = toPolicyArray(policies?.paymentPolicy);
  const termsValue = policies?.termsAndConditions || customText?.termsAndConditions;
  const cancellationPolicyUrl = customText?.cancellationPolicyUrl;
  const bankDetails = Array.isArray(customText?.bankDetails)
    ? customText.bankDetails
    : [];
  const paymentLink = customText?.paymentLink || "";

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
            <b>Official Website Visit @</b><br/>
            <a href="${companyWebsite}" target="_blank" style="font-weight:bold; color:#1976d2; text-decoration:none;">
                ${companyWebsite}
            </a>
        </p>
        <p>
            This is referenced in our discussion regarding your forthcoming Vehicle Tour to the
            <span style="color:#d32f2f; font-weight:bold;"> ${safe(
              basics?.clientName,
              "Guest",
            )}</span>.
        </p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">
            ##PACKAGE COST FOR ALL PERSON = INR ${INR.format(totals.total)} As of now
        </p>
        <p style="color:#000; font-weight:bold;">
            SPECIAL DISCOUNTED TOUR PACKAGE VALID FOR 24Hrs only..
        </p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
        <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
        ${termsAndConditionsLine(termsValue)}
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
        ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
        <p>${policyLines(paymentCombined).replace(/\n/g, "<br/>")}</p>
        ${bankHtmlSection(bankDetails, paymentLink)}
    </div>
  `;
}

export function buildVehicleQuotationBookingEmail(vehicleData, customText = {}) {
  const vehicle = vehicleData?.vehicle || {};
  const lead = vehicleData?.lead || {};
  const basics = vehicle?.basicsDetails || {};
  const pickupDrop = vehicle?.pickupDropDetails || {};
  const totals = vehicleTotals(vehicle);
  const companyName = safe(customText?.companyName, "Iconic Travel");
  const policies = vehicle?.policies || {};
  const inclusionWithAdditional = [
    ...toPolicyArray(policies?.inclusionPolicy),
    ...includedAdditionalServiceLines(vehicle?.additionalServices),
  ];
  const exclusionCombined = toPolicyArray(policies?.exclusionPolicy);
  const paymentCombined = toPolicyArray(policies?.paymentPolicy);
  const termsValue = policies?.termsAndConditions || customText?.termsAndConditions;
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

  return `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#333; line-height:1.6;">
      <p style="color:red; font-weight:bold;">
        ${safe(customText.greeting, `Dear ${safe(basics?.clientName, "Guest")},`)}
      </p>
      <p style="color:red; font-weight:bold;">
        ${safe(customText.opening, `BOOKING CONFIRMATION FROM ${companyName.toUpperCase()}!!!`)}
      </p>
      <p>${safe(
        customText.thankYou,
        `Thank you for choosing ${companyName}. Your booking has been confirmed.`,
      )}</p>
      <p style="color:#d32f2f; font-weight:bold;">BOOKING ID: ${safe(
        customText.bookingId,
        vehicle?.vehicleQuotationId,
      )}</p>
      <p><b>Client:</b> ${safe(basics?.clientName, "Guest")}</p>
      <p><b>Vehicle:</b> ${safe(basics?.vehicleType, "As per itinerary")}</p>
      <p><b>Trip Type:</b> ${safe(basics?.tripType, "-")}</p>
      <p><b>No. of Days:</b> ${safe(basics?.noOfDays, "-")}</p>
      <p><b>No. of Pax:</b> ${summarizeGuests(lead)}</p>
      <p><b>Arrival Date:</b> ${fmtDate(pickupDrop?.pickupDate)} ${pickupDrop?.pickupTime ? `, Time: ${fmtTime(pickupDrop.pickupTime)}` : ""}</p>
      <p><b>Departure Date:</b> ${fmtDate(pickupDrop?.dropDate)} ${pickupDrop?.dropTime ? `, Time: ${fmtTime(pickupDrop.dropTime)}` : ""}</p>
      <p><b>Pick Up Point:</b> ${safe(pickupDrop?.pickupLocation, "As per itinerary")}</p>
      <p><b>Drop Point:</b> ${safe(pickupDrop?.dropLocation, "As per itinerary")}</p>
      <br/>
      <p style="color:#d32f2f; font-weight:bold;">PAYMENT STATUS:</p>
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
      <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
      <p>${policyLines(inclusionWithAdditional).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
      <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
      ${termsAndConditionsLine(termsValue)}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
      ${cancellationPolicyUrlLine(cancellationPolicyUrl)}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
      <p>${policyLines(paymentCombined).replace(/\n/g, "<br/>")}</p>
      ${bankHtmlSection(bankDetails, paymentLink)}
      <p>
        ${safe(
          customText.signature,
          `Warm Regards<br/>Reservation Team<br/>${companyName}`,
        ).replace(/\n/g, "<br/>")}
      </p>
    </div>
  `;
}
