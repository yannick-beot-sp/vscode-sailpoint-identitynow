/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as os from 'os';
import * as fs from 'fs';
import FormData from "form-data";
import { File } from 'node:buffer';
import { EndpointUtils } from "../utils/EndpointUtils.js";
import { SailPointISCAuthenticationProvider } from "./AuthenticationProvider.js";
import { compareByName } from "../utils.js";
import { Account, AccountsApi, AccountsApiListAccountsV1Request, Entitlement, TaskResultDto } from "sailpoint-api-client/dist/accounts/api.js";
import { DEFAULT_ACCOUNTS_QUERY_PARAMS } from "../models/Account.js";
import { DEFAULT_ENTITLEMENTS_QUERY_PARAMS } from "../models/Entitlements.js";
import { Configuration, IdentityProfilesApi, LifecycleStatesApi, Paginator, ServiceDeskIntegrationApi, SourcesApi, TransformsApi, RolesApi, SearchApi, EntitlementsApi, AccessProfilesApi, AccessRequestApprovalsApi, AccessRequestsApi, AccountActivitiesApi, AppsApi, AuthUsersApi, CertificationCampaignsApi, CertificationsApi, CertificationSummariesApi, ConfigurationHubApi, ConnectorRuleManagementApi, CustomFormsApi, CustomUserLevelsApi, DimensionsApi, GovernanceGroupsApi, IdentitiesApi, IdentityAttributesApi, IdentityHistoryApi, MachineAccountSubtypesApi, MachineClassificationConfigApi, MachineIdentitiesApi, ManagedClustersApi, PasswordConfigurationApi, PasswordManagementApi, PasswordPoliciesApi, PasswordSyncGroupsApi, PrivilegeCriteriaApi, PrivilegeCriteriaConfigurationApi, PublicIdentitiesApi, SearchAttributeConfigurationApi, SegmentsApi, SODPoliciesApi, SPConfigApi, TaskManagementApi, WorkflowsApi, NotificationsApi } from 'sailpoint-api-client/dist/index.js';
import { DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS } from '../models/PublicIdentity.js';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ImportEntitlementsResult } from '../models/JobStatus.js';
import { basename } from 'path';
import { createReadStream } from 'fs';
import { DEFAULT_ACCESSPROFILES_QUERY_PARAMS } from "../models/AccessProfiles.js";
import { DEFAULT_ROLES_QUERY_PARAMS } from "../models/Roles.js";
import { addQueryParams } from "../utils/UriUtils.js";
import { onErrorResponse, onRequest, onResponse } from "./AxiosHandlers.js";
import { EmailTestMode } from "../models/EmailTestMode.js";
import { DEFAULT_PAGINATED_PARAMS, PaginatedSearch, PaginatedSearchRequest } from "../models/SearchQuery.js";
import {
	AccessProfileDocument,
	AccountActivityDocument,
	EntitlementDocument,
	EventDocument,
	IdentityDocument,
	RoleDocument,
	SearchDocument,
} from "../models/SearchDocument.js";
import { buildSearchQuery } from "../utils/buildSearchQuery.js";
import {
	accessItemTypeFromSearchDocument,
	buildRequestableAccessItemQuery,
	REQUESTABLE_ACCESS_INDICES,
	REQUESTABLE_ACCESS_SEARCH_FIELDS,
} from "../utils/requestableAccessSearch.js";
import { buildIdentityEventsSearchQuery, collectIdentityEventSearchTerms } from "../utils/identityEventsQuery.js";
import { AccessProfileRead } from "../models/AccessProfiles.js";
import { IdentityAccessItem, IdentityAccessItemType } from "../models/IdentityAccessItem.js";
import { HecateJobStatus } from "../models/HecateJob.js";
import { isDefaultNotificationTemplateId, notificationTemplateKeyFilter, parseDefaultNotificationTemplateId } from "../utils/notificationTemplateList.js";
import { AccountDeleteConfigDto, AttrSyncSourceConfig, JsonPatchOperation, JsonPatchOperationOpEnum, NativeChangeDetectionConfig, PasswordPolicyHoldersDtoInner, Schema, Source, StatusResponse, TransformRead } from "sailpoint-api-client/dist/sources/index.js";
import { CreateProvisioningPolicyV2, getProvisioningPoliciesPath, ProvisioningPolicyV2 } from "../models/ProvisioningPolicy.js";
import { Search, AttributeDTO, Index } from "sailpoint-api-client/dist/access_model_metadata/api.js";
import { AccessRequestResponse, RequestedItemStatus, RequestedItemStatusRequestState } from "sailpoint-api-client/dist/access_requests/api.js";
import { AccountActivity } from "sailpoint-api-client/dist/account_activities/api.js";
import { CertificationCampaignsApiMoveV1Request, CertificationTask, GetCampaignV1200Response } from "sailpoint-api-client/dist/certification_campaigns/api.js";
import { ListUserLevelsV1DetailLevelEnum, PublicIdentity, UserLevelSummaryDTO } from "sailpoint-api-client/dist/custom_user_levels/api.js";
import { IdentityProfile, IdentityAttributeTransform, IdentityPreviewResponse } from "sailpoint-api-client/dist/identity_profiles/api.js";
import { LifecycleState } from "sailpoint-api-client/dist/lifecycle_states/api.js";
import { Role, RolesApiListRolesV1Request } from "sailpoint-api-client/dist/roles/api.js";
import { Segment } from "sailpoint-api-client/dist/segments/api.js";
import { ServiceDeskIntegrationDto } from "sailpoint-api-client/dist/service_desk_integration/api.js";
import { EntitlementsApiListEntitlementsV1Request, EntitlementSourceResetBaseReferenceDto, LoadEntitlementTask } from "sailpoint-api-client/dist/entitlements/api.js";
import { TaskStatus } from "sailpoint-api-client/dist/task_management/index.js";
import { ManagedCluster, StandardLevel } from "sailpoint-api-client/dist/managed_clusters/index.js";
import { PasswordPolicyV3Dto } from "sailpoint-api-client/dist/password_policies/index.js";
import { PasswordSyncGroup } from "sailpoint-api-client/dist/password_sync_groups/index.js";
import { PendingApproval } from "sailpoint-api-client/dist/access_request_approvals/api.js";
import { AccessProfileDetails, SourceApp, SourceAppPatchDto } from "sailpoint-api-client/dist/apps/api.js";
import { AuthUser } from "sailpoint-api-client/dist/auth_users/api.js";
import { IdentityCertDecisionSummary } from "sailpoint-api-client/dist/certification_summaries/api.js";
import { IdentityCertificationDto, AccessReviewItem, CertificationsApiMakeIdentityDecisionV1Request, CertificationsApiReassignIdentityCertificationsV1Request, CertificationsApiSubmitReassignCertsAsyncV1Request } from "sailpoint-api-client/dist/certifications/api.js";
import { ConnectorRuleResponse, ConnectorRuleUpdateRequest, ConnectorRuleValidationResponse } from "sailpoint-api-client/dist/connector_rule_management/api.js";
import { FormDefinitionResponse, CreateFormDefinitionRequest, ExportFormDefinitionsByTenantV1200ResponseInner, ImportFormDefinitionsV1RequestInner } from "sailpoint-api-client/dist/custom_forms/api.js";
import { Dimension, DimensionsApiListDimensionsV1Request } from "sailpoint-api-client/dist/dimensions/api.js";
import { WorkgroupDto } from "sailpoint-api-client/dist/governance_groups/api.js";
import { CreateSourceSubtypeV1Request, SourceSubtypeWithSource } from "sailpoint-api-client/dist/machine_account_subtypes/api.js";
import { MachineClassificationConfig } from "sailpoint-api-client/dist/machine_classification_config/api.js";
import { MachineIdentitiesApiListMachineIdentitiesV1Request, MachineIdentityResponse } from "sailpoint-api-client/dist/machine_identities/api.js";
import { PasswordOrgConfig } from "sailpoint-api-client/dist/password_configuration/api.js";
import { CreatePrivilegeCriteriaRequest, PrivilegeCriteriaDTO } from "sailpoint-api-client/dist/privilege_criteria/api.js";
import { PrivilegeCriteriaConfigDTO } from "sailpoint-api-client/dist/privilege_criteria_configuration/api.js";
import { WorkflowBody, Workflow, WorkflowExecution, WorkflowExecutionEvent, CreateWorkflowV1Request } from "sailpoint-api-client/dist/workflows/api.js";
import { SendTestNotificationRequestDto, TemplateDto, TemplateDtoDefault } from "sailpoint-api-client/dist/notifications/api.js";
import { BackupResponse } from "sailpoint-api-client/dist/configuration_hub/api.js";
import { Identity, TaskResultResponse, IdentitySyncJob, IdentitiesApiListIdentitiesV1Request } from "sailpoint-api-client/dist/identities/api.js";
import { SearchAttributeConfig } from "sailpoint-api-client/dist/search_attribute_configuration/api.js";
import { SodPolicy } from "sailpoint-api-client/dist/sod_policies/api.js";
import { ObjectExportImportOptions, SpConfigJob, SpConfigExportResults, ImportOptions, SpConfigImportResults, ExportPayloadIncludeTypesEnum } from "sailpoint-api-client/dist/sp_config/api.js";
import { IdentityAttribute2 } from "sailpoint-api-client/dist/identity_attributes/api.js";
import { ListIdentityAccessItemsV1200ResponseInner, ListIdentityAccessItemsV1TypeEnum } from "sailpoint-api-client/dist/identity_history/api.js";
import { PublicIdentitiesApiGetPublicIdentitiesV1Request } from "sailpoint-api-client/dist/public_identities/api.js";
import { AccessProfile, AccessProfilesApiListAccessProfilesV1Request } from "sailpoint-api-client/dist/access_profiles/api.js";
import { Transform } from "sailpoint-api-client/dist/transforms/api.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
// cf. https://axios-http.com/docs/res_schema
// All header names are lower cased.
const CONTENT_TYPE_HEADER = "Content-Type";
export const USER_AGENT_HEADER = "User-Agent";
const EXTENSION_VERSION = vscode.extensions.getExtension("yannick-beot-sp.vscode-sailpoint-identitynow")?.packageJSON.version
export const USER_AGENT = `VSCode/${EXTENSION_VERSION}/${vscode.version} (${os.type()} ${os.arch()} ${os.release()})`

export const TOTAL_COUNT_HEADER = "x-total-count";

// Content types
const CONTENT_TYPE_JSON = "application/json";
const CONTENT_TYPE_FORM_URLENCODED = "application/x-www-form-urlencoded";
const CONTENT_TYPE_FORM_DATA = "multipart/form-data";
const CONTENT_TYPE_FORM_JSON_PATCH = "application/json-patch+json";

const DEFAULT_PAGINATION = 250;

const IDENTITY_ACCESS_FETCH_PAGE_SIZE = 250;
const IDENTITY_ACCESS_TYPE_SOURCES: { apiType: ListIdentityAccessItemsV1TypeEnum; itemType: IdentityAccessItemType }[] = [
	{ apiType: ListIdentityAccessItemsV1TypeEnum.Role, itemType: "ROLE" },
	{ apiType: ListIdentityAccessItemsV1TypeEnum.AccessProfile, itemType: "ACCESS_PROFILE" },
	{ apiType: ListIdentityAccessItemsV1TypeEnum.Entitlement, itemType: "ENTITLEMENT" },
];
const IDENTITY_ACCESS_TYPE_ORDER: Record<IdentityAccessItemType, number> = {
	ROLE: 0,
	ACCESS_PROFILE: 1,
	ENTITLEMENT: 2,
};

function compareIdentityAccessType(a: IdentityAccessItemType, b: IdentityAccessItemType): number {
	return IDENTITY_ACCESS_TYPE_ORDER[a] - IDENTITY_ACCESS_TYPE_ORDER[b];
}

export interface PaginatedData<T> {
	data: T[],
	count: number;
	limit: number;
	offset: number;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number | undefined;
	count: number;
	limit: number;
	offset: number;
}

export class ISCClient {

	constructor(
		public readonly tenantId: string,
		public readonly tenantName: string
	) {

	}

	private ensureOneBasedOnHeader<T>(response: AxiosResponse<T[]>, type: string, value: string): T {
		const nb = Number(response.headers[TOTAL_COUNT_HEADER]);
		if (nb !== 1) {
			const message = `Could not find ${type} ${value}. Found ${nb}`;
			console.error(message);
			throw new Error(message);
		}
		return response.data[0] as T;
	}

	private ensureOneElement<T>(input: T[], type: string, value: string): T {

		if (input === undefined || input === null || input.length !== 1) {
			const nb = input?.length ?? 0
			const message = `Could not find ${type} ${value}. Found ${nb}`;
			console.error(message);
			throw new Error(message);
		}
		return input[0]
	}

	/**
	 * Returns the Configuration needed by sailpoint typescript SDK 
	 */
	private async getApiConfiguration(accessToken?: string): Promise<Configuration> {

		if (accessToken === undefined) {
			const session = await SailPointISCAuthenticationProvider.getInstance().getSessionByTenant(this.tenantId)
			accessToken = session?.accessToken
		}

		const apiConfig = new Configuration({
			baseurl: EndpointUtils.getBaseUrl(this.tenantName),
			tokenUrl: EndpointUtils.getAccessTokenUrl(this.tenantName),
			accessToken: accessToken,
		});
		apiConfig.experimental = true;

		return apiConfig;
	}

	/**
	 * 
	 * @param contentType 
	 * @returns Create an Axios Instance
	 */
	private getAxiosWithInterceptors(): AxiosInstance {
		const instance = axios.create();
		instance.defaults.headers.common = {
			[USER_AGENT_HEADER]: USER_AGENT
		}
		instance.interceptors.request.use(
			onRequest);
		instance.interceptors.response.use(
			onResponse,
			(error) => {
				return onErrorResponse(error, instance)
			}
		);
		return instance;
	}

	/**
	 * Create an Axios Instance with default headers for content type, user agent and authorization
	 * @param contentType 
	 * @returns an Axios Instance
	 */
	private async getAxios(contentType = CONTENT_TYPE_JSON): Promise<AxiosInstance> {
		const session = await SailPointISCAuthenticationProvider.getInstance().getSessionByTenant(this.tenantId)

		const instance = axios.create({
			baseURL: EndpointUtils.getBaseUrl(this.tenantName),
			headers: {
				"Content-Type": contentType,
				"Authorization": `Bearer ${session?.accessToken}`,
				[USER_AGENT_HEADER]: USER_AGENT,
				"X-SailPoint-Experimental": true
			}

		});
		instance.interceptors.request.use(
			onRequest);
		instance.interceptors.response.use(
			onResponse,
			(error) => {
				return onErrorResponse(error, instance)
			}
		);
		return instance;
	}

	/////////////////////
	//#region Sources
	/////////////////////

	public async pingCluster(sourceId: string): Promise<StatusResponse> {
		console.log("> pingClusterConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const response = await api.pingClusterV1({ sourceId })
		return response.data;
	}

	public async testSourceConnection(sourceId: string): Promise<StatusResponse> {
		console.log("> testSourceConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const response = await api.testSourceConnectionV1({ sourceId })
		return response.data;
	}

	public async peekSourceConnection(sourceId: string, objectType: string, maxCount: number): Promise<StatusResponse> {
		console.log("> peekSourceConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const response = await api.searchResourceObjectsV1({
			sourceId,
			resourceObjectsRequest: {
				objectType,
				maxCount
			}
		})
		return response.data;
	}

	public async getSources(): Promise<Source[]> {
		console.log("> getSources");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listSourcesV1, { sorters: "name" });
		return result.data;
	}

	public async getSourcesByOwner(ownerId: string): Promise<Source[]> {
		console.log("> getSourcesByOwner", ownerId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listSourcesV1, { filters: `owner.id eq "${ownerId}"` });
		return result.data;
	}

	public async updateSource(id: string, operations: Array<JsonPatchOperation>): Promise<Source> {
		console.log("> updateSource", id, operations);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.updateSourceV1({ id, jsonPatchOperation: operations });
		return response.data;
	}

	public async getSourceById(id: string): Promise<Source> {
		console.log("> getSourceById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await api.getSourceV1({ id });
		return result.data;
	}

	public async getSourceByName(name: string): Promise<Source> {
		console.log("> getSourceByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await api.listSourcesV1({
			filters: `name eq "${name}"`,
			limit: 2
		})

		if (result === undefined || (result instanceof Array && result.length !== 1)) {
			throw new Error(`Could not find source ${name}`);
		}
		return result.data[0];
	}

	public async createProvisioningPolicy(sourceId: string,
		provisioningPolicyDto: CreateProvisioningPolicyV2): Promise<ProvisioningPolicyV2> {

		console.log("> createProvisioningPolicy", sourceId, provisioningPolicyDto);
		return await this.createResource(getProvisioningPoliciesPath(sourceId), provisioningPolicyDto);
	}

	public async getProvisioningPolicies(sourceId: string): Promise<ProvisioningPolicyV2[]> {
		console.log("> listProvisioningPolicies", sourceId);
		return await this.getResource(getProvisioningPoliciesPath(sourceId));
	}

	public async getSourceId(sourceName: string): Promise<string> {
		console.log("> getSourceId", sourceName);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listSourcesV1({
			filters: `name eq "${sourceName}" or id eq "${sourceName}"`,
			count: true
		});
		const source = this.ensureOneBasedOnHeader(response, "source", sourceName);
		return source.id!;
	}

	public async getSchemas(sourceId: string): Promise<Schema[]> {
		console.log("> getSchemas", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getSourceSchemasV1({ sourceId });

		return response.data;
	}

	public async createSchema(sourceId: string, schema: Schema): Promise<Schema> {
		console.log("> createSchema", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createSourceSchemaV1({ sourceId, schema });
		return response.data;
	}


	public async startEntitlementAggregation(
		sourceId: string,
		filePath?: string
	): Promise<LoadEntitlementTask> {
		console.log("> ISCClient.startEntitlementAggregation");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		let file: File | undefined = undefined
		if (filePath) {
			const fileBuffer = await fs.readFileSync(filePath);

			// Create a File object
			file = new File([fileBuffer], basename(filePath), {
				type: "text/csv"
			})
		}


		const response = await api.importEntitlementsV1({ sourceId, file })
		return response.data
	}

	public async startEntitlementReset(
		sourceId: string
	): Promise<EntitlementSourceResetBaseReferenceDto> {
		console.log("> ISCClient.startEntitlementReset");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.resetSourceEntitlementsV1({ id: sourceId })
		return response.data
	}

	public async startAccountReset(
		sourceId: string
	): Promise<TaskResultDto> {
		console.log("> ISCClient.startAccountReset");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.deleteAccountsAsyncV1({ id: sourceId })
		return response.data
	}

	public async startMachineIdentityAggregation(
		sourceId: string,
		datasetIds: string[],
		disableOptimization = false
	): Promise<any> {
		console.log("> ISCClient.startMachineIdentityAggregation");

		const apiConfig = await this.getApiConfiguration();
		const api = new MachineIdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.startMachineIdentityAggregationV1({
			sourceId,
			machineIdentityAggregationRequest: {
				disableOptimization, datasetIds
			}
		})

		return response.data;
	}

	public async startAccountAggregation(
		sourceID: string,
		disableOptimization = false,
		filePath: string | undefined = undefined
	): Promise<any> {
		console.log("> ISCClient.startAccountAggregation");

		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		let f: File | undefined = undefined
		if (filePath) {
			const mimeType = 'application/octet-stream'
			const fileBuffer = fs.readFileSync(filePath);
			const blob = new Blob([fileBuffer], { type: mimeType });
			f = new File([blob], basename(filePath), {
				type: mimeType,
			})
		}

		const response = await api.importAccountsV1({
			id: sourceID,
			disableOptimization: disableOptimization ? "true" : undefined,
			file: f
		})

		return response.data
	}

	public async getTaskStatus(
		taskId: string,
	): Promise<TaskStatus> {
		console.log("> getTaskStatus", taskId);
		const apiConfig = await this.getApiConfiguration();
		const api = new TaskManagementApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getTaskStatusV1({
			id: taskId
		})
		return response.data;
	}

	public async updateLogConfiguration(
		clusterId: string, duration: number, logLevels: {
			[key: string]: StandardLevel;
		}
	): Promise<void> {
		console.log("> updateLogConfiguration", clusterId);
		const apiConfig = await this.getApiConfiguration();
		const api = new ManagedClustersApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.putClientLogConfigurationV1({
			id: clusterId,
			putClientLogConfigurationV1Request: {
				durationMinutes: duration,
				clientId: "VSCode",
				logLevels,
				rootLevel: "INFO"
			}
		})
	}

	public async getClusterByName(name: string): Promise<ManagedCluster | undefined> {
		console.log("> getClusterByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new ManagedClustersApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getManagedClustersV1({ filters: `name eq "${name}"` });
		return response.data?.[0];
	}

	public async getPasswordPolicyHolders(sourceId: string): Promise<PasswordPolicyHoldersDtoInner[]> {
		console.log("> getPasswordPolicyHolders", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listPasswordPolicyHoldersOnSourceV1({ sourceId });
		return response.data;
	}

	public async updatePasswordPolicyHolders(
		sourceId: string,
		holders: PasswordPolicyHoldersDtoInner[]
	): Promise<PasswordPolicyHoldersDtoInner[]> {
		console.log("> updatePasswordPolicyHolders", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.updatePasswordPolicyHoldersV1({
			sourceId,
			passwordPolicyHoldersDtoInner: holders
		});
		return response.data;
	}

	public async getPasswordPolicies(): Promise<PasswordPolicyV3Dto[]> {
		console.log("> getPasswordPolicies");
		const apiConfig = await this.getApiConfiguration();
		const api = new PasswordPoliciesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listPasswordPoliciesV1();
		return response.data;
	}

	public async getPasswordPolicyByName(name: string): Promise<PasswordPolicyV3Dto | undefined> {
		console.log("> getPasswordPolicyByName", name);
		const policies = await this.getPasswordPolicies();
		return policies.find(p => p.name === name);
	}

	public async createPasswordPolicy(policy: PasswordPolicyV3Dto): Promise<PasswordPolicyV3Dto> {
		console.log("> createPasswordPolicy", policy.name);
		const apiConfig = await this.getApiConfiguration();
		const api = new PasswordPoliciesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createPasswordPolicyV1({ passwordPolicyV3Dto: policy });
		return response.data;
	}

	public async getPasswordSyncGroups(): Promise<PasswordSyncGroup[]> {
		console.log("> getPasswordSyncGroups");
		const apiConfig = await this.getApiConfiguration();
		const api = new PasswordSyncGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getPasswordSyncGroupsV1();
		return response.data;
	}

	public async getPasswordSyncGroupByName(name: string): Promise<PasswordSyncGroup | undefined> {
		console.log("> getPasswordSyncGroupByName", name);
		const groups = await this.getPasswordSyncGroups();
		return groups.find(g => g.name === name);
	}

	public async createPasswordSyncGroup(group: PasswordSyncGroup): Promise<PasswordSyncGroup> {
		console.log("> createPasswordSyncGroup", group.name);
		const apiConfig = await this.getApiConfiguration();
		const api = new PasswordSyncGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createPasswordSyncGroupV1({ passwordSyncGroup: group });
		return response.data;
	}

	public async updatePasswordSyncGroup(id: string, group: PasswordSyncGroup): Promise<PasswordSyncGroup> {
		console.log("> updatePasswordSyncGroup", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new PasswordSyncGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.updatePasswordSyncGroupV1({ id, passwordSyncGroup: group });
		return response.data;
	}

	public async uploadConnectorFile(sourceId: string, filePath: string): Promise<void> {
		console.log("> uploadConnectorFile", sourceId, filePath);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const mimeType = 'application/octet-stream'
		const fileBuffer = fs.readFileSync(filePath);
		const blob = new Blob([fileBuffer], { type: mimeType });
		const file = new File([blob], basename(filePath), {
			type: mimeType,
		})
		await api.importConnectorFileV1({ sourceId, file });
	}

	public async getAttributeSyncConfig(sourceId: string): Promise<AttrSyncSourceConfig> {
		console.log("> getAttributeSyncConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getSourceAttrSyncConfigV1({ id: sourceId });
		return response.data;
	}

	public async updateAttributeSyncConfig(
		sourceId: string,
		config: AttrSyncSourceConfig
	): Promise<AttrSyncSourceConfig> {
		console.log("> updateAttributeSyncConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.putSourceAttrSyncConfigV1({ id: sourceId, attrSyncSourceConfig: config });
		return response.data;
	}

	public async getNativeChangeDetectionConfig(sourceId: string): Promise<NativeChangeDetectionConfig> {
		console.log("> getNativeChangeDetectionConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getNativeChangeDetectionConfigV1({ sourceId });
		return response.data;
	}

	public async updateNativeChangeDetectionConfig(
		sourceId: string,
		config: NativeChangeDetectionConfig
	): Promise<NativeChangeDetectionConfig> {
		console.log("> updateNativeChangeDetectionConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.putNativeChangeDetectionConfigV1({
			sourceId,
			nativeChangeDetectionConfig: config
		});
		return response.data;
	}

	public async getAccountDeleteApprovalConfig(sourceId: string): Promise<AccountDeleteConfigDto> {
		console.log("> getAccountDeleteApprovalConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getAccountDeleteApprovalConfigV1({ sourceId });
		return response.data;
	}

	public async updateAccountDeleteApprovalConfig(
		sourceId: string,
		config: AccountDeleteConfigDto
	): Promise<AccountDeleteConfigDto> {
		console.log("> updateAccountDeleteApprovalConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const operations: JsonPatchOperation[] = [
			{ op: "replace", path: "/approvalRequired", value: config.approvalRequired },
			{ op: "replace", path: "/approvalConfig", value: config.approvalConfig }
		];
		const response = await api.updateAccountDeletionApprovalConfigV1({
			sourceId,
			jsonPatchOperation: operations
		});
		return response.data;
	}

	public async getMachineAccountDeleteApprovalConfig(sourceId: string): Promise<AccountDeleteConfigDto> {
		console.log("> getMachineAccountDeleteApprovalConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getMachineAccountDeletionApprovalConfigBySourceV1({ sourceId });
		return response.data;
	}

	public async updateMachineAccountDeleteApprovalConfig(
		sourceId: string,
		config: AccountDeleteConfigDto
	): Promise<AccountDeleteConfigDto> {
		console.log("> updateMachineAccountDeleteApprovalConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const operations: JsonPatchOperation[] = [
			{ op: "replace", path: "/approvalRequired", value: config.approvalRequired },
			{ op: "replace", path: "/approvalConfig", value: config.approvalConfig }
		];
		const response = await api.updateMachineAccountDeletionApprovalConfigV1({
			sourceId,
			jsonPatchOperation: operations
		});
		return response.data;
	}

	public async getMachineClassificationConfig(sourceId: string): Promise<MachineClassificationConfig | undefined> {
		console.log("> getMachineClassificationConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new MachineClassificationConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		try {
			const response = await api.getMachineClassificationConfigV1({ sourceId });
			return response.data;
		} catch {
			// No classification config defined for this source
			return undefined;
		}
	}

	public async updateMachineClassificationConfig(
		sourceId: string,
		config: MachineClassificationConfig
	): Promise<MachineClassificationConfig> {
		console.log("> updateMachineClassificationConfig", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new MachineClassificationConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.setMachineClassificationConfigV1({sourceId,
			machineClassificationConfig: config
		});
		return response.data;
	}

	public async createSourceSubtype(subtype: CreateSourceSubtypeV1Request): Promise<SourceSubtypeWithSource> {
		console.log("> createSourceSubtype", subtype.sourceId, subtype.displayName);
		const apiConfig = await this.getApiConfiguration();
		const api = new MachineAccountSubtypesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createSourceSubtypeV1({ createSourceSubtypeV1Request: subtype });
		return response.data;
	}

	public async createPrivilegeCriteria(criteria: CreatePrivilegeCriteriaRequest): Promise<PrivilegeCriteriaDTO> {
		console.log("> createPrivilegeCriteria", criteria.sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new PrivilegeCriteriaApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createCustomPrivilegeCriteriaV1({ createPrivilegeCriteriaRequest: criteria });
		return response.data;
	}

	////////////////////////
	//#endregion Sources
	////////////////////////

	/////////////////////
	//#region Transforms
	/////////////////////
	/**
	 * NOTE: "List transforms" endpoint does not support sorters yet
	 * It will return sorted by name list by name
	 * @returns all transforms of the tenant
	 */

	public async getTransforms(): Promise<TransformRead[]> {
		console.log("> getTransforms");
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listTransformsV1);
		const transforms = result.data;
		if (transforms !== undefined && transforms instanceof Array) {
			transforms.sort(compareByName);
		}
		return transforms;
	}

	public async createTransform(transform: Transform): Promise<TransformRead> {
		console.log("> createTransform");
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const response = await api.createTransformV1({
			transform: transform
		})
		return response.data

	}

	public async deleteTransformById(id: string): Promise<void> {
		console.log("> deleteTransformById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		await api.deleteTransformV1({
			id
		})

	}
	public async getTransformByName(name: string): Promise<TransformRead> {
		console.log("> getTransformByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listTransformsV1({
			filters: `name eq "${name}"`,
			limit: 1,
			count: true
		});

		const transform = this.ensureOneBasedOnHeader(response, "transform", name);
		return transform;
	}
	public async getTransformById(id: string): Promise<TransformRead> {
		console.log("> getTransformById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getTransformV1({
			id
		});

		return response.data
	}


	public async updateTransform(id: string, transform: Transform): Promise<TransformRead> {
		console.log("> updateTransform", id, transform);
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.updateTransformV1({
			id,
			transform: transform
		});
		return response.data
	}

	////////////////////////
	//#endregion Transforms
	////////////////////////

	/////////////////////
	//#region Configuration Hub
	/////////////////////

	public async uploadBackup(data: string, fileName: string, name: string): Promise<BackupResponse> {
		console.log("> uploadBackup");


		const fileBuffer = Buffer.from(data)

		// Create a File object
		const file = new File([fileBuffer], fileName, {
			type: "application/json"
		})


		const apiConfig = await this.getApiConfiguration()
		const api = new ConfigurationHubApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		const result = await api.createUploadedConfigurationV1({
			data: file,
			name
		})
		return result.data
	}


	/**
	 * cf. https://developer.sailpoint.com/docs/api/v2024/get-uploaded-configuration
	 * @param jobId
	 * @returns
	 */
	public async getUploadConfigurationJobStatus(jobId: string): Promise<BackupResponse> {
		console.log("> getUploadConfigurationJobStatus", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new ConfigurationHubApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getUploadedConfigurationV1({ id: jobId })
		return response.data;
	}


	////////////////////////
	//#endregion Configuration Hub
	////////////////////////

	/////////////////////////////
	//#region Generic methods
	/////////////////////////////

	/**
	 *
	 * @param path Generic method to get resource
	 * @returns
	 */

	public async getResource(path: string): Promise<any> {
		console.log("> ISCClient.getResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.get(path);
		return response.data;
	}

	public async createResource(path: string, data: string | object): Promise<any> {
		console.log("> ISCClient.createResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.post(path, data);
		const res = await response.data;
		console.log("< ISCClient.createResource", res);
		return res;
	}

	public async deleteResource(path: string): Promise<void> {
		console.log("> ISCClient.deleteResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.delete(path, {
			headers: {
				"X-SailPoint-Experimental": true
			}
		});
		console.log("< ISCClient.deleteResource");
	}

	public async updateResource(path: string, data: string): Promise<any> {
		console.log("> updateResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.put(path, data);
		return response.data;
	}

	public async patchResource(path: string, data: string | object): Promise<any> {
		console.log("> patchResource", path);
		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_JSON_PATCH);
		const response = await httpClient.patch(path, data);
		const text = await response.data;
		if (response.headers.hasOwnProperty(CONTENT_TYPE_HEADER)
			&& response.headers?.[CONTENT_TYPE_HEADER]?.toString().startsWith(CONTENT_TYPE_JSON)
			&& text) {
			return JSON.parse(text);
		}
		return text;
	}

	/////////////////////////////
	//#endregion Generic methods
	/////////////////////////////

	/////////////////////////////
	//#region Search
	/////////////////////////////

	public async getIdentity(identityNameOrId: string): Promise<any> {
		console.log("> getIdentity", identityNameOrId);
		const results = await this.searchAllIdentities(
			'"' + identityNameOrId + '"',
			1,
			["name", "displayName", "id"]
		);
		const identity = this.ensureOneElement(results, "identity", identityNameOrId);
		return identity;
	}

	public async searchAllAccessProfiles(query: string, limit?: number, fields?: string[], includeNested = false): Promise<AccessProfileDocument[]> {
		console.log("> searchAllAccessProfiles", query);
		const search = buildSearchQuery({ index: Index.Accessprofiles, query, sort: "name", fields, includeNested })
		return await this.searchAll(search, limit) as AccessProfileDocument[];
	}

	public async searchAllEntitlements(query: string, limit?: number, fields?: string[], includeNested = false): Promise<EntitlementDocument[]> {
		console.log("> searchAllEntitlements", query);
		const search = buildSearchQuery({ index: Index.Entitlements, query, sort: "name", fields, includeNested })
		return await this.searchAll(search, limit) as EntitlementDocument[];
	}

	public async searchAllIdentities(query: string, limit?: number, fields?: string[], sort = "name"): Promise<IdentityDocument[]> {
		console.log("> searchAllIdentities", query);
		const search = buildSearchQuery({ index: Index.Identities, query, sort, fields, includeNested: false })
		return await this.searchAll(search, limit) as IdentityDocument[];
	}

	public async searchAll(query: Search, limit?: number): Promise<SearchDocument[]> {
		console.log("> search", query);

		const increment = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;

		const apiConfig = await this.getApiConfiguration();
		const api = new SearchApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await Paginator.paginateSearchApi(api, query, increment, limit);
		return resp.data as SearchDocument[];
	}


	public async searchRoles(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"]): Promise<AxiosResponse<RoleDocument[]>> {
		console.log("> paginatedSearchRoles", query);

		return await this.searchPost<RoleDocument>({
			query: buildSearchQuery({ index: Index.Roles, query, sort: "name", fields }),
			count,
			limit,
			offset
		})
	}

	public async searchAccessProfiles(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"], includeNested = false): Promise<AxiosResponse<AccessProfileDocument[]>> {
		console.log("> paginatedSearchAccessProfiles", query);

		return await this.searchPost<AccessProfileDocument>({
			query: buildSearchQuery({ index: Index.Accessprofiles, query, sort: "name", fields, includeNested }),
			count,
			limit,
			offset
		})
	}

	public async searchEntitlements(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"], includeNested = false): Promise<AxiosResponse<EntitlementDocument[]>> {
		console.log("> paginatedSearchEntitlements", query);

		return await this.searchPost<EntitlementDocument>({
			query: buildSearchQuery({ index: Index.Entitlements, query, sort: "name", fields, includeNested }),
			count,
			limit,
			offset
		})
	}

	public async paginatedSearchIdentities(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"], includeNested = false): Promise<AxiosResponse<IdentityDocument[]>> {
		console.log("> paginatedSearchIdentities", query);
		return await this.searchPost<IdentityDocument>({
			query: buildSearchQuery({ index: Index.Identities, query, sort: "name", fields, includeNested }),
			count,
			limit,
			offset
		})
	}

	private async searchPost<T>(input: PaginatedSearchRequest): Promise<AxiosResponse<T[]>> {
		const {
			query,
			limit = DEFAULT_PAGINATED_PARAMS.limit,
			offset = DEFAULT_PAGINATED_PARAMS.offset,
			count = DEFAULT_PAGINATED_PARAMS.count
		} = input;

		const cappedLimit = Math.min(limit, 10000)

		const apiConfig = await this.getApiConfiguration();
		const api = new SearchApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.searchPostV1({
			search: query,
			limit: cappedLimit,
			offset,
			count
		}) as AxiosResponse<T[]>
		return response
	}

	private async paginatedSearch<T>(input: PaginatedSearchRequest): Promise<PaginatedResult<T>> {
		input.limit = input.limit ?? DEFAULT_PAGINATED_PARAMS.limit
		input.offset = input.offset ?? DEFAULT_PAGINATED_PARAMS.offset

		const response = await this.searchPost(input)

		const rawCount = response.headers?.[TOTAL_COUNT_HEADER];
		const total = rawCount !== undefined ? Number(rawCount) : undefined;

		const data = response.data as T[]
		return { data, total, count: data.length, limit: input.limit, offset: input.offset };
	}

	public async paginatedSearchAccessProfiles(input: PaginatedSearch): Promise<PaginatedResult<AccessProfileDocument>> {
		return this.paginatedSearch<AccessProfileDocument>({
			...input,
			query: buildSearchQuery({ ...input, sort: input.sort ?? "name", index: Index.Accessprofiles })
		});
	}

	public async paginatedSearchEntitlements(input: PaginatedSearch): Promise<PaginatedResult<EntitlementDocument>> {
		return this.paginatedSearch<EntitlementDocument>({
			...input,
			query: buildSearchQuery({ ...input, index: Index.Entitlements })
		});
	}

	public async paginatedSearchRoles(input: PaginatedSearch): Promise<PaginatedResult<RoleDocument>> {
		return this.paginatedSearch<RoleDocument>({
			...input,
			query: buildSearchQuery({ ...input, index: Index.Roles })
		})
	}

	public async paginatedSearchEvents(input: PaginatedSearch): Promise<PaginatedResult<EventDocument>> {
		return this.paginatedSearch<EventDocument>({
			...input,
			query: buildSearchQuery({ ...input, index: Index.Events })
		})
	}

	public async getIdentityAuditEvents(identityId: string, identityName: string, limit = 250): Promise<PaginatedResult<EventDocument>> {
		console.log("> getIdentityAuditEvents", identityId, identityName, limit);

		let identityDetails: { name?: string; displayName?: string; email?: string; alias?: string } | undefined;
		try {
			const identityResponse = await this.paginatedSearchIdentities(
				`id:${identityId}`,
				1,
				0,
				false,
				["id", "name", "displayName", "email", "alias"]
			);
			identityDetails = identityResponse.data[0] as typeof identityDetails;
		} catch (error) {
			console.warn("Could not load identity details for event search", error);
		}

		const searchTerms = collectIdentityEventSearchTerms(identityId, identityName, identityDetails);
		const query = buildIdentityEventsSearchQuery(searchTerms);

		return this.paginatedSearchEvents({
			query,
			sort: "-created",
			limit,
			offset: 0
		});
	}

	public async getIdentityAccess(identityId: string): Promise<IdentityAccessItem[]> {
		console.log("> getIdentityAccess", identityId);

		try {
			const results = await Promise.all(
				IDENTITY_ACCESS_TYPE_SOURCES.map(({ apiType, itemType }) =>
					this.getAllIdentityAccessItemsOfType(identityId, apiType, itemType)
				)
			);

			return results.flat().sort((a, b) => {
				const typeOrder = compareIdentityAccessType(a.type, b.type);
				if (typeOrder !== 0) {
					return typeOrder;
				}
				return (a.displayName ?? a.name ?? "").localeCompare(b.displayName ?? b.name ?? "", undefined, { sensitivity: "base" });
			});
		} catch (error) {
			console.warn("getIdentityAccess: Identity History API failed, falling back to search API", error);
			return this.getIdentityAccessFromSearch(identityId);
		}
	}

	private async getAllIdentityAccessItemsOfType(
		identityId: string,
		apiType: ListIdentityAccessItemsV1TypeEnum,
		itemType: IdentityAccessItemType,
	): Promise<IdentityAccessItem[]> {
		const items: IdentityAccessItem[] = [];
		let offset = 0;
		let total: number | undefined;

		while (true) {
			const response = await this.listIdentityAccessItemsPage(
				identityId,
				apiType,
				IDENTITY_ACCESS_FETCH_PAGE_SIZE,
				offset,
				total === undefined
			);

			if (total === undefined) {
				const headerTotal = response.headers?.[TOTAL_COUNT_HEADER];
				total = headerTotal !== undefined ? Number(headerTotal) : response.data.length;
			}

			for (const entry of response.data) {
				const normalized = this.normalizeListIdentityAccessItem(itemType, entry as unknown as Record<string, unknown>);
				if (normalized) {
					items.push(normalized);
				}
			}

			offset += response.data.length;
			if (response.data.length === 0 || offset >= total) {
				break;
			}
		}

		return items;
	}

	private async listIdentityAccessItemsPage(
		identityId: string,
		type: ListIdentityAccessItemsV1TypeEnum,
		limit: number,
		offset: number,
		count: boolean,
	): Promise<AxiosResponse<ListIdentityAccessItemsV1200ResponseInner[]>> {
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityHistoryApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		return api.listIdentityAccessItemsV1({
			id: identityId,
			type,
			limit,
			offset,
			count,
		});
	}

	private async getIdentityAccessFromSearch(identityId: string): Promise<IdentityAccessItem[]> {
		const response = await this.paginatedSearchIdentities(
			`id:${identityId}`,
			1,
			0,
			false,
			["id", "name", "access"],
			true
		);

		const identity = response.data?.[0];
		if (!identity?.access || !Array.isArray(identity.access)) {
			return [];
		}

		const items = identity.access
			.map((entry) => this.normalizeIdentityAccessItem(entry as unknown as Record<string, unknown>))
			.filter((item): item is IdentityAccessItem => item !== undefined);

		const skipped = identity.access.length - items.length;
		if (skipped > 0) {
			console.warn(`getIdentityAccessFromSearch: skipped ${skipped} of ${identity.access.length} access entries with an unsupported type or missing id`);
		}

		return items.sort((a, b) => {
			const typeOrder = compareIdentityAccessType(a.type, b.type);
			if (typeOrder !== 0) {
				return typeOrder;
			}
			return (a.displayName ?? a.name ?? "").localeCompare(b.displayName ?? b.name ?? "", undefined, { sensitivity: "base" });
		});
	}

	public async revokeIdentityAccess(identityId: string, item: IdentityAccessItem): Promise<AccessRequestResponse> {
		console.log("> revokeIdentityAccess", identityId, item.id, item.type);

		const apiConfig = await this.getApiConfiguration();
		const api = new AccessRequestsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createAccessRequestV1({
			accessRequest: {
				requestType: "REVOKE_ACCESS",
				requestedFor: [identityId],
				requestedItems: [{
					type: item.type,
					id: item.id,
					comment: "VSCode",
					...(item.assignmentId ? { assignmentId: item.assignmentId } : {}),
					...(item.nativeIdentity ? { nativeIdentity: item.nativeIdentity } : {}),
				}],
			}
		});
		return response.data;
	}

	public async searchRequestableAccessItems(term: string): Promise<IdentityAccessItem[]> {
		console.log("> searchRequestableAccessItems", term);

		const response = await this.searchPost<Record<string, unknown>>({
			query: buildSearchQuery({
				indices: REQUESTABLE_ACCESS_INDICES,
				query: buildRequestableAccessItemQuery(term),
				sort: "name",
				fields: REQUESTABLE_ACCESS_SEARCH_FIELDS,
			}),
			limit: DEFAULT_PAGINATED_PARAMS.limit,
			offset: 0,
			count: false,
		});

		return (response.data ?? []).map(entry =>
			this.normalizeResolvedAccessItem(accessItemTypeFromSearchDocument(entry), entry)
		);
	}

	public async grantIdentityAccess(identityId: string, item: IdentityAccessItem): Promise<AccessRequestResponse> {
		console.log("> grantIdentityAccess", identityId, item.id, item.type);

		const apiConfig = await this.getApiConfiguration();
		const api = new AccessRequestsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createAccessRequestV1({
			accessRequest: {
				requestType: "GRANT_ACCESS",
				requestedFor: [identityId],
				requestedItems: [{
					type: item.type,
					id: item.id,
					comment: "VSCode",
				}],
			}
		});
		return response.data;
	}

	public extractAccessRequestIds(response: AccessRequestResponse): string[] {
		const ids = [
			...(response.newRequests ?? []).flatMap(request => request.accessRequestIds ?? []),
			...(response.existingRequests ?? []).flatMap(request => request.accessRequestIds ?? []),
		];
		return [...new Set(ids.filter(Boolean))];
	}

	public async getAccessRequestStatus(accessRequestId: string): Promise<RequestedItemStatus | undefined> {
		console.log("> getAccessRequestStatus", accessRequestId);

		const apiConfig = await this.getApiConfiguration();
		const api = new AccessRequestsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listAccessRequestStatusV1({
			filters: `accessRequestId eq "${accessRequestId}"`,
			limit: 1,
		});
		return response.data?.[0];
	}

	public isAccessRequestTerminal(state?: RequestedItemStatusRequestState | null): boolean {
		return state === "REQUEST_COMPLETED"
			|| state === "CANCELLED"
			|| state === "TERMINATED"
			|| state === "REJECTED"
			|| state === "PROVISIONING_FAILED"
			|| state === "NOT_ALL_ITEMS_PROVISIONED"
			|| state === "ERROR";
	}

	private normalizeResolvedAccessItem(type: IdentityAccessItemType, entry: unknown): IdentityAccessItem {
		const record = entry as Record<string, unknown>;
		const id = record.id as string | undefined;
		if (!id) {
			throw new Error(`Resolved ${type} is missing an ID.`);
		}

		const source = record.source as { name?: string } | undefined;

		return {
			type,
			id,
			name: record.name as string | undefined,
			displayName: record.displayName as string | undefined,
			description: record.description as string | undefined,
			sourceName: source?.name,
			revocable: record.revocable as boolean | undefined,
			standalone: record.standalone as boolean | undefined,
			raw: record,
		};
	}

	private normalizeListIdentityAccessItem(type: IdentityAccessItemType, entry: Record<string, unknown>): IdentityAccessItem | undefined {
		const id = entry.id as string | undefined;
		if (!id) {
			return undefined;
		}

		const sourceName = entry.sourceName as string | null | undefined;

		return {
			type,
			id,
			name: entry.displayName as string | undefined,
			displayName: entry.displayName as string | undefined,
			description: entry.description as string | undefined,
			sourceName: sourceName ?? undefined,
			removeDate: entry.removeDate as string | undefined,
			assignmentId: entry.assignmentId as string | undefined,
			nativeIdentity: entry.nativeIdentity as string | undefined,
			revocable: entry.revocable as boolean | undefined,
			standalone: entry.standalone as boolean | undefined,
			raw: entry,
		};
	}

	private normalizeIdentityAccessItem(entry: Record<string, unknown>): IdentityAccessItem | undefined {
		const type = entry.type as string | undefined;
		if (type !== "ROLE" && type !== "ACCESS_PROFILE" && type !== "ENTITLEMENT") {
			return undefined;
		}

		const id = entry.id as string | undefined;
		if (!id) {
			return undefined;
		}

		const source = entry.source as { name?: string } | undefined;

		return {
			type: type as IdentityAccessItemType,
			id,
			name: entry.name as string | undefined,
			displayName: entry.displayName as string | undefined,
			description: entry.description as string | undefined,
			sourceName: source?.name,
			removeDate: entry.removeDate as string | undefined,
			assignmentId: entry.assignmentId as string | undefined,
			nativeIdentity: entry.nativeIdentity as string | undefined,
			revocable: entry.revocable as boolean | undefined,
			standalone: entry.standalone as boolean | undefined,
			raw: entry,
		};
	}

	public async paginatedSearchAccountActivities(input: PaginatedSearch): Promise<PaginatedResult<AccountActivityDocument>> {
		return this.paginatedSearch<AccountActivityDocument>({
			...input,
			query: buildSearchQuery({ ...input, index: Index.Accountactivities })
		})
	}

	/////////////////////////////
	//#endregion Search
	/////////////////////////////

	/////////////////////////////
	//#region SP-Config
	/////////////////////////////
	/**
	 *
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-export
	 * @returns jobId
	 */

	public async startExportJob(
		objectTypes: ExportPayloadIncludeTypesEnum[],
		objectOptions: {
			[key: string]: ObjectExportImportOptions;
		} = {}
	): Promise<string> {
		console.log("> startExportJob", objectTypes, objectOptions);

		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.exportSpConfigV1({
			exportPayload: {
				description: `Export Job vscode ${new Date().toISOString()}`,
				includeTypes: objectTypes,
				objectOptions: objectOptions
			}
		});
		const jobId = response.data.jobId;
		console.log("< startExportJob. jobId =", jobId);
		return jobId;
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportJobStatus
	 * @param jobId
	 * @returns
	 */
	public async getExportJobStatus(jobId: string): Promise<SpConfigJob> {
		console.log("> getExportJobStatus", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getSpConfigExportStatusV1({ id: jobId });
		return response.data;
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportDownload
	 * @param jobId
	 * @returns
	 */
	public async getExportJobResult(jobId: string): Promise<SpConfigExportResults> {
		console.log("> getExportJobResult", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getSpConfigExportV1({ id: jobId });
		return response.data;
	}

	/**
	 *
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import
	 * @returns jobId
	 */
	public async startImportJob(
		data: string,
		options: ImportOptions = {}
	): Promise<string> {
		console.log("> startImportJob", options);
		/*
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		// const readable = Readable.from([data]);
		// const file = await blob(readable);
		// const buffer = Buffer.from(data);
		const formData = new FormData();
		let fileData = Buffer.from(data);
		formData.append("data", fileData, "import.json");
		const response = await api.importSpConfigV1(formData);
		const jobId = response.data.jobId;
		console.log("< startImportJob. jobId =", jobId);
		return jobId;
		*/

		const endpoint = "beta/sp-config/import";

		console.log("startImportJob: endpoint = " + endpoint);

		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_URLENCODED);
		const formData = new FormData();
		let fileData = Buffer.from(data);
		formData.append("data", fileData, "import.json");
		if (Object.keys(options).length !== 0 || options.constructor !== Object) {
			formData.append("options", JSON.stringify(options));
		}
		console.log("startImportJob: requesting");

		const response = await httpClient.post(
			endpoint,
			formData
		);

		const jobId = response.data.jobId;
		console.log("< startImportJob. jobId =", jobId);
		return jobId;
	}


	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import-job-status
	 * @param jobId
	 * @returns
	 */
	public async getImportJobStatus(jobId: string): Promise<SpConfigJob> {
		console.log("> getImportJobStatus", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getSpConfigImportStatusV1({ id: jobId });
		return response.data;
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import-download
	 * @param jobId
	 * @returns
	 */
	public async getImportJobResult(jobId: string): Promise<SpConfigImportResults> {
		console.log("> getImportJobResult", jobId);

		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getSpConfigImportV1({ id: jobId });
		return response.data;
	}
	/////////////////////////////
	//#endregion SP-Config
	/////////////////////////////

	///////////////////////
	//#region Workflows
	///////////////////////

	public async deleteWorkflow(id: string): Promise<void> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.deleteWorkflowV1({ id });
	}

	public async putWorkflow(id: string, body: WorkflowBody): Promise<Workflow> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.putWorkflowV1({ id, workflowBody: body });
		return resp.data;
	}

	public async createWorflow(workflow: CreateWorkflowV1Request): Promise<Workflow> {
		const apiConfig = await this.getApiConfiguration()
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const resp = await api.createWorkflowV1({
			createWorkflowV1Request: workflow
		})
		return resp.data;
	}


	public async getWorflowById(id: string): Promise<Workflow> {
		const apiConfig = await this.getApiConfiguration()
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const resp = await api.getWorkflowV1({ id })
		return resp.data;
	}

	public async getWorkflowByName(name: string): Promise<Workflow> {
		const workflows = await this.getWorflows();
		const found = workflows.find(w => w.name === name);
		if (!found) {
			throw new Error(`Could not find workflow with name "${name}"`);
		}
		return found;
	}

	public async getWorflows(): Promise<Workflow[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.listWorkflowsV1();
		return resp.data.sort(compareByName);
	}

	public async updateWorkflow(id: string, operations: Array<JsonPatchOperation>): Promise<Workflow> {
		console.log("> updateWorkflow", id, operations);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchWorkflowV1({ id, jsonPatchOperation: operations });
		return response.data;
	}



	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/patchWorkflow
	 * @param jobId
	 */
	public async updateWorkflowStatus(
		id: string,
		status: boolean
	): Promise<void> {
		console.log("> updateWorkflowStatus", id, status);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.patchWorkflowV1({
			id, jsonPatchOperation: [
				{
					op: "replace",
					path: "/enabled",
					//@ts-ignore cf. https://github.com/sailpoint-oss/typescript-sdk/issues/18
					value: status,
				},
			]
		});
		console.log("< updateWorkflowStatus");
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/list-workflow-executions
	 * There is a limit of 250 items by default
	 * @param id
	 * @returns
	 */
	public async getWorkflowExecutionHistory(id: string): Promise<WorkflowExecution[]> {
		console.log("> getWorkflowExecutionHistory", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getWorkflowExecutionsV1({ id });
		return resp.data;
	}
	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/get-workflow-execution
	 * @param workflowExecutionId
	 * @returns
	 */
	public async getWorkflowExecution(workflowExecutionId: string): Promise<WorkflowExecution> {
		console.log("> getWorkflowExecution", workflowExecutionId);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getWorkflowExecutionV1({ id: workflowExecutionId });
		// TODO test this particularly. Not consistent with Beta endpoint
		return resp.data[0];
	}

	public async testWorkflow(id: string, payload: any): Promise<string> {
		console.log("> testWorkflow", id, payload);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.testWorkflowV1({
			id,
			testWorkflowV1Request: {
				input: payload
			}
		});
		return resp.data.workflowExecutionId!;
	}

	public async getWorkflowExecutionEvents(executionId: string): Promise<WorkflowExecutionEvent[]> {
		console.log("> getWorkflowExecutionEvents", executionId);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getWorkflowExecutionHistoryV1({ id: executionId });
		return resp.data;
	}

	public async callWorkflowExternalTrigger(id: string, accessToken: string, payload: any): Promise<string> {
		console.log("> callWorkflowExternalTrigger", id, payload);
		const apiConfig = await this.getApiConfiguration(accessToken);
		const api = new WorkflowsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.createExternalExecuteWorkflowV1({
			id,
			createExternalExecuteWorkflowV1Request: {
				input: payload
			}
		});
		return resp.data.workflowExecutionId!;
	}



	///////////////////////
	//#endregion Workflows
	///////////////////////

	/////////////////////////////
	//#region Connector Rules
	/////////////////////////////

	public async getConnectorRules(): Promise<ConnectorRuleResponse[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getConnectorRuleListV1();
		const rules = resp.data;
		rules.sort(compareByName);
		return rules;
	}

	public async getConnectorRuleById(id: string): Promise<ConnectorRuleResponse> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getConnectorRuleV1({ id });
		return resp.data;
	}

	/**
	 * At this moment, it is not possible to get a rule by filtering on the name
	 * The filtering must be done client-side
	 * @param name
	 * @returns
	 */
	public async getConnectorRuleByName(
		name: string
	): Promise<ConnectorRuleResponse | undefined> {
		console.log("> getConnectorRuleByName", name);
		const rules = await this.getConnectorRules();
		return rules.find((r) => r.name === name);
	}

	public async validateConnectorRule(
		script: string
	): Promise<ConnectorRuleValidationResponse> {
		console.log("> validateConnectorRule", script);

		const payload = {
			version: "1.0",
			script,
		};

		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.testConnectorRuleV1({
			sourceCode: payload
		});
		const jsonBody = resp.data;
		console.log("< validateConnectorRule", jsonBody);
		return jsonBody;
	}

	public async updateConnectorRule(rule: ConnectorRuleUpdateRequest): Promise<ConnectorRuleResponse> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.putConnectorRuleV1({
			id: rule.id,
			connectorRuleUpdateRequest: rule
		});
		return resp.data;
	}

	/////////////////////////////
	//#endregion Connector Rules
	/////////////////////////////

	/////////////////////////////
	//#region Identity Profiles
	/////////////////////////////

	public async getIdentityProfiles(): Promise<IdentityProfile[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.listIdentityProfilesV1({});
		return resp.data;
	}

	public async getLifecycleStates(
		identityProfileId: string
	): Promise<LifecycleState[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new LifecycleStatesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getLifecycleStatesV1({
			identityProfileId,
			sorters: "name"
		});
		return resp.data;
	}

	public async getIdentityProfileById(id: string): Promise<IdentityProfile> {
		console.log("> getIdentityProfileById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getIdentityProfileV1({ identityProfileId: id });
		return resp.data;
	}

	public async getIdentityProfileByName(name: string): Promise<IdentityProfile> {
		console.log("> getIdentityProfileByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.listIdentityProfilesV1({
			filters: `name eq "${name}"`,
			limit: 2,
		});
		const profiles = resp.data;
		if (!profiles || profiles.length !== 1) {
			throw new Error(`Could not find identity profile "${name}". Found ${profiles?.length ?? 0}`);
		}
		return profiles[0];
	}

	public async addIdentityProfileMapping(
		identityProfileId: string,
		mapping: IdentityAttributeTransform
	): Promise<IdentityProfile> {
		console.log("> addIdentityProfileMapping", identityProfileId);
		const apiConfig = await this.getApiConfiguration();
		const axios = await this.getAxios(CONTENT_TYPE_FORM_JSON_PATCH);
		const api = new IdentityProfilesApi(apiConfig, undefined, axios);
		const resp = await api.updateIdentityProfileV1({
			identityProfileId,
			jsonPatchOperation: [
				{
					op: "add" as any,
					path: "/identityAttributeConfig/attributeTransforms/-",
					value: mapping as any,
				},
			],
		});
		return resp.data;
	}

	public async setIdentityProfileMapping(
		identityProfileId: string,
		mapping: IdentityAttributeTransform
	): Promise<IdentityProfile> {
		console.log("> setIdentityProfileMapping", identityProfileId);
		const profile = await this.getIdentityProfileById(identityProfileId);
		const transforms = profile.identityAttributeConfig?.attributeTransforms ?? [];
		const existingIndex = transforms.findIndex(
			t => t.identityAttributeName === mapping.identityAttributeName
		);

		const apiConfig = await this.getApiConfiguration();
		const axios = await this.getAxios(CONTENT_TYPE_FORM_JSON_PATCH);
		const api = new IdentityProfilesApi(apiConfig, undefined, axios);

		const op = existingIndex >= 0
			? {
				op: "replace" as any,
				path: `/identityAttributeConfig/attributeTransforms/${existingIndex}`,
				value: mapping as any,
			}
			: {
				op: "add" as any,
				path: "/identityAttributeConfig/attributeTransforms/-",
				value: mapping as any,
			};

		const resp = await api.updateIdentityProfileV1({
			identityProfileId,
			jsonPatchOperation: [op],
		});
		return resp.data;
	}

	public async refreshIdentityProfile(identityProfileId: string): Promise<void> {
		console.log("> refreshIdentityProfile", identityProfileId);
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, (await this.getAxios()));
		const resp = await api.syncIdentityProfileV1({ identityProfileId });
	}

	public async createIdentityProfile(payload: IdentityProfile): Promise<IdentityProfile> {
		console.log("> createIdentityProfile", payload.name);
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.createIdentityProfileV1({ identityProfile: payload });
		return resp.data;
	}

	public async getIdentityPreview(identityId: string, config: Array<IdentityAttributeTransform>): Promise<IdentityPreviewResponse> {
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.generateIdentityPreviewV1({
			identityPreviewRequest: {
				identityId,
				identityAttributeConfig: {
					attributeTransforms: config
				}
			}
		})
		return resp.data;
	}

	public async updateIdentityProfile(id: string, operations: Array<JsonPatchOperation>): Promise<IdentityProfile> {
		console.log("> updateIdentityProfile", id, operations);
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentityProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.updateIdentityProfileV1({ identityProfileId: id, jsonPatchOperation: operations });
		return response.data;
	}

	/////////////////////////////
	//#endregion Identity Profiles
	/////////////////////////////

	//////////////////////
	//#region ServiceDesk
	//////////////////////

	public async getServiceDesks(): Promise<ServiceDeskIntegrationDto[]> {
		console.log("> getServiceDesks");
		const apiConfig = await this.getApiConfiguration();
		const api = new ServiceDeskIntegrationApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getServiceDeskIntegrationsV1({ sorters: "name" });
		return response.data;
	}

	/////////////////////////
	//#endregion ServiceDesk
	/////////////////////////

	/////////////////////////
	//#region Accounts
	/////////////////////////

	private async getAccounts(
		query: AccountsApiListAccountsV1Request = DEFAULT_ACCOUNTS_QUERY_PARAMS
	): Promise<AxiosResponse<Account[], any>> {
		console.log("> getAccounts", query);
		const queryValues = {
			...DEFAULT_ACCOUNTS_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listAccountsV1(queryValues);
		return response;
	}

	public async getAccountCountBySource(sourceId: string, exportUncorrelatedAccountOnly = false): Promise<number> {
		let filters = `sourceId eq "${sourceId}"`;
		if (exportUncorrelatedAccountOnly) {
			filters += " and uncorrelated eq true and manuallyCorrelated eq false";
		}
		const resp = await this.getAccounts({
			filters,
			count: true,
			limit: 0,
			offset: 0
		});
		return Number(resp.headers[TOTAL_COUNT_HEADER]);
	}

	public async getAccountsBySource(sourceId: string, exportUncorrelatedAccountOnly = false, offset = 0, limit = DEFAULT_PAGINATION): Promise<Account[]> {
		let filters = `sourceId eq "${sourceId}"`;
		if (exportUncorrelatedAccountOnly) {
			filters += " and uncorrelated eq true and manuallyCorrelated eq false";
		}
		const resp = await this.getAccounts({
			filters,
			limit,
			offset
		});
		return resp.data;
	}

	public async getAccountBySource(sourceId: string, nativeIdentity: string): Promise<Account> {
		let filters = `sourceId eq "${sourceId}" and nativeIdentity eq "${nativeIdentity}"`;
		const resp = await this.getAccounts({
			filters,
			limit: 1,
			offset: 0,
			count: true
		});

		const nbAccount = Number(resp.headers[TOTAL_COUNT_HEADER]);
		if (nbAccount !== 1) {
			throw new Error("Could Not Find Account");
		}
		return resp.data[0];
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/v3/update-account
	 * @param accountId
	 * @param identityId The unique ID of the identity this account is correlated to
	 * @returns
	 */
	public async updateAccount(
		accountId: string,
		identityId: string
	): Promise<void> {
		console.log("> patchAccount", accountId, identityId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.updateAccountV1({
			id: accountId,
			requestBody: [
				{
					op: "replace",
					path: "/identityId",
					value: identityId,
				},
			]
		});
		console.log("< patchAccount");
	}

	public async getAccountsByIdentity(identityId: string, limit = DEFAULT_PAGINATION): Promise<Account[]> {
		console.log("> getAccountsByIdentity", identityId);
		const resp = await this.getAccounts({
			filters: `identityId eq "${identityId}"`,
			sorters: "sourceId",
			limit,
			offset: 0
		});
		return resp.data;
	}

	public async enableAccount(accountId: string): Promise<string | undefined> {
		console.log("> enableAccount", accountId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.enableAccountV1({ id: accountId, accountToggleRequest: {} });
		console.log("< enableAccount");
		return response.data.id;
	}

	public async disableAccount(accountId: string): Promise<string | undefined> {
		console.log("> disableAccount", accountId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.disableAccountV1({ id: accountId, accountToggleRequest: {} });
		console.log("< disableAccount");
		return response.data.id;
	}

	public async unlockAccount(accountId: string): Promise<string | undefined> {
		console.log("> unlockAccount", accountId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.unlockAccountV1({ id: accountId, accountUnlockRequest: {} });
		console.log("< unlockAccount");
		return response.data.id;
	}

	public async deleteAccount(accountId: string): Promise<string | undefined> {
		console.log("> deleteAccount", accountId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.deleteAccountAsyncV1({ id: accountId });
		console.log("< deleteAccount");
		return response.data.id;
	}

	public async reloadAccount(accountId: string): Promise<string | undefined> {
		console.log("> reloadAccount", accountId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.submitReloadAccountV1({ id: accountId });
		console.log("< reloadAccount");
		return response.data.id;
	}

	public async getHecateJobStatus(jobId: string): Promise<HecateJobStatus> {
		console.log("> getHecateJobStatus", jobId);
		const httpClient = await this.getAxios();
		const response = await httpClient.get(`/hecate/message/client/qpoc/job/${jobId}`);
		return response.data;
	}

	/////////////////////////
	//#endregion Accounts
	/////////////////////////

	/////////////////////////
	//#region Entitlements
	/////////////////////////

	public async getEntitlement(id: string): Promise<Entitlement> {
		console.log("> getEntitlement");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getEntitlementV1({ id })
		return response.data
	}
	public async getAllEntitlements(query: string): Promise<Entitlement[]> {
		console.log("> getAllEntitlements");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api,
			api.listEntitlementsV1,
			{ filters: query, sorters: "name" });
		return result.data;
	}

	/**
	 * This function is used to support "manual" pagination and only returns a maximum of 250 records
	 * @param query parameters for query
	 * @returns list of entitlements
	 */
	public async getEntitlements(
		query: EntitlementsApiListEntitlementsV1Request = DEFAULT_ENTITLEMENTS_QUERY_PARAMS
		// @ts-ignore 
	): Promise<AxiosResponse<Entitlement[], any>> {
		console.log("> getEntitlements", query);
		const queryValues: EntitlementsApiListEntitlementsV1Request = {
			...DEFAULT_ENTITLEMENTS_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listEntitlementsV1(queryValues);
		return response;
	}

	public async getEntitlementCountBySource(sourceId: string): Promise<number> {
		console.log("> getEntitlementCountBySource", sourceId);
		const filters = `source.id eq "${sourceId}"`;
		const resp = await this.getEntitlements({
			filters,
			count: true,
			limit: 1,
			offset: 0
		});
		return Number(resp.headers[TOTAL_COUNT_HEADER]);
	}

	public async getEntitlementByName(sourceId: string, entitlementName: string, attribute: string | undefined = undefined): Promise<Entitlement> {
		console.log("> getEntitlementByName", sourceId, entitlementName);

		let filters = `source.id eq "${sourceId}" and name eq "${entitlementName}"`;
		if (attribute) {
			filters += ` and attribute eq "${attribute}"`
		}
		const response = await this.getEntitlements({
			filters,
			limit: 2,
			count: false
		});

		const entitlement = this.ensureOneElement(response.data, "entitlement", entitlementName);
		return entitlement;
	}

	public async getAllEntitlementsBySource(sourceId: string): Promise<Entitlement[]> {
		console.log("> getAllEntitlementsBySource", sourceId);
		const filters = `source.id eq "${sourceId}"`;
		const resp = await this.getAllEntitlements(filters);
		return resp;
	}

	/**
	 * cf. https://developer.sailpoint.com/docs/api/v2025/patch-entitlement/
	 * @param id
	 * @param payload
	  */
	public async updateEntitlement(
		id: string,
		payload: Array<JsonPatchOperation>
	): Promise<void> {
		console.log("> updateEntitlement", id, payload);
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchEntitlementV1({
			id,
			jsonPatchOperation: payload
		});
		console.log("< updateEntitlement");
	}

	public async importEntitlements(
		sourceId: string,
		filePath: string
	): Promise<ImportEntitlementsResult> {
		console.log("> ISCClient.importEntitlements");
		const endpoint = `beta/entitlements/sources/${sourceId}/entitlements/import`;
		console.log("endpoint = " + endpoint);
		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_URLENCODED);

		var formData = new FormData();
		formData.append("slpt-source-entitlements-panel-search-entitlements-inputEl", 'Search Entitlements');
		formData.append('csvFile', createReadStream(filePath));

		const response = await httpClient.post(endpoint, formData);

		return response.data;
	}

	/////////////////////////
	//#endregion Entitlements
	/////////////////////////

	//////////////////////////////
	//#region Public Identities
	//////////////////////////////

	public async getPublicIdentities(
		query: PublicIdentitiesApiGetPublicIdentitiesV1Request = DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS
	): Promise<AxiosResponse<PublicIdentity[], any>> {
		console.log("> getPublicIdentities", query);
		const queryValues: PublicIdentitiesApiGetPublicIdentitiesV1Request = {
			...DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS,
			...query
		};

		const apiConfig = await this.getApiConfiguration();
		const api = new PublicIdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getPublicIdentitiesV1(queryValues);
		return response;
	}

	public async getPublicIdentityByAlias(alias: string): Promise<PublicIdentity> {
		const filters = `alias eq "${alias}"`;
		const response = await this.getPublicIdentities({
			filters,
			limit: 1,
			count: true
		});
		const identity = this.ensureOneBasedOnHeader(response, "identity", alias);

		return identity;
	}

	public async getPublicIdentityByUsernameOrDisplayName(name: string): Promise<PublicIdentity> {
		const filters = `alias eq "${name}" or name eq "${name}"`;
		const response = await this.getPublicIdentities({
			filters,
			limit: 1,
			count: true
		});
		const identity = this.ensureOneBasedOnHeader(response, "identity", name);

		return identity;
	}

	/**
	 * Note: public identities endpoint does not have a "get"
	 * @param id Id
	 */
	public async getPublicIdentityById(
		id: string
	): Promise<PublicIdentity> {
		console.log("> getPublicIdentityById", id);

		const filters = `id eq "${id}"`;
		const response = await this.getPublicIdentities({
			filters,
			limit: 1,
			count: true
		});

		const identity = this.ensureOneBasedOnHeader(response, "identity", id);
		console.log("< getPublicIdentityById", identity);
		return identity;
	}
	//////////////////////////////
	//#endregion Public Identities
	//////////////////////////////

	//////////////////////////////
	//#region Governance Groups
	//////////////////////////////

	public async getGovernanceGroups(): Promise<WorkgroupDto[]> {
		console.log("> getGovernanceGroups");
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listWorkgroupsV1, { sorters: "name" }, 50);
		return result.data;
	}

	public async getGovernanceGroupById(id: string): Promise<WorkgroupDto> {
		console.log("> getGovernanceGroupById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await api.getWorkgroupV1({ id });
		return result.data;
	}
	public async getGovernanceGroupByName(name: string): Promise<WorkgroupDto> {
		console.log("> getGovernanceGroupByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listWorkgroupsV1({
			filters: `name eq "${name}"`,
			limit: 1,
			count: true
		});
		const workgroup = this.ensureOneBasedOnHeader(response, "workgroup", name);

		return workgroup;
	}

	public async updateGovernanceGroup(id: string, operations: Array<JsonPatchOperation>): Promise<WorkgroupDto> {
		console.log("> updateGovernanceGroup", id, operations);
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchWorkgroupV1({ id, jsonPatchOperation: operations });
		return response.data;
	}

	//////////////////////////////
	//#endregion Governance Groups
	//////////////////////////////

	//////////////////////////////
	//#region Access Profiles
	//////////////////////////////

	public async getAccessProfiles(
		query: AccessProfilesApiListAccessProfilesV1Request = DEFAULT_ACCESSPROFILES_QUERY_PARAMS
	): Promise<AxiosResponse<AccessProfileRead[], any>> {
		console.log("> getAccessProfiles", query);
		const queryValues: AccessProfilesApiListAccessProfilesV1Request = {
			...DEFAULT_ACCESSPROFILES_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listAccessProfilesV1(queryValues);
		return response as AxiosResponse<AccessProfileRead[], any>;
	}

	public async getAllAccessProfiles(filters: string): Promise<AccessProfileRead[]> {
		console.log("> getAllAccessProfiles", filters);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listAccessProfilesV1, { filters, sorters: "name" });
		return result.data as AccessProfileRead[];
	}

	public async getAccessProfileByName(name: string): Promise<AccessProfileRead> {
		console.log("> getAccessProfileByName", name);
		let filters = `name eq "${name}"`;
		const response = await this.getAccessProfiles({
			filters,
			limit: 1,
			count: true
		});

		const accessProfile = this.ensureOneBasedOnHeader(response, "access profile", name);
		return accessProfile;
	}

	public async createAccessProfile(ap: AccessProfile): Promise<AccessProfileRead> {
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createAccessProfileV1({
			accessProfile: ap
		})
		return response.data as AccessProfileRead
	}

	public async updateAccessProfile(id: string, operations: Array<JsonPatchOperation>): Promise<AccessProfileRead> {
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchAccessProfileV1({
			id,
			jsonPatchOperation: operations
		})
		return response.data as AccessProfileRead
	}

	public async updateAccessProfileMetadata(id: string, attributes: Array<AttributeDTO>) {
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessProfilesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchAccessProfileV1({
			id,
			jsonPatchOperation: [{
				op: "replace",
				path: "/accessModelMetadata/attributes",
				value: attributes
			}]
		})
		return response.data
	}

	//////////////////////////////
	//#endregion Access Profiles
	//////////////////////////////

	//////////////////////////////
	//#region Roles
	//////////////////////////////

	public async getRoleByName(name: string): Promise<Role> {
		console.log("> getRoleByName", name);
		const result = await this.getRoles({
			filters: `name eq "${name}"`,
			limit: 1,
			count: true
		});
		const role = this.ensureOneBasedOnHeader(result, "role", name);
		console.log("< getRoleByName", role);
		return role;
	}

	public async getAllRoles(): Promise<Role[]> {
		console.log("> getAllRoles");
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listRolesV1, { sorters: "name" });
		return result.data;
	}

	public async getRoles(
		query: RolesApiListRolesV1Request = DEFAULT_ROLES_QUERY_PARAMS
	): Promise<AxiosResponse<Role[], any>> {
		console.log("> getRoles", query);
		const queryValues: RolesApiListRolesV1Request = {
			...DEFAULT_ROLES_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listRolesV1(queryValues);
		return response;
	}

	public async createRole(role: Role): Promise<Role> {
		console.log("> createRole", role);
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createRoleV1({ role });
		return response.data;
	}

	public async updateRole(id: string, ops: Array<JsonPatchOperation>) {
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchRoleV1({
			id,
			jsonPatchOperation: ops
		})
		return response.data
	}

	public async updateRoleMetadata(id: string, attributes: Array<AttributeDTO>) {
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchRoleV1({
			id,
			jsonPatchOperation: [{
				op: "replace",
				path: "/accessModelMetadata/attributes",
				value: attributes
			}]
		})
		return response.data
	}

	public async getPaginatedDimensions(query: DimensionsApiListDimensionsV1Request
		//	roleId:string, filters?: string, limit?: number, offset?: number, count = false
	): Promise<AxiosResponse<Dimension[]>> {

		const apiConfig = await this.getApiConfiguration();
		const api = new DimensionsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listDimensionsV1(query)
		return response
	}

	public async createDimension(roleId: string, dim: Dimension): Promise<Dimension> {
		console.log("> createDimension", dim);
		const apiConfig = await this.getApiConfiguration();
		const api = new DimensionsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createDimensionV1({ roleId, dimension: dim });
		return response.data;
	}

	public async updateDimension(roleId: string, dimensionId: string, ops: Array<JsonPatchOperation>) {
		const apiConfig = await this.getApiConfiguration();
		const api = new DimensionsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchDimensionV1({
			roleId,
			dimensionId,
			jsonPatchOperation: ops
		})
		return response.data
	}


	public async getDimensionByName(roleId: string, name: string): Promise<Dimension> {
		console.log("> getDimensionByName", roleId, name);
		const result = await this.getPaginatedDimensions({
			roleId,
			filters: `name eq "${name}"`,
			limit: 2
		});
		const dimension = this.ensureOneElement(result.data, "dimension", name);
		console.log("< getDimensionByName", dimension);
		return dimension;
	}

	//////////////////////////////
	//#endregion Roles
	//////////////////////////////

	//////////////////////////////
	//#region Forms
	//////////////////////////////


	public async *getForms(filters?: string): AsyncGenerator<FormDefinitionResponse> {
		console.log("> getForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		let offset = 0;
		const limit = DEFAULT_PAGINATION;
		let count = -1;
		do {
			const response = await api.searchFormDefinitionsByTenantV1({ offset, limit, filters });
			count = response.data.count ?? 0;
			if (response.data.results) {
				for (const f of response.data.results) {
					yield f;
				}
			}
			offset += limit;
			// if requesting an offset > total: "offset is greater than number of form definitions results"
			// By using this criteria, we may fall on some edge cases where the total is a multiple of 250.
		} while (count === limit);
	}

	public async listForms(): Promise<FormDefinitionResponse[]> {
		console.log("> listForms");
		const forms: FormDefinitionResponse[] = [];
		for await (const form of this.getForms()) {
			forms.push(form);
		}
		return forms;
	}

	public async getFormById(id: string): Promise<FormDefinitionResponse> {
		console.log("> getFormById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getFormDefinitionByKeyV1({ formDefinitionID: id });
		return response.data;
	}

	public async getFormByName(name: string): Promise<FormDefinitionResponse> {
		console.log("> getFormByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.searchFormDefinitionsByTenantV1({
			filters: `name eq "${name}"`,
			limit: 1,
		});
		const results = response.data.results;
		if (!results || results.length === 0) {
			throw new Error(`Form "${name}" not found.`);
		}
		return results[0];
	}

	public async createForm(payload: CreateFormDefinitionRequest): Promise<FormDefinitionResponse> {
		console.log("> createForm");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createFormDefinitionV1({ body: payload });
		return response.data;
	}

	public async patchForm(id: string, patches: Array<{ [key: string]: object }>): Promise<FormDefinitionResponse> {
		console.log("> patchForm", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchFormDefinitionV1({ formDefinitionID: id, body: patches });
		return response.data;
	}

	public async deleteFormById(id: string): Promise<void> {
		console.log("> deleteFormById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.deleteFormDefinitionV1({ formDefinitionID: id });
	}

	public async exportForms(filters: string | undefined = undefined): Promise<ExportFormDefinitionsByTenantV1200ResponseInner[]> {
		console.log("> exportForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		let args = {
			offset: 0,
			limit: DEFAULT_PAGINATION,
			filters
		}
		let count = -1
		const result: ExportFormDefinitionsByTenantV1200ResponseInner[] = []
		do {
			const response = await api.exportFormDefinitionsByTenantV1(args)
			count = response.data.length
			if (response.data && response.data.length > 0) {
				result.push(...response.data)
			}
			args.offset += DEFAULT_PAGINATION
		} while (count === DEFAULT_PAGINATION)

		return result
	}

	public async importForms(forms: ImportFormDefinitionsV1RequestInner[]) {
		console.log("> importForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.importFormDefinitionsV1({
			body: forms
		})
		return response.data
	}

	//////////////////////////////
	//#endregion Forms
	//////////////////////////////

	//////////////////////////////
	//region Applications
	//////////////////////////////

	public async createApplication({ name, description, sourceId }: { name: string; description: string; sourceId: string; }): Promise<SourceApp> {
		console.log("> createApplication", name, sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AppsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.createSourceAppV1({
			sourceAppCreateDto: {
				name,
				description,
				matchAllAccounts: false,
				accountSource: {
					id: sourceId,
					type: "SOURCE"
				}
			}
		});
		return response.data;
	}
	/**
	 * cf. SAASTRIAGE-7051
	 * @param filters 
	 * @param limit 
	 * @param offset 
	 * @param count 
	 * @returns 
	 */
	public async getApplication(applicationId: string): Promise<SourceApp | undefined> {
		console.log("> getApplication", applicationId);
		const response = await this.getPaginatedApplications(
			`id eq "${applicationId}"`,
			2
		);
		if (response.data.length === 1) {
			return response.data[0]
		}
		return undefined
	}


	public async getAllApplications(filters: string): Promise<SourceApp[]> {
		console.log("> getAllApplications", filters);
		const apiConfig = await this.getApiConfiguration();
		const api = new AppsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listAllSourceAppV1, { filters, sorters: "name" });
		return result.data;
	}

	public async getPaginatedApplications(filters: string, limit?: number, offset?: number, count?: boolean): Promise<AxiosResponse<SourceApp[]>> {
		console.log("> getPaginatedApplications", filters, limit, offset);

		limit = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;
		const apiConfig = await this.getApiConfiguration();
		const api = new AppsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listAllSourceAppV1({
			offset,
			limit,
			filters,
			sorters: "name",
			count
		})
		return response;
	}

	public async updateApplication(id: string, operations: Array<JsonPatchOperation>): Promise<SourceAppPatchDto> {
		console.log("> updateApplication", id, operations);
		const apiConfig = await this.getApiConfiguration();
		const api = new AppsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.patchSourceAppV1({ id, jsonPatchOperation: operations });
		return response.data;
	}

	public async getPaginatedApplicationAccessProfiles(appId: string, limit?: number, offset?: number): Promise<AxiosResponse<AccessProfileDetails[]>> {
		console.log("> getPaginatedApplicationAccessProfile", limit, offset);

		limit = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;
		const apiConfig = await this.getApiConfiguration();
		const api = new AppsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		return await api.listAccessProfilesForSourceAppV1({
			id: appId,
			limit,
			offset,
		});
	}

	public async removeAccessProfileFromApplication(appId: string, accessProfileId: string): Promise<void> {
		console.log("> removeAccessProfileFromApplication", appId, accessProfileId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AppsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.deleteAccessProfilesFromSourceAppByBulkV1({
			id: appId,
			requestBody: [accessProfileId],
		});
	}

	public async addAccessProfilesToApplication(appId: string, accessProfileIds: string[]): Promise<void> {
		console.log("> addAccessProfileToApplication", appId, accessProfileIds);
		const payload: JsonPatchOperation[] = accessProfileIds.map(accessProfileId => ({
			op: JsonPatchOperationOpEnum.Add,
			path: "/accessProfiles/-",
			value: accessProfileId,
		}));
		await this.updateApplication(appId, payload);
	}

	//////////////////////////////
	//#endregion Applications
	//////////////////////////////

	//////////////////////////////
	//#region Certification Campaigns
	//////////////////////////////

	public async getPaginatedCampaigns(filters: string, limit?: number, offset?: number, count?: boolean): Promise<AxiosResponse<any[]>> {
		console.log("> getPaginatedCampaigns", filters, limit, offset);

		limit = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationCampaignsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		return await api.getActiveCampaignsV1({
			filters,
			limit,
			offset,
			count,
			sorters: "-created",
		});
	}

	public async getCampaign(campaignId: string): Promise<GetCampaignV1200Response> {
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationCampaignsApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		const val = await api.getCampaignV1({ id: campaignId });

		if (val.status !== 200) {
			throw new Error(`Failed to fetch campaign with ID [${campaignId}]. Status: ${val.status}.`);
		}

		return val.data;
	}

	public async getCampaignCertifications(campaignId: string, completed?: boolean): Promise<IdentityCertificationDto[]> {
		let filters = `campaign.id eq "${campaignId}"`
		if (completed !== undefined) {
			filters += ` and completed eq ${completed}`
		}
		return this.getCampaignCertificationsByFilter(filters);
	}

	public async getCampaignCertificationsByFilter(filters: string): Promise<IdentityCertificationDto[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		const val = await Paginator.paginate(
			api,
			api.listIdentityCertificationsV1,
			{
				filters,
				sorters: "name"
			}
		);

		if (val.status !== 200) {
			throw new Error(`Failed to fetch certifications for campaign with filter [${filters}]. Status: ${val.status}.`);
		}

		return val.data;
	}

	public async getCertificationReviewItems(certificationId: string, completed?: boolean): Promise<AccessReviewItem[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		let filters
		if (completed !== undefined) {
			filters = `completed eq ${completed}`
		}

		const val = await Paginator.paginate(
			api,
			api.listIdentityAccessReviewItemsV1,
			{
				id: certificationId,
				filters: filters
			}
		);

		if (val.status !== 200) {
			throw new Error(`Failed to fetch access review items for certification with ID [${certificationId}]. Status: ${val.status}.`);
		}

		return val.data;
	}

	public async getPaginatedCampaignCertifications({ campaignId, offset, sorters = "name", limit = 250 }: {
		campaignId: string,
		offset: number,
		sorters?: string,
		limit?: number
	}): Promise<PaginatedData<IdentityCertificationDto>> {
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		let filters = `campaign.id eq "${campaignId}"`
		const resp = await api.listIdentityCertificationsV1({
			filters,
			offset,
			limit,
			count: true,
			sorters

		})

		return {
			data: resp.data,
			count: parseInt(resp.headers[TOTAL_COUNT_HEADER]),
			limit,
			offset
		}
	}

	public async getSummaryCertificationDecisions(certificationId: string): Promise<IdentityCertDecisionSummary> {
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationSummariesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const resp = await api.getIdentityDecisionSummaryV1({ id: certificationId })
		return resp.data
	}

	public async reassignCampaignCertifications(certificationMoveRequest: CertificationCampaignsApiMoveV1Request): Promise<void> {
		const apiConfig = await this.getApiConfiguration();
		const campaignApi = new CertificationCampaignsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		await campaignApi.moveV1(certificationMoveRequest);
	}

	public async reassignCertificationReviewItemsSync(certificationReassignRequestSync: CertificationsApiReassignIdentityCertificationsV1Request): Promise<CertificationTask> {
		const apiConfig = await this.getApiConfiguration();
		const certificationsApi = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const resp = await certificationsApi.reassignIdentityCertificationsV1(certificationReassignRequestSync)
		return resp.data
	}

	public async reassignCertificationReviewItemsAsync(certificationReassignRequestAsync: CertificationsApiSubmitReassignCertsAsyncV1Request): Promise<CertificationTask> {
		const apiConfig = await this.getApiConfiguration();
		const certificationsApi = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const resp = await certificationsApi.submitReassignCertsAsyncV1(certificationReassignRequestAsync)
		return resp.data
	}

	public async decideCertificationItems(certificationsApiMakeIdentityDecisionRequest: CertificationsApiMakeIdentityDecisionV1Request): Promise<{ IdentityCertificationDto: IdentityCertificationDto }> {
		const apiConfig = await this.getApiConfiguration();
		const certificationsApi = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const resp = await certificationsApi.makeIdentityDecisionV1(certificationsApiMakeIdentityDecisionRequest)
		return {
			IdentityCertificationDto: resp.data
		}
	}

	/**
	 * Lists the pending (or completed) identity campaign certifications for which the given identity is the reviewer.
	 */
	public async getCertificationsByReviewer(reviewerIdentityId: string, completed = false): Promise<IdentityCertificationDto[]> {
		console.log("> getCertificationsByReviewer", reviewerIdentityId, completed);
		const apiConfig = await this.getApiConfiguration();
		const api = new CertificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listIdentityCertificationsV1, {
			reviewerIdentity: reviewerIdentityId,
			filters: `completed eq ${completed}`,
			sorters: "name"
		});
		return result.data;
	}

	//////////////////////////////
	//#endregion Certification Campaigns
	//////////////////////////////

	//////////////////////////////
	//#region Access Request Approvals
	//////////////////////////////

	/**
	 * Lists the pending access request approvals owned by (assigned to) the given identity.
	 */
	public async getPendingApprovals(ownerId: string): Promise<PendingApproval[]> {
		console.log("> getPendingApprovals", ownerId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessRequestApprovalsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listPendingApprovalsV1, { ownerId });
		return result.data;
	}

	/**
	 * Forwards (reassigns) a pending access request approval to a different identity.
	 */
	public async forwardAccessRequestApproval(approvalId: string, newOwnerId: string, comment: string): Promise<void> {
		console.log("> forwardAccessRequestApproval", approvalId, newOwnerId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessRequestApprovalsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.forwardAccessRequestV1({
			approvalId,
			forwardApprovalDto: { newOwnerId, comment }
		});
	}

	//////////////////////////////
	//#endregion Access Request Approvals
	//////////////////////////////

	/////////////////////////
	//#region Notification Templates
	/////////////////////////

	public async getNotificationTemplates(filters?: string): Promise<TemplateDto[]> {
		console.log("> getNotificationTemplates", filters);
		const apiConfig = await this.getApiConfiguration();
		const api = new NotificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(
			api,
			api.listNotificationTemplatesV1,
			filters ? { filters } : undefined,
		);
		return result.data;
	}

	/**
	 * Product defaults (`GET /beta/notification-template-defaults`).
	 * A tenant customization is a separate object and is not returned here.
	 * `filters` is the standard collection filter; `key` supports `eq`.
	 */
	public async getNotificationTemplateDefaults(filters?: string): Promise<TemplateDtoDefault[]> {
		console.log("> getNotificationTemplateDefaults", filters);
		const apiConfig = await this.getApiConfiguration();
		const api = new NotificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(
			api,
			api.listNotificationTemplateDefaultsV1,
			filters ? { filters } : undefined,
		);
		return result.data;
	}

	/**
	 * Fetch a single notification template.
	 *
	 * `GET /notification-templates/{id}` is documented to return an array even
	 * though the id is unique, but it can also come back empty or 404 for some
	 * tenants, so we fall back to finding the template in the customized list.
	 *
	 * Defaults have no id. The tree addresses them with a synthetic id; a
	 * customization of the same key, medium and locale wins when one exists.
	 * `GET /notification-templates/{id}` does not return a product default, so
	 * a default is loaded from `GET /notification-template-defaults` filtered by key.
	 */
	public async getNotificationTemplateById(id: string): Promise<TemplateDto> {
		console.log("> getNotificationTemplateById", id);
		const identity = parseDefaultNotificationTemplateId(id);
		if (identity) {
			return await this.getNotificationTemplateByIdentity(identity.key, identity.medium, identity.locale);
		}
		const apiConfig = await this.getApiConfiguration();
		const api = new NotificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		try {
			const response = await api.getNotificationTemplateV1({ id });
			const template = Array.isArray(response.data) ? response.data[0] : response.data;
			if (template) {
				return template;
			}
		} catch (error) {
			console.warn("> getNotificationTemplateById: GET by id failed", error);
		}
		const templates = await this.getNotificationTemplates();
		const match = templates.find(t => t.id === id);
		if (!match) {
			throw new Error(`Could not find notification template ${id}`);
		}
		return match;
	}

	private async getNotificationTemplateByIdentity(key: string, medium: string, locale: string): Promise<TemplateDto> {
		// Same key can exist for several mediums and locales. The list is filtered
		// on the key; medium and locale select the template in that result.
		const filters = notificationTemplateKeyFilter(key);
		const custom = (await this.getNotificationTemplates(filters))
			.find(template => template.key === key && template.medium === medium && template.locale === locale);
		if (custom) {
			return custom;
		}
		const defaults = await this.getNotificationTemplateDefaults(filters);
		const match = defaults.find(template => template.key === key && template.medium === medium && template.locale === locale);
		if (!match?.key || !match.medium || !match.locale) {
			throw new Error(`Could not find notification template ${key}/${medium}/${locale}`);
		}
		return {
			key: match.key,
			name: match.name,
			medium: match.medium,
			locale: match.locale,
			subject: match.subject ?? undefined,
			body: match.body,
			from: match.from ?? undefined,
			replyTo: match.replyTo ?? undefined,
			description: match.description ?? undefined,
			slackTemplate: match.slackTemplate ?? undefined,
			teamsTemplate: match.teamsTemplate ?? undefined,
		};
	}

	public async updateNotificationTemplate(template: TemplateDto): Promise<TemplateDto> {
		console.log("> updateNotificationTemplate", template.key, template.medium, template.locale);
		const apiConfig = await this.getApiConfiguration();
		const api = new NotificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const payload: TemplateDto = { ...template };
		// Defaults are addressed with a synthetic id. The upsert keys off
		// key + medium + locale and rejects an id that is not a stored template.
		if (isDefaultNotificationTemplateId(payload.id)) {
			delete payload.id;
		}
		// Despite the name, this is an upsert-by-key/medium/locale - there's no PUT /{id}
		const response = await api.createNotificationTemplateV1({ templateDto: payload });
		return response.data;
	}

	/**
	 * Send a test notification for a stored template.
	 * `POST /beta/send-test-notification` (`sendTestNotification`).
	 */
	public async sendTestNotification(request: SendTestNotificationRequestDto): Promise<void> {
		console.log("> sendTestNotification", request.key, request.medium, request.locale);
		const apiConfig = await this.getApiConfiguration();
		const api = new NotificationsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.sendTestNotificationV1({ sendTestNotificationRequestDto: request });
	}
	/////////////////////////
	//#endregion Notification Templates
	/////////////////////////

	/////////////////////////
	//#region Segments
	/////////////////////////

	public async getSegments(): Promise<Segment[]> {
		console.log("> getSegments");
		const apiConfig = await this.getApiConfiguration();
		const api = new SegmentsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listSegmentsV1);
		return result.data;
	}

	/////////////////////////
	//#endregion Segments
	/////////////////////////

	/////////////////////////
	//#region SoD Policies
	/////////////////////////

	public async getSoDPolicies(): Promise<SodPolicy[]> {
		console.log("> getSoDPolicies");
		const apiConfig = await this.getApiConfiguration();
		const api = new SODPoliciesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await Paginator.paginate(api, api.listSodPoliciesV1, { sorters: "name" });
		return result.data;
	}

	/////////////////////////
	//#endregion SoD Policies
	/////////////////////////

	/////////////////////////
	//#region Search attributes
	/////////////////////////

	public async getSearchAttributes(): Promise<SearchAttributeConfig[]> {
		console.log("> getSearchAttributes");
		const apiConfig = await this.getApiConfiguration();
		const api = new SearchAttributeConfigurationApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const result = await api.getSearchAttributeConfigV1()
		return result.data.sort(compareByName)
	}

	public async createSearchAttribute(searchAttributeConfig: SearchAttributeConfig): Promise<void> {
		console.log("> createSearchAttribute");
		const apiConfig = await this.getApiConfiguration();
		const api = new SearchAttributeConfigurationApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.createSearchAttributeConfigV1({ searchAttributeConfig })
	}

	/////////////////////////
	//#endregion Search attributes
	/////////////////////////

	/////////////////////////
	//#region Identity attributes
	/////////////////////////

	public async getIdentityAttributes(): Promise<IdentityAttribute2[]> {
		console.log("> getIdentityAttributes");
		const apiConfig = await this.getApiConfiguration()
		const api = new IdentityAttributesApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const result = await api.listIdentityAttributesV1({})
		return result.data
	}

	public async createIdentityAttribute(identityAttribute: IdentityAttribute2): Promise<IdentityAttribute2> {
		console.log("> createIdentityAttribute");
		const apiConfig = await this.getApiConfiguration()
		const api = new IdentityAttributesApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const result = await api.createIdentityAttributeV1({ identityAttribute2: identityAttribute })
		return result.data
	}

	/////////////////////////
	//#endregion Identity attributes
	/////////////////////////


	/////////////////////////
	//#region Password Management
	/////////////////////////

	public async getPasswordOrgConfig(): Promise<PasswordOrgConfig> {
		console.log("> getPasswordOrgConfig");
		const apiConfig = await this.getApiConfiguration()
		const api = new PasswordConfigurationApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const result = await api.getPasswordOrgConfigV1()
		return result.data
	}

	public async generateDigitToken(identityId: string, durationMinutes: number, length: number): Promise<string> {
		console.log("> generateDigitToken");
		const apiConfig = await this.getApiConfiguration()
		const api = new PasswordManagementApi(apiConfig, undefined, this.getAxiosWithInterceptors())
		const result = await api.createDigitTokenV1({
			passwordDigitTokenReset: {
				userId: identityId,
				durationMinutes,
				length
			}

		})
		console.log(`generateDigitToken: Request Id = ${result.data.requestId}`);

		return result.data.digitToken!
	}

	/////////////////////////
	//#endregion Password Management
	/////////////////////////

	////////////////////////
	//#region Identity Management
	////////////////////////

	public async getIdentityByName(identityName: string): Promise<Identity | undefined> {
		// Can only ever be one ID
		const result = await this.listIdentities({ filters: `alias eq "${identityName}"` })
		if (result && result.data) {
			return result.data[0]
		}
		return undefined
	}

	public async listIdentities(identityFilter: IdentitiesApiListIdentitiesV1Request): Promise<AxiosResponse<Identity[]>> {
		console.log("> listIdentities");
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const result = await api.listIdentitiesV1(identityFilter);
		return result;
	}

	public async listMachineIdentities(params: MachineIdentitiesApiListMachineIdentitiesV1Request): Promise<AxiosResponse<MachineIdentityResponse[]>> {
		console.log("> listMachineIdentities");
		const apiConfig = await this.getApiConfiguration();
		const api = new MachineIdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		return await api.listMachineIdentitiesV1(params);
	}

	public async listMachineAccountSubtypes(sourceId: string): Promise<SourceSubtypeWithSource[]> {
		console.log("> listMachineAccountSubtypes");
		const apiConfig = await this.getApiConfiguration();
		const api = new MachineAccountSubtypesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		console.log(api.listSourceSubtypesV1);
		const response = await api.listSourceSubtypesV1({
			filters: `source.id eq "${sourceId}"`,
			sorters: "displayName"
		});
		return response.data
	}

	public async processIdentity(identityId: string): Promise<AxiosResponse<TaskResultResponse, any>> {
		console.log("> processIdentity");
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const requestParameters = {
			processIdentitiesRequest:
			{
				identityIds: [identityId]
			}
		};
		return await api.startIdentityProcessingV1(requestParameters);
	}

	public async syncIdentityAttributes(identityId: string): Promise<AxiosResponse<IdentitySyncJob, any>> {
		console.log("> syncIdentityAttributes");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		//IdentitiesApiSynchronizeAttributesForIdentityRequest
		return await api.synchronizeAttributesForIdentityV1(
			{ identityId: identityId });
	}

	public async deleteIdentity(identityId: string): Promise<void> {
		console.log("> deleteIdentity");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		await api.deleteIdentityV1({ id: identityId });
	}

	public async inviteIdentity(identityId: string): Promise<void> {
		console.log("> inviteIdentity");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		await api.startIdentitiesInviteV1({
			inviteIdentitiesRequest: { ids: [identityId] }
		});
	}

	public async setIdentityLifecycleState(identityId: string, lifecycleStateId: string): Promise<string | undefined> {
		console.log("> setIdentityLifecycleState");

		const apiConfig = await this.getApiConfiguration();
		const api = new LifecycleStatesApi(apiConfig, undefined, this.getAxiosWithInterceptors());

		const resp = await api.setLifecycleStateV1({
			identityId,
			setLifecycleStateV1Request: { lifecycleStateId }
		});
		return resp.data.accountActivityId;
	}

	public async getAccountActivity(accountActivityId: string): Promise<AccountActivity> {
		console.log("> getAccountActivity", accountActivityId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountActivitiesApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getAccountActivityV1({ id: accountActivityId });
		return response.data;
	}

	public async getIdentityProfileForIdentity(identityId: string): Promise<{ profileId: string; profileName?: string; currentLifecycleState?: string }> {
		console.log("> getIdentityProfileForIdentity", identityId);

		const results = await this.searchAllIdentities(
			`id:${identityId}`,
			1,
			["id", "name", "identityProfile", "cloudLifecycleState"]
		);
		const identity = this.ensureOneElement(results, "identity", identityId) as IdentityDocument & {
			identityProfile?: { id?: string; name?: string };
			cloudLifecycleState?: string;
		};
		const profileId = identity.identityProfile?.id;
		if (!profileId) {
			throw new Error(`Identity ${identityId} has no identity profile.`);
		}
		return {
			profileId,
			profileName: identity.identityProfile?.name,
			currentLifecycleState: identity.cloudLifecycleState
		};
	}

	public async listCustomUserLevels(): Promise<UserLevelSummaryDTO[]> {
		console.log("> listCustomUserLevels");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomUserLevelsApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const limit = 50;
		const levels: UserLevelSummaryDTO[] = [];
		let offset = 0;
		let count: number;
		do {
			const response = await api.listUserLevelsV1({
				limit,
				offset,
				sorters: "name",
				detailLevel: ListUserLevelsV1DetailLevelEnum.Full
			});
			count = response.data.length;
			levels.push(...response.data);
			offset += limit;
		} while (count === limit);
		return levels;
	}

	public async getAuthUser(identityId: string): Promise<AuthUser> {
		console.log("> getAuthUser", identityId);
		const apiConfig = await this.getApiConfiguration();
		const api = new AuthUsersApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.getAuthUserV1({ id: identityId });
		return response.data;
	}

	public async setAuthUserCapabilities(identityId: string, capabilities: string[]): Promise<void> {
		console.log("> setAuthUserCapabilities", identityId, capabilities);
		const apiConfig = await this.getApiConfiguration();
		const api = new AuthUsersApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		await api.patchAuthUserV1({
			id: identityId,
			jsonPatchOperation: [{
				op: JsonPatchOperationOpEnum.Replace,
				path: "/capabilities",
				value: capabilities
			}]
		});
	}

	////////////////////////
	//#endregion Identity Management
	////////////////////////

	/**
	 * cf. https://developer.sailpoint.com/docs/api/v2025/list-privilege-criteria-config
	 * @param sourceId Id of the source
	 * @returns the privilege criteria configurations defined for the source
	 */
	public async getPrivilegeCriteriaConfigs(sourceId: string): Promise<PrivilegeCriteriaConfigDTO[]> {
		console.log("> getPrivilegeCriteriaConfigs", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new PrivilegeCriteriaConfigurationApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listPrivilegeCriteriaConfigV1({
			filters: `sourceId eq "${sourceId}"`
		})
		return response.data;
	}

	/**
	 * cf. https://developer.sailpoint.com/docs/api/v2025/list-privilege-criteria
	 * @param sourceId Id of the source
	 * @returns the privilege criteria defined for the source
	 */
	public async getPrivilegeCriteria(sourceId: string): Promise<PrivilegeCriteriaDTO[]> {
		console.log("> getPrivilegeCriteria", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new PrivilegeCriteriaApi(apiConfig, undefined, this.getAxiosWithInterceptors());
		const response = await api.listPrivilegeCriteriaV1({
			filters: `sourceId eq "${sourceId}"`
		})
		return response.data;
	}

	public async getEmailTestMode(): Promise<EmailTestMode> {
		console.log("> getEmailTestMode");
		return await this.getResource("/beta/notification-preferences/email-test-mode")
	}

	public async updateEmailTestMode(emailTestMode: boolean, emailTestAddress?: string): Promise<EmailTestMode> {
		console.log("> updateEmailTestMode");

		return await this.updateResource("/beta/notification-preferences/email-test-mode",
			JSON.stringify({
				emailTestMode, emailTestAddress
			})
		)
	}
}