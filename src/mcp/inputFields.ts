import { z } from "zod";

/**
 * Shared Zod field definitions reused across all MCP tool input schemas.
 */

export const tenantNameField = z.string().describe(
    "Tenant identifier: full domain (e.g. 'company.identitynow.com'), " +
    "a prefix (e.g. 'company-poc'), or display name."
);

export const sourceNameOrIdField = z.string().describe(
    "Source name or ID."
);
