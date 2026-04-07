const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

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
    return `${total} Pax (${adults} Adults, ${children} Children, ${kids} Kids, ${infants} Infants)`;
};

const pkgKey = (q = {}) => {
    const p = safe(q.finalizedPackage, "").toLowerCase();
    return ["standard", "deluxe", "superior"].includes(p) ? p : "standard";
};

const packageTotals = (q = {}) => {
    const qd = q?.tourDetails?.quotationDetails || {};
    const calc = qd.packageCalculations || {};
    const key = pkgKey(q);
    const total = toNum(calc?.[key]?.finalTotal);
    const beforeTax = toNum(calc?.[key]?.afterDiscount);
    const taxPercent = toNum(qd?.taxes?.taxPercent);
    return { total, beforeTax, taxPercent, taxAmount: Math.max(0, total - beforeTax) };
};

const hotelLines = (destinations = [], key = "standard") => {
    const map = { standard: "standardHotels", deluxe: "deluxeHotels", superior: "superiorHotels" };
    const field = map[key] || map.standard;
    return (destinations || [])
        .map((d, i) => `${i + 1}. ${safe((d?.[field] || [])[0], "Hotel similar")} in ${safe(d?.cityName, "City")}`)
        .join("\n");
};

const itineraryLines = (itinerary = []) =>
    (itinerary || [])
        .map((d, i) => `Day ${i + 1}: ${safe(d?.dayTitle, `Day ${i + 1}`)}\n${safe(d?.dayNote, "")}`)
        .join("\n\n");

const policyLines = (arr = []) =>
    (arr || []).map((x) => safe(x)).filter(Boolean).join("\n");

export const buildCustomQuotationNormalEmail = (quotation, customText = {}) => {
    const td = quotation?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const rooms = qd?.rooms || {};
    const vehicle = td?.vehicleDetails || {};
    const pd = vehicle?.pickupDropDetails || {};
    const destinations = qd?.destinations || [];
    const nights = destinations.reduce((s, d) => s + toNum(d?.nights), 0);
    const totals = packageTotals(quotation);
    const key = pkgKey(quotation);

    return [
        safe(customText.greeting, "Dear Sir/Ma'am,"),
        safe(customText.opening, "GREETING FROM ICONIC TRAVEL!!!"),
        safe(customText.intro, "As discussed, please find your package details below."),
        "",
        `Quotation ID: ${safe(quotation?.quotationId, "N/A")}`,
        `Guest Name: ${safe(quotation?.clientDetails?.clientName, "Guest")}`,
        `Destination: ${(destinations || []).map((d) => `${toNum(d?.nights)}N ${safe(d?.cityName, "City")}`).join(", ")}`,
        `No. of Pax: ${guestSummary(qd)}`,
        `No. of Room: ${toNum(rooms.numberOfRooms)} ${safe(rooms.sharingType, "")}`.trim(),
        `Pick Up Point: ${safe(pd.pickupLocation, "As per itinerary")}`,
        `Drop Point: ${safe(pd.dropLocation, "As per itinerary")}`,
        `Tour Duration: ${nights} Nights ${nights + 1} Days`,
        `Arrival Date: ${fmtDate(td.arrivalDate)}${pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""}`,
        `Departure Date: ${fmtDate(td.departureDate)}${pd.dropTime ? `, Time: ${pd.dropTime}` : ""}`,
        `Hotel Type: ${safe(rooms.roomType, "Standard")}`,
        `Meal Plan: ${safe(qd.mealPlan, "CP Plan")}`,
        `Transportation: ${safe(vehicle?.basicsDetails?.vehicleType, "As per itinerary")}`,
        "",
        `Package Cost (excluding GST): INR ${INR.format(totals.beforeTax)}`,
        `GST (${totals.taxPercent}%): INR ${INR.format(totals.taxAmount)}`,
        `Package Cost (including GST): INR ${INR.format(totals.total)}`,
        "",
        "HOTEL NAMES/SIMILAR",
        hotelLines(destinations, key),
        "",
        "DAY WISE ITINERARY",
        itineraryLines(td?.itinerary),
        "",
        "INCLUSIONS:",
        policyLines(td?.policies?.inclusionPolicy),
        "",
        "EXCLUSIONS:",
        policyLines(td?.policies?.exclusionPolicy),
        "",
        "CANCELLATION POLICY:",
        policyLines(td?.policies?.cancellationPolicy),
        "",
        "PAYMENT POLICY:",
        policyLines(td?.policies?.paymentPolicy),
        "",
        safe(customText.signature, "Warm Regards\nReservation Team\nIconic Travel"),
    ].join("\n");
};

export const buildCustomQuotationBookingEmail = (quotation, customText = {}) => {
    const td = quotation?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const totals = packageTotals(quotation);
    const received = toNum(customText.receivedAmount);
    const due = customText.dueAmount !== undefined ? toNum(customText.dueAmount) : Math.max(0, totals.total - received);
    const next = customText.nextPayableAmount !== undefined ? toNum(customText.nextPayableAmount) : due;

    return [
        `Dear ${safe(quotation?.clientDetails?.clientName, "Guest")},`,
        safe(customText.intro, "Thank you for choosing Iconic Travel. Your booking details are below."),
        "",
        `Booking Id: ${safe(customText.bookingId, quotation?.quotationId)}`,
        `Package: ${safe(td?.quotationTitle, "Tour Package")}`,
        `Guest Name: ${safe(quotation?.clientDetails?.clientName, "Guest")}`,
        `Persons: ${guestSummary(qd)}`,
        `Date of Journey: ${fmtDate(td?.arrivalDate)}`,
        `Tour End Date: ${fmtDate(td?.departureDate)}`,
        "",
        `Package Cost (excluding GST): INR ${INR.format(totals.beforeTax)}`,
        `GST (${totals.taxPercent}%): INR ${INR.format(totals.taxAmount)}`,
        `Package Cost (including GST): INR ${INR.format(totals.total)}`,
        "",
        `Payment received: INR ${INR.format(received)}`,
        `Remaining payment: INR ${INR.format(due)}`,
        `Next Payable Amount: INR ${INR.format(next)}`,
        customText.dueDate ? `Payment Due Date: ${customText.dueDate}` : "",
        "",
        safe(customText.signature, "Warm Regards\nReservation Team\nIconic Travel"),
    ]
        .filter(Boolean)
        .join("\n");
};

