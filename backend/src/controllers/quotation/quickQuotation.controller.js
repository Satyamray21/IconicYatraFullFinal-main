import QuickQuotation from "../../models/quotation/quickQuotation.model.js";
import Package from "../../models/package.model.js";
import Company from "../../models/company.model.js";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Resolve local image path (logo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../../../public/logoiconic.jpg");

// Read image and convert to Base64
const logoBase64 = fs.existsSync(logoPath)
  ? fs.readFileSync(logoPath).toString("base64")
  : null;

const logoSrc = logoBase64
  ? `data:image/png;base64,${logoBase64}`
  : "https://www.iconicyatra.com/static/media/logo.7803301b9efb5c74d172.png";


// ==========================
// Create QuickQuotation
// ==========================
export const createQuickQuotation = async (req, res) => {
  try {
    const { customerName, email, phone, packageId, adults, children, message, totalCost, transportation, pickupPoint, dropPoint } = req.body;

    if (!customerName || !email || !packageId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pkg = await Package.findById(packageId).lean();
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const newQuotation = await QuickQuotation.create({
      customerName,
      email,
      phone,
      packageId,
      adults,
      children,
      message,

      pickupPoint: pickupPoint || "",
      dropPoint: dropPoint || "",

      transportation: transportation || pkg.transportation || "",
      totalCost: totalCost || 0,

      packageSnapshot: pkg,
      policy: pkg.policy,
    });

    res.status(201).json({
      message: "Quick quotation created successfully",
      quotation: newQuotation,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Get All Quick Quotations
// ==========================
export const getAllQuickQuotations = async (req, res) => {
  try {
    const quotations = await QuickQuotation.find()
      .populate("packageId", "packageName price duration")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: quotations.length, quotations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Get Single Quick Quotation
// ==========================
export const getQuickQuotationById = async (req, res) => {
  try {
    const quotation = await QuickQuotation.findById(req.params.id)
      .populate("packageId", "packageName price duration");

    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    res.status(200).json(quotation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Update Quick Quotation
// ==========================
export const updateQuickQuotation = async (req, res) => {
  try {
    const updated = await QuickQuotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Quotation not found" });

    res.status(200).json({ message: "Quotation updated", quotation: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Delete Quick Quotation
// ==========================
export const deleteQuickQuotation = async (req, res) => {
  try {
    const deleted = await QuickQuotation.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Quotation not found" });

    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// Manual Mail Sender (Callable)
// ==========================
export const sendQuotationMail = async (
  toEmail,
  customerName,
  pkg,
  quotation,
  company
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: company.email,           // <-- dynamic email
        pass: company.appPassword,     // <-- dynamic app password
      },
    });

    const htmlContent = getQuotationEmailTemplate(
      customerName,
      pkg,
      quotation,
      company
    );

    await transporter.sendMail({
      from: `"${company.companyName}" <${company.email}>`,  // dynamic sender
      to: toEmail,
      subject: `Your Quotation for ${pkg?.title || pkg?.packageName}`,
      html: htmlContent,
      attachments: company.logoCid
        ? [
          {
            filename: company.logoFilename,
            path: company.logoPath,
            cid: company.logoCid,
          },
        ]
        : [],
    });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};


// ==========================
// Send Quotation Mail (Manual Trigger)
// ==========================
export const sendQuickQuotationMail = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName } = req.body; // <-- Now taking company Name

    const quotation = await QuickQuotation.findById(id).populate("packageId");
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    const pkg = quotation.packageSnapshot || quotation.packageId;

    // 🔥 Find company by name
    const company = await Company.findOne({ companyName }).lean();

    if (!company) {
      return res.status(400).json({
        message: `Company '${companyName}' not found`,
      });
    }

    // Logo setup
    company.logoPath = company.logo
      ? path.join(__dirname, "../../../public/", company.logo)
      : null;

    company.logoCid = company.logo ? "companyLogo" : null;
    company.logoFilename = company.logo || null;

    // 🔥 Set correct email password
    company.appPassword =
      company.email === process.env.gmail
        ? process.env.app_pass // Iconic Yatra
        : process.env.EMAIL_PASS; // Iconic Travel

    // Send email
    const emailResult = await sendQuotationMail(
      quotation.email,
      quotation.customerName,
      pkg,
      quotation,
      company
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: emailResult.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Mail sent using company: ${company.companyName}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==========================
// Fixed Modern Mail Template (API Data Compatible)
// ==========================
const getQuotationEmailTemplate = (customerName, pkg, quotation, company) => {
  // Format total cost with commas
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'Contact for pricing';
    return '₹' + Math.round(amount).toLocaleString('en-IN') + ' INR';
  };

  // Calculate values
  const totalAdults = quotation?.adults || 0;
  const totalChildren = quotation?.children || 0;
  const pickupPoint = quotation?.pickupPoint || "Not Provided";
  const dropPoint = quotation?.dropPoint || "Not Provided";

  const baseCost = quotation?.totalCost || 0;
  const totalWithGST = Math.round(baseCost);

  const packageName = pkg?.title || pkg?.packageName || "Tour Package";
  const destination = pkg?.sector || pkg?.destinationCountry || "N/A";

  // Duration Calculation
  let totalNights = 0;
  if (pkg?.stayLocations && Array.isArray(pkg.stayLocations)) {
    totalNights = pkg.stayLocations.reduce(
      (total, location) => total + (location.nights || 0),
      0
    );
  }

  const nights = totalNights || (pkg?.days ? pkg.days.length - 1 : 0);
  const duration = nights + 1 || (pkg?.days ? pkg.days.length : 0);

  const mealPlan = pkg?.mealPlan?.planType || "CP (Breakfast Only)";
  const arrivalCity = pkg?.arrivalCity || "Airport / Railway Station";
  const departureCity = pkg?.departureCity || "Airport / Railway Station";

  // Hotel Options HTML
  let hotelOptionsHTML = "";

  if (
    pkg?.destinationNights &&
    Array.isArray(pkg.destinationNights) &&
    pkg.destinationNights.length > 0
  ) {
    hotelOptionsHTML = pkg.destinationNights
      .map((d) => {
        const hotels = d.hotels
          ?.map(
            (h) =>
              `${h.category?.toUpperCase() || ""} – ${h.hotelName} (₹${h.pricePerPerson})`
          )
          .join("<br/>");

        return `
          <li>
            <strong>${d.destination} (${d.nights} Nights)</strong><br/>
            ${hotels || ""}
          </li>
        `;
      })
      .join("");
  } else {
    if (pkg?.stayLocations && Array.isArray(pkg.stayLocations)) {
      pkg.stayLocations.forEach((location) => {
        const cityName = location.city || "City";
        const nights = location.nights || 1;

        hotelOptionsHTML += `
          <li><strong>${cityName} (${nights} Night${nights > 1 ? "s" : ""}):</strong> Premium Deluxe Hotel (3★ Category)</li>`;
      });
    } else {
      hotelOptionsHTML = `<li><strong>All Destinations:</strong> Premium Deluxe Hotels (3★ Category)</li>`;
    }
  }

  // Itinerary HTML
  let itineraryHTML = "";
  if (pkg?.days && Array.isArray(pkg.days)) {
    itineraryHTML = pkg.days
      .map((day, index) => {
        return `
        <div style="margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #eee;">
          <strong>Day ${index + 1}: ${day.title || ""}</strong><br/>
          ${day.notes ? `<div style="margin-top:5px;">${day.notes}</div>` : ""}
          ${day.aboutCity
            ? `<div style="margin-top:5px; color:#555;">${day.aboutCity}</div>`
            : ""}
        </div>`;
      })
      .join("");
  }

  // Policies
  const cleanHTML = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  const inclusionPolicy =
    pkg?.policy?.inclusionPolicy?.[0] ||
    quotation?.policy?.inclusionPolicy?.[0] ||
    "";
  const exclusionPolicy =
    pkg?.policy?.exclusionPolicy?.[0] ||
    quotation?.policy?.exclusionPolicy?.[0] ||
    "";
  const paymentPolicy =
    pkg?.policy?.paymentPolicy?.[0] ||
    quotation?.policy?.paymentPolicy?.[0] ||
    "";
  const cancellationPolicy =
    pkg?.policy?.cancellationPolicy?.[0] ||
    quotation?.policy?.cancellationPolicy?.[0] ||
    "";
  const termsConditions =
    pkg?.policy?.termsAndConditions?.[0] ||
    quotation?.policy?.termsAndConditions?.[0] ||
    "";

  // Transportation
  const transportationValue =
    quotation?.transportation || pkg?.transportation || "As per itinerary";

  // ⭐ FINAL TEMPLATE WITH DYNAMIC COMPANY DATA ⭐
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;color:#000;background:#fff;padding:0;margin:0;line-height:1.7;">

    <!-- HEADER -->
    <div style="background:#0b5394;color:#fff;text-align:center;padding:25px 15px;">
      <img src="cid:companyLogo" alt="${company.companyName}" style="height:80px;margin-bottom:10px;border-radius:10px;">
      <h2 style="margin:5px 0 0;font-size:24px;">GREETING FROM ${company.companyName}!!!</h2>
      <p style="margin:5px 0;font-size:15px;">Your Trusted Travel Partner</p>

      <p style="text-align:center;margin:40px 0;">
        <a href="${company.website}" target="_blank"
          style="background:#ffc107;color:#000;padding:12px 25px;text-decoration:none;font-weight:600;border-radius:5px;">
          Visit Our Official Website
        </a>
      </p>
    </div>

    <!-- BODY -->
    <div style="padding:40px 30px;">
      <p>Dear <strong>${customerName}</strong>,</p>
      <p>Greetings from <strong>${company.companyName}!!!</strong><br>
      Please find below your customized <strong>${packageName}</strong> details and costing.</p>

      <!-- PACKAGE SUMMARY -->
      <div style="background:#f9f9f9;padding:20px;border-left:4px solid #0b5394;margin:25px 0;">
        <h3 style="margin-top:0;color:#0b5394;">Package Summary</h3>
        <p><strong>Destination:</strong> ${destination}</p>
        <p><strong>No. of Pax:</strong> ${totalAdults} Adults, ${totalChildren} Child</p>
        <p><strong>Duration:</strong> ${nights} Nights / ${duration} Days</p>
        <p><strong>Plan:</strong> ${mealPlan}</p>
        <p><strong>Transportation:</strong> ${transportationValue}</p>
        <p><strong>Pick-Up:</strong> ${pickupPoint}</p>
        <p><strong>Drop:</strong> ${dropPoint}</p>
        <p><strong>Total Package Cost:</strong> ${formatCurrency(totalWithGST)}</p>
      </div>

      <!-- HOTEL DETAILS -->
      <h3 style="color:#0b5394;">🏨 Hotel Options</h3>
      <ul>${hotelOptionsHTML}</ul>

      <!-- ITINERARY -->
      <h3 style="color:#0b5394;">🗓️ Day Wise Itinerary</h3>
      <div>${itineraryHTML}</div>

      <!-- INCLUSION -->
      <h3 style="color:#0b5394;">✅ Cost Inclusions</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${inclusionPolicy ? cleanHTML(inclusionPolicy) : "Not Provided"}
      </div>

      <!-- EXCLUSION -->
      <h3 style="color:#0b5394;">❌ Cost Exclusions</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${exclusionPolicy ? cleanHTML(exclusionPolicy) : "Not Provided"}
      </div>

      <!-- TERMS -->
      <h3 style="color:#0b5394;">📋 Terms & Conditions</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${termsConditions ? cleanHTML(termsConditions) : "Not Provided"}
      </div>

      <!-- CANCELLATION -->
      <h3 style="color:#0b5394;">📜 Cancellation Policy</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${cancellationPolicy ? cleanHTML(cancellationPolicy) : "Not Provided"}
      </div>

      <!-- PAYMENT -->
      <h3 style="color:#0b5394;">💳 Payment Policy</h3>
      <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin-bottom:20px;">
        ${paymentPolicy ? cleanHTML(paymentPolicy) : "Not Provided"}
      </div>

      <!-- SIGNATURE -->
      <div style="margin-top:50px;text-align:left;">
        <p><strong>Thanks & Best Regards,</strong></p>
        <p><strong>${company.companyName}</strong><br>
        Email: ${company.email}<br>
        Phone: ${company.phone || ""}<br>
        Website: <a href="${company.website}" style="color:#0b5394;">${company.website}</a></p>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background:#f1f1f1;text-align:center;padding:15px;font-size:12px;color:#555;">
      Corporate Office: ${company.address || ""}
    </div>
  </div>
`;
};

export default getQuotationEmailTemplate;