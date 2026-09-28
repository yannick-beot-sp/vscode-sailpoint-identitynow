import { PublicIdentitiesApiGetPublicIdentitiesV1Request } from "sailpoint-api-client/dist/public_identities/api.js";


export const DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS: PublicIdentitiesApiGetPublicIdentitiesV1Request = {
    count: false,
    limit: 250,
    offset: 0,
    addCoreFilters: false,
    sorters: "name"
};

