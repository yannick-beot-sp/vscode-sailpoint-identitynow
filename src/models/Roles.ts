import { RolesApiListRolesV1Request } from "sailpoint-api-client/dist/roles/api.js";

export const DEFAULT_ROLES_QUERY_PARAMS: RolesApiListRolesV1Request = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};

