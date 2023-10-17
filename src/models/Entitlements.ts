import { EntitlementsBetaApiListEntitlementsRequest } from "sailpoint-api-client";

export const DEFAULT_ENTITLEMENTS_QUERY_PARAMS: EntitlementsBetaApiListEntitlementsRequest = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};

