import { sumBillableAdditionalServices } from "./quotationAdditionalServices.js";

const INR = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

const toNum = (v) => {
  const n = Number(v);
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
  return {
    adults,
    children,
    kids,
    infants,
    total,
    text: `${total} Pax (${adults} Adults, ${children} Children, ${kids} Kids, ${infants} Infants)`,
  };
};

const nightsAndDays = (destinations = []) => {
  const nights = (destinations || []).reduce(
    (sum, d) => sum + toNum(d?.nights),
    0,
  );
  return { nights, days: nights + 1 };
};

const selectedPackageKey = (quotation = {}) => {
  const pkg = safe(quotation.finalizedPackage, "").toLowerCase();
  return ["standard", "deluxe", "superior"].includes(pkg) ? pkg : "standard";
};

const selectedFinalTotal = (quotation = {}) => {
  const qd = quotation?.tourDetails?.quotationDetails || {};
  const calc = qd.packageCalculations || {};
  const key = selectedPackageKey(quotation);
  return (
    toNum(calc?.[key]?.finalTotal) +
    sumBillableAdditionalServices(qd.additionalServices)
  );
};

const selectedTaxPercent = (quotation = {}) =>
  toNum(quotation?.tourDetails?.quotationDetails?.taxes?.taxPercent);

const selectedBaseAfterDiscount = (quotation = {}) => {
  const qd = quotation?.tourDetails?.quotationDetails || {};
  const calc = qd.packageCalculations || {};
  const key = selectedPackageKey(quotation);
  return toNum(calc?.[key]?.afterDiscount);
};

const mealPlanText = (mp) => {
  if (!mp) return "";
  const m = mp.toLowerCase();
  if (m.includes("cp")) return "CP Plan (Breakfast only)";
  if (m.includes("map")) return "MAP Plan (Breakfast + Dinner)";
  if (m.includes("ap")) return "AP Plan (All meals)";
  return mp;
};

const destinationLines = (destinations = []) =>
  (destinations || [])
    .map((d) => `${toNum(d?.nights)}N ${safe(d?.cityName, "Destination")}`)
    .join(", ");

const hotelLines = (destinations = [], packageKey = "standard") => {
  const keyMap = {
    standard: "standardHotels",
    deluxe: "deluxeHotels",
    superior: "superiorHotels",
  };
  const field = keyMap[packageKey] || keyMap.standard;
  return (destinations || [])
    .map((d, idx) => {
      const name = safe((d?.[field] || [])[0], "Hotel similar");
      return `${idx + 1}. ${name} in ${safe(d?.cityName, "City")}`;
    })
    .join("\n");
};

const itineraryLines = (itinerary = []) =>
  (itinerary || [])
    .map((d, idx) => {
      const title = safe(d?.dayTitle, `Day ${idx + 1}`);
      const note = safe(d?.dayNote, "");
      return `Day ${idx + 1}: ${title}\n${note}`;
    })
    .join("\n\n");

const policyLines = (arr = []) =>
  (arr || [])
    .map((x) => safe(x))
    .filter(Boolean)
    .join("\n");

const renderMoney = (n) => INR.format(toNum(n));

/**
 * Build a short "quotation sharing" email body.
 *
 * @param {object} quotation Full API quotation object
 * @param {object} customText Optional additional text blocks managed by frontend
 * @returns {string}
 */
export function buildCustomQuotationNormalEmail(quotation, customText = {}) {
  const td = quotation?.tourDetails || {};
  const qd = td?.quotationDetails || {};
  const room = qd?.rooms || {};
  const vehicle = td?.vehicleDetails || {};
  const pd = vehicle?.pickupDropDetails || {};
  const guests = guestSummary(qd);
  const duration = nightsAndDays(qd.destinations);
  const pkgKey = selectedPackageKey(quotation);
  const total = selectedFinalTotal(quotation);
  const taxPercent = selectedTaxPercent(quotation);
  const beforeTax = selectedBaseAfterDiscount(quotation);
  const taxAmount = Math.max(0, total - beforeTax);

  return [
    safe(customText.greeting, "Dear Sir/Ma'am,"),
    safe(customText.opening, "GREETING FROM ICONIC TRAVEL!!!"),
    safe(
      customText.intro,
      "As discussed, please find your tour package details below.",
    ),
    "",
    `Official Website: ${safe(customText.website, "https://www.iconictravel.in/")}`,
    "",
    `Quotation ID: ${safe(quotation?.quotationId, "N/A")}`,
    `Guest Name: ${safe(quotation?.clientDetails?.clientName, "Guest")}`,
    `Destination: ${destinationLines(qd.destinations)}`,
    `No. of Pax: ${guests.text}`,
    `No. of Room: ${toNum(room.numberOfRooms)} ${safe(room.sharingType, "")}`.trim(),
    `Pick Up Point: ${safe(pd.pickupLocation, "As per itinerary")}`,
    `Drop Point: ${safe(pd.dropLocation, "As per itinerary")}`,
    `Tour Duration: ${duration.nights} Nights ${duration.days} Days`,
    `Arrival Date: ${fmtDate(td.arrivalDate)}${pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""}`,
    `Departure Date: ${fmtDate(td.departureDate)}${pd.dropTime ? `, Time: ${pd.dropTime}` : ""}`,
    `Hotel Type: ${safe(room.roomType, "Standard")}`,
    `Meal Plan: ${mealPlanText(safe(qd.mealPlan, "CP Plan"))}`,
    `Transportation: ${safe(vehicle?.basicsDetails?.vehicleType, "As per itinerary")}`,
    "",
    `Package Cost (Before GST): INR ${renderMoney(beforeTax)}`,
    `GST (${taxPercent}%): INR ${renderMoney(taxAmount)}`,
    `Package Cost (Including GST): INR ${renderMoney(total)}`,
    "",
    "HOTEL NAMES/SIMILAR",
    hotelLines(qd.destinations, pkgKey),
    "",
    "DAY WISE ITINERARY",
    itineraryLines(td.itinerary),
    "",
    "COST EXCLUSIONS:",
    policyLines(qd?.policies?.exclusionPolicy || td?.policies?.exclusionPolicy),
    "",
    "TERMS & CONDITIONS:",
    safe(
      customText.termsUrl,
      "As per company website: https://iconicyatra.com/terms-conditions",
    ),
    "",
    "CANCELLATION POLICY:",
    policyLines(td?.policies?.cancellationPolicy),
    "",
    "PAYMENT POLICY:",
    policyLines(td?.policies?.paymentPolicy),
    "",
    safe(
      customText.closing,
      "We hope the above is clear. For any changes or clarifications, please reply on the same thread.",
    ),
    "",
    safe(
      customText.signature,
      "Warm Regards,\nReservation Team\nIconic Travel",
    ),
  ]
    .filter((x) => x !== undefined && x !== null)
    .join("\n");
}

/**
 * Build a booking-confirmation style email body.
 *
 * @param {object} quotation Full API quotation object
 * @param {object} customText Frontend text blocks (receivedAmount, dueAmount, dueDate, etc.)
 * @returns {string}
 */
export function buildCustomQuotationBookingEmail(quotation, customText = {}) {
  const td = quotation?.tourDetails || {};
  const qd = td?.quotationDetails || {};
  const room = qd?.rooms || {};
  const vehicle = td?.vehicleDetails || {};
  const pd = vehicle?.pickupDropDetails || {};
  const guests = guestSummary(qd);
  const duration = nightsAndDays(qd.destinations);
  const pkgKey = selectedPackageKey(quotation);
  const total = selectedFinalTotal(quotation);
  const taxPercent = selectedTaxPercent(quotation);
  const beforeTax = selectedBaseAfterDiscount(quotation);
  const taxAmount = Math.max(0, total - beforeTax);
  const receivedAmount = toNum(customText.receivedAmount);
  const dueAmount =
    customText.dueAmount !== undefined
      ? toNum(customText.dueAmount)
      : Math.max(0, total - receivedAmount);
  const nextPayableAmount = toNum(
    customText.nextPayableAmount !== undefined
      ? customText.nextPayableAmount
      : dueAmount,
  );
  const paymentDueDate = safe(
    customText.dueDate,
    safe(customText.paymentDueDate),
  );
  const companyName = safe(customText.companyName, "Iconic Travel");
  const companyWebsite = safe(
    customText.companyWebsite,
    "https://www.iconictravel.in/",
  );
  const termsUrl = safe(
    customText.companyTermsConditions,
    "https://www.iconictravel.in/terms-conditions",
  );

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
        
         <p style="color:#d32f2f; font-weight:bold;">DETAILS OF TOUR PACKAGE:</p>
        <p style="color:#000; font-weight:bold;">
            BOOKING ID: ${safe(customText.bookingId, quotation?.quotationId)}
        </p>
        
        <p><b>No. of Pax:</b> ${guests.text}</p>
        <p><b>No. of Room:</b> ${toNum(room.numberOfRooms)} ${safe(room.sharingType, "")}</p>
        <p><b>Transportation:</b> ${safe(vehicle?.basicsDetails?.vehicleType, "As per itinerary")}</p>
        <p><b>Tour Duration:</b> ${duration.nights} Nights ${duration.days} Days</p>
        <p><b>Arrival Date:</b> ${fmtDate(td.arrivalDate)}${pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""}</p>
        <p><b>Departure Date:</b> ${fmtDate(td.departureDate)}${pd.dropTime ? `, Time: ${pd.dropTime}` : ""}</p>
        <p><b>Pick Up Point:</b> ${safe(pd.pickupLocation, "As per itinerary")}</p>
        <p><b>Drop Point:</b> ${safe(pd.dropLocation, "As per itinerary")}</p>
        <p><b>Meal Plan:</b> ${mealPlanText(safe(qd.mealPlan, "CP Plan"))}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">PAYMENT STATUS:</p>
        <p><b>Package Cost (excluding GST):</b> INR ${renderMoney(beforeTax)}</p>
        <p><b>GST (${taxPercent}%):</b> INR ${renderMoney(taxAmount)}</p>
        <p><b>Package Cost (including GST):</b> INR ${renderMoney(total)}</p>
        <p><b>Payment received:</b> INR ${renderMoney(receivedAmount)}${
          customText.receivedDate ? ` (paid on ${customText.receivedDate})` : ""
        }</p>
        <p><b>Remaining payment:</b> INR ${renderMoney(dueAmount)}</p>
        <p><b>Next Payable Amount:</b> INR ${renderMoney(nextPayableAmount)}</p>
        ${paymentDueDate ? `<p><b>Payment Due Date:</b> ${paymentDueDate}</p>` : ""}
        <p style="color:#d32f2f; font-weight:bold;">Please clear your all dues as per the payment policy.</p>
        <p style="color:#2e7d32; font-weight:bold;">Kindly pay the next amount as per due date to avoid penalty or fine (10% on remaining amount).</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>HOTEL NAMES/SIMILAR</b></p>
        <p><b>${hotelLines(qd.destinations, pkgKey).replace(/\n/g, "<br/>")}</b></p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">DAY WISE ITINERARY</p>
        <p style="white-space:pre-wrap;">${itineraryLines(td.itinerary)}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
        <p>
            <b>As per company website - </b>
            <a href="${termsUrl}" target="_blank" style="color:#1976d2; font-weight:bold;">
                View Terms & Conditions
            </a>
        </p>
        <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
        <p style="white-space:pre-wrap;">${policyLines(td?.policies?.inclusionPolicy)}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
        <p style="white-space:pre-wrap;">${policyLines(td?.policies?.exclusionPolicy)}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
        <p style="white-space:pre-wrap;">${policyLines(td?.policies?.cancellationPolicy)}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
        <p style="white-space:pre-wrap;">${policyLines(td?.policies?.paymentPolicy)}</p>
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
