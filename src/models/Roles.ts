import { RolesApiListRolesRequest } from "sailpoint-api-client";

export const DEFAULT_ROLES_QUERY_PARAMS: RolesApiListRolesRequest = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};

