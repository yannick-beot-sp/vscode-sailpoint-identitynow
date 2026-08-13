import { AccountsApiListAccountsRequest } from "sailpoint-api-client";

export const DEFAULT_ACCOUNTS_QUERY_PARAMS: AccountsApiListAccountsRequest = {
    count: false,
    limit: 250,
    offset: 0,
    sorters: "name"
};

