import { tenantContext } from "../utils/tenantContext.js";
import mongoose from "mongoose";

/**
 * Global Mongoose Plugin for Multi-Tenant SaaS Isolation
 * 
 * How it works:
 * 1. Checks if the Mongoose Schema has a `tenantId` field defined.
 * 2. If yes, it intercepts every database query (find, findOne, aggregate, save, update).
 * 3. It automatically fetches the `tenantId` from the current request context 
 *    (via AsyncLocalStorage) and enforces the filter!
 */
export function tenantIsolationPlugin(schema) {
    // 1. Automatically inject the tenantId field into ALL schemas that don't have it explicitly defined!
    // (We exclude schemas where it might not be applicable, but Mongoose plugins apply globally by default. 
    // We'll just add it dynamically if it doesn't exist).
    if (!schema.path("tenantId")) {
        schema.add({
            tenantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Company",
                index: true
            }
        });
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
            const tenantId = tenantContext.getStore();
            if (tenantId) {
                // If tenantId is not already explicitly queried, append it securely
                if (!this.getQuery().tenantId) {
                    this.where({ tenantId });
                }
            }
            next();
        });
    });

    // 3. Intercept Document Creation/Saving BEFORE Validation!
    // Mongoose runs validation BEFORE pre('save'), so we must inject tenantId during pre('validate')
    schema.pre("validate", function (next) {
        const tenantId = tenantContext.getStore();
        if (tenantId && !this.tenantId) {
            this.tenantId = tenantId;
        }
        next();
    });

    // 4. Intercept Aggregations
    // We must unshift a $match stage to the very beginning of the pipeline
    schema.pre("aggregate", function (next) {
        const tenantId = tenantContext.getStore();
        if (tenantId) {
            this.pipeline().unshift({ $match: { tenantId } });
        }
        next();
    });
}
