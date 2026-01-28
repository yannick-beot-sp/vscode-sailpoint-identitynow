import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";
import { WorkflowV2025 } from "sailpoint-api-client";

/**
 * Cache the workflow ID by name
 */
export class WorkflowNameToIdCacheService extends CacheService<string>{
    private workflows: WorkflowV2025[]
    constructor(readonly client: ISCClient) {
        super(
            async (key: string) => {
                const workflow = this.workflows.find(x => x.name === key)
                if (workflow === undefined) {
                    const message = `Could not find workflow with name ${key}.`;
                    console.error(message);
                    throw new Error(message);
                }
                return workflow.id
            }
        );
    }
    public override async init(): Promise<void> {
        this.workflows = await this.client.getWorflows()
    }
}
