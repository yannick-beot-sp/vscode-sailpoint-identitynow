import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the form definition name by id
 */
export class FormIdToNameCacheService extends CacheService<string> {

    constructor(readonly client: ISCClient) {
        super(
            async (key: string): Promise<string> => {
                const form = await this.client.getFormById(key);
                return form.name!;
            }
        );
    }
}
