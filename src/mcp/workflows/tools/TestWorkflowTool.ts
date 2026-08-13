import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { workflowNameField } from "../workflowInputFields";
import { isGuid } from "../../../utils/stringUtils";
import { WorkflowExecutionV2025StatusV2025 } from "sailpoint-api-client";
import { delay } from "../../../utils";

const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 5 * 60 * 1_000; // 5 minutes

const activitySchema = z.object({
    displayName: z.string().optional(),
    stepName: z.string().optional(),
    technicalName: z.string().optional(),
    status: z.enum(["completed", "failed"]),
    timestamp: z.string().optional(),
});

const inputSchema = z.object({
    tenantName: tenantNameField,
    workflowName: workflowNameField,
    payload: z.record(z.string(), z.unknown()).describe(
        "Input data to test the workflow as expected by the trigger"
    ),
});

const outputSchema = z.object({
    executionId: z.string(),
    status: z.string(),
    startTime: z.string().optional(),
    closeTime: z.string().optional(),
    activities: z.array(activitySchema),
    error: z.string().optional(),
});

type Input = z.infer<typeof inputSchema>;
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
        title: "Test Workflow",
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true
    },
})
export class TestWorkflowTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        // 1. Resolve workflow ID
        let workflowId: string;
        try {
            const w = isGuid(input.workflowName)
                ? await client.getWorflowById(input.workflowName)
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
        let executionStatus: WorkflowExecutionV2025StatusV2025 = WorkflowExecutionV2025StatusV2025.Running;
        let startTime: string | undefined;
        let closeTime: string | undefined;

        while (Date.now() < deadline) {
            await delay(POLL_INTERVAL_MS);
            try {
                const execution = await client.getWorkflowExecution(executionId);
                executionStatus = execution.status ?? executionStatus;
                startTime = (execution as any).startTime;
                closeTime = (execution as any).closeTime;
                if (executionStatus == WorkflowExecutionV2025StatusV2025.Failed
                    || executionStatus == WorkflowExecutionV2025StatusV2025.Canceled
                    || executionStatus == WorkflowExecutionV2025StatusV2025.Completed
                ) {
                    break;
                }
                this.notify("Workflow is " + executionStatus);
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

        // 6. Build activity summary from ActivityTaskCompleted / ActivityTaskFailed events
        let error
        const activities = events
            .filter(e =>
                e.type === "ActivityTaskCompleted" ||
                e.type === "ActivityTaskFailed"
            )
            .map(e => {
                const attrs: Record<string, any> = (e.attributes as any) ?? {};
                error = attrs.error
                return {
                    displayName: attrs.displayName,
                    stepName: attrs.stepName,
                    technicalName: attrs.technicalName,
                    status: e.type === "ActivityTaskCompleted" ? "completed" as const : "failed" as const,
                    timestamp: e.timestamp,
                };
            });

        return {
            executionId,
            status: executionStatus,
            startTime,
            closeTime,
            activities,
            error,
        };
    }
}