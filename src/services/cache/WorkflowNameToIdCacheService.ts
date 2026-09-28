import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";
import { Workflow } from "sailpoint-api-client/dist/workflows/api.js";

/**
 * Cache the workflow ID by name
 */
export class WorkflowNameToIdCacheService extends CacheService<string>{
    private workflows: Workflow[]
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
