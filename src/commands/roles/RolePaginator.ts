import { Role } from "sailpoint-api-client";
import { IdentityNowClient } from "../../services/IdentityNowClient";

/**
 * Don't actually need this class, so will remove it in future as the getAccessProfiles()
 * function alrady does the pagination.  Only keeping for convenience.
 */

export default class RolePaginator implements AsyncIterable<Role[]> {

    constructor(
        private client: IdentityNowClient
    ) { }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<Role[]> {
        const response = await this.client.getRoles();
        yield response.data;
    }
}