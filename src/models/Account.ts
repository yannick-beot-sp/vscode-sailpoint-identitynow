import { AccountsApiListAccountsV1Request } from "sailpoint-api-client/dist/accounts/api.js";

export const DEFAULT_ACCOUNTS_QUERY_PARAMS: AccountsApiListAccountsV1Request = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};

