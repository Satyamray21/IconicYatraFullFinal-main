import Company from "../models/company.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ✅ CREATE Company
export const createCompany = asyncHandler(async (req, res) => {
    const {
        companyName,
        address,
        phone,
        email,
        gstin,
        stateCode,
        companyWebsite,
        authorizedSignatory,
        authorizedSignatoryName,
        authorizedSignatoryDesignation,
        termsConditions,
        paymentLink,
    } = req.body;

    if (!companyName || !address)
        throw new ApiError(400, "Company name and address are required");

    // files handled via multer fields
    const logoPath = req.files?.logo?.[0]?.path;
    const signPath = req.files?.signature?.[0]?.path;

    let logoUrl = null;
    let signatureUrl = null;

    if (logoPath) {
        const logoUpload = await uploadOnCloudinary(logoPath);
        logoUrl = logoUpload?.secure_url || null;
    }

    if (signPath) {
        const signUpload = await uploadOnCloudinary(signPath);
        signatureUrl = signUpload?.secure_url || null;
    }

    const parsedSignatory =
        authorizedSignatory && typeof authorizedSignatory === "string"
            ? JSON.parse(authorizedSignatory)
            : authorizedSignatory;

    const signatoryName = parsedSignatory?.name ?? authorizedSignatoryName;
    const signatoryDesignation =
        parsedSignatory?.designation ?? authorizedSignatoryDesignation;

    const company = await Company.create({
        companyName,
        address,
        phone,
        email,
        gstin,
        stateCode,
        companyWebsite,
        logo: logoUrl,
        authorizedSignatory: {
            name: signatoryName,
            designation: signatoryDesignation,
            signatureImage: signatureUrl,
        },
        termsConditions,
        paymentLink,
    });

    res
        .status(201)
        .json(new ApiResponse(201, company, "Company created successfully"));
});

// ✅ GET All Companies
export const getCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.find().sort({ createdAt: -1 });
    res
        .status(200)
        .json(new ApiResponse(200, companies, "Companies fetched successfully"));
});

// ✅ GET Company by ID
export const getCompanyById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) throw new ApiError(404, "Company not found");
    res.status(200).json(new ApiResponse(200, company, "Company details"));
});

// ✅ UPDATE Company
export const updateCompany = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        companyName,
        address,
        phone,
        email,
        gstin,
        stateCode,
        authorizedSignatory,
        authorizedSignatoryName,
        authorizedSignatoryDesignation,
        termsConditions,
        paymentLink,
        companyWebsite,
    } = req.body;

    const company = await Company.findById(id);
    if (!company) throw new ApiError(404, "Company not found");

    const logoPath = req.files?.logo?.[0]?.path;
    const signPath = req.files?.signature?.[0]?.path;

    let logoUrl = company.logo;
    let signatureUrl = company.authorizedSignatory?.signatureImage;

    if (logoPath) {
        const upload = await uploadOnCloudinary(logoPath);
        logoUrl = upload?.secure_url || logoUrl;
    }

    if (signPath) {
        const upload = await uploadOnCloudinary(signPath);
        signatureUrl = upload?.secure_url || signatureUrl;
    }

    const parsedSignatory =
        authorizedSignatory && typeof authorizedSignatory === "string"
            ? JSON.parse(authorizedSignatory)
            : authorizedSignatory;

    const nextSignatoryName =
        parsedSignatory?.name ?? authorizedSignatoryName ?? company.authorizedSignatory?.name;
    const nextSignatoryDesignation =
        parsedSignatory?.designation ??
        authorizedSignatoryDesignation ??
        company.authorizedSignatory?.designation;

    company.companyName = companyName || company.companyName;
    company.address = address || company.address;
    company.phone = phone || company.phone;
    company.email = email || company.email;
    company.gstin = gstin || company.gstin;
    company.stateCode = stateCode || company.stateCode;
    company.logo = logoUrl;
    company.authorizedSignatory = {
        name: nextSignatoryName,
        designation: nextSignatoryDesignation,
        signatureImage: signatureUrl,
    };
    company.termsConditions = termsConditions || company.termsConditions;
    company.paymentLink = paymentLink || company.paymentLink;
    company.companyWebsite=companyWebsite || company.companyWebsite;
    await company.save();

    res
        .status(200)
        .json(new ApiResponse(200, company, "Company updated successfully"));
});

// ✅ DELETE Company
export const deleteCompany = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, null, "Company deleted"));
});