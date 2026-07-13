import Company from "../models/company.model.js";
import { tenantContext } from "../utils/tenantContext.js";

export const identifyTenant = async (req, res, next) => {
  try {
    // 1. Get the domain from the Origin header or a custom x-tenant-domain header
    // The frontend should send this with every request.
    const origin = req.headers.origin || req.headers["x-tenant-domain"];

    if (!origin) {
      return res.status(400).json({ 
        success: false, 
        message: "No tenant domain provided in headers." 
      });
    }

    // Clean the URL to extract just the hostname (e.g. "https://www.agencyA.com" -> "www.agencyA.com")
    let domainName = origin;
    try {
      if (origin.startsWith('http')) {
        const url = new URL(origin);
        domainName = url.hostname;
      }
    } catch (e) {
      // If parsing fails, use the raw string
    }

    // Remove port numbers if testing locally (e.g. localhost:3000 -> localhost)
    domainName = domainName.split(':')[0];

    // 2. Look up the company in the database
    const company = await Company.findOne({ domain: domainName });

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: `Tenant domain '${domainName}' is not registered.` 
      });
    }

    // 3. Attach the companyId securely to the request object
    req.companyId = company._id;
    
    // Also attach company details in case the controller needs them
    req.tenant = company;

    // 4. Wrap the rest of the request in the Global Tenant Context
    tenantContext.run(company._id, () => {
      next();
    });
  } catch (error) {
    console.error("Tenant Identification Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while identifying tenant." 
    });
  }
};
