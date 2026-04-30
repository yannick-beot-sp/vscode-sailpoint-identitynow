import { z } from "zod";

/**
 * Shared Zod field definitions reused across Workflow tool input schemas.
 */

export const workflowNameField = z.string().describe(
    "Workflow name or ID (UUID). " +
    "When the value matches a UUID pattern the lookup is done by ID; otherwise by name."
);
