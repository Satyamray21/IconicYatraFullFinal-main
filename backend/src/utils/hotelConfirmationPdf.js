import PDFDocument from "pdfkit";

export const buildHotelConfirmationPdf = async (quotation, options = {}) => {
  const companyName = options.companyName || "Iconic Travel";
  const companyMobile = options.companyMobile || "+91-8130883907";
  const companyEmail = options.companyEmail || "info@iconictravel.in";
  const companyWebsite = options.companyWebsite || "www.iconictravel.in";
  const companyAddress = options.companyAddress || "Noida, Uttar Pradesh";

  const guestName = quotation?.clientDetails?.clientName || quotation?.customerName || "Guest";
  const bookingId = quotation?.quotationId || quotation?.quickQuotationId || "Booking Id";

  const packageTitle = options.packageTitle || `${quotation?.tourDetails?.quotationTitle || "Tour Package"} ${options.duration?.nights || 0} Nights ${options.duration?.days || 0} Days`;
  const destinationSummary = options.destinationSummary || `(${quotation?.tourDetails?.destinationSummary || ""})`;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // --- Header / Greeting ---
      doc.fillColor("#ff0000").fontSize(14).font("Helvetica-Bold").text(`Dear ${guestName},`, { continued: false });
      doc.fillColor("#000000").fontSize(11).font("Helvetica").text(`Thank you for choosing ${companyName}, we are pleased to inform you to start planning your way for the following to be confirmed successfully.`);
      doc.moveDown(1);

      // --- Package Title ---
      doc.fillColor("#ff0000").fontSize(13).font("Helvetica-Bold").text(packageTitle);
      doc.fillColor("#000000").fontSize(11).font("Helvetica").text(destinationSummary);

      const stayLocations = options.stayLocations || [];
      if (stayLocations.length > 0) {
        const stayText = `(${stayLocations.map(loc => `${loc.city || loc.cityName} ${loc.nights}N`).join(", ")})`;
        doc.fillColor("#000000").fontSize(10).font("Helvetica").text(stayText);
      }

      doc.moveDown(1);

      // --- Inclusions Section ---
      doc.fillColor("#ff0000").fontSize(13).font("Helvetica-Bold").text("INCLUSIONS OF PACKAGE:");

      const startY = doc.y + 5;
      const col1 = 40;
      const col2 = 160;
      const rowHeight = 16;

      const details = [
        ["Guest Name -", guestName],
        ["Booking Id -", bookingId],
        ["Persons-", options.guestsLine || `${quotation.adults || 0} Adults, ${quotation.children || 0} Child`],
        ["No of Rooms-", options.roomsLine || "01 Double Sharing"],
        ["Package Type -", options.packageType || "Family Tour Package"],
        ["Duration-", `${options.duration?.nights || 0} Nights ${options.duration?.days || 0} Days`],
        ["Date of Journey-", `${options.startDate || "standard**"}, Time - standard**`],
        ["Tour End Date-", `${options.endDate || "standard**"}, Time - standard**`],
        ["Pick Up Point-", options.pickupPoint || "Siliguri Airport/Railway Station**"],
        ["Drop Point -", options.dropPoint || "Siliguri Airport/Railway Station**"],
        ["Meal Plan -", options.mealPlan || "CPI Plan (Breakfast only)"],
      ];

      details.forEach(([label, value], i) => {
        doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold").text(label, col1, startY + i * rowHeight);
        doc.font("Helvetica").text(value, col2, startY + i * rowHeight);
      });



      // --- Final Hotel Names ---
      doc.fillColor("#2e7d32").fontSize(13).font("Helvetica-Bold").text("FINAL HOTEL NAMES WITH CONFIRMATION", { align: "left" });
      doc.moveDown(1);

      const confirmedHotels = quotation.confirmedHotels || [];
      confirmedHotels.forEach((h, i) => {
        if (doc.y > 700) doc.addPage();

        doc.fillColor("#ff0000").fontSize(12).font("Helvetica-Bold").text(`${i + 1}: ${h.hotelName} in ${h.city} (${h.nights || 1} Night)`);

        const hStartY = doc.y + 2;
        const hCol1 = 40;
        const hCol2 = 160;
        const hRowH = 14;

        const hDetails = [
          ["Address -", h.hotelAddress || "N/A"],
          ["Guest Name -", guestName],
          ["Person-", options.guestsLine || "N/A"],
          ["Rooms-", options.roomsLine || "N/A"],
          ["Booking PNR -", `${companyName} (for Confirmation)`],
          ["Check-in Date -", h.checkInDate || "Standard"],
          ["Check Out Date -", h.checkOutDate || "Standard"],
          ["Room Type-", h.roomType || "Standard"],
          ["Contact No-", `${h.contactNo || "N/A"} (Manager)`],
        ];

        hDetails.forEach(([label, value], j) => {
          doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold").text(label, hCol1, hStartY + j * hRowH);
          doc.font("Helvetica").text(value, hCol2, hStartY + j * hRowH);
        });

        doc.y = hStartY + hDetails.length * hRowH + 15;
      });

      // --- Child Policy / Notes ---
      if (doc.y > 650) doc.addPage();
      doc.moveDown(1);
      doc.fillColor("#ff0000").fontSize(12).font("Helvetica-Bold").text("Child Policy- ", { continued: true });
      doc.fillColor("#000000").font("Helvetica").text("Above 05y Childs are payable and this depends on the hotel if they charge or not if not included in room sharing.");

      doc.moveDown(1);
      doc.fillColor("#ff0000").fontSize(11).font("Helvetica-Bold").text("NOTE ", { continued: true });
      doc.fillColor("#000000").font("Helvetica").text("- ALL AMENDMENTS ARE PAYABLE BY GUEST WHEN RESERVATION TEAM WILL SENT TO YOU.");

      doc.moveDown(1);
      doc.fillColor("#ff0000").fontSize(11).font("Helvetica-Bold").text("NOTE- ", { continued: true });
      doc.fillColor("#000000").font("Helvetica").text("if any hotels do not provide Meals Breakfast/Lunch/Dinner, which are given in your booking then we will provide refunds as per company policy and If any Extra Meals provided by hotel then charges applicable & payable by guest to the company with GST (5%) extra. Thanks");

      // --- Footer ---
      doc.moveDown(2);
      doc.fillColor("#ff0000").fontSize(12).font("Helvetica-Bold").text("Warm & Regards,");
      doc.text(companyName);
      doc.text("Reservation Team");

      doc.fillColor("#000000").font("Helvetica-Bold").text("Mobile: ", { continued: true });
      doc.font("Helvetica").text(`${companyMobile} (WhatsApp)`);

      doc.fillColor("#000000").font("Helvetica-Bold").text("Website: ", { continued: true });
      doc.fillColor("#0000ff").font("Helvetica").text(companyWebsite, { link: companyWebsite, underline: true });

      doc.moveDown(1);
      doc.fillColor("#ff0000").fontSize(11).font("Helvetica-Bold").text("Reg. Address & Corporate Office: ", { continued: true });
      doc.fillColor("#000000").font("Helvetica-Bold").text(companyAddress);

      doc.moveDown(2);
      doc.fillColor("#2e7d32").fontSize(13).font("Helvetica-Bold").text(`THANK YOU FOR CHOOSING ${companyName.toUpperCase()}!!!`, { align: "left" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
