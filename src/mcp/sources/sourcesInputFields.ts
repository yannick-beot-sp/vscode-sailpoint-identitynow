import { z } from "zod";

/**
 * Shared Zod field definitions reused across Source tool input schemas.
 */

export const sourceNameOrIdField = z.string().describe(
    "Source name or ID (UUID). " +
    "When the value matches a UUID pattern the lookup is done by ID; otherwise by name."
);
