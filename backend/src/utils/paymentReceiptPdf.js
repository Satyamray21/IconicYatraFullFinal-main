import PDFDocument from "pdfkit";

/**
 * Generates a Payment Receipt PDF using pdfkit
 * @param {Object} voucher - The voucher document from MongoDB
 * @param {Object} company - The company document
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const buildPaymentReceiptPdf = async (voucher, company = {}) => {
  const companyName = company.companyName || "Iconic Yatra";
  const companyAddress = company.address || "";
  const companyPhone = company.phone || "";
  const companyEmail = company.email || "";
  const companyGstin = company.gstin || "";

  const partyName = voucher.partyName || "N/A";
  const amount = voucher.amount || 0;
  const date = voucher.date ? new Date(voucher.date).toLocaleDateString("en-GB") : "N/A";
  const receiptNo = voucher.invoiceId || voucher.receiptNumber || "N/A";
  const paymentMode = voucher.paymentMode || "N/A";
  const reference = voucher.referenceNumber || "N/A";
  const particulars = voucher.particulars || "";
  const drCr = voucher.drCr || (voucher.paymentType === "Receive Voucher" ? "Cr" : "Dr");

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // --- Header ---
      doc.fillColor("#1a237e").fontSize(20).font("Helvetica-Bold").text(companyName, { align: "center" });
      doc.fillColor("#444").fontSize(10).font("Helvetica").text(companyAddress, { align: "center" });
      doc.text(`Phone: ${companyPhone} | Email: ${companyEmail}`, { align: "center" });
      if (companyGstin) doc.text(`GSTIN: ${companyGstin}`, { align: "center" });
      
      doc.moveDown(1);
      doc.strokeColor("#1a237e").lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // --- Receipt Title ---
      doc.fillColor("#1a237e").fontSize(16).font("Helvetica-Bold").text("PAYMENT RECEIPT", { align: "center", underline: true });
      doc.moveDown(1);

      // --- Receipt Details Grid ---
      const startY = doc.y;
      doc.fillColor("#000").fontSize(11).font("Helvetica-Bold");
      
      // Left Column
      doc.text("Receipt No:", 50, startY);
      doc.font("Helvetica").text(receiptNo, 130, startY);
      
      doc.font("Helvetica-Bold").text("Date:", 50, startY + 20);
      doc.font("Helvetica").text(date, 130, startY + 20);

      // Right Column
      doc.font("Helvetica-Bold").text("Type:", 350, startY);
      doc.font("Helvetica").text(voucher.paymentType || "N/A", 430, startY);

      doc.font("Helvetica-Bold").text("Dr/Cr:", 350, startY + 20);
      doc.font("Helvetica").text(drCr, 430, startY + 20);

      doc.moveDown(2);

      // --- Main Content Box ---
      const boxTop = doc.y;
      doc.rect(50, boxTop, 495, 150).stroke();
      
      doc.font("Helvetica-Bold").text("Received With Thanks From:", 60, boxTop + 15);
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a237e").text(partyName, 60, boxTop + 35);
      
      doc.fillColor("#000").fontSize(11).font("Helvetica-Bold").text("A Sum of Rupees:", 60, boxTop + 65);
      doc.font("Helvetica").text(`INR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 160, boxTop + 65);

      doc.font("Helvetica-Bold").text("Payment Mode:", 60, boxTop + 85);
      doc.font("Helvetica").text(paymentMode, 160, boxTop + 85);

      if (reference && reference !== "N/A") {
        doc.font("Helvetica-Bold").text("Reference No:", 60, boxTop + 105);
        doc.font("Helvetica").text(reference, 160, boxTop + 105);
      }

      doc.font("Helvetica-Bold").text("Particulars:", 60, boxTop + 125);
      doc.font("Helvetica").text(particulars, 160, boxTop + 125, { width: 370 });

      doc.moveDown(4);

      // --- Amount Box and Signature ---
      const finalY = doc.y + 20;
      
      // Amount in figures
      doc.rect(50, finalY, 150, 40).fillAndStroke("#f5f5f5", "#1a237e");
      doc.fillColor("#1a237e").fontSize(14).font("Helvetica-Bold").text(`₹ ${amount.toLocaleString("en-IN")}/-`, 60, finalY + 12);

      // Signature area
      doc.fillColor("#000").fontSize(11).font("Helvetica-Bold").text("For " + companyName, 350, finalY);
      doc.moveDown(3);
      doc.text("Authorized Signatory", 350, doc.y, { underline: true });

      // Footer Note
      doc.fontSize(9).font("Helvetica").fillColor("#777").text("This is a computer generated receipt and does not require a physical signature.", 50, 750, { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
