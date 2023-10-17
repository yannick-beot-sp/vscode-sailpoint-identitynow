import { Entitlement } from "sailpoint-api-client";
import { IdentityNowClient } from "../services/IdentityNowClient";


export default class EntitlementPaginator implements AsyncIterable<Entitlement[]> {

    constructor(
        private client: IdentityNowClient,
        private sourceId: string
    ){}


    async *[Symbol.asyncIterator](): AsyncIterableIterator<Entitlement[]> {
        const count = await this.client.getEntitlementCountBySource(this.sourceId);
        console.log(count, "entitlements found in", this.sourceId);

        let offset = 0;
        const limit = 250;
        do {
            const data = await this.client.getEntitlementsBySource(this.sourceId, offset, limit);
            yield data;
            offset += limit;
        } while (offset < count);
    }
}