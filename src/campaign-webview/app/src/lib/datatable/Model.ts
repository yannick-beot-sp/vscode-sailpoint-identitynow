export interface SortingOptions {
    field: string,
    order: "asc" | "desc"
}
export interface FetchOptions {
    currentPage: number,
    pageSize: number,
    sort?: SortingOptions
}

export interface PaginatedData<T> {
    data: T[],
    count: number
}

export type FetchDataCallback = (fetchOptions: FetchOptions) => Promise<PaginatedData<any>>

export interface Column {
    field: string,
    label: string,
    visible?: boolean,
    sortable?: boolean
}


export interface BaseAction<T> {
    label: string,
    id?: string,
    class?: string,
}
export interface Action<T> extends BaseAction<T> {
    callback: (row: T) => Promise<void>
    condition?: (row: T) => boolean
}
export interface MultiSelectAction<T> extends BaseAction<T> {

    callback: (rows: T[]) => Promise<void>
}