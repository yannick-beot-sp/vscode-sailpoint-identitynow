import { AccessProfilesApiListAccessProfilesV1Request, AccessProfile as SdkAccessProfile } from "sailpoint-api-client/dist/access_profiles/api.js";

export const DEFAULT_ACCESSPROFILES_QUERY_PARAMS: AccessProfilesApiListAccessProfilesV1Request = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};



/**
 * Work on AccessProfile returned by ISClient AccessProfile
 */
export type AccessProfileRead = SdkAccessProfile & Required<Pick<SdkAccessProfile, 'id'>> & {
  owner: NonNullable<SdkAccessProfile['owner']>;
};

