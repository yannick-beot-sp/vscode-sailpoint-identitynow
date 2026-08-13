import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { IdentityProfile } from "sailpoint-api-client";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { resolveIdentity } from "../../utils/identityUtils";
import { resolveSource } from "../../utils/sourceUtils";

const inputSchema = z.object({
    tenantName: tenantNameField,
    name: z.string().min(1).describe("Name of the identity profile."),
    description: z.string().optional().describe("Description of the identity profile."),
    owner: z.string().min(1).describe("Username (alias) or display name of the identity who owns this profile."),
    priority: z.number().optional().describe("Priority of the identity profile. Lower values take precedence."),
    authoritativeSource: z.string().min(1).describe("Name or ID of the authoritative source for this identity profile."),
});

const outputSchema = z.object({
    id: z.string().optional().describe("Identity profile ID."),
    name: z.string().describe("Identity profile name."),
    description: z.string().optional().nullable().describe("Identity profile description."),
    priority: z.number().optional().describe("Priority of the identity profile."),
    authoritativeSource: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        type: z.string().optional(),
    }).optional().describe("Authoritative source."),
    owner: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        type: z.string().optional(),
    }).optional().nullable().describe("Identity profile owner."),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "createIdentityProfile",
    description:
        "Create a new identity profile in SailPoint ISC. " +
        "Specify the profile name, authoritative source (name or ID), and owner (identity alias or display name). " +
        "Optionally provide a description and priority. " +
        "Use listSources to find authoritative sources.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Create Identity Profile",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class CreateIdentityProfileTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const ownerId = await resolveIdentity(input.owner, client);
            const sourceId = await resolveSource(input.authoritativeSource, client);

            const payload: IdentityProfile = {
                name: input.name,
                description: input.description,
                priority: input.priority,
                owner: { id: ownerId, type: "IDENTITY" },
                authoritativeSource: { id: sourceId, type: "SOURCE", name: input.authoritativeSource },
            };

            const created = await client.createIdentityProfile(payload);

            return created as Output;
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
