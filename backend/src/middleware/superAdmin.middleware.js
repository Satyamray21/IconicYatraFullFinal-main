export const requireSuperAdmin = (req, res, next) => {
    // Determine the master domain from environment variable, fallback to iconicyatra.com
    const masterDomain = process.env.MASTER_TENANT_DOMAIN || "iconicyatra.com";
    
    // The current request's domain was attached by tenant.middleware.js 
    // Wait, let's fetch the origin header just like tenant middleware did.
    const origin = req.headers.origin || req.headers["x-tenant-domain"];
    
    if (!origin) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: No domain identified.",
            error: "Forbidden"
        });
    }

    let domainName = origin;
    try {
        if (origin.startsWith('http')) {
            const url = new URL(origin);
            domainName = url.hostname;
        }
    } catch (e) {
        // Fallback
    }

    // Remove port numbers (e.g. localhost:5173 -> localhost)
    domainName = domainName.split(':')[0];

    // Allow localhost for local development, and the exact master domain for production
    if (domainName !== masterDomain && domainName !== "localhost" && domainName !== "127.0.0.1") {
        return res.status(403).json({
            success: false,
            message: "Forbidden: This action requires Universal Superadmin privileges.",
            error: "Forbidden"
        });
    }

    next();
};
