import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { workflowNameField } from "../workflowInputFields";
import { isGuid } from "../../../utils/stringUtils";

const inputSchema = z.object({
    tenantName:   tenantNameField,
    workflowName: workflowNameField,
});

const outputSchema = z.object({
    status: z.literal("deleted"),
});

type Input  = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Deletes a workflow by name or ID.
 */
@Tool({
    name: "deleteWorkflow",
    description: "Delete a workflow by name or ID.",
    inputSchema,
    outputSchema,
    annotations: {
        title:           "Delete Workflow",
        readOnlyHint:    false,
        destructiveHint: true,
    },
})
export class DeleteWorkflowTool extends ToolContext {
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
            await client.deleteWorkflow(id);
            return { status: "deleted" };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
