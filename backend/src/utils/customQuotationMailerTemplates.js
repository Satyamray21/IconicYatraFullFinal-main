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
    const quotationTitle=q?.tourDetails?.quotationTitle || {};
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

const bankHtmlSection = (bankDetails = []) => {
    if (!Array.isArray(bankDetails) || bankDetails.length === 0) return "";
    return `
        <br/>
        <p style="color:#d32f2f; font-weight:bold;">NET BANKING PAYMENT DETAILS:</p>
        ${bankDetails
            .map(
                (b, i) => `
                    <div style="margin-bottom:8px;">
                        <b>${i + 1}. ${safe(b?.bankName, "Bank")} (${safe(
                    b?.branchName,
                    "Branch"
                )})</b><br/>
                        Account Holder: ${safe(b?.accountHolderName, "-")}<br/>
                        Account Number: ${safe(b?.accountNumber, "-")}<br/>
                        IFSC: ${safe(b?.ifscCode, "-")}
                    </div>
                `
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
                    "Branch"
                )}) | A/C Holder: ${safe(
                    b?.accountHolderName,
                    "-"
                )} | A/C No: ${safe(b?.accountNumber, "-")} | IFSC: ${safe(
                    b?.ifscCode,
                    "-"
                )}`
        ),

        // ✅ FIXED (HTML as string)
        `<p>
            <span style="color:#d32f2f; font-weight:bold;">NOTE:</span>
            <span style="color:#2e7d32;">
                All cards are accepted here. You can now pay using Credit/Debit Cards (3% extra). 
                For more details, contact your Tour Expert.
            </span>
        </p>`

    ].join("\n");
};


/* =========================================================
   NORMAL QUOTATION EMAIL
========================================================= */
export const buildCustomQuotationNormalEmail = (
    quotation,
    customText = {},
    options = {}
) => {
    const td = quotation?.tourDetails || {};
    const qd = td?.quotationDetails || {};
    const rooms = qd?.rooms || {};
    const vehicle = td?.vehicleDetails || {};
    const pd = vehicle?.pickupDropDetails || {};
    const destinations = qd?.destinations || [];
    const termsandCondition=safe(options?.companyTermsConditions)
    const duration = nightsAndDays(destinations);
    const totals = packageTotals(quotation);
    const key = pkgKey(quotation);
    const companyName = safe(options?.companyName, "Iconic Travel");
    const companyWebsite=safe(options?.companyWebsite);
    const termsCombined = mergePolicies(
        
       
        toPolicyArray(options?.companyTermsConditions)
    );
    const paymentCombined = mergePolicies(
        toPolicyArray(td?.policies?.paymentPolicy),
        toPolicyArray(options?.globalPaymentPolicy)
    );
    const inclusionCombined = mergePolicies(
        toPolicyArray(td?.policies?.inclusionPolicy),
        toPolicyArray(options?.globalInclusions)
    );
    const exclusionCombined = mergePolicies(
        toPolicyArray(td?.policies?.exclusionPolicy),
        toPolicyArray(options?.globalExclusions)
    );
    const cancellationCombined = mergePolicies(
        toPolicyArray(td?.policies?.cancellationPolicy),
        toPolicyArray(options?.globalCancellationPolicy)
    );
    const bankDetails = options?.bankDetails || [];

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
            "As per discussed with you short while ago please see the below packages and let us know."
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
        
        

        <p><b>Destination:</b> ${
            td.quotationTitle
        }</p>

        <p><b>No. of Pax:</b> ${guestSummary(qd)}</p>

        <p><b>No. of Room:</b> ${toNum(rooms.numberOfRooms)} ${safe(
            rooms.sharingType,
            ""
        )}</p>
         <p><b>Transportation:</b> ${safe(
            vehicle?.basicsDetails?.vehicleType,
            "As per itinerary"
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

        <br/>

        <p style="color:#d32f2f; font-weight:bold;"><b>HOTEL NAMES/SIMILAR</b></p>
        <p><b>${hotelLines(destinations, key).replace(/\n/g, "<br/>")}</b></p>

        <br/>

        <p style="color:#d32f2f; font-weight:bold;">
    DAY WISE ITINERARY
</p>

<div>
    ${itineraryLines(td?.itinerary)}
</div>


        <br/>
         <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
        <p>
    <b>As per company website - </b>
    <a href="${termsandCondition}" target="_blank" style="color:#1976d2; font-weight:bold;">
        View Terms & Conditions
    </a>
</p>
        <p style="color:#d32f2f; font-weight:bold;" ><b>INCLUSIONS:</b></p>
        <p>${policyLines(inclusionCombined).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
        <p>${policyLines(cancellationCombined).replace(/\n/g, "<br/>")}</p>

        <br/>

        <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
        <p>${policyLines(paymentCombined).replace(/\n/g, "<br/>")}</p>

        <br/>

       


        ${bankHtmlSection(bankDetails)}
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
                `Warm Regards<br/>Reservation Team<br/>${companyName}`
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
    const rooms = qd?.rooms || {};
    const vehicle = td?.vehicleDetails || {};
    const pd = vehicle?.pickupDropDetails || {};
    const destinations = qd?.destinations || [];
    const termsandCondition = safe(customText?.companyTermsConditions);
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
        safe(customText.paymentDueDate)
    );
    const bankDetails = customText?.bankDetails || [];
    const paymentCombined = mergePolicies(
        toPolicyArray(td?.policies?.paymentPolicy),
        toPolicyArray(customText.globalPaymentPolicy)
    );
    const inclusionCombined = mergePolicies(
        toPolicyArray(td?.policies?.inclusionPolicy),
        toPolicyArray(customText.globalInclusions)
    );
    const exclusionCombined = mergePolicies(
        toPolicyArray(td?.policies?.exclusionPolicy),
        toPolicyArray(customText.globalExclusions)
    );
    const cancellationCombined = mergePolicies(
        toPolicyArray(td?.policies?.cancellationPolicy),
        toPolicyArray(customText.globalCancellationPolicy)
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
            `Thank you for choosing ${companyName}. Your booking has been confirmed.`
        )}</p>
        <p style="color:#000;">
            <b>Official Website Visit @</b> <br/>
            <a href="${companyWebsite}" target="_blank" style="font-weight:bold; color:#1976d2; text-decoration:none;">
                ${companyWebsite}
            </a>
        </p>
        <p style="color:#d32f2f; font-weight:bold;">
            BOOKING ID: ${safe(customText.bookingId, quotation?.quotationId)}
        </p>
        <p style="color:#d32f2f; font-weight:bold;">
            ##PACKAGE COST FOR ALL PERSON = INR ${INR.format(total)} As of now
        </p>
        <p style="color:#d32f2f; font-weight:bold;">DETAILS OF TOUR PACKAGE:</p>
        <p><b>Destination:</b> ${td.quotationTitle}</p>
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
        <p><b>Package Cost (excluding GST):</b> INR ${INR.format(beforeTax)}</p>
        <p><b>GST (${taxPercent}%):</b> INR ${INR.format(taxAmount)}</p>
        <p><b>Package Cost (including GST):</b> INR ${INR.format(total)}</p>
        <p><b>Received from client:</b> INR ${INR.format(receivedAmount)}${customText.receivedDate ? ` (paid on ${customText.receivedDate})` : ""}</p>
        <p><b>Balance due:</b> INR ${INR.format(dueAmount)}</p>
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
        <p style="color:#d32f2f; font-weight:bold;"><b>TERMS & CONDITIONS:</b></p>
        <p>
            <b>As per company website - </b>
            <a href="${termsandCondition}" target="_blank" style="color:#1976d2; font-weight:bold;">
                View Terms & Conditions
            </a>
        </p>
        <p style="color:#d32f2f; font-weight:bold;"><b>INCLUSIONS:</b></p>
        <p>${policyLines(inclusionCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>EXCLUSIONS:</b></p>
        <p>${policyLines(exclusionCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>CANCELLATION POLICY:</b></p>
        <p>${policyLines(cancellationCombined).replace(/\n/g, "<br/>")}</p>
        <br/>
        <p style="color:#d32f2f; font-weight:bold;"><b>PAYMENT POLICY:</b></p>
        <p>${policyLines(paymentCombined).replace(/\n/g, "<br/>")}</p>
        ${bankHtmlSection(bankDetails)}
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
                `Warm Regards<br/>Reservation Team<br/>${companyName}`
            ).replace(/\n/g, "<br/>")}
        </p>
    </div>
    `;
}
