import { ISCClient } from "../ISCClient.js";
import { CacheService } from "./CacheService.js";

/**
 * Cache the form definition ID by name
 */
export class FormNameToIdCacheService extends CacheService<string> {

    constructor(readonly client: ISCClient) {
        super(
            async (key: string): Promise<string> => {
                const form = await this.client.getFormByName(key);
                return form.id!;
            }
        );
    }
}
