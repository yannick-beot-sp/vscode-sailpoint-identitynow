import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";
import { Workflow } from "sailpoint-api-client/dist/workflows/api.js";

/**
 * Cache the workflow name by id
 */
export class WorkflowIdToNameCacheService extends CacheService<string> {

    private workflows: Workflow[] = [];

    constructor(readonly client: ISCClient) {

        super(
            async (key: string): Promise<string> => {
                const workflow = this.workflows.find(x => x.id === key)
                if (workflow === undefined) {
                    const message = `Could not find workflow with id ${key}.`;
                    console.error(message);
                    throw new Error(message);
                }
                return workflow.name!
            }
        )

    }
    
    public override async init(): Promise<void> {
        this.workflows = await this.client.getWorflows()
    }
}
