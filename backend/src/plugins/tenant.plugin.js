import { tenantContext } from "../utils/tenantContext.js";

/**
 * Global Mongoose Plugin for Multi-Tenant SaaS Isolation
 * 
 * How it works:
 * 1. Checks if the Mongoose Schema has a `companyId` field defined.
 * 2. If yes, it intercepts every database query (find, findOne, aggregate, save, update).
 * 3. It automatically fetches the `companyId` from the current request context 
 *    (via AsyncLocalStorage) and enforces the filter!
 */
export function tenantIsolationPlugin(schema) {
    // 1. Only apply isolation to models that have a `companyId` field in their schema
    // Models without companyId (like the Company model itself) will not be isolated.
    if (!schema.path("companyId")) {
        return;
    }

    // 2. Intercept Queries
    const queryTypes = [
        "find", 
        "findOne", 
        "findOneAndUpdate", 
        "findOneAndDelete", 
        "findOneAndRemove", 
        "countDocuments", 
        "updateMany", 
        "updateOne",
        "deleteMany",
        "deleteOne"
    ];

    queryTypes.forEach((type) => {
        schema.pre(type, function (next) {
            const companyId = tenantContext.getStore();
            if (companyId) {
                // If companyId is not already explicitly queried, append it securely
                if (!this.getQuery().companyId) {
                    this.where({ companyId });
                }
            }
            next();
        });
    });

    // 3. Intercept Document Creation/Saving BEFORE Validation!
    // Mongoose runs validation BEFORE pre('save'), so we must inject companyId during pre('validate')
    schema.pre("validate", function (next) {
        const companyId = tenantContext.getStore();
        if (companyId && !this.companyId) {
            this.companyId = companyId;
        }
        next();
    });

    // 4. Intercept Aggregations
    // We must unshift a $match stage to the very beginning of the pipeline
    schema.pre("aggregate", function (next) {
        const companyId = tenantContext.getStore();
        if (companyId) {
            this.pipeline().unshift({ $match: { companyId } });
        }
        next();
    });
}
