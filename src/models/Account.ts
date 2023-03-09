export interface Account {
    authoritative: boolean
    systemAccount: boolean
    uncorrelated: boolean
    features: string
    uuid: string
    nativeIdentity: string
    description: any
    disabled: boolean
    locked: boolean
    manuallyCorrelated: boolean
    hasEntitlements: boolean
    sourceId: string
    sourceName: string
    identityId: string
    attributes: AttributeBag;
    id: string
    name: string
    created: string
    modified: string
}

export interface AttributeBag {
    [propName: string]: any;
}

export interface PaginatedQueryParams {
    filters?: string,
    limit?: number,
    offset?: number,
    count?: boolean,
    sorters?: string

}

export interface AccountsQueryParams extends PaginatedQueryParams {
    detailLevel?: "FULL" | "SLIM"
}

export const DEFAULT_ACCOUNTS_QUERY_PARAMS: AccountsQueryParams = {
    count: false,
    limit: 250,
    offset: 0,
    detailLevel: "SLIM",
    sorters: "name"
};

/**
 * As returned by 401 error
 */
export interface AuthenticationError {
    error: string
}
/**
 * As returned by 429 error
 */
export interface TooManyRequestError {
    message: string
}

/**
 * As returned by 400 or 403
 */
export interface DetailedError {
    detailCode: string
    trackingId: string
    messages: Message[]
    causes: Cause[]
}

export interface Message {
    locale: string
    localeOrigin: string
    text: string
}

export interface Cause {
    locale: string
    localeOrigin: string
    text: string
}
