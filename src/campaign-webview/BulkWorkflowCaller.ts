import { ISCClient } from "../services/ISCClient";
import { isEmpty } from "../utils/stringUtils";

export interface BulkResult {
    success: number;
    errors: any[]
}

export class BulkWorkflowCaller {

    /**
     *
     */
    constructor(private readonly workflowId: string,
        private readonly accessToken: string,
        private client: ISCClient
    ) {
    }

    public async call(data: any[]): Promise<BulkResult> {

        const result: BulkResult = {
            success: 0,
            errors: []
        }

        for (const item of data) {
            try {
                const workflowExecutionId = await this.client.callWorkflowExternalTrigger(
                    this.workflowId,
                    this.accessToken,
                    item)
                if (isEmpty(workflowExecutionId)) {
                    result.errors.push(item)
                } else {
                    result.success++
                }
            } catch (error) {
                result.errors.push(item)
            }
        }
        return result

    }
}