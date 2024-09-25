export const VALID_OPERATORS = ['lt', 'lte', 'gt', 'gte'];
export const VALID_DATE_FORMATS = ['ISO8601', 'LDAP', 'PEOPLE_SOFT', 'EPOCH_TIME_JAVA', 'EPOCH_TIME_WIN32'];
export const URL_PREFIX = 'idn';
export const NEW_ID = '00000000000000000000000000000000';
export const CSV_MULTIVALUE_SEPARATOR = ';';


export const RESOURCE_TYPES = {
    connectorRule : "connector-rules",
    identityAttribute : "identity-attributes",
    sourceApps : "source-apps",
} as const
