import dotenv from "dotenv";
import dns from "dns";

// Force IPv4 (Node.js v17+ issue fix)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import slipRouter from "./src/routers/slip.router.js";
import { verifyToken } from "./src/middleware/user.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());
app.use("/upload", express.static(path.join(process.cwd(), "upload")));

// Routes — `verifyToken` on mounts that require a logged-in dashboard (or staff) user.
// Public/marketing and auth endpoints stay without it.
import authRoutes from "./src/routers/user.router.js";
app.use("/api/v1/user", authRoutes);

import paymentRoutes from "./src/routers/payment.js";
app.use("/api/payment", paymentRoutes);

import cityRoutes from "./src/routers/city.router.js";
app.use("/api/v1/cities", cityRoutes);

import leadRouter from "./src/routers/lead.router.js";
app.use("/api/v1/lead", verifyToken, leadRouter);

import {
  getMyStaffProfile,
  updateMyStaffProfile,
} from "./src/controllers/staff.controller.js";
import { upload as staffImageUpload } from "./src/middleware/imageMulter.middleware.js";
import staffRouter from "./src/routers/staff.router.js";

// Staff self profile must be registered before `app.use("/api/v1/staff", router)` so
// Express does not treat "me" as `/:id` (which returns "Staff not found").
const staffSelfUpload = staffImageUpload.fields([
  { name: "staffPhoto", maxCount: 1 },
  { name: "aadharPhoto", maxCount: 1 },
  { name: "panPhoto", maxCount: 1 },
]);
app.get("/api/v1/staff/me", verifyToken, getMyStaffProfile);
app.put("/api/v1/staff/me", verifyToken, staffSelfUpload, updateMyStaffProfile);
app.use("/api/v1/staff", verifyToken, staffRouter);

import staffPermissionRouter from "./src/routers/staffPermission.routes.js";
app.use("/api/v1/staff-permission", verifyToken, staffPermissionRouter);

import associateRouter from "./src/routers/associate.router.js";
app.use("/api/v1/associate", verifyToken, associateRouter);

import paymentRouter from "./src/routers/payment.route.js";
app.use("/api/v1/payment", verifyToken, paymentRouter);

import activityRouter from "./src/routers/activityRoutes.js";
app.use("/api/v1/activity", verifyToken, activityRouter);

import invoiceRouter from "./src/routers/invoice.router.js";
app.use("/api/v1/invoice", verifyToken, invoiceRouter);

import companyRouter from "./src/routers/company.router.js";
app.use("/api/v1/company", verifyToken, companyRouter);

import calcualteAccommodationRouter from "./src/routers/calculateAccommodation.router.js";
app.use("/api/v1/accommodation", verifyToken, calcualteAccommodationRouter);

import statesAndCitiesRouter from "./src/routers/stateAndCity.router.js";
app.use("/api/v1/state", statesAndCitiesRouter);
import locationRouter from "./src/routers/location.router.js";
app.use("/api/v1/location", locationRouter);
import allCountryStatesAndCity from "./src/routers/allCountryStatesAndCity.router.js";
app.use("/api/v1/countryStateAndCity", allCountryStatesAndCity);
import packageRoutes from "./src/routers/package.routes.js";
app.use("/api/v1/packages", packageRoutes);
import dayRoutes from "./src/routers/day.routes.js";
app.use("/api/v1/days", verifyToken, dayRoutes);
// flight Quotation
import FlightQuotationRouter from "./src/routers/quotation/flightQuotation.router.js";
app.use("/api/v1/flightQT", verifyToken, FlightQuotationRouter);

import leadOptionsRoutes from "./src/routers/leadOptionsRoutes.js";
app.use("/api/v1/lead-options", verifyToken, leadOptionsRoutes);

import hotelQuotationRouter from "./src/routers/quotation/hotelQuotation.router.js";
app.use("/api/v1/hotelQT", verifyToken, hotelQuotationRouter);

import customQuotationRouter from "./src/routers/quotation/customQuotation.router.js";
app.use("/api/v1/customQT", verifyToken, customQuotationRouter);

import fullQuotationRouter from "./src/routers/quotation/fullQuotation.router.js";
app.use("/api/v1/fullQT", verifyToken, fullQuotationRouter);

import quickQuotationRouter from "./src/routers/quotation/quickQuotation.router.js";
app.use("/api/v1/quickQT", verifyToken, quickQuotationRouter);

import bankDetailsRouter from "./src/routers/common/bankDetails.route.js";
app.use("/api/v1/bank", verifyToken, bankDetailsRouter);

import easebussRoutes from "./src/routers/easebuzz.routes.js";
app.use("/api/v1/easebusspayment", easebussRoutes);

import companyUiRouter from "./src/routers/companyUi.router.js";
app.use("/api/v1/companyUI", companyUiRouter);
// vehicle Quotation
import vehicleQuotationRouter from "./src/routers/quotation/vehicleQuotation.router.js";
app.use("/api/v1/vehicleQT", verifyToken, vehicleQuotationRouter);

import galleryRoutes from "./src/routers/gallery.routes.js";

app.use("/api/v1/gallery", galleryRoutes);
import enquiryRoutes from "./src/routers/enquiry.routes.js";
app.use("/api/v1/enquiry", enquiryRoutes);
import careerRoutes from "./src/routers/career.routes.js";
app.use("/api/v1/career", careerRoutes);
import globalSettingsRoutes from "./src/routers/globalSettings.routes.js";
app.use("/api/v1/global-settings", globalSettingsRoutes);

import googleAdsEnquiryRouter from "./src/routers/googleAdsEnquiry.js";
app.use("/api/v1/googleAdsEnquiry", googleAdsEnquiryRouter);

import landingRoutes from "./src/routers/landingPage.router.js";

app.use("/api/v1/landing-pages", landingRoutes);

import destinationRoutes from "./src/routers/destination.routes.js";

app.use("/api/v1/destinations", destinationRoutes);

// ========== ADD BLOG ROUTES HERE ==========
import blogRoutes from "./src/routers/blog.routes.js";
app.use("/api/v1/blogs", blogRoutes);

import socialLinksRoutes from "./src/routers/socialLinksRoutes.js";

app.use("/api/v1/social-links", socialLinksRoutes);

import homePageRoutes from "./src/routers/homePage.routes.js";
app.use("/api/v1/home", homePageRoutes);
// ==========================================
// ✅ Fix: Load JSON without import
const swaggerDocument = JSON.parse(fs.readFileSync("./swagger-output.json", "utf-8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// email send slip
app.use("/api/v1/slip", verifyToken, slipRouter);

// Public inquiry before /api/v1 mounts that require JWT (e.g. hotels).
import inquiryRoutes from "./src/routers/inquiry.router.js";
app.use("/api/v1", inquiryRoutes);

import hotelRoutes from "./src/routers/hotel.router.js";
app.use("/api/v1", verifyToken, hotelRoutes);



export { app };