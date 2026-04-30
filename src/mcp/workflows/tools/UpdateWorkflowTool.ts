import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { workflowNameField } from "../workflowInputFields";
import { isGuid } from "../../../utils/stringUtils";

const inputSchema = z.object({
    tenantName: tenantNameField,
    workflowName: workflowNameField,
    name: z.string().optional().describe("New name for the workflow."),
    description: z.string().optional().describe("New description for the workflow."),
    owner: z.object({
        type: z.string().optional().describe("Owner type, e.g. 'IDENTITY'."),
        id: z.string().optional().describe("Owner identity ID."),
        name: z.string().optional().describe("Owner display name."),
    }).optional().describe("New owner of the workflow."),
    definition: z.unknown().optional().describe(
        "Replacement workflow definition with 'start' and 'steps' fields."
    ),
    trigger: z.unknown().optional().describe(
        "Replacement trigger configuration (type, attributes)."
    ),
});

const outputSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.literal("updated"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Fully replaces a workflow using PUT, identified by name or ID.
 * Fields not provided are cleared — fetch the workflow first if you need to preserve existing values.
 */
@Tool({
    name: "updateWorkflow",
    description:
        "Update a workflow by name or ID using a full replacement (PUT). " +
        "Fetch the workflow first if you need to preserve existing fields.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Update Workflow",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class UpdateWorkflowTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        let id: string;
        try {
            const w = isGuid(input.workflowName)
                ? await client.getWorflowById(input.workflowName)
                : await client.getWorkflowByName(input.workflowName);
            id = w.id!;
        } catch (err: any) {
            throw new McpError(
                ErrorCodes.WORKFLOW_NOT_FOUND,
                `Workflow "${input.workflowName}" not found.`
            );
        }

        try {
            const updated = await client.putWorkflow(id, {
                name: input.name,
                description: input.description,
                owner: input.owner as any,
                definition: input.definition as any,
                trigger: input.trigger as any,
            });
            return { id: updated.id!, name: updated.name!, status: "updated" };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
