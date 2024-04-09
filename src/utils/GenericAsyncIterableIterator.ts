/**
 * Inpsired by Paginator from saipoint-api-client
 */

import { ExtraParams, PaginationParams } from "sailpoint-api-client";
import { ISCClient, TOTAL_COUNT_HEADER } from "../services/ISCClient";
import { AxiosResponse } from "axios";

export class GenericAsyncIterableIterator<TResult, A extends PaginationParams & ExtraParams> implements AsyncIterable<TResult[]> {

    constructor(
        private client: ISCClient,
        private callbackFn: (this: ISCClient, args: A) => Promise<AxiosResponse<TResult[], any>>,
        private args?: A
    ) { }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<TResult[]> {
        let params: PaginationParams = this.args ? this.args : { limit: 0, offset: 0 };

        const maxLimit = params && params.limit ? params.limit : 0;
        let count = 0,
            first = true,
            nbResult = 0;
        params.limit = 250;
        params.count = true;
        console.log(`AsyncIterableIterator, maxLimit = ${maxLimit}`);
        do {
            console.log("Paginating call", params);
            const response = await this.callbackFn.call(this.client, params);
            if (first) {
                count = Number(response.headers[TOTAL_COUNT_HEADER]);
                first = false;
                params.count = false;
            }
            yield response.data;
            nbResult += response.data.length;
            params.offset += params.limit;
        } while (params.offset < count || (maxLimit > 0 && nbResult < maxLimit));

    }
}