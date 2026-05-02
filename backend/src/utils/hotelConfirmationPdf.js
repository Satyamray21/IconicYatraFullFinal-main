import PDFDocument from "pdfkit";

export const buildHotelConfirmationPdf = async (quotation, options = {}) => {
  const companyName = options.companyName || "Iconic Travel";
  const companyMobile = options.phone || options.companyMobile || "8130883907";
  const companyEmail = options.email || options.companyEmail || "info@iconictravel.in";
  const companyWebsite = options.companyWebsite || options.website || "www.iconictravel.in";
  const companyAddress = options.address || options.companyAddress || "B-38, 2nd Floor, Sector-64, Noida, U.P. 201301";
  const termsConditions = options.termsConditions || "";
  const cancellationPolicy = options.cancellationPolicy || "";

  const guestName = quotation?.clientDetails?.clientName || quotation?.customerName || "Guest";
  const bookingId = quotation?.quotationId || quotation?.quickQuotationId || "Booking Id";

  let packageTitle = options.packageTitle || quotation?.tourDetails?.quotationTitle || "Tour Package";
  if (!packageTitle.includes("Nights") && !packageTitle.includes("Days")) {
    packageTitle += ` ${options.duration?.nights || 0} Nights ${options.duration?.days || 0} Days`;
  }
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

      if (destinationSummary && destinationSummary !== "()") {
        doc.fillColor("#000000").fontSize(11).font("Helvetica").text(destinationSummary);
      }

      const stayLocations = options.stayLocations || [];
      const totalNights = stayLocations.reduce((sum, loc) => sum + (Number(loc.nights) || 0), 0);
      const totalDays = totalNights + 1;

      if (stayLocations.length > 0) {
        const stayText = `(${stayLocations.map(loc => `${loc.city || loc.cityName} ${loc.nights}N`).join(", ")})`;
        if (stayText !== "()") {
          doc.fillColor("#000000").fontSize(10).font("Helvetica").text(stayText);
        }
      }

      doc.moveDown(1);

      // --- Inclusions Section ---
      doc.fillColor("#ff0000").fontSize(13).font("Helvetica-Bold").text("INCLUSIONS OF PACKAGE:");

      const startY = doc.y + 5;
      const col1 = 40;
      const col2 = 160;
      const rowHeight = 16;

      const formatDate = (d) => {
        if (!d || d === "standard**") return d;
        try {
          const date = new Date(d);
          if (isNaN(date.getTime())) return d;
          return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
        } catch (e) {
          return d;
        }
      };

      const formatTime = (t) => {
        if (!t) return "12:00 PM";
        if (t.includes("AM") || t.includes("PM")) return t;
        try {
          const [h, m] = t.split(":");
          const hr = Number(h);
          const ampm = hr >= 12 ? "PM" : "AM";
          const h12 = hr % 12 || 12;
          return `${h12}:${m} ${ampm}`;
        } catch (e) {
          return t;
        }
      };

      const pad = (n) => String(n || 0).padStart(2, "0");

      const details = [
        ["Guest Name -", guestName],
        ["Booking Id -", bookingId],
        ["Persons-", options.guestsLine || `${quotation.adults || 0} Adults, ${quotation.children || 0} Child`],
        ["No of Rooms-", options.roomsLine || "01 Double Sharing"],
        ["Package Type -", options.packageType || "Family Tour Package"],
        ["Duration-", ` ${pad(totalNights)} Nights ${pad(totalDays)} Days`],
        ["Date of Journey-", `${formatDate(options.startDate)}, Time - standard**`],
        ["Tour End Date-", `${formatDate(options.endDate)}, Time - standard**`],
        ["Pick Up Point-", options.pickupPoint || "Siliguri Airport/Railway Station**"],
        ["Drop Point -", options.dropPoint || "Siliguri Airport/Railway Station**"],
        ["Meal Plan -", options.mealPlan || "CPI Plan (Breakfast only)"],
      ];

      details.forEach(([label, value], i) => {
        doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold").text(label, col1, startY + i * rowHeight);
        
        // Make Guest Name and journey dates bold
        if (label === "Guest Name -" || label === "Date of Journey-" || label === "Tour End Date-") {
          doc.font("Helvetica-Bold").text(value, col2, startY + i * rowHeight);
        } else {
          doc.font("Helvetica").text(value, col2, startY + i * rowHeight);
        }
      });

      doc.y = startY + (details.length * rowHeight) + 30;

      // --- Final Hotel Names ---
      doc.fillColor("#2e7d32").fontSize(13).font("Helvetica-Bold").text("FINAL HOTEL NAMES WITH CONFIRMATION", 40, doc.y, { align: "left" });
      doc.moveDown(0.5);

      const confirmedHotels = quotation.confirmedHotels || [];
      confirmedHotels.forEach((h, i) => {
        if (doc.y > 650) doc.addPage();

        doc.fillColor("#ff0000").fontSize(12).font("Helvetica-Bold").text(`${i + 1}: ${h.hotelName} in ${h.city} (${pad(h.nights)} Night)`, 40);
        doc.moveDown(0.2);

        const hStartY = doc.y;
        const hCol1 = 40;
        const hCol2 = 160;
        const hRowH = 15;

        const hDetails = [
          ["Address -", h.hotelAddress || "N/A"],
          ["Guest Name -", guestName],
          ["Person-", options.guestsLine || "N/A"],
          ["Rooms-", options.roomsLine || "N/A"],
          ["Booking PNR -", `${companyName} (for Confirmation)`],
          ["Check-in Date -", formatDate(h.checkInDate)],
          ["Check-in Time -", formatTime(h.checkInTime)],
          ["Check Out Date -", formatDate(h.checkOutDate)],
          ["Check Out Time -", formatTime(h.checkOutTime)],
          ["Room Type-", h.roomType || "Standard"],
          ["Contact No-", `${h.contactNo || "N/A"} (Manager)`],
        ];

        hDetails.forEach(([label, value], j) => {
          doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold").text(label, hCol1, hStartY + j * hRowH);
          
          if (label === "Guest Name -" || label === "Booking PNR -" || label === "Room Type-" || label === "Contact No-") {
            doc.font("Helvetica-Bold").text(value, hCol2, hStartY + j * hRowH);
          } else {
            doc.font("Helvetica").text(value, hCol2, hStartY + j * hRowH);
          }
        });

        doc.y = hStartY + hDetails.length * hRowH + 20;
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

      if (termsConditions) {
        doc.fillColor("#000000").font("Helvetica-Bold").text("Terms & Conditions: ", { continued: true });
        doc.fillColor("#0000ff").font("Helvetica").text(termsConditions, { link: termsConditions, underline: true });
      }

      if (cancellationPolicy) {
        doc.fillColor("#000000").font("Helvetica-Bold").text("Cancellation Policy: ", { continued: true });
        doc.fillColor("#0000ff").font("Helvetica").text(cancellationPolicy, { link: cancellationPolicy, underline: true });
      }

      if (options.paymentLink) {
        doc.fillColor("#000000").font("Helvetica-Bold").text("Pay Online: ", { continued: true });
        doc.fillColor("#0000ff").font("Helvetica").text(options.paymentLink, { link: options.paymentLink, underline: true });
      }

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
