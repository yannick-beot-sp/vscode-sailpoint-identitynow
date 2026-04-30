import { SearchV2025 } from "sailpoint-api-client/dist/v2025"

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
    query: SearchV2025
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

