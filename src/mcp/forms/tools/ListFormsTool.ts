import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { formBaseOutputSchema } from "./formSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    forms: z.array(formBaseOutputSchema),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "listForms",
    description: "List all form definitions for a given tenant. Returns id, name, description, owner, created, and modified for each form.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "List Forms",
        readOnlyHint: true,
    },
})
export class ListFormsTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const forms = await client.listForms();

            return {
                forms: forms.map(f => ({
                    id: f.id,
                    name: f.name,
                    description: f.description,
                    owner: {
                        ...f.owner,
                        name: f.owner?.name ?? ((f.owner) as any)?.fullName // casting to any because fullName is not part of schema
                    },
                    created: f.created,
                    modified: f.modified,
                })),
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
