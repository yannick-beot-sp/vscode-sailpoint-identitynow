import { z } from "zod";

export const refSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional().nullable(),
    type: z.string().optional(),
});

export const accessProfileBaseOutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    requestable: z.boolean().optional(),
    source: refSchema.optional(),
    owner: refSchema.nullable().optional(),
});
