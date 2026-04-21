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

const summarizeGuests = (lead = {}) => {
  const members = lead?.tourDetails?.members || {};
  const adults = toNum(members.adults);
  const children = toNum(members.children);
  return `${adults + children} Pax (${adults} Adults, ${children} Children)`;
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
      <p><b>Arrival Date:</b> ${fmtDate(pickupDrop?.pickupDate)} ${pickupDrop?.pickupTime ? `, Time: ${pickupDrop.pickupTime}` : ""}</p>
      <p><b>Departure Date:</b> ${fmtDate(pickupDrop?.dropDate)} ${pickupDrop?.dropTime ? `, Time: ${pickupDrop.dropTime}` : ""}</p>
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
    </div>
  `;
}
