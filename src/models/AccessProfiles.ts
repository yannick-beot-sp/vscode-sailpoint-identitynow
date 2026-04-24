import { AccessProfilesV2025ApiListAccessProfilesRequest, AccessProfileV2025 } from "sailpoint-api-client/dist/v2025";

export const DEFAULT_ACCESSPROFILES_QUERY_PARAMS: AccessProfilesV2025ApiListAccessProfilesRequest = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};



/**
 * Work on AccessProfileV2025 returned by ISClient AccessProfileV2025
 */
export type AccessProfile = AccessProfileV2025 & Required<Pick<AccessProfileV2025, 'id'>> & {
  owner: NonNullable<AccessProfileV2025['owner']>;
};

