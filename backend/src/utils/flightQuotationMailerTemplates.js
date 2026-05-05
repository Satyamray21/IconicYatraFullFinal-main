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

const fmtTripType = (type) => {
  if (!type) return "";
  const t = String(type).toLowerCase();
  if (t === "oneway") return "One Way";
  if (t === "roundtrip") return "Round Trip";
  if (t === "multicity") return "Multi City";
  return type;
};

const fmtDate = (dateString) => {
  if (!dateString) return "";
  if (typeof dateString === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split("/");
    const d = new Date(`${year}-${month}-${day}`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return dateString;
  }
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (timeString) => {
  if (!timeString) return "";
  if (typeof timeString === "string" && (timeString.includes("AM") || timeString.includes("PM"))) {
    return timeString;
  }
  const d = new Date(timeString);
  if (Number.isNaN(d.getTime())) return String(timeString);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

const normalizeTermsValue = (value) => {
  if (Array.isArray(value)) {
    const cleaned = value.map((x) => safe(x)).filter(Boolean);
    if (cleaned.length === 0) return "";
    const firstUrl = cleaned.find((x) => /^https?:\/\//i.test(x));
    return firstUrl || cleaned.join("\n");
  }
  return safe(value, "");
};

const isHttpUrlString = (v) => {
  const s = safe(v, "");
  return s.length > 0 && /^https?:\/\//i.test(s);
};

const termsAndConditionsLine = (value, companyTermsUrl = "https://iconictravel.in/terms") => {
  const t = normalizeTermsValue(value);
  const link = isHttpUrlString(t) ? t : companyTermsUrl;
  
  if (!link) return "";

  return `
    <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
    <p style="margin-bottom:10px;">
      <b>As per company terms and conditions - </b>
      <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#1976d2; font-weight:bold; word-break:break-all;">
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

const flightTotals = (quotation = {}) => {
  if (quotation?.finalFare !== undefined && quotation?.finalFare !== null) {
    return { total: toNum(quotation.finalFare) };
  }
  const fareList =
    Array.isArray(quotation?.finalFareList) && quotation.finalFareList.length
      ? quotation.finalFareList
      : Array.isArray(quotation?.flightDetails)
        ? quotation.flightDetails.map((f) => f?.fare)
        : [];
  const total = fareList.reduce((sum, fare) => sum + toNum(fare), 0);
  return { total };
};

const resolveTermsValue = (policies = {}, customText = {}) => {
  const policyTerms = toPolicyArray(policies?.termsAndConditions);
  if (policyTerms.length > 0) return policyTerms;
  return customText?.termsAndConditions || "";
};
export function buildFlightQuotationNormalEmail(data, customText = {}) {
  const quotation = data?.quotation || {};
  const policies = quotation?.policies || {};
  const totals = flightTotals(quotation);
  const companyName = safe(customText?.companyName, "Iconic Travel");
  const companyWebsite = safe(customText?.companyWebsite, "");
  const inclusionPolicy = toPolicyArray(policies?.inclusionPolicy);
  const exclusionPolicy = toPolicyArray(policies?.exclusionPolicy);
  const paymentPolicy = toPolicyArray(policies?.paymentPolicy);
  const termsandCondition = resolveTermsValue(policies, customText);

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
    </p>
      <p><b>Quotation ID:</b> ${safe(quotation?.flightQuotationId, "-")}</p>
      <p><b>Passenger:</b> ${safe(quotation?.personalDetails?.fullName, "Guest")}</p>
      <p><b>Trip Type:</b> ${fmtTripType(quotation?.tripType)}</p>
      <p><b>${quotation?.gstType === "Excluded" && quotation?.gstAmount > 0 ? "Base Fare" : "Total Fare"}(May vary on the time/date of booking):</b> INR ${INR.format(quotation?.gstType === "Excluded" ? (quotation?.baseFare || totals.total) : totals.total)}</p>
      ${quotation?.gstType === "Excluded" && quotation?.gstAmount > 0 ? `<p><b>GST (${quotation.gstPercentage}%):</b> INR ${INR.format(quotation.gstAmount)}</p><p><b>Total Fare (Incl. GST):</b> INR ${INR.format(totals.total)}</p>` : ""}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>FLIGHT DETAILS:</b></p>
      ${(quotation?.flightDetails || [])
        .map(
          (f, idx) =>
            `<p><b>Flight ${idx + 1}:</b> ${safe(f?.from)} to ${safe(f?.to)} | ${safe(f?.preferredAirline)} ${f?.flightNo ? `(${f.flightNo})` : ""} | ${fmtDate(f?.departureDate)} ${fmtTime(f?.departureTime)}</p>`,
        )
        .join("")}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
      <p>${policyLines(inclusionPolicy.length ? inclusionPolicy : ["As per confirmed inclusions."]).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
      <p>${policyLines(exclusionPolicy.length ? exclusionPolicy : ["As per company exclusion policy."]).replace(/\n/g, "<br/>")}</p>
      <br/>
      ${termsAndConditionsLine(termsandCondition, customText?.termsAndConditions)}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
      ${cancellationPolicyUrlLine(customText?.cancellationPolicyUrl)}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
      <p>${policyLines(paymentPolicy.length ? paymentPolicy : ["Payment policy as per confirmation."]).replace(/\n/g, "<br/>")}</p>
      ${bankHtmlSection(customText?.bankDetails || [], customText?.paymentLink || "")}
      <p>${safe(customText.signature, `Warm Regards<br/><b>${companyName}</b>`)}</p>
    </div>
  `;
}

export function buildFlightQuotationBookingEmail(data, customText = {}) {
  const quotation = data?.quotation || {};
  const totals = flightTotals(quotation);
  const policies = quotation?.policies || {};
  const companyName = safe(customText?.companyName, "Iconic Travel");
  const receivedAmount = toNum(customText?.receivedAmount);
  const dueAmount = Math.max(0, totals.total - receivedAmount);
  const inclusionPolicy = toPolicyArray(policies?.inclusionPolicy);
  const exclusionPolicy = toPolicyArray(policies?.exclusionPolicy);
  const paymentPolicy = toPolicyArray(policies?.paymentPolicy);
  const termsandCondition = resolveTermsValue(policies, customText);

  return `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#333; line-height:1.6;">
      <p style="color:red; font-weight:bold;">${safe(customText.greeting, `Dear ${safe(quotation?.personalDetails?.fullName, "Guest")},`)}</p>
      <p style="color:red; font-weight:bold;">${safe(customText.opening, `BOOKING CONFIRMATION FROM ${companyName.toUpperCase()}!!!`)}</p>
      <p><b>BOOKING ID:</b> ${safe(quotation?.flightQuotationId, "-")}</p>
      <p><b>Passenger:</b> ${safe(quotation?.personalDetails?.fullName, "Guest")}</p>
      <p><b>Trip Type:</b> ${fmtTripType(quotation?.tripType)}</p>
      <br/>
      <p style="color:#d32f2f; font-weight:bold;">PAYMENT STATUS:</p>
      <p><b>${quotation?.gstType === "Excluded" && quotation?.gstAmount > 0 ? "Base Fare" : "Package Cost"}:</b> INR ${INR.format(quotation?.gstType === "Excluded" ? (quotation?.baseFare || totals.total) : totals.total)}</p>
      ${quotation?.gstType === "Excluded" && quotation?.gstAmount > 0 ? `<p><b>GST (${quotation.gstPercentage}%):</b> INR ${INR.format(quotation.gstAmount)}</p><p><b>Total Package Cost (Incl. GST):</b> INR ${INR.format(totals.total)}</p>` : ""}
      <p><b>Payment received:</b> INR ${INR.format(receivedAmount)}</p>
      <p><b>The remaining payment:</b> INR ${INR.format(dueAmount)}</p>
      ${
        customText?.dueDate
          ? `<p><b>Payment Due Date:</b> ${safe(customText.dueDate)}</p>`
          : ""
      }
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>FLIGHT DETAILS:</b></p>
      ${(quotation?.flightDetails || [])
        .map((f, idx) => {
          const pnr = quotation?.pnrList?.[idx];
          return `<p><b>Flight ${idx + 1}:</b> ${safe(f?.from)} to ${safe(
            f?.to,
          )} | ${safe(f?.preferredAirline)} ${f?.flightNo ? `(${f.flightNo})` : ""} | ${fmtDate(
            f?.departureDate,
          )} ${fmtTime(f?.departureTime)}${
            pnr ? ` | <span style="color:#d32f2f;"><b>PNR: ${pnr}</b></span>` : ""
          }</p>`;
        })
        .join("")}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
      <p>${policyLines(inclusionPolicy.length ? inclusionPolicy : ["As per confirmed inclusions."]).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
      <p>${policyLines(exclusionPolicy.length ? exclusionPolicy : ["As per company exclusion policy."]).replace(/\n/g, "<br/>")}</p>
      <br/>
      ${termsAndConditionsLine(termsandCondition, customText?.termsAndConditions)}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
      ${cancellationPolicyUrlLine(customText?.cancellationPolicyUrl)}
      <br/>
      <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
      <p>${policyLines(paymentPolicy.length ? paymentPolicy : ["Payment policy as per confirmation."]).replace(/\n/g, "<br/>")}</p>
      ${bankHtmlSection(customText?.bankDetails || [], customText?.paymentLink || "")}
      <p>${safe(customText.signature, `Warm Regards<br/><b>${companyName}</b>`)}</p>
    </div>
  `;
}
