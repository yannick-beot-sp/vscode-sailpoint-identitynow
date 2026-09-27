import * as assert from "assert";
import { AxiosResponse } from "axios";
import { Configuration, ExtraParams, PaginationParams, Paginator, Search, SearchApi, SearchV2025 } from "sailpoint-api-client";

function response<T>(data: T[]): AxiosResponse<T[]> {
	return {
		data,
		status: 200,
		statusText: "OK",
		headers: {},
		config: {},
	} as AxiosResponse<T[]>;
}

function httpError(status: number): Error & { response: { status: number } } {
	const error = new Error(`HTTP ${status}`) as Error & { response: { status: number } };
	error.response = { status };
	return error;
}

function configuration(): Configuration {
	return new Configuration({
		baseurl: "https://acme.api.identitynow.com",
		tokenUrl: "https://acme.api.identitynow.com/oauth/token",
		accessToken: "pat-token",
	});
}

suite("sailpoint-api-client Paginator", () => {
	test("concatenates pages of 250 and stops on a short page", async () => {
		const calls: Array<{ limit?: number; offset?: number; filters?: string }> = [];
		const pages = [
			Array.from({ length: 250 }, (_, index) => index),
			[250, 251],
		];

		const result = await Paginator.paginate(
			undefined,
			async (params: PaginationParams & ExtraParams) => {
				calls.push({ limit: params.limit, offset: params.offset, filters: params.filters });
				return response(pages[calls.length - 1]);
			},
			{ filters: 'name eq "Employees"' }
		);

		assert.strictEqual(result.data.length, 252);
		assert.deepStrictEqual(result.data.slice(0, 2), [0, 1]);
		assert.deepStrictEqual(result.data.slice(-2), [250, 251]);
		assert.deepStrictEqual(calls, [
			{ limit: 250, offset: 0, filters: 'name eq "Employees"' },
			{ limit: 250, offset: 250, filters: 'name eq "Employees"' },
		]);
	});

	test("treats limit as a maximum and stops once a page reaches it", async () => {
		let calls = 0;
		const result = await Paginator.paginate(
			undefined,
			async () => {
				calls++;
				return response([calls]);
			},
			{ limit: 1 },
			1
		);

		assert.strictEqual(calls, 1);
		assert.deepStrictEqual(result.data, [1]);
	});

	test("returns results already collected when the next page responds 4xx", async () => {
		let calls = 0;
		const result = await Paginator.paginate(
			undefined,
			async () => {
				calls++;
				if (calls === 1) {
					return response(["a", "b"]);
				}
				throw httpError(400);
			},
			undefined,
			2
		);

		assert.deepStrictEqual(result.data, ["a", "b"]);
	});

	test("propagates a 4xx on the first page and any 5xx", async () => {
		await assert.rejects(
			() => Paginator.paginate(undefined, async () => { throw httpError(404); }, undefined, 2),
			(error: { response?: { status?: number } }) => error.response?.status === 404
		);

		let calls = 0;
		await assert.rejects(
			() => Paginator.paginate(
				undefined,
				async () => {
					calls++;
					if (calls === 1) {
						return response(["a", "b"]);
					}
					throw httpError(500);
				},
				undefined,
				2
			),
			(error: { response?: { status?: number } }) => error.response?.status === 500
		);
	});

	test("paginates Search v3 with one sort and a searchAfter cursor", async () => {
		const api = new SearchApi(configuration());
		const calls: Array<{ limit?: unknown; searchAfter?: string[] }> = [];
		const search: Search = {
			indices: ["identities"],
			query: { query: "*" },
			sort: ["-name"],
		};
		(api as unknown as { searchPost(request: { limit?: unknown; search?: Search }): Promise<AxiosResponse<Array<Record<string, string>>>> }).searchPost =
			async (request) => {
				calls.push({
					limit: request.limit,
					searchAfter: request.search?.searchAfter ? [...request.search.searchAfter] : undefined,
				});
				const data = calls.length === 1
					? [{ name: "Zoe" }, { name: "Yan" }]
					: [{ name: "Amy" }];
				return response(data);
			};

		const result = await Paginator.paginateSearchApi(api, search, 2);

		assert.deepStrictEqual((result.data as Array<{ name: string }>).map(item => item.name), ["Zoe", "Yan", "Amy"]);
		assert.deepStrictEqual(calls, [
			{ limit: 2, searchAfter: undefined },
			{ limit: 2, searchAfter: ["Yan"] },
		]);
		assert.deepStrictEqual(search.searchAfter, ["Yan"]);
	});

	test("paginates Search v2025 through the searchV2025 request field", async () => {
		const api = new SearchApi(configuration());
		const search: SearchV2025 = {
			indices: ["roles"],
			query: { query: "requestable:true" },
			sort: ["name"],
		};
		let request: Record<string, unknown> | undefined;
		(api as unknown as { searchPost(request: Record<string, unknown>): Promise<AxiosResponse<unknown[]>> }).searchPost =
			async (next) => {
				request = next;
				return response([{ name: "Helpdesk" }]);
			};

		const result = await Paginator.paginateSearchApi(api, search, 10, 10);

		assert.deepStrictEqual(result.data, [{ name: "Helpdesk" }]);
		assert.strictEqual(request?.limit, 10);
		assert.strictEqual(request?.searchV2025, search);
	});

	test("requires exactly one sort and a known search client", async () => {
		const api = new SearchApi(configuration());
		const search = { indices: ["identities"], query: { query: "*" }, sort: ["name", "id"] } as Search;

		await assert.rejects(
			() => Paginator.paginateSearchApi(api, search),
			(error: unknown) => error === "search must include exactly one sort parameter to paginate properly"
		);

		await assert.rejects(
			() => Paginator.paginateSearchApi({} as SearchApi, { ...search, sort: ["name"] }),
			(error: unknown) => error instanceof Error && error.message === "Unsupported API type"
		);
	});
});
