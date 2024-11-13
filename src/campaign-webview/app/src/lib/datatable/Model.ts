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

export interface Action<T> {
    label: string,
    id?: string,
    class?:string,
    callback: (row: T) => Promise<void>
}
export interface MultiSelectAction<T> {
    label: string,
    id?: string,
    class?:string,
    callback: (rows: T[]) => Promise<void>
}