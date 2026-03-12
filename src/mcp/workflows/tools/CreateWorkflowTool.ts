import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";

const inputSchema = z.object({
    tenantName: tenantNameField,
    name: z.string().describe("Unique name for the new workflow."),
    description: z.string().optional().describe("Description of what the workflow accomplishes."),
    owner: z.object({
        type: z.string().optional().describe("Owner type, e.g. 'IDENTITY'."),
        id: z.string().optional().describe("Owner identity ID."),
        name: z.string().optional().describe("Owner display name."),
    }).optional().describe("Owner of the workflow."),
    definition: z.unknown().optional().describe(
        "Workflow definition with 'start' and 'steps' fields. "
    ),
    trigger: z.unknown().optional().describe(
        "Workflow trigger configuration (type, attributes)."
    ),
});

const outputSchema = z.object({
    id: z.string(),
    status: z.literal("created"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Creates a new workflow for the specified tenant.
 * Workflows are always created in a disabled state.
 */
@Tool({
    name: "createWorkflow",
    description:
        "Create a new workflow for a given tenant. " +
        "Workflows are always created in a disabled state.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Create Workflow",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class CreateWorkflowTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const created = await client.createWorflow({
                name: input.name,
                description: input.description,
                definition: input.definition as any,
                trigger: input.trigger as any,
                enabled: false,
            });
            return { id: created.id!, status: "created" };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
