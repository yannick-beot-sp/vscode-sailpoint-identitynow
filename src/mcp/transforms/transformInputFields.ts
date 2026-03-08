import { z } from "zod";

/**
 * Shared Zod field definitions reused across Transform tool input schemas.
 */

export const transformNameField = z.string().describe(
    "Transform name or ID (UUID). " +
    "When the value matches a UUID pattern the lookup is done by ID; otherwise by name."
);
