import { AttributeBag, PaginatedQueryParams } from "./Account";

export interface Entitlement {
    id: string
    name: string
    attribute: string
    value: string
    sourceSchemaObjectType: string
    description: string
    privileged: boolean
    cloudGoverned: boolean
    created: string
    modified: string
    source: SourceRef[]
    attributes: AttributeBag;
    segments: string[]
    directPermissions: DirectPermission[]
}

export interface SourceRef {
    type: string
    id: string
    name: string
}


export interface DirectPermission {
    rights: string[]
    target: string
}

export interface EntitlementsQueryParams extends PaginatedQueryParams {
// eslint-disable-next-line @typescript-eslint/naming-convention
"account-id"?:string
// eslint-disable-next-line @typescript-eslint/naming-convention
"segmented-for-identity"?:string
// eslint-disable-next-line @typescript-eslint/naming-convention
"for-segment-ids"?:string
// eslint-disable-next-line @typescript-eslint/naming-convention
"include-unsegmented"?:boolean
}

export const DEFAULT_ENTITLEMENTS_QUERY_PARAMS: EntitlementsQueryParams = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};
