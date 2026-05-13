import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { identityProfileOutputSchema, parseMapping } from "./identityProfileSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    profiles: z.array(identityProfileOutputSchema),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "listIdentityProfiles",
    description:
        "List all identity profiles for a given tenant. " +
        "Returns id, name, priority, authoritative source name, attribute mappings, and lifecycle states for each profile.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "List Identity Profiles",
        readOnlyHint: true,
    },
})
export class ListIdentityProfilesTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const profiles = await client.getIdentityProfiles();

            const profilesWithDetails = await Promise.all(
                profiles.map(async profile => {
                    const lifecycleStates = await client.getLifecycleStates(profile.id!);
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
                })
            );

            return { profiles: profilesWithDetails };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
