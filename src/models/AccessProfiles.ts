import { AccessProfilesApiListAccessProfilesRequest } from "sailpoint-api-client";

export const DEFAULT_ACCESSPROFILES_QUERY_PARAMS: AccessProfilesApiListAccessProfilesRequest = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};

