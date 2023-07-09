import { AccessProfile } from "../../models/AccessProfile";
import { IdentityNowClient } from "../../services/IdentityNowClient";

/**
 * Don't actually need this class, so will remove it in future as the getAccessProfiles()
 * function alrady does the pagination.  Only keeping for convenience.
 */

export default class AccessProfilePaginator implements AsyncIterable<AccessProfile[]> {

    constructor(
        private client: IdentityNowClient
    ) { }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<AccessProfile[]> {
        const data = await this.client.getAccessProfiles();
        yield data;
    }
}