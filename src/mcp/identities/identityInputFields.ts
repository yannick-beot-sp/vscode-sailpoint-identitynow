import { z } from "zod";

/**
 * Shared Zod field definitions reused across Identity tool input schemas.
 */

export const identityIdField = z.string().describe(
    "Identity name or ID (UUID). " +
    "When the value matches a UUID pattern the lookup is done by ID; otherwise by name."
);

export const identitySortField = z.string().optional().describe(
    "Field to sort results by. Prefix with '-' for descending order (e.g. '-name'). Defaults to 'name'."
);

export const identityQueryField = z.string().describe(
    "Lucene query string to search identities. " +
    "Supports field-specific queries such as 'email:*@example.com', " +
    "'attributes.department:Engineering', or 'name:john*'. " +
    "See https://documentation.sailpoint.com/saas/help/search/building-query.html for syntax " +
    "and https://documentation.sailpoint.com/saas/help/search/searchable-fields.html for available fields."
);
