import { IndexV2025, SearchV2025 } from "sailpoint-api-client"

export interface SearchQuery {
	index: IndexV2025
	query: string
	sort?: string | string[]
	fields?: string[]
	includeNested?: boolean
}


export function buildSearchQuery(
	{ index, query, sort, fields, includeNested = false }: SearchQuery,
): SearchV2025 {

	const sortArray = Array.isArray(sort)
		? sort
		: sort?.split(",").map(s => s.trim()).filter(Boolean);
	return {
		indices: [index],
		query: { query },
		sort: sortArray,
		includeNested,
		...(fields?.length ? { queryResultFilter: { includes: fields } } : {}),
	};
}