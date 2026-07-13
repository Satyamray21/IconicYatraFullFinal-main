import { AsyncLocalStorage } from "async_hooks";

// Create a global context to store the tenant (company) ID during a request lifecycle
export const tenantContext = new AsyncLocalStorage();
