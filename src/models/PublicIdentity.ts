import { PublicIdentitiesApiGetPublicIdentitiesRequest } from "sailpoint-api-client";


export const DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS: PublicIdentitiesApiGetPublicIdentitiesRequest = {
    count: false,
    limit: 250,
    offset: 0,
    addCoreFilters: false,
    sorters: "name"
};

