/**
 * Compatibility barrel for sailpoint-api-client SDK 2.x.
 * Re-exports model types from submodule paths and provides backward-compatible
 * aliases for names used with SDK 1.x / beta / v2025 APIs.
 */

// --- Search ---
export { Index, Search } from 'sailpoint-api-client/dist/search/api';
export type { Index as IndexV2025, Search as SearchV2025 } from 'sailpoint-api-client/dist/search/api';

// --- Paginator helpers (re-exported from main entry in SDK 2.x) ---
export type { ExtraParams, PaginationParams } from 'sailpoint-api-client/dist/paginator';

// --- Search document types (untyped search results) ---
export type IdentityDocument = Record<string, any>;
export type SearchDocument = Record<string, any>;
export type AccessProfileDocument = Record<string, any>;
export type EntitlementDocument = Record<string, any>;
export type RoleDocument = Record<string, any>;
export type EventDocument = Record<string, any>;
export type AccountActivityDocument = Record<string, any>;
export type AccessProfileDocumentV2025 = AccessProfileDocument;
export type EntitlementDocumentV2025 = EntitlementDocument;
export type RoleDocumentV2025 = RoleDocument;
export type EventDocumentV2025 = EventDocument;
export type AccountActivityDocumentV2025 = AccountActivityDocument;

// --- Accounts ---
export type {
	Account,
	AccountsApiListAccountsV1Request,
} from 'sailpoint-api-client/dist/accounts/api';
export type { AccountsApiListAccountsV1Request as AccountsApiListAccountsRequest } from 'sailpoint-api-client/dist/accounts/api';

// --- Account activities ---
export type {
	AccountActivity,
} from 'sailpoint-api-client/dist/account_activities/api';

// --- Identities ---
export type {
	Identity,
	IdentitiesApiListIdentitiesV1Request,
	IdentitySyncJob,
	ProcessIdentitiesRequest,
	InviteIdentitiesRequest,
	TaskResultResponse,
} from 'sailpoint-api-client/dist/identities/api';
export type { Identity as IdentityBeta } from 'sailpoint-api-client/dist/identities/api';
export type { IdentitiesApiListIdentitiesV1Request as IdentitiesBetaApiListIdentitiesRequest } from 'sailpoint-api-client/dist/identities/api';
export type { IdentitySyncJob as IdentitySyncJobBeta } from 'sailpoint-api-client/dist/identities/api';
export type { TaskResultResponse as TaskResultResponseBeta } from 'sailpoint-api-client/dist/identities/api';

// --- Identity profiles & lifecycle ---
export type {
	IdentityProfile,
	IdentityAttributeTransform,
	IdentityPreviewResponse,
} from 'sailpoint-api-client/dist/identity_profiles/api';
export type { IdentityProfile as IdentityProfileV2025 } from 'sailpoint-api-client/dist/identity_profiles/api';
export type { IdentityAttributeTransform as IdentityAttributeTransformV2025 } from 'sailpoint-api-client/dist/identity_profiles/api';
export type { IdentityPreviewResponse as IdentityPreviewResponseV2025 } from 'sailpoint-api-client/dist/identity_profiles/api';

export type { LifecycleState } from 'sailpoint-api-client/dist/lifecycle_states/api';

// --- Identity attributes ---
export type { IdentityAttribute2 } from 'sailpoint-api-client/dist/identity_attributes/api';
export type { IdentityAttribute2 as IdentityAttributeBeta } from 'sailpoint-api-client/dist/identity_attributes/api';

// --- Sources ---
export type {
	Source,
	Schema,
	StatusResponse,
	SourceCluster,
	AttrSyncSourceConfig,
	NativeChangeDetectionConfig,
	AccountDeleteConfigDto,
	LoadEntitlementTask,
	TaskResultDto,
	ProvisioningPolicyDto,
	PasswordPolicyHoldersDtoInner,
	ResourceObjectsResponse,
} from 'sailpoint-api-client/dist/sources/api';
export type { Source as SourceV2025 } from 'sailpoint-api-client/dist/sources/api';
export type { AttrSyncSourceConfig as AttrSyncSourceConfigV2025 } from 'sailpoint-api-client/dist/sources/api';
export type { NativeChangeDetectionConfig as NativeChangeDetectionConfigV2026 } from 'sailpoint-api-client/dist/sources/api';
export type { AccountDeleteConfigDto as AccountDeleteConfigDtoV2026 } from 'sailpoint-api-client/dist/sources/api';
export type { LoadEntitlementTask as LoadEntitlementTaskBeta } from 'sailpoint-api-client/dist/sources/api';
export type { TaskResultDto as TaskResultDtoBeta } from 'sailpoint-api-client/dist/sources/api';
export type { PasswordPolicyHoldersDtoInner as PasswordPolicyHoldersDtoInnerV2025 } from 'sailpoint-api-client/dist/sources/api';
export type { StatusResponse as StatusResponseBeta } from 'sailpoint-api-client/dist/sources/api';

// --- JsonPatch (canonical: sources submodule) ---
export type { JsonPatchOperation } from 'sailpoint-api-client/dist/sources/api';
export { JsonPatchOperationOpEnum } from 'sailpoint-api-client/dist/sources/api';
export type { JsonPatchOperation as JsonPatchOperationV2025 } from 'sailpoint-api-client/dist/sources/api';
export type { JsonPatchOperation as JsonPatchOperationBeta } from 'sailpoint-api-client/dist/sources/api';
export type { JsonPatchOperation as JsonPatchOperationV2026 } from 'sailpoint-api-client/dist/sources/api';

// --- Transforms ---
export type { Transform, TransformRead } from 'sailpoint-api-client/dist/transforms/api';
export type { Transform as TransformV2025 } from 'sailpoint-api-client/dist/transforms/api';
export type { TransformRead as TransformReadV2025 } from 'sailpoint-api-client/dist/transforms/api';

// --- Entitlements ---
export type {
	Entitlement,
	EntitlementsApiListEntitlementsV1Request,
	EntitlementSourceResetBaseReferenceDto,
} from 'sailpoint-api-client/dist/entitlements/api';
export type { Entitlement as EntitlementV2025 } from 'sailpoint-api-client/dist/entitlements/api';
export type { Entitlement as EntitlementBeta } from 'sailpoint-api-client/dist/entitlements/api';
export type { EntitlementsApiListEntitlementsV1Request as EntitlementsV2025ApiListEntitlementsRequest } from 'sailpoint-api-client/dist/entitlements/api';
export type { EntitlementSourceResetBaseReferenceDto as EntitlementSourceResetBaseReferenceDtoBeta } from 'sailpoint-api-client/dist/entitlements/api';

// --- Access profiles ---
export type {
	AccessProfile,
	AccessProfilesApiListAccessProfilesV1Request,
	AccessProfileSourceRef,
	Requestability,
} from 'sailpoint-api-client/dist/access_profiles/api';
export type { AccessProfile as AccessProfileV2025 } from 'sailpoint-api-client/dist/access_profiles/api';
export type { AccessProfilesApiListAccessProfilesV1Request as AccessProfilesV2025ApiListAccessProfilesRequest } from 'sailpoint-api-client/dist/access_profiles/api';
export type { AccessProfilesApiListAccessProfilesV1Request as AccessProfilesApiListAccessProfilesRequest } from 'sailpoint-api-client/dist/access_profiles/api';
export type {
	AccessProfileApprovalScheme,
} from 'sailpoint-api-client/dist/access_profiles/api';
export type { AccessProfileApprovalScheme as AccessProfileApprovalSchemeV2025 } from 'sailpoint-api-client/dist/access_profiles/api';

// --- Roles ---
export type {
	Role,
	RolesApiListRolesV1Request,
	AccessProfileRef,
	EntitlementRef,
	AdditionalOwnerRef,
	AccessDuration,
	ApprovalSchemeForRole,
	RequestabilityForRole,
	RevocabilityForRole,
	RoleMembershipSelector,
	RoleCriteriaKey,
	RoleCriteriaLevel1,
	RoleCriteriaLevel2,
	RoleCriteriaLevel3,
	AttributeDTO,
	AttributeDTOList,
	DimensionSchema,
} from 'sailpoint-api-client/dist/roles/api';
export type { EntitlementRef as EntitlementRefV2025 } from 'sailpoint-api-client/dist/roles/api';
export type { Role as RoleV2025 } from 'sailpoint-api-client/dist/roles/api';
export type { RolesApiListRolesV1Request as RolesV2025ApiListRolesRequest } from 'sailpoint-api-client/dist/roles/api';
export type { RolesApiListRolesV1Request as RolesApiListRolesRequest } from 'sailpoint-api-client/dist/roles/api';
export type { AccessDuration as AccessDurationV2025 } from 'sailpoint-api-client/dist/roles/api';
export type { AdditionalOwnerRef as AdditionalOwnerRefV2025 } from 'sailpoint-api-client/dist/roles/api';
export type { ApprovalSchemeForRole as ApprovalSchemeForRoleV2025 } from 'sailpoint-api-client/dist/roles/api';
export type { AttributeDTOList as AttributeDTOListV2025 } from 'sailpoint-api-client/dist/roles/api';
export type { DimensionSchema as DimensionSchemaV2025 } from 'sailpoint-api-client/dist/roles/api';

// --- Dimensions ---
export type {
	Dimension,
	DimensionsApiListDimensionsV1Request,
	DimensionCriteriaLevel1,
	DimensionMembershipSelector,
} from 'sailpoint-api-client/dist/dimensions/api';
export type { Dimension as DimensionV2025 } from 'sailpoint-api-client/dist/dimensions/api';
export type { DimensionsApiListDimensionsV1Request as DimensionsV2025ApiListDimensionsRequest } from 'sailpoint-api-client/dist/dimensions/api';
export type { DimensionCriteriaLevel1 as DimensionCriteriaLevel1V2025 } from 'sailpoint-api-client/dist/dimensions/api';
export type { DimensionMembershipSelector as DimensionMembershipSelectorV2025 } from 'sailpoint-api-client/dist/dimensions/api';

// --- Public identities ---
export type {
	PublicIdentity,
	PublicIdentitiesApiGetPublicIdentitiesV1Request,
} from 'sailpoint-api-client/dist/public_identities/api';
export type { PublicIdentitiesApiGetPublicIdentitiesV1Request as PublicIdentitiesApiGetPublicIdentitiesRequest } from 'sailpoint-api-client/dist/public_identities/api';
export type { PublicIdentitiesApiGetPublicIdentitiesV1Request as PublicIdentitiesV2025ApiGetPublicIdentitiesRequest } from 'sailpoint-api-client/dist/public_identities/api';

// --- Workflows ---
export type {
	Workflow,
	WorkflowBody,
	WorkflowExecution,
	WorkflowExecutionEvent,
	CreateWorkflowV1Request,
} from 'sailpoint-api-client/dist/workflows/api';
export type { Workflow as WorkflowV2025 } from 'sailpoint-api-client/dist/workflows/api';
export type { Workflow as WorkflowBeta } from 'sailpoint-api-client/dist/workflows/api';
export type { WorkflowBody as WorkflowBodyV2025 } from 'sailpoint-api-client/dist/workflows/api';
export type { WorkflowExecution as WorkflowExecutionBeta } from 'sailpoint-api-client/dist/workflows/api';
export type { WorkflowExecution as WorkflowExecutionV2025 } from 'sailpoint-api-client/dist/workflows/api';
export type { WorkflowExecutionEvent as WorkflowExecutionEventV2025 } from 'sailpoint-api-client/dist/workflows/api';
export type { CreateWorkflowV1Request as CreateWorkflowRequestV2025 } from 'sailpoint-api-client/dist/workflows/api';

// --- Connector rules ---
export type {
	ConnectorRuleResponse,
	ConnectorRuleUpdateRequest,
	ConnectorRuleValidationResponse,
} from 'sailpoint-api-client/dist/connector_rule_management/api';
export type { ConnectorRuleResponse as ConnectorRuleResponseBeta } from 'sailpoint-api-client/dist/connector_rule_management/api';
export type { ConnectorRuleResponse as ConnectorRuleResponseV2025 } from 'sailpoint-api-client/dist/connector_rule_management/api';
export type { ConnectorRuleUpdateRequest as ConnectorRuleUpdateRequestBeta } from 'sailpoint-api-client/dist/connector_rule_management/api';
export type { ConnectorRuleValidationResponse as ConnectorRuleValidationResponseBeta } from 'sailpoint-api-client/dist/connector_rule_management/api';

// --- SP Config ---
export type {
	ExportPayload,
	ObjectExportImportOptions,
	SpConfigJob,
	SpConfigExportResults,
	SpConfigImportResults,
} from 'sailpoint-api-client/dist/sp_config/api';
export type { ImportOptions as ImportOptionsBeta } from 'sailpoint-api-client/dist/sp_config/api';
export type { ObjectExportImportOptions as ObjectExportImportOptionsBeta } from 'sailpoint-api-client/dist/sp_config/api';
export type { SpConfigJob as SpConfigJobBeta } from 'sailpoint-api-client/dist/sp_config/api';
export type { SpConfigExportResults as SpConfigExportResultsBeta } from 'sailpoint-api-client/dist/sp_config/api';
export type { SpConfigImportResults as SpConfigImportResultsBeta } from 'sailpoint-api-client/dist/sp_config/api';

// --- Task management ---
export type { TaskStatus } from 'sailpoint-api-client/dist/task_management/api';
export type { TaskStatus as TaskStatusBeta } from 'sailpoint-api-client/dist/task_management/api';

// --- Governance groups ---
export type { WorkgroupDto } from 'sailpoint-api-client/dist/governance_groups/api';
export type { WorkgroupDto as WorkgroupDtoBeta } from 'sailpoint-api-client/dist/governance_groups/api';
export type { WorkgroupDto as WorkgroupDtoV2025 } from 'sailpoint-api-client/dist/governance_groups/api';

// --- Managed clusters ---
export type { ManagedCluster, StandardLevel } from 'sailpoint-api-client/dist/managed_clusters/api';
export type { ManagedCluster as ManagedClusterBeta } from 'sailpoint-api-client/dist/managed_clusters/api';
export type { StandardLevel as StandardLevelBeta } from 'sailpoint-api-client/dist/managed_clusters/api';

// --- Custom forms ---
export type {
	FormDefinitionResponse,
	CreateFormDefinitionRequest,
	ImportFormDefinitionsV1RequestInner,
	ExportFormDefinitionsByTenantV1200ResponseInner,
} from 'sailpoint-api-client/dist/custom_forms/api';
export type { FormDefinitionResponse as FormDefinitionResponseV2025 } from 'sailpoint-api-client/dist/custom_forms/api';
export type { FormDefinitionResponse as FormDefinitionResponseBeta } from 'sailpoint-api-client/dist/custom_forms/api';
export type { CreateFormDefinitionRequest as CreateFormDefinitionRequestV2025 } from 'sailpoint-api-client/dist/custom_forms/api';
export type { ImportFormDefinitionsV1RequestInner as ImportFormDefinitionsRequestInnerBeta } from 'sailpoint-api-client/dist/custom_forms/api';
export type { ExportFormDefinitionsByTenantV1200ResponseInner as ExportFormDefinitionsByTenant200ResponseInnerBeta } from 'sailpoint-api-client/dist/custom_forms/api';

// --- Search attribute configuration ---
export type { SearchAttributeConfig } from 'sailpoint-api-client/dist/search_attribute_configuration/api';
export type { SearchAttributeConfig as SearchAttributeConfigBeta } from 'sailpoint-api-client/dist/search_attribute_configuration/api';

// --- Service desk ---
export type { ServiceDeskIntegrationDto } from 'sailpoint-api-client/dist/service_desk_integration/api';

// --- Segments ---
export type { Segment } from 'sailpoint-api-client/dist/segments/api';

// --- Notifications ---
export type { TemplateDto } from 'sailpoint-api-client/dist/notifications/api';
export type { TemplateDto as TemplateDtoBeta } from 'sailpoint-api-client/dist/notifications/api';

// --- Certifications & campaigns ---
export type {
	CertificationTask,
	IdentityCertificationDto,
	AccessReviewItem,
	CampaignReference,
	Reviewer,
	ReassignReference,
	CertificationsApiReassignIdentityCertificationsV1Request,
	CertificationsApiMakeIdentityDecisionV1Request,
	CertificationsApiSubmitReassignCertsAsyncV1Request,
} from 'sailpoint-api-client/dist/certifications/api';
export type { IdentityCertificationDto as IdentityCertificationDtoV2025 } from 'sailpoint-api-client/dist/certifications/api';
export type { AccessReviewItem as AccessReviewItemV2025 } from 'sailpoint-api-client/dist/certifications/api';
export type { CertificationsApiReassignIdentityCertificationsV1Request as CertificationsV2025ApiReassignIdentityCertificationsRequest } from 'sailpoint-api-client/dist/certifications/api';
export type { CertificationsApiMakeIdentityDecisionV1Request as CertificationsV2025ApiMakeIdentityDecisionRequest } from 'sailpoint-api-client/dist/certifications/api';
export type { CertificationsApiSubmitReassignCertsAsyncV1Request as CertificationsV2025ApiSubmitReassignCertsAsyncRequest } from 'sailpoint-api-client/dist/certifications/api';

export type {
	SlimCampaign,
	GetActiveCampaignsV1200ResponseInner,
	CertificationCampaignsApiMoveV1Request,
} from 'sailpoint-api-client/dist/certification_campaigns/api';
export type { GetActiveCampaignsV1200ResponseInner as GetActiveCampaigns200ResponseInnerV2025 } from 'sailpoint-api-client/dist/certification_campaigns/api';
export type { CertificationCampaignsApiMoveV1Request as CertificationCampaignsV2025ApiMoveRequest } from 'sailpoint-api-client/dist/certification_campaigns/api';
export { SlimCampaignStatusEnum as CampaignStatusV3 } from 'sailpoint-api-client/dist/certification_campaigns/api';

export type { IdentityCertDecisionSummary } from 'sailpoint-api-client/dist/certification_summaries/api';
export type { IdentityCertDecisionSummary as IdentityCertDecisionSummaryV2025 } from 'sailpoint-api-client/dist/certification_summaries/api';

// --- SOD policies ---
export type { SodPolicy } from 'sailpoint-api-client/dist/sod_policies/api';
export type { SodPolicy as SodPolicyV2024 } from 'sailpoint-api-client/dist/sod_policies/api';

// --- Apps ---
export type { SourceApp, SourceAppPatchDto } from 'sailpoint-api-client/dist/apps/api';
export type { SourceApp as SourceAppBeta } from 'sailpoint-api-client/dist/apps/api';
export type { SourceAppPatchDto as SourceAppPatchDtoV2025 } from 'sailpoint-api-client/dist/apps/api';

// --- Configuration hub ---
export type { BackupResponse } from 'sailpoint-api-client/dist/configuration_hub/api';
export type { BackupResponse as BackupResponseV2024 } from 'sailpoint-api-client/dist/configuration_hub/api';

// --- Password configuration & policies ---
export type { PasswordOrgConfig } from 'sailpoint-api-client/dist/password_configuration/api';
export type { PasswordOrgConfig as PasswordOrgConfigV2025 } from 'sailpoint-api-client/dist/password_configuration/api';
export type { PasswordPolicyV3Dto } from 'sailpoint-api-client/dist/password_policies/api';
export type { PasswordPolicyV3Dto as PasswordPolicyV3DtoV2025 } from 'sailpoint-api-client/dist/password_policies/api';
export type { PasswordSyncGroup } from 'sailpoint-api-client/dist/password_sync_groups/api';
export type { PasswordSyncGroup as PasswordSyncGroupV2025 } from 'sailpoint-api-client/dist/password_sync_groups/api';

// --- Machine identities & subtypes ---
export type {
	MachineIdentityResponse,
	MachineIdentitiesApiListMachineIdentitiesV1Request,
} from 'sailpoint-api-client/dist/machine_identities/api';
export type { MachineIdentityResponse as MachineIdentityResponseV2025 } from 'sailpoint-api-client/dist/machine_identities/api';
export type { MachineIdentitiesApiListMachineIdentitiesV1Request as MachineIdentitiesV2025ApiListMachineIdentitiesRequest } from 'sailpoint-api-client/dist/machine_identities/api';

export type {
	SourceSubtypeWithSource,
	CreateSourceSubtypeV1Request,
} from 'sailpoint-api-client/dist/machine_account_subtypes/api';
export type { SourceSubtypeWithSource as SourceSubtypeWithSourceV2026 } from 'sailpoint-api-client/dist/machine_account_subtypes/api';
export type { CreateSourceSubtypeV1Request as CreateSourceSubtypeRequestV2026 } from 'sailpoint-api-client/dist/machine_account_subtypes/api';

// --- Privilege criteria ---
export type {
	PrivilegeCriteriaDTO,
	CreatePrivilegeCriteriaRequest,
} from 'sailpoint-api-client/dist/privilege_criteria/api';
export type { PrivilegeCriteriaDTO as PrivilegeCriteriaDTOV2026 } from 'sailpoint-api-client/dist/privilege_criteria/api';
export type { CreatePrivilegeCriteriaRequest as CreatePrivilegeCriteriaRequestV2026 } from 'sailpoint-api-client/dist/privilege_criteria/api';

export type { PrivilegeCriteriaConfigDTO } from 'sailpoint-api-client/dist/privilege_criteria_configuration/api';
export type { PrivilegeCriteriaConfigDTO as PrivilegeCriteriaConfigDTOV2026 } from 'sailpoint-api-client/dist/privilege_criteria_configuration/api';

// --- Machine classification ---
export type { MachineClassificationConfig } from 'sailpoint-api-client/dist/machine_classification_config/api';
export type { MachineClassificationConfig as MachineClassificationConfigV2026 } from 'sailpoint-api-client/dist/machine_classification_config/api';

// --- Auth users & custom user levels ---
export type { AuthUser, AuthUser as AuthUserV2025 } from 'sailpoint-api-client/dist/auth_users/api';

export type {
	UserLevelSummaryDTO,
} from 'sailpoint-api-client/dist/custom_user_levels/api';
export type { UserLevelSummaryDTO as UserLevelSummaryDTOV2025 } from 'sailpoint-api-client/dist/custom_user_levels/api';

// --- Access request approvals ---
export type { PendingApproval } from 'sailpoint-api-client/dist/access_request_approvals/api';
export type { PendingApproval as PendingApprovalV2025 } from 'sailpoint-api-client/dist/access_request_approvals/api';

// --- Access requests ---
export type {
	AccessRequest,
	AccessRequestItem,
	AccessRequestResponse,
} from 'sailpoint-api-client/dist/access_requests/api';
export type { AccessRequestItemTypeEnum } from 'sailpoint-api-client/dist/access_requests/api';
export type { RequestedItemStatus } from 'sailpoint-api-client/dist/access_requests/api';
export type { AccessRequestPhases } from 'sailpoint-api-client/dist/access_requests/api';
export { AccessRequestType, RequestedItemStatusRequestState } from 'sailpoint-api-client/dist/access_requests/api';

// --- Runtime value aliases (const enums / objects imported as values) ---
export {
	CompletionStatus,
	ExecutionStatus,
	ProvisioningState,
} from 'sailpoint-api-client/dist/account_activities/api';

export { UsageType as UsageTypeBeta } from 'sailpoint-api-client/dist/sources/api';
export { StatusResponseStatusEnum as StatusResponseBetaStatusBeta } from 'sailpoint-api-client/dist/sources/api';
export { JsonPatchOperationOpEnum as JsonPatchOperationV2025OpV2025 } from 'sailpoint-api-client/dist/sources/api';

export { AccessProfileApprovalSchemeApproverTypeEnum as AccessProfileApprovalSchemeV2025ApproverTypeV2025 } from 'sailpoint-api-client/dist/access_profiles/api';

export {
	AccessDurationTimeUnitEnum as AccessDurationV2025TimeUnitV2025,
	ApprovalSchemeForRoleApproverTypeEnum as ApprovalSchemeForRoleV2025ApproverTypeV2025,
	RoleCriteriaKeyType,
	RoleCriteriaOperation,
	RoleCriteriaOperation as RoleCriteriaOperationV2025,
	RoleMembershipSelectorType,
} from 'sailpoint-api-client/dist/roles/api';

export {
	DimensionCriteriaKeyType as DimensionCriteriaKeyTypeV2025,
	DimensionCriteriaOperation as DimensionCriteriaOperationV2025,
} from 'sailpoint-api-client/dist/dimensions/api';

export {
	ExportPayloadIncludeTypesEnum as ExportPayloadBetaIncludeTypesBeta,
	ExportPayloadIncludeTypesEnum as ExportPayloadV2025IncludeTypesV2025,
	ExportPayloadExcludeTypesEnum as ExportPayloadBetaExcludeTypesBeta,
	ImportOptionsIncludeTypesEnum as ImportOptionsBetaIncludeTypesBeta,
	SpConfigJobStatusEnum as SpConfigJobBetaStatusBeta,
} from 'sailpoint-api-client/dist/sp_config/api';

export { TaskStatusCompletionStatusEnum as TaskStatusBetaCompletionStatusBeta } from 'sailpoint-api-client/dist/task_management/api';

export { AuthUserCapabilitiesEnum as AuthUserV2025CapabilitiesV2025 } from 'sailpoint-api-client/dist/auth_users/api';
export { ListUserLevelsV1DetailLevelEnum as ListUserLevelsDetailLevelV2025 } from 'sailpoint-api-client/dist/custom_user_levels/api';

export { WorkflowExecutionStatusEnum as WorkflowExecutionV2025StatusV2025 } from 'sailpoint-api-client/dist/workflows/api';

export { BackupResponseStatusEnum as BackupResponseV2024StatusV2024 } from 'sailpoint-api-client/dist/configuration_hub/api';

export {
	GetActiveCampaignsV1200ResponseInnerStatusEnum as GetActiveCampaigns200ResponseInnerV2025StatusV2025,
} from 'sailpoint-api-client/dist/certification_campaigns/api';
export type { AdminReviewReassignReassignTo as AdminReviewReassignReassignToV2025 } from 'sailpoint-api-client/dist/certification_campaigns/api';

export {
	CertificationDecision as CertificationDecisionV2025,
	DtoType,
	DtoType as DtoTypeV2025,
	ReassignReferenceTypeEnum as ReassignReferenceTypeV3,
	ReassignReferenceTypeEnum as ReassignReferenceV2025TypeV2025,
} from 'sailpoint-api-client/dist/certifications/api';
export type {
	ReviewDecision as ReviewDecisionV2025,
	ReassignReference as ReassignReferenceV2025,
	ReviewReassign,
} from 'sailpoint-api-client/dist/certifications/api';
export type { ReviewReassign as ReviewReassignV2025 } from 'sailpoint-api-client/dist/certifications/api';
export type { AdminReviewReassign as AdminReviewReassignV2025 } from 'sailpoint-api-client/dist/certification_campaigns/api';
