import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { tenantNameField } from "../../inputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
});

const outputSchema = z.object({
    workflows: z.array(
        z.object({
            id:          z.string(),
            name:        z.string(),
            description: z.string().optional(),
            enabled:     z.boolean(),
        })
    ),
});

type Input  = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Lists all workflows for the specified tenant.
 * Results are sorted alphabetically by name.
 */
@Tool({
    name: "listWorkflows",
    description: "List all workflows for a given tenant.",
    inputSchema,
    outputSchema,
    annotations: {
        title:        "List Workflows",
        readOnlyHint: true,
    },
})
export class ListWorkflowsTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);
        const workflows = await client.getWorflows();
        return {
            workflows: workflows.map(w => ({
                id:          w.id!,
                name:        w.name!,
                description: w.description,
                enabled:     w.enabled ?? false,
            })),
        };
    }
}
