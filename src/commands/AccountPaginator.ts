import { Account } from "../models/Account";
import { IdentityNowClient } from "../services/IdentityNowClient";


export default class AccountPaginator implements AsyncIterable<Account[]> {

    constructor(
        private client: IdentityNowClient,
        private sourceId: string
    ){}


    async *[Symbol.asyncIterator](): AsyncIterableIterator<Account[]> {
        const count = await this.client.getAccountCountBySource(this.sourceId);
        console.log(count, "accounts found in", this.sourceId);

        let offset = 0;
        const limit = 250;
        do {
            const data = await this.client.getAccountsBySource(this.sourceId, offset, limit);
            yield data;
            offset += limit;
        } while (offset < count);
    }
}