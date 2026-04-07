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
        0
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
                    "City"
                )}`
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
            `
        )
        .join("");


const policyLines = (arr = []) =>
    (arr || []).map((x) => safe(x)).filter(Boolean).join("\n");

/* =========================================================
   NORMAL QUOTATION EMAIL
========================================================= */
export const buildCustomQuotationNormalEmail = (quotation, customText = {}) => {
    const td = quotation?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const rooms = qd?.rooms || {};
    const vehicle = td?.vehicleDetails || {};
    const pd = vehicle?.pickupDropDetails || {};
    const destinations = qd?.destinations || [];

    const duration = nightsAndDays(destinations);
    const totals = packageTotals(quotation);
    const key = pkgKey(quotation);

    return `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#333; line-height:1.6;">

        <p style="color:red; font-weight:bold;">
            ${safe(customText.greeting, "Dear Sir/Ma'am,")}
        </p>

        <p style="color:red; font-weight:bold;">
    ${safe(customText.opening, "GREETING FROM ICONIC TRAVEL!!!")}
</p>


        <p>${safe(
            customText.intro,
            "As per discussed with you short while ago please see the below packages and let us know."
        )}</p>

        <br/>

        <p><b>Quotation ID:</b> ${safe(quotation?.quotationId, "N/A")}</p>
        <p><b>Guest Name:</b> ${safe(quotation?.clientDetails?.clientName, "Guest")}</p>

        <p><b>Destination:</b> ${
            (destinations || [])
                .map((d) => `${toNum(d?.nights)}N ${safe(d?.cityName, "City")}`)
                .join(", ")
        }</p>

        <p><b>No. of Pax:</b> ${guestSummary(qd)}</p>

        <p><b>No. of Room:</b> ${toNum(rooms.numberOfRooms)} ${safe(
            rooms.sharingType,
            ""
        )}</p>

        <p><b>Pick Up Point:</b> ${safe(pd.pickupLocation, "As per itinerary")}</p>
        <p><b>Drop Point:</b> ${safe(pd.dropLocation, "As per itinerary")}</p>

        <p><b>Tour Duration:</b> ${duration.nights} Nights ${duration.days} Days</p>

        <p><b>Arrival Date:</b> ${fmtDate(td.arrivalDate)} ${
            pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""
        }</p>

        <p><b>Departure Date:</b> ${fmtDate(td.departureDate)} ${
            pd.dropTime ? `, Time: ${pd.dropTime}` : ""
        }</p>

        <p><b>Hotel Type:</b> ${safe(rooms.roomType, "Standard")}</p>
        <p><b>Meal Plan:</b> ${safe(qd.mealPlan, "CP Plan")}</p>

        <p><b>Transportation:</b> ${safe(
            vehicle?.basicsDetails?.vehicleType,
            "As per itinerary"
        )}</p>

        <br/>

        <p><b>Package Cost (excluding GST):</b> INR ${INR.format(totals.beforeTax)}</p>
        <p><b>GST (${totals.taxPercent}%):</b> INR ${INR.format(totals.taxAmount)}</p>
        <p><b>Package Cost (including GST):</b> <b>INR ${INR.format(totals.total)}</b></p>

        <br/>

        <p><b>HOTEL NAMES/SIMILAR</b></p>
        <p>${hotelLines(destinations, key).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p style="color:#d32f2f; font-weight:bold;">
    DAY WISE ITINERARY
</p>

<div>
    ${itineraryLines(td?.itinerary)}
</div>


        <br/>

        <p><b>INCLUSIONS:</b></p>
        <p>${policyLines(td?.policies?.inclusionPolicy).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p><b>EXCLUSIONS:</b></p>
        <p>${policyLines(td?.policies?.exclusionPolicy).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p><b>CANCELLATION POLICY:</b></p>
        <p>${policyLines(td?.policies?.cancellationPolicy).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p><b>PAYMENT POLICY:</b></p>
        <p>${policyLines(td?.policies?.paymentPolicy).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p>
            ${safe(
                customText.signature,
                "Warm Regards<br/>Reservation Team<br/>Iconic Travel"
            ).replace(/\n/g, "<br/>")}
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
    const room = qd?.rooms || {};
    const vehicle = td?.vehicleDetails || {};
    const pd = vehicle?.pickupDropDetails || {};

    const guests = guestSummary(qd);
    const duration = nightsAndDays(qd.destinations);

    const pkgKeyVal = pkgKey(quotation);
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

    return [
        `Dear ${safe(quotation?.clientDetails?.clientName, "Guest")},`,

        safe(
            customText.thankYou,
            "Thank you for choosing Iconic Travel. Your package details are shared below."
        ),

        "",
        `${safe(td.quotationTitle, "Tour Package")}`,
        "",

        "DETAILS OF PACKAGE:",
        `Guest Name: ${safe(quotation?.clientDetails?.clientName, "Guest")}`,
        `Booking Id: ${safe(customText.bookingId, quotation?.quotationId)}`,
        `Persons: ${guests}`,
        `No. of Rooms: ${toNum(room.numberOfRooms)} ${safe(
            room.sharingType,
            ""
        )}`.trim(),
        `Transportation: ${safe(
            vehicle?.basicsDetails?.vehicleType,
            "As per itinerary"
        )}`,
        `Package Type: ${safe(customText.packageType, "Family Tour Package")}`,
        `Duration: ${duration.nights} Nights ${duration.days} Days`,
        `Date of Journey: ${fmtDate(td.arrivalDate)}${
            pd.pickupTime ? `, Time: ${pd.pickupTime}` : ""
        }`,
        `Tour End Date: ${fmtDate(td.departureDate)}${
            pd.dropTime ? `, Time: ${pd.dropTime}` : ""
        }`,
        `Pick Up Point: ${safe(pd.pickupLocation, "As per itinerary")}`,
        `Drop Point: ${safe(pd.dropLocation, "As per itinerary")}`,
        `Meal Plan: ${safe(qd.mealPlan, "CP Plan")}`,

        "",
        `Package Cost (excluding GST): INR ${INR.format(beforeTax)}`,
        `GST (${taxPercent}%): INR ${INR.format(taxAmount)}`,
        `Package Cost (including GST): INR ${INR.format(total)}`,

        "",
        `Payment received: INR ${INR.format(receivedAmount)}${
            customText.receivedDate
                ? ` (paid on ${customText.receivedDate})`
                : ""
        }`,
        `Remaining payment: INR ${INR.format(dueAmount)}`,
        `Next Payable Amount: INR ${INR.format(nextPayableAmount)}`,
        customText.dueDate ? `Payment Due Date: ${customText.dueDate}` : "",

        "",
        "INCLUSIONS OF TOUR:",
        policyLines(td?.policies?.inclusionPolicy),

        "",
        "HOTEL NAMES/SIMILAR",
        hotelLines(qd.destinations, pkgKeyVal),

        "",
        "DAY WISE ITINERARY",
        itineraryLines(td.itinerary),

        "",
        "COST EXCLUSIONS:",
        policyLines(td?.policies?.exclusionPolicy),

        "",
        "CANCELLATION POLICY:",
        policyLines(td?.policies?.cancellationPolicy),

        "",
        "PAYMENT POLICY:",
        policyLines(td?.policies?.paymentPolicy),

        "",
        safe(
            customText.footer,
            "For any support or update, please reply on this email thread."
        ),

        "",
        safe(
            customText.signature,
            "Warm Regards,\nReservation Team\nIconic Travel"
        ),
    ]
        .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
        .join("\n");
}
