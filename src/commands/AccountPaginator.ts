import { Account } from "sailpoint-api-client";
import { IdentityNowClient } from "../services/IdentityNowClient";


export default class AccountPaginator implements AsyncIterable<Account[]> {

    constructor(
        private client: IdentityNowClient,
        private sourceId: string,
        private exportUncorrelatedAccountOnly = false
    ) { }


    async *[Symbol.asyncIterator](): AsyncIterableIterator<Account[]> {
        const count = await this.client.getAccountCountBySource(this.sourceId, this.exportUncorrelatedAccountOnly);
        console.log(count, "accounts found in", this.sourceId);

        let offset = 0;
        const limit = 250;
        do {
            let data = await this.client.getAccountsBySource(this.sourceId, this.exportUncorrelatedAccountOnly, offset, limit);
            if (this.exportUncorrelatedAccountOnly) {
                data = data.filter(x => x.manuallyCorrelated === false);
            }
            // skip empty data set
            if (data.length > 0) {
                yield data;
            }
            offset += limit;
        } while (offset < count);
    }
}