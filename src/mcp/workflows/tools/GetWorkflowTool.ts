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
});

const outputSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    enabled: z.boolean(),
    definition: z.unknown().nullable(),
    trigger: z.unknown().nullable(),
    created: z.date().optional(),
    modified: z.date().optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Returns the full details of a workflow by name or ID.
 */
@Tool({
    name: "getWorkflow",
    description: "Get the full details of a workflow by name or ID.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Workflow",
        readOnlyHint: true,
    },
})
export class GetWorkflowTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const w = isGuid(input.workflowName)
                ? await client.getWorflowById(input.workflowName)
                : await client.getWorkflowByName(input.workflowName);

            return {
                id: w.id!,
                name: w.name!,
                description: w.description,
                enabled: w.enabled ?? false,
                definition: w.definition ?? null,
                trigger: w.trigger ?? null,
                created: w.created ? new Date(w.created) : undefined,
                modified: w.modified ? new Date(w.modified) : undefined,

            };
        } catch (err: any) {
            if (err?.response?.status === 404 || err?.message?.includes("Could not find")) {
                throw new McpError(
                    ErrorCodes.WORKFLOW_NOT_FOUND,
                    `Workflow "${input.workflowName}" not found.`
                );
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
