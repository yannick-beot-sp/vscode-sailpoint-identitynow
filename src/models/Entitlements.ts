import { EntitlementsV2025ApiListEntitlementsRequest } from "sailpoint-api-client/dist/v2025";

export const DEFAULT_ENTITLEMENTS_QUERY_PARAMS: EntitlementsV2025ApiListEntitlementsRequest = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};
