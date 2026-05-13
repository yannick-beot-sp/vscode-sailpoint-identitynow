import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { identityProfileIdOrNameField, identityProfileOutputSchema, parseMapping } from "./identityProfileSchemas";
import { isUuid } from "../../../utils/stringUtils";

const inputSchema = z.object({
    tenantName: tenantNameField,
    identityProfile: identityProfileIdOrNameField,
});

const outputSchema = identityProfileOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "getIdentityProfile",
    description:
        "Get the details of a single identity profile by name or ID, including attribute mappings and lifecycle states. " +
        "Rule-based mappings return the rule name. " +
        "Use listIdentityProfiles to discover available profiles.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Identity Profile",
        readOnlyHint: true,
    },
})
export class GetIdentityProfileTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const profile = isUuid(input.identityProfile)
                ? await client.getIdentityProfileById(input.identityProfile)
                : await client.getIdentityProfileByName(input.identityProfile);

            if (!profile.id) {
                throw new McpError(
                    ErrorCodes.IDENTITY_PROFILE_NOT_FOUND,
                    `Identity profile "${input.identityProfile}" not found.`
                );
            }

            const lifecycleStates = await client.getLifecycleStates(profile.id);

            return {
                id: profile.id,
                name: profile.name ?? "",
                priority: profile.priority,
                sourceName: profile.authoritativeSource?.name,
                mappings: (profile.identityAttributeConfig?.attributeTransforms ?? []).map(parseMapping),
                lifecycleStates: lifecycleStates.map(ls => ({
                    name: ls.name ?? "",
                    technicalName: ls.technicalName,
                    enabled: ls.enabled,
                    identityState: ls.identityState,
                })),
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            const message = String(err?.message ?? err);
            if (message.includes("Could not find identity profile") || err?.response?.status === 404) {
                throw new McpError(
                    ErrorCodes.IDENTITY_PROFILE_NOT_FOUND,
                    `Identity profile "${input.identityProfile}" not found.`
                );
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, message);
        }
    }
}
