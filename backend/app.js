
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import slipRouter from "./src/routers/slip.router.js";


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

// Routes
import authRoutes from "./src/routers/user.router.js";
app.use("/api/v1/user", authRoutes);

import paymentRoutes from "./src/routers/payment.js";
app.use("/api/payment", paymentRoutes);

import cityRoutes from "./src/routers/city.router.js";
app.use("/api/v1/cities", cityRoutes);

import leadRouter from "./src/routers/lead.router.js"
app.use('/api/v1/lead', leadRouter);
import staffRouter from "./src/routers/staff.router.js"
app.use('/api/v1/staff', staffRouter);

import associateRouter from "./src/routers/associate.router.js"
app.use('/api/v1/associate', associateRouter);

import paymentRouter from "./src/routers/payment.route.js"
app.use('/api/v1/payment', paymentRouter);

import activityRouter from "./src/routers/activityRoutes.js"
app.use('/api/v1/activity', activityRouter);

import invoiceRouter from "./src/routers/invoice.router.js";
app.use("/api/v1/invoice", invoiceRouter);

import companyRouter from "./src/routers/company.router.js";
app.use("/api/v1/company", companyRouter);

import calcualteAccommodationRouter from "./src/routers/calculateAccommodation.router.js"
app.use('/api/v1/accommodation', calcualteAccommodationRouter);

import statesAndCitiesRouter from "./src/routers/stateAndCity.router.js";
app.use("/api/v1/state", statesAndCitiesRouter);
import locationRouter from "./src/routers/location.router.js";
app.use("/api/v1/location", locationRouter);
import allCountryStatesAndCity from "./src/routers/allCountryStatesAndCity.router.js";
app.use("/api/v1/countryStateAndCity", allCountryStatesAndCity);
import packageRoutes from './src/routers/package.routes.js'
app.use("/api/v1/packages", packageRoutes)
import dayRoutes from "./src/routers/day.routes.js";
app.use("api/v1/days", dayRoutes);
// flight Quotation
import FlightQuotationRouter from "./src/routers/quotation/flightQuotation.router.js";
app.use("/api/v1/flightQT", FlightQuotationRouter);

import leadOptionsRoutes from "./src/routers/leadOptionsRoutes.js";
app.use("/api/v1/lead-options", leadOptionsRoutes);

import hotelQuotationRouter from "./src/routers/quotation/hotelQuotation.router.js";
app.use("/api/v1/hotelQT", hotelQuotationRouter);

import customQuotationRouter from "./src/routers/quotation/customQuotation.router.js";
app.use("/api/v1/customQT", customQuotationRouter);

import fullQuotationRouter from "./src/routers/quotation/fullQuotation.router.js";
app.use("/api/v1/fullQT", fullQuotationRouter);

import quickQuotationRouter from "./src/routers/quotation/quickQuotation.router.js";
app.use("/api/v1/quickQT", quickQuotationRouter);

import bankDetailsRouter from "./src/routers/common/bankDetails.route.js";
app.use("/api/v1/bank", bankDetailsRouter)

import easebussRoutes from "./src/routers/easebuzz.routes.js";
app.use("/api/v1/easebusspayment", easebussRoutes);

import companyUiRouter from "./src/routers/companyUi.router.js"
app.use("/api/v1/companyUI", companyUiRouter);
// vehicle Quotation
import vehicleQuotationRouter from "./src/routers/quotation/vehicleQuotation.router.js";
app.use("/api/v1/vehicleQT", vehicleQuotationRouter);

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


// ========== ADD BLOG ROUTES HERE ==========
import blogRoutes from "./src/routers/blog.routes.js";
app.use("/api/v1/blogs", blogRoutes);
// ==========================================
// ✅ Fix: Load JSON without import
const swaggerDocument = JSON.parse(fs.readFileSync("./swagger-output.json", "utf-8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// email send slip
app.use('/api/v1/slip', slipRouter);

// hotel route
import hotelRoutes from "./src/routers/hotel.router.js";
app.use("/api/v1", hotelRoutes);

import inquiryRoutes from "./src/routers/inquiry.router.js";
app.use("/api/v1", inquiryRoutes);



export { app };