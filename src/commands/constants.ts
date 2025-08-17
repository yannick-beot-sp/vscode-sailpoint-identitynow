const COMMAND_PREFIX = 'vscode-sailpoint-identitynow';
export const OPEN_URL = `${COMMAND_PREFIX}.open-url`;
export const OPEN_RESOURCE = `${COMMAND_PREFIX}.open-resource`;
export const REMOVE_RESOURCE = `${COMMAND_PREFIX}.remove-resource`;
export const MODIFIED_RESOURCE = `${COMMAND_PREFIX}.modified-resource`;
export const REFRESH_FORCED = `${COMMAND_PREFIX}.refresh-forced`;
export const REFRESH = `${COMMAND_PREFIX}.refresh`;
export const ADD_TENANT = `${COMMAND_PREFIX}.add-tenant`;
export const ADD_FOLDER_ROOT = `${COMMAND_PREFIX}.folder.add-root`;
export const ADD_FOLDER = `${COMMAND_PREFIX}.folder.add`;
export const REMOVE_FOLDER = `${COMMAND_PREFIX}.folder.remove`;
export const RENAME_FOLDER = `${COMMAND_PREFIX}.folder.rename`;
export const TENANT_SET_READONLY = `${COMMAND_PREFIX}.tenant.set-readonly`;
export const TENANT_SET_WRITABLE = `${COMMAND_PREFIX}.tenant.set-writable`;
export const RENAME_TENANT = `${COMMAND_PREFIX}.rename-tenant`;
export const REMOVE_TENANT = `${COMMAND_PREFIX}.remove-tenant`;
export const EXPORT_CONFIG_VIEW = `${COMMAND_PREFIX}.export-config.view`;
export const EXPORT_CONFIG_PALETTE = `${COMMAND_PREFIX}.export-config.palette`;
export const EXPORT_NODE_CONFIG_VIEW = `${COMMAND_PREFIX}.export-node-config.view`;

export const IMPORT_CONFIG_VIEW = `${COMMAND_PREFIX}.import-config.view`;
export const IMPORT_CONFIG_PALETTE = `${COMMAND_PREFIX}.import-config.palette`;
export const IMPORT_CONFIG_MENU = `${COMMAND_PREFIX}.import-config.menu`;

export const UPLOAD_CONFIGURATION_VIEW = `${COMMAND_PREFIX}.upload-config.view`;

export const AGGREGATE = `${COMMAND_PREFIX}.aggregate-source`;
export const AGGREGATE_DISABLE_OPTIMIZATION = `${COMMAND_PREFIX}.aggregate-source-disable-optimization`;
export const AGGREGATE_ENTITLEMENTS = `${COMMAND_PREFIX}.aggregate-entitlements`;
export const UPLOAD_FILE = `${COMMAND_PREFIX}.source.upload-file`;
export const IMPORT_ACCOUNTS_VIEW = `${COMMAND_PREFIX}.source.import.accounts.view`;
export const IMPORT_ACCOUNTS_DISABLE_OPTIMIZATION_VIEW = `${COMMAND_PREFIX}.source.import.accounts.disable-optimization.view`;
export const IMPORT_ENTITLEMENTS_VIEW = `${COMMAND_PREFIX}.source.import.entitlements.view`;
export const EXPORT_ACCOUNTS_VIEW = `${COMMAND_PREFIX}.source.export.accounts.view`;
export const IMPORT_UNCORRELATED_ACCOUNTS_VIEW = `${COMMAND_PREFIX}.source.import.uncorrelated-accounts.view`;
export const EXPORT_UNCORRELATED_ACCOUNTS_VIEW = `${COMMAND_PREFIX}.source.export.uncorrelated-accounts.view`;
export const IMPORT_ENTITLEMENT_DETAILS_VIEW = `${COMMAND_PREFIX}.source.import.entitlement-details.view`;
export const EXPORT_ENTITLEMENT_DETAILS_VIEW = `${COMMAND_PREFIX}.source.export.entitlement-details.view`;
export const TEST_SOURCE = `${COMMAND_PREFIX}.test-source`;
export const TEST_SOURCE_PALETTE = `${COMMAND_PREFIX}.test-source.palette`;
export const PEEK_SOURCE = `${COMMAND_PREFIX}.peek-source`;
export const PEEK_SOURCE_PALETTE = `${COMMAND_PREFIX}.peek-source.palette`;
export const PING_SOURCE = `${COMMAND_PREFIX}.ping-source`;
export const PING_SOURCE_PALETTE = `${COMMAND_PREFIX}.ping-source.palette`;
export const CLONE_SOURCE = `${COMMAND_PREFIX}.clone-source`;
export const CLONE_SOURCE_PALETTE = `${COMMAND_PREFIX}.clone-source.palette`;
export const RESET_SOURCE = `${COMMAND_PREFIX}.reset-source`;
export const RESET_SOURCE_ACCOUNTS = `${COMMAND_PREFIX}.reset-source-accounts`;
export const RESET_SOURCE_ENTITLEMENTS = `${COMMAND_PREFIX}.reset-source-entitlements`;
export const ENABLE_LOGGING = `${COMMAND_PREFIX}.enable-logging`;
export const ENABLE_LOGGING_PALETTE = `${COMMAND_PREFIX}.enable-logging.palette`;
export const NEW_TRANSFORM = `${COMMAND_PREFIX}.new-transform`;
export const NEW_PROVISIONING_POLICY = `${COMMAND_PREFIX}.new-provisioning-policy`;
export const NEW_SCHEMA = `${COMMAND_PREFIX}.new-schema`;
export const EVALUATE_TRANSFORM = `${COMMAND_PREFIX}.transform.evaluate`;
export const EVALUATE_TRANSFORM_EDITOR = `${COMMAND_PREFIX}.transform.evaluate.editor`;
export const EVALUATE_TRANSFORM_CLOUD = `${COMMAND_PREFIX}.transform.evaluate.cloud`;
export const EVALUATE_TRANSFORM_CLOUD_EDITOR = `${COMMAND_PREFIX}.transform.evaluate.cloud.editor`;
export const ENABLE_WORKFLOW = `${COMMAND_PREFIX}.workflow.enable`;
export const DISABLE_WORKFLOW = `${COMMAND_PREFIX}.workflow.disable`;
export const EXPORT_WORKFLOW = `${COMMAND_PREFIX}.workflow.export`;
export const IMPORT_WORKFLOW = `${COMMAND_PREFIX}.workflow.import`;
export const IMPORT_WORKFLOW_VIEW_ICON = `${COMMAND_PREFIX}.workflow.import.view-icon`;
export const TEST_WORKFLOW = `${COMMAND_PREFIX}.workflow.test`;
export const VIEW_WORKFLOW_EXECUTION_HISTORY = `${COMMAND_PREFIX}.workflow.view-execution-history`;
export const EDIT_CONNECTOR_RULE = `${COMMAND_PREFIX}.connector-rule.edit`;
export const NEW_CONNECTOR_RULE = `${COMMAND_PREFIX}.new-connector-rule`;
export const UPLOAD_CONNECTOR_RULE = `${COMMAND_PREFIX}.connector-rule.upload`;
export const VALIDATE_CONNECTOR_RULE = `${COMMAND_PREFIX}.connector-rule.validate`;
export const EXPORT_CONNECTOR_RULE_SCRIPT_EDITOR = `${COMMAND_PREFIX}.connector-rule.export-script.editor`;
export const EXPORT_CONNECTOR_RULE_SCRIPT_VIEW = `${COMMAND_PREFIX}.connector-rule.export-script.view`;
export const SORT_IDENTITY_PROFILES_BY_NAME = `${COMMAND_PREFIX}.identity-profiles.sort.name`;
export const SORT_IDENTITY_PROFILES_BY_PRIORITY = `${COMMAND_PREFIX}.identity-profiles.sort.priority`;
export const REFRESH_IDENTITY_PROFILE = `${COMMAND_PREFIX}.identity-profile.refresh`;
export const TREE_VIEW = `${COMMAND_PREFIX}.view`;

export const LOAD_MORE = `${COMMAND_PREFIX}.load-more`;

// New Access Profile
export const NEW_ACCESS_PROFILE_VIEW = `${COMMAND_PREFIX}.new-access-profile.view`;
export const NEW_ACCESS_PROFILE_VIEW_ICON = `${COMMAND_PREFIX}.new-access-profile.view-icon`;
export const NEW_ACCESS_PROFILE_PALETTE = `${COMMAND_PREFIX}.new-access-profile.palette`;

// New Role
export const NEW_ROLE_VIEW = `${COMMAND_PREFIX}.new-role.view`;
export const NEW_ROLE_VIEW_ICON = `${COMMAND_PREFIX}.new-role.view-icon`;
export const NEW_ROLE_PALETTE = `${COMMAND_PREFIX}.new-role.palette`;

// Access Profile Import / Export
export const EXPORT_ACCESS_PROFILE_VIEW = `${COMMAND_PREFIX}.csv.export.access-profiles.view`;
export const EXPORT_ACCESS_PROFILE_ICON_VIEW = `${COMMAND_PREFIX}.csv.export.access-profiles-icon.view`;
export const IMPORT_ACCESS_PROFILE_VIEW = `${COMMAND_PREFIX}.csv.import.access-profiles.view`;
export const IMPORT_ACCESS_PROFILE_ICON_VIEW = `${COMMAND_PREFIX}.csv.import.access-profiles-icon.view`;
export const IMPORT_ACCESS_PROFILE_EXPLORER = `${COMMAND_PREFIX}.csv.import.access-profiles.explorer`;
export const ACCESS_PROFILE_FILTER_VIEW = `${COMMAND_PREFIX}.access-profiles.filter`;
export const ACCESS_PROFILE_UPDATE_FILTER_VIEW = `${COMMAND_PREFIX}.access-profiles.update-filter`;

// Role Import / Export
export const EXPORT_ROLE_VIEW = `${COMMAND_PREFIX}.csv.export.roles.view`;
export const EXPORT_ROLE_ICON_VIEW = `${COMMAND_PREFIX}.csv.export.roles-icon.view`;
export const IMPORT_ROLE_VIEW = `${COMMAND_PREFIX}.csv.import.roles.view`;
export const IMPORT_ROLE_ICON_VIEW = `${COMMAND_PREFIX}.csv.import.roles-icon.view`;
export const IMPORT_ROLE_EXPLORER = `${COMMAND_PREFIX}.csv.import.roles.explorer`;
export const ROLE_FILTER_VIEW = `${COMMAND_PREFIX}.roles.filter`;
export const ROLE_UPDATE_FILTER_VIEW = `${COMMAND_PREFIX}.roles.update-filter`;

// FORMS
export const EXPORT_FORMS_VIEW = `${COMMAND_PREFIX}.forms.export.view`;
export const EXPORT_FORMS_ICON_VIEW = `${COMMAND_PREFIX}.forms.export.icon-view`;
export const EXPORT_FORM_VIEW = `${COMMAND_PREFIX}.form.export.view`;
export const IMPORT_FORMS_VIEW = `${COMMAND_PREFIX}.forms.import.view`;
export const IMPORT_FORMS_ICON_VIEW = `${COMMAND_PREFIX}.forms.import.icon-view`;

export const EDIT_PUBLIC_IDENTITIES_CONFIG = `${COMMAND_PREFIX}.tenant.edit.public-identities-config`;
export const EDIT_ACCESS_REQUEST_CONFIG = `${COMMAND_PREFIX}.tenant.edit.access-request-config`;
export const EDIT_PASSWORD_ORG_CONFIG = `${COMMAND_PREFIX}.tenant.edit.password-org-config`;
export const GENERATE_DIGIT_TOKEN = `${COMMAND_PREFIX}.tenant.generate-digit-token`;
export const EMAIL_SETTINGS = `${COMMAND_PREFIX}.tenant.email-settings`;

//Search Attribute
export const NEW_SEARCH_ATTRIBUTE = `${COMMAND_PREFIX}.new-attribute-search.view`;

//Identity Attribute
export const NEW_IDENTITY_ATTRIBUTE = `${COMMAND_PREFIX}.new-identity-attribute.view`;

//Identities
export const IDENTITIES_SEARCH = `${COMMAND_PREFIX}.identities.search`;
export const IDENTITIES_ICON_SEARCH = `${COMMAND_PREFIX}.identities.icon-search`;
export const IDENTITIES_DELETE = `${COMMAND_PREFIX}.identities.delete`;
export const IDENTITIES_ATT_SYNC = `${COMMAND_PREFIX}.identities.att-sync`;
export const IDENTITIES_PROCESS = `${COMMAND_PREFIX}.identities.process`;

// Applications
export const APPLICATIONS_FILTER_SOURCE_VIEW = `${COMMAND_PREFIX}.applications.filter.source`;
export const APPLICATIONS_UPDATE_FILTER_SOURCE_VIEW = `${COMMAND_PREFIX}.applications.update-filter.source`;
export const APPLICATIONS_FILTER_NAME_VIEW = `${COMMAND_PREFIX}.applications.filter.name`;
export const REMOVE_ACCESS_PROFILE_FROM_APPLICATION = `${COMMAND_PREFIX}.applications.remove.access-profile`;
export const ADD_ACCESS_PROFILE_FROM_APPLICATION = `${COMMAND_PREFIX}.applications.add.access-profile`;
export const NEW_APPLICATION = `${COMMAND_PREFIX}.applications.new`;
export const NEW_APPLICATION_ICON = `${COMMAND_PREFIX}.applications.new.view-icon`;
export const NEW_APPLICATION_PALETTE = `${COMMAND_PREFIX}.applications.new.palette`;

// Certification Campaigns
export const VIEW_CAMPAIGN_PANEL = `${COMMAND_PREFIX}.campaigns.panel`;
export const EXPORT_CAMPAIGN_REPORT = `${COMMAND_PREFIX}.campaigns.export.report`;
export const ESCALATE_CERTIFICATION = `${COMMAND_PREFIX}.campaigns.escalate`;
export const CAMPAIGN_SEND_REMINDER = `${COMMAND_PREFIX}.campaigns.reminder.send`;
export const CAMPAIGN_CONFIGURE_REMINDER = `${COMMAND_PREFIX}.campaigns.reminder.configure`;
export const REASSIGN_CAMPAIGN_OWNERS = `${COMMAND_PREFIX}.campaigns.reassign.owners`;
export const REASSIGN_CAMPAIGN_CUSTOM = `${COMMAND_PREFIX}.campaigns.reassign.custom`;
export const CAMPAIGN_FILTER_NAME = `${COMMAND_PREFIX}.campaigns.filter.name`;
export const CAMPAIGN_FILTER_STATUS = `${COMMAND_PREFIX}.campaigns.filter.status`;

// Service Desk
export const EDIT_SERVICE_DESK_INTEGRATIONS_STATUS_CHECK_CONFIGURATION = `${COMMAND_PREFIX}.service-desk-integrations.edit.status-check-configuration`;
