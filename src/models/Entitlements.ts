import { EntitlementsApiListEntitlementsV1Request } from "sailpoint-api-client/dist/entitlements/api.js";

export const DEFAULT_ENTITLEMENTS_QUERY_PARAMS: EntitlementsApiListEntitlementsV1Request = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};
