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

const renderMoney = (n) => INR.format(toNum(n));

/**
 * Build a plain text summary for WhatsApp sharing
 *
 * @param {object} invoice Full API invoice object
 * @param {object} customText Optional additional text blocks
 * @returns {string}
 */
export function buildInvoiceWhatsAppText(invoice, customText = {}) {
  const invoiceNo = safe(invoice?.invoiceNo, "N/A");
  const clientName = safe(invoice?.billingName, "Guest");
  const total = toNum(invoice?.totalAmount);
  const received = toNum(invoice?.receivedAmount);
  const balance = toNum(invoice?.balanceAmount);

  return [
    safe(customText.greeting, "Dear Sir/Ma'am,"),
    safe(customText.opening, "GREETING FROM ICONIC TRAVEL!!!"),
    safe(
      customText.intro,
      "As discussed, please find your invoice details below."
    ),
    "",
    `Official Website: ${safe(customText.website, "https://www.iconictravel.in/")}`,
    "",
    `Invoice No: ${invoiceNo}`,
    `Guest Name: ${clientName}`,
    `Tour Description: ${safe(invoice?.description, "N/A")}`,
    `No. of Pax: ${safe(invoice?.noOfPax, "N/A")}`,
    `Tour Type: ${safe(invoice?.tourType, "N/A")}`,
    `Start Date: ${fmtDate(invoice?.startDate)}`,
    `Return Date: ${fmtDate(invoice?.returnDate)}`,
    `Starting Point: ${safe(invoice?.startingPoint, "N/A")}`,
    `Drop Point: ${safe(invoice?.dropPoint, "N/A")}`,
    `Cab Type: ${safe(invoice?.cabType, "N/A")}`,
    "",
    `Total Invoice Amount: INR ${renderMoney(total)}`,
    `Received Amount: INR ${renderMoney(received)}`,
    `Balance Amount: INR ${renderMoney(balance)}`,
    "",
    "TERMS & CONDITIONS:",
    safe(
      customText.termsUrl,
      "As per company website: https://iconicyatra.com/terms-conditions"
    ),
    "",
    safe(
      customText.closing,
      "We hope the above is clear. For any changes or clarifications, please reply on the same thread."
    ),
    "",
    safe(
      customText.signature,
      "Warm Regards,\nAccounts Team\nIconic Travel"
    ),
  ]
    .filter((x) => x !== undefined && x !== null)
    .join("\n");
}

/**
 * Build an HTML email body for sending the Invoice
 *
 * @param {object} invoice Full API invoice object
 * @param {object} customText Frontend text blocks
 * @returns {string}
 */
export function buildInvoiceEmailHtml(invoice, customText = {}) {
  const invoiceNo = safe(invoice?.invoiceNo, "N/A");
  const clientName = safe(invoice?.billingName, "Guest");
  const total = toNum(invoice?.totalAmount);
  const received = toNum(invoice?.receivedAmount);
  const balance = toNum(invoice?.balanceAmount);
  const companyName = safe(customText.companyName, "Iconic Travel");
  const termsUrl = safe(
    customText.companyTermsConditions,
    "https://www.iconictravel.in/terms-conditions"
  );

  return `
    <div style="font-family: 'Georgia', serif; font-size:15px; color:#333; line-height:1.6;">
        <style>
            p { margin: 4px 0; }
        </style>

        <p style="color:#003366; font-weight:bold; font-size: 16px;">
            ${safe(customText.greeting, `Dear ${clientName},`)}
        </p>

        <p style="color:#003366; font-weight:bold; font-size: 18px;">
            ${safe(customText.opening, `INVOICE FROM ${companyName.toUpperCase()}!!!`)}
        </p>

        <p>${safe(
          customText.intro,
          `Please find attached your invoice for the recent tour/services. We appreciate your business.`
        )}</p>
        
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 16px; border-bottom: 2px solid #003366; display: inline-block;">DETAILS OF INVOICE:</p>
        <p style="color:#000; font-weight:bold;">
            INVOICE NO: ${invoiceNo}
        </p>
        
        <p><b>Tour Description:</b> ${safe(invoice?.description, "N/A")}</p>
        <p><b>No. of Pax:</b> ${safe(invoice?.noOfPax, "N/A")}</p>
        <p><b>Cab Type:</b> ${safe(invoice?.cabType, "N/A")}</p>
        <p><b>Start Date:</b> ${fmtDate(invoice?.startDate)}</p>
        <p><b>Return Date:</b> ${fmtDate(invoice?.returnDate)}</p>
        <p><b>Starting Point:</b> ${safe(invoice?.startingPoint, "N/A")}</p>
        <p><b>Drop Point:</b> ${safe(invoice?.dropPoint, "N/A")}</p>
        <br/>
        
        <p style="color:#003366; font-weight:bold; font-size: 16px; border-bottom: 2px solid #003366; display: inline-block;">PAYMENT SUMMARY:</p>
        <p><b>Total Invoice Amount:</b> INR ${renderMoney(total)}</p>
        <p><b>Received Amount:</b> INR ${renderMoney(received)}</p>
        <p><b>Balance Amount:</b> INR ${renderMoney(balance)}</p>
        <br/>
        
        <p style="color:#003366; font-weight:bold; font-size: 16px; border-bottom: 2px solid #003366; display: inline-block;">TERMS & CONDITIONS:</p>
        <p>
            <b>As per company website - </b>
            <a href="${termsUrl}" target="_blank" style="color:#1976d2; font-weight:bold;">
                View Terms & Conditions
            </a>
        </p>
        ${customText.bankDetails ? `
        <br/>
        <p style="color:#003366; font-weight:bold; font-size: 15px; border-bottom: 2px solid #003366; display: inline-block;">NET BANKING PAYMENT DETAILS:</p>
        <div style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #003366;">
            <p style="white-space:pre-wrap; margin:0;">${customText.bankDetails}</p>
        </div>
        ` : ''}
        <br/>
        <div>
            ${customText.signature ? customText.signature : `<p>Warm Regards<br/>Accounts Team<br/>${companyName}</p>`}
        </div>
    </div>
    `;
}
