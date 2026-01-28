import { WorkflowV2025 } from "sailpoint-api-client";
import { ISCClient } from "../ISCClient";
import { CacheService } from "./CacheService";

/**
 * Cache the workflow name by id
 */
export class WorkflowIdToNameCacheService extends CacheService<string> {

    private workflows: WorkflowV2025[]

    constructor(readonly client: ISCClient) {

        super(
            async (key: string) => {
                const workflow = this.workflows.find(x => x.id === key)
                if (workflow === undefined) {
                    const message = `Could not find workflow with id ${key}.`;
                    console.error(message);
                    throw new Error(message);
                }
                return workflow.name
            }
        )

    }
    
    public override async init(): Promise<void> {
        this.workflows = await this.client.getWorflows()
    }
}
