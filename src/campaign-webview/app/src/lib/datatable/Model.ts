export interface FetchOptions {
    currentPage: number,
    pageSize: number,
}

export interface PaginatedData<T> {
    data: T[],
    count: number
}

export type FetchDataCallback = (fetchOptions: FetchOptions) => Promise<PaginatedData<any>>

export interface Column {
    field: string,
    label: string
}