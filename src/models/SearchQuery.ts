import { Search } from "sailpoint-api-client/dist/search/api.js"

export interface BasePaginatedSearch {
    limit?: number
    offset?: number
    count?: boolean

}

export interface PaginatedSearch extends BasePaginatedSearch {
    query: string
    sort?: string | string[]
    fields?: string[]
    includeNested?: boolean
}

export interface PaginatedSearchRequest extends BasePaginatedSearch {
    query: Search
}

export const DEFAULT_PAGINATED_PARAMS = {
    count: true,
    limit: 250,
    offset: 0
}

export const DEFAULT_PAGINATED_SEARCH_PARAMS = {
    ...DEFAULT_PAGINATED_PARAMS,
    includeNested: false
}

