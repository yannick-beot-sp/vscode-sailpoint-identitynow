/**
 * Paginates a list endpoint.
 * `limit` is the page size sent to the API (default 250), not a cap on the total number of results.
 */

import { ExtraParams, PaginationParams } from "sailpoint-api-client/dist/index.js";
import { ISCClient, TOTAL_COUNT_HEADER } from "../services/ISCClient.js";
import { AxiosResponse } from "axios";

const DEFAULT_PAGE_SIZE = 250;

export class GenericAsyncIterableIterator<TResult, A extends PaginationParams & ExtraParams> implements AsyncIterable<TResult[]> {

    constructor(
        private client: ISCClient,
        private callbackFn: (this: ISCClient, args: A) => Promise<AxiosResponse<TResult[], any>>,
        private args?: A
    ) { }

    async *[Symbol.asyncIterator](): AsyncIterableIterator<TResult[]> {
        const pageSize = this.args?.limit ?? DEFAULT_PAGE_SIZE;
        let offset = this.args?.offset ?? 0;
        const params: A = {
            ...(this.args ?? ({} as A)),
            limit: pageSize,
            offset,
            count: true,
        };
        let totalCount = Number.POSITIVE_INFINITY;
        let first = true;

        do {
            params.offset = offset;
            params.count = first;
            console.log("Paginating call", params);
            const response = await this.callbackFn.call(this.client, params);
            if (first) {
                const header = response.headers?.[TOTAL_COUNT_HEADER];
                totalCount = header !== undefined && header !== ""
                    ? Number(header)
                    : response.data.length;
                first = false;
            }
            yield response.data;
            if (response.data.length < pageSize) {
                return;
            }
            offset += pageSize;
        } while (offset < totalCount);
    }
}
