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
    enabled:      z.boolean().describe("Set to true to enable the workflow, false to disable it."),
});

const outputSchema = z.object({
    status: z.enum(["enabled", "disabled"]),
});

type Input  = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Enables or disables a workflow identified by name or ID.
 */
@Tool({
    name: "setWorkflowStatus",
    description: "Enable or disable a workflow by name or ID.",
    inputSchema,
    outputSchema,
    annotations: {
        title:           "Set Workflow Status",
        readOnlyHint:    false,
        destructiveHint: false,
    },
})
export class SetWorkflowStatusTool extends ToolContext {
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
            await client.updateWorkflowStatus(id, input.enabled);
            return { status: input.enabled ? "enabled" : "disabled" };
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
