import * as assert from "assert";
import { AxiosResponse } from "axios";
import { describe, it, suite } from "mocha";
import { PaginationParams } from "sailpoint-api-client/dist/index.js";
import { ISCClient, TOTAL_COUNT_HEADER } from "../../services/ISCClient.js";
import { GenericAsyncIterableIterator } from "../../utils/GenericAsyncIterableIterator.js";

function response<T>(data: T[], totalCount: number): AxiosResponse<T[]> {
	return {
		data,
		status: 200,
		statusText: "OK",
		headers: { [TOTAL_COUNT_HEADER]: String(totalCount) },
		config: {},
	} as unknown as AxiosResponse<T[]>;
}

async function collect<T>(iterable: AsyncIterable<T[]>): Promise<T[][]> {
	const pages: T[][] = [];
	for await (const page of iterable) {
		pages.push(page);
	}
	return pages;
}

suite("GenericAsyncIterableIterator Test Suite", () => {
	describe("pagination", () => {
		it("pages with the default size until offset reaches the total count", async () => {
			const calls: Array<{ limit?: number; offset?: number; count?: boolean }> = [];
			const total = 500;
			const iterator = new GenericAsyncIterableIterator<number, PaginationParams>(
				{} as ISCClient,
				async function (params) {
					calls.push({ limit: params.limit, offset: params.offset, count: params.count });
					const offset = params.offset ?? 0;
					const limit = params.limit ?? 250;
					const length = Math.min(limit, Math.max(0, total - offset));
					const data = Array.from({ length }, (_, index) => offset + index);
					return response(data, total);
				}
			);

			const pages = await collect(iterator);

			assert.strictEqual(pages.length, 2);
			assert.strictEqual(pages[0].length, 250);
			assert.strictEqual(pages[1].length, 250);
			assert.deepStrictEqual(calls, [
				{ limit: 250, offset: 0, count: true },
				{ limit: 250, offset: 250, count: false },
			]);
		});

		it("uses limit as the page size and still returns every result", async () => {
			const calls: Array<{ limit?: number; offset?: number }> = [];
			const args: PaginationParams = { limit: 2, filters: 'name eq "A"' };
			const originalArgs = { ...args };
			const total = 5;
			const iterator = new GenericAsyncIterableIterator<number, PaginationParams>(
				{} as ISCClient,
				async function (params) {
					calls.push({ limit: params.limit, offset: params.offset });
					const offset = params.offset ?? 0;
					const limit = params.limit ?? 2;
					const length = Math.min(limit, Math.max(0, total - offset));
					const data = Array.from({ length }, (_, index) => offset + index);
					return response(data, total);
				},
				args
			);

			const pages = await collect(iterator);

			assert.deepStrictEqual(pages, [[0, 1], [2, 3], [4]]);
			assert.deepStrictEqual(calls, [
				{ limit: 2, offset: 0 },
				{ limit: 2, offset: 2 },
				{ limit: 2, offset: 4 },
			]);
			assert.deepStrictEqual(args, originalArgs);
		});

		it("stops after a short page without requesting another", async () => {
			let calls = 0;
			const iterator = new GenericAsyncIterableIterator<number, PaginationParams>(
				{} as ISCClient,
				async function () {
					calls++;
					return response([1, 2, 3], 1000);
				}
			);

			const pages = await collect(iterator);

			assert.strictEqual(calls, 1);
			assert.deepStrictEqual(pages, [[1, 2, 3]]);
		});
	});
});
