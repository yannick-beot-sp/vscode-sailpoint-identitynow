import { z } from "zod";
import { refSchema } from "../../inputFields";

export const accessProfileOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    requestable: z.boolean().optional(),
    source: refSchema.optional(),
    owner: refSchema.nullable().optional(),
    entitlements: z.array(refSchema).optional().nullable(),
});
