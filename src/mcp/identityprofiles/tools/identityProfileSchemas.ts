import { z } from "zod";
import { IdentityAttributeTransform } from "sailpoint-api-client";

export const identityProfileIdOrNameField = z.string().min(1).describe(
    "Identity profile name or ID (32-char hex UUID, e.g. '200be07ae84f43a38d14f429cb4f9951')."
);

export const mappingOutputSchema = z.object({
    identityAttributeName: z.string().describe("Identity attribute name (e.g. 'uid', 'email')."),
    sourceName: z.string().optional().describe("Name of the source providing the account attribute."),
    attributeName: z.string().optional().describe("Account attribute name on the source."),
    transformName: z.string().optional().describe("Name of the transform applied to the account attribute value, if any."),
    ruleName: z.string().optional().describe("Name of the rule applied, if the mapping is rule-based."),
});

export function parseMapping(t: IdentityAttributeTransform): z.infer<typeof mappingOutputSchema> {
    const def = t.transformDefinition;
    if (def?.type === "accountAttribute") {
        return {
            identityAttributeName: t.identityAttributeName ?? "",
            sourceName: def.attributes?.sourceName,
            attributeName: def.attributes?.attributeName,
        };
    }
    if (def?.type === "reference") {
        return {
            identityAttributeName: t.identityAttributeName ?? "",
            transformName: def.attributes?.id,
            sourceName: def.attributes?.input?.attributes?.sourceName,
            attributeName: def.attributes?.input?.attributes?.attributeName,
        };
    }
    if (def?.type === "rule") {
        return {
            identityAttributeName: t.identityAttributeName ?? "",
            ruleName: def.attributes?.name,
        };
    }
    return { identityAttributeName: t.identityAttributeName ?? "" };
}

export const lifecycleStateOutputSchema = z.object({
    name: z.string().describe("Lifecycle state display name."),
    technicalName: z.string().describe("Technical name used internally."),
    enabled: z.boolean().optional().describe("Whether the lifecycle state is active."),
    identityState: z.string().optional().nullable().describe("Associated identity state."),
});

export const identityProfileOutputSchema = z.object({
    id: z.string().optional().describe("Identity profile ID."),
    name: z.string().describe("Identity profile name."),
    priority: z.number().optional().describe("Priority of the identity profile."),
    sourceName: z.string().optional().describe("Name of the authoritative source."),
    mappings: z.array(mappingOutputSchema).describe("Identity attribute mappings."),
    lifecycleStates: z.array(lifecycleStateOutputSchema).describe("Lifecycle states defined on this profile."),
});
