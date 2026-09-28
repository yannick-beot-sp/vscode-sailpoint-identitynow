import { Index, Search } from "sailpoint-api-client/dist/search/api.js"

export interface SearchQuery {
	index?: Index
	indices?: Index[]
	query: string
	sort?: string | string[]
	fields?: string[]
	includeNested?: boolean
}


export function buildSearchQuery(
	{ index, indices, query, sort, fields, includeNested = false }: SearchQuery,
): Search {
	const resolvedIndices = indices?.length ? indices : index ? [index] : [];
	if (resolvedIndices.length === 0) {
		throw new Error("Search query requires at least one index");
	}

	const sortArray = Array.isArray(sort)
		? sort
		: sort?.split(",").map(s => s.trim()).filter(Boolean);
	return {
		indices: resolvedIndices,
		query: { query },
		sort: sortArray,
		includeNested,
		...(fields?.length ? { queryResultFilter: { includes: fields } } : {}),
	};
}