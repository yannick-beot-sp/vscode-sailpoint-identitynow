import { Index, Search } from '../sailpointCompat';
export interface SearchQuery {
	index: Index
	query: string
	sort?: string | string[]
	fields?: string[]
	includeNested?: boolean
}


export function buildSearchQuery(
	{ index, query, sort, fields, includeNested = false }: SearchQuery,
): Search {

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