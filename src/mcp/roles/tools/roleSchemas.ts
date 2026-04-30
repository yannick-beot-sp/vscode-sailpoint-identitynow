import { z } from "zod";

export const refSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
});

export const membershipCriteriaField = z.string().optional().describe(
    "Membership criteria in SCIM-like format. " +
    "Supported attributes: identity.<attributeName>, '{source name}'.attribute.{attribute name}, '{source name}'.entitlement.{attribute name}. " +
    "Operators: eq, ne, in, co, sw, ew, gt, ge, lt, le. " +
    "Logical: AND, OR. Grouping: ( ). " +
    'Example: identity.department eq "Engineering" AND identity.location eq "HQ". ' +
    "Pass an empty string to remove membership criteria."
);

export const roleBaseOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    requestable: z.boolean().optional(),
    owner: refSchema.optional().nullable(),
});
