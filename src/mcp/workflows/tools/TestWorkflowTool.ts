import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { workflowNameField } from "../workflowInputFields";
import { isGuid } from "../../../utils/stringUtils";

const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 5 * 60 * 1_000; // 5 minutes

const activitySchema = z.object({
    displayName:   z.string().optional(),
    stepName:      z.string().optional(),
    technicalName: z.string().optional(),
    status:        z.enum(["completed", "failed"]),
    timestamp:     z.string().optional(),
});

const inputSchema = z.object({
    tenantName:   tenantNameField,
    workflowName: workflowNameField,
    payload:      z.record(z.string(), z.unknown()).optional().describe(
        "Optional JSON object passed as the trigger input to the workflow under test."
    ),
});

const outputSchema = z.object({
    executionId: z.string(),
    status:      z.string(),
    startTime:   z.string().optional(),
    closeTime:   z.string().optional(),
    activities:  z.array(activitySchema),
    lastEvent:   z.string().optional(),
});

type Input  = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Runs a workflow test, waits for completion and returns a summary of executed activities.
 */
@Tool({
    name: "testWorkflow",
    description:
        "Test a workflow by running it with an optional payload. " +
        "Waits for the execution to finish and returns a summary of all activities executed, " +
        "their status (completed / failed) and the final execution status.",
    inputSchema,
    outputSchema,
    annotations: {
        title:           "Test Workflow",
        readOnlyHint:    false,
        destructiveHint: false,
    },
})
export class TestWorkflowTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        // 1. Resolve workflow ID
        let workflowId: string;
        try {
            const w = isGuid(input.workflowName)
                ? await client.getWorflow(input.workflowName)
                : await client.getWorkflowByName(input.workflowName);
            workflowId = w.id!;
        } catch (err: any) {
            throw new McpError(
                ErrorCodes.WORKFLOW_NOT_FOUND,
                `Workflow "${input.workflowName}" not found.`
            );
        }

        // 2. Trigger the test execution
        let executionId: string;
        try {
            executionId = await client.testWorkflow(workflowId, input.payload ?? {});
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, `Failed to start workflow test: ${err?.message ?? err}`);
        }

        // 3. Poll until the execution finishes
        const deadline = Date.now() + MAX_WAIT_MS;
        let executionStatus = "Running";
        let startTime: string | undefined;
        let closeTime: string | undefined;

        while (Date.now() < deadline) {
            await sleep(POLL_INTERVAL_MS);
            try {
                const execution = await client.getWorkflowExecution(executionId);
                executionStatus = (execution as any).status ?? executionStatus;
                startTime = (execution as any).startTime;
                closeTime = (execution as any).closeTime;
                if (executionStatus !== "Running" && executionStatus !== "Queued") {
                    break;
                }
            } catch (err: any) {
                throw new McpError(ErrorCodes.ISC_API_ERROR, `Failed to poll workflow execution: ${err?.message ?? err}`);
            }
        }

        // 4. Fetch the execution event history
        let events: any[] = [];
        try {
            events = await client.getWorkflowExecutionEvents(executionId);
        } catch (err: any) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, `Failed to retrieve execution history: ${err?.message ?? err}`);
        }

        // 5. Determine last event type
        const lastEvent = events.length > 0 ? events[events.length - 1].type : undefined;

        // 6. Build activity summary from ActivityTaskCompleted / ActivityTaskFailed events
        const activities = events
            .filter(e =>
                e.type === "ActivityTaskCompleted" ||
                e.type === "ActivityTaskFailed"
            )
            .map(e => {
                const attrs: Record<string, any> = (e.attributes as any) ?? {};
                return {
                    displayName:   attrs.displayName,
                    stepName:      attrs.stepName,
                    technicalName: attrs.technicalName,
                    status:        e.type === "ActivityTaskCompleted" ? "completed" as const : "failed" as const,
                    timestamp:     e.timestamp,
                };
            });

        return {
            executionId,
            status: executionStatus,
            startTime,
            closeTime,
            activities,
            lastEvent,
        };
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
