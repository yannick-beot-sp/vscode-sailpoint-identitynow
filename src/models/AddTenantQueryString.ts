export interface AddTenantQueryString {
    tenantName: string;
    authenticationMethod: string;
    accessToken: string|undefined;
    clientId: string|undefined;
    clientSecret: string|undefined;
    displayName: string|undefined;
}