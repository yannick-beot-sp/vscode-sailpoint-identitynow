import * as vscode from "vscode";
import * as os from 'os';
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointISCAuthenticationProvider } from "./AuthenticationProvider";
import { compareByName, convertToText } from "../utils";
import { DEFAULT_ACCOUNTS_QUERY_PARAMS } from "../models/Account";
import { DEFAULT_ENTITLEMENTS_QUERY_PARAMS } from "../models/Entitlements";
import { Configuration, IdentityProfilesApi, IdentityProfile, LifecycleState, LifecycleStatesApi, Paginator, ServiceDeskIntegrationApi, ServiceDeskIntegrationDto, Source, SourcesApi, TransformsApi, WorkflowsBetaApi, WorkflowBeta, WorkflowExecutionBeta, WorkflowLibraryTriggerBeta, ConnectorRuleManagementBetaApi, ConnectorRuleResponseBeta, ConnectorRuleValidationResponseBeta, AccountsApi, AccountsApiListAccountsRequest, Account, EntitlementsBetaApi, EntitlementsBetaApiListEntitlementsRequest, PublicIdentitiesApi, PublicIdentitiesApiGetPublicIdentitiesRequest, PublicIdentity, JsonPatchOperationBeta, SPConfigBetaApi, SpConfigImportResultsBeta, SpConfigJobBeta, ImportOptionsBeta, SpConfigExportResultsBeta, ObjectExportImportOptionsBeta, ExportPayloadBetaIncludeTypesEnum, TransformRead, GovernanceGroupsBetaApi, WorkgroupDtoBeta, AccessProfilesApi, AccessProfilesApiListAccessProfilesRequest, AccessProfile, RolesApi, Role, RolesApiListRolesRequest, Search, SearchApi, IdentityDocument, SearchDocument, AccessProfileDocument, EntitlementDocument, EntitlementBeta, RoleDocument, SourcesBetaApi, StatusResponseBeta, Schema, FormBeta, CustomFormsBetaApi, ExportFormDefinitionsByTenant200ResponseInnerBeta, FormDefinitionResponseBeta, NotificationsBetaApi, TemplateDtoBeta, SegmentsApi, Segment, SearchAttributeConfigurationBetaApi, SearchAttributeConfigBeta, IdentityAttributesBetaApi, IdentityAttributeBeta, PasswordConfigurationApi, PasswordOrgConfig, PasswordManagementBetaApi, ConnectorRuleUpdateRequestBeta, IdentitiesBetaApi, IdentitiesBetaApiListIdentitiesRequest, IdentityBeta, IdentitySyncJobBeta, TaskResultResponseBeta, LoadEntitlementTaskBeta, TaskManagementBetaApi, TaskStatusBeta, EntitlementSourceResetBaseReferenceDtoBeta, AccountsBetaApi, TaskResultDtoBeta, ProvisioningPolicyDto, ImportFormDefinitionsRequestInnerBeta, ManagedClustersBetaApi, ManagedClustersApi, StandardLevelBeta } from 'sailpoint-api-client';
import { DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS } from '../models/PublicIdentity';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ImportEntitlementsResult } from '../models/JobStatus';
import { basename } from 'path';
import { createReadStream } from 'fs';
import { DEFAULT_ACCESSPROFILES_QUERY_PARAMS } from "../models/AccessProfiles";
import { DEFAULT_ROLES_QUERY_PARAMS } from "../models/Roles";
import axiosRetry = require("axios-retry");
import { addQueryParams, withQuery } from "../utils/UriUtils";
import { onErrorResponse, onRequest, onResponse } from "./AxiosHandlers";
// eslint-disable-next-line @typescript-eslint/naming-convention
const FormData = require('form-data');

// cf. https://axios-http.com/docs/res_schema
// All header names are lower cased.
const CONTENT_TYPE_HEADER = "Content-Type";
const USER_AGENT_HEADER = "User-Agent";
const EXTENSION_VERSION = vscode.extensions.getExtension("yannick-beot-sp.vscode-sailpoint-identitynow").packageJSON.version
const USER_AGENT = `VSCode/${EXTENSION_VERSION}/${vscode.version} (${os.type()} ${os.arch()} ${os.release()})`
const DEFAULT_AXIOS_OPTIONS: AxiosRequestConfig = {
	headers: {
		[USER_AGENT_HEADER]: USER_AGENT
	}
}
export const TOTAL_COUNT_HEADER = "x-total-count";

// Content types
const CONTENT_TYPE_JSON = "application/json";
const CONTENT_TYPE_FORM_URLENCODED = "application/x-www-form-urlencoded";
const CONTENT_TYPE_FORM_DATA = "multipart/form-data";
const CONTENT_TYPE_FORM_JSON_PATCH = "application/json-patch+json";


const DEFAULT_PAGINATION = 250;

export class ISCClient {

	constructor(
		private readonly tenantId: string,
		private readonly tenantName: string
	) {

	}

	private async prepareHeaders(contentType = CONTENT_TYPE_JSON): Promise<any> {
		const headers = await this.prepareAuthenticationHeader();
		headers[CONTENT_TYPE_HEADER] = contentType;
		headers[USER_AGENT_HEADER] = USER_AGENT
		return headers;
	}

	private async prepareAuthenticationHeader(): Promise<any> {
		const session = await SailPointISCAuthenticationProvider.getInstance().getSessionByTenant(this.tenantId)

		return {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Authorization: `Bearer ${session?.accessToken}`,

		};
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
	private async getApiConfiguration(): Promise<Configuration> {
		
		const session = await await SailPointISCAuthenticationProvider.getInstance().getSessionByTenant(this.tenantId)
		const apiConfig = new Configuration({
			baseurl: EndpointUtils.getBaseUrl(this.tenantName),
			tokenUrl: EndpointUtils.getAccessTokenUrl(this.tenantName),
			accessToken: session?.accessToken,
			// TODO https://github.com/sailpoint-oss/typescript-sdk/issues/30
			clientId: "",
			clientSecret: ""
		});

		apiConfig.retriesConfig = {
			retries: 10,
			retryDelay: axiosRetry.exponentialDelay,
			onRetry(retryCount, error, requestConfig) {
				console.log(`retrying due to request error, try number ${retryCount}`);
			},
		};

		return apiConfig;
	}

	/**
	 * 
	 * @param contentType 
	 * @returns Create an Axios Instance
	 */
	private async getAxios(contentType = CONTENT_TYPE_JSON): Promise<AxiosInstance> {
		const session = await SailPointISCAuthenticationProvider.getInstance().getSessionByTenant(this.tenantId)

		const instance = axios.create({
			baseURL: EndpointUtils.getBaseUrl(this.tenantName),
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"Content-Type": contentType,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"Authorization": `Bearer ${session?.accessToken}`,
				[USER_AGENT_HEADER]: USER_AGENT
			}

		});
		instance.interceptors.request.use(
			onRequest);
		instance.interceptors.response.use(
			onResponse,
			onErrorResponse
		);
		return instance;
	}

	/////////////////////
	//#region Sources
	/////////////////////
	public async pingCluster(sourceId: string): Promise<StatusResponseBeta> {
		console.log("> pingClusterConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesBetaApi(apiConfig)

		const response = await api.pingCluster({ sourceId }, DEFAULT_AXIOS_OPTIONS)
		return response.data;
	}

	public async testSourceConnection(sourceId: string): Promise<StatusResponseBeta> {
		console.log("> testSourceConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesBetaApi(apiConfig)
		const response = await api.testSourceConnection({ sourceId }, DEFAULT_AXIOS_OPTIONS)
		return response.data;
	}

	public async peekSourceConnection(sourceId: string, objectType: string, maxCount: number): Promise<StatusResponseBeta> {
		console.log("> peekSourceConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesBetaApi(apiConfig)
		const response = await api.peekResourceObjects({
			sourceId,
			resourceObjectsRequestBeta: {
				objectType,
				maxCount
			}
		}, DEFAULT_AXIOS_OPTIONS)
		return response.data;
	}


	public async getSources(): Promise<Source[]> {
		console.log("> getSources");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await Paginator.paginate(api, api.listSources, { sorters: "name" });
		return result.data;
	}

	public async getSourceById(id: string): Promise<Source> {
		console.log("> getSourceById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await api.getSource({ id }, DEFAULT_AXIOS_OPTIONS);
		return result.data;
	}

	public async getSourceByName(name: string): Promise<Source> {
		console.log("> getSourceByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await api.listSources({
			filters: `name eq "${name}"`,
			limit: 2
		}, DEFAULT_AXIOS_OPTIONS)

		if (result === undefined || (result instanceof Array && result.length !== 1)) {
			throw new Error(`Could not find source ${name}`);
		}
		return result.data[0];
	}

	public async createProvisioningPolicy(sourceId: string,
		provisioningPolicyDto: ProvisioningPolicyDto): Promise<ProvisioningPolicyDto> {

		console.log("> createProvisioningPolicy", sourceId, provisioningPolicyDto);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await api.createProvisioningPolicy({
			sourceId,
			provisioningPolicyDto
		}, DEFAULT_AXIOS_OPTIONS)
		return result.data;
	}

	/**
	 * @param sourceName - A reference to the source to search for accounts.
	 */
	public async getSourceId(sourceName: string): Promise<string> {
		console.log("> getSourceId", sourceName);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const response = await api.listSources({
			filters: `name eq "${sourceName}" or id eq "${sourceName}"`,
			count: true
		}, DEFAULT_AXIOS_OPTIONS);
		const source = this.ensureOneBasedOnHeader(response, "source", sourceName);
		return source.id!;
	}

	public async getSchemas(sourceId: string): Promise<Schema[]> {
		console.log("> getSchemas", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const response = await api.getSourceSchemas({ sourceId }, DEFAULT_AXIOS_OPTIONS);

		return response.data;
	}

	public async createSchema(sourceId: string, schema: Schema): Promise<Schema> {
		console.log("> createSchema", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const response = await api.createSourceSchema({ sourceId, schema }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}


	public async startEntitlementAggregation(
		sourceID: string
	): Promise<LoadEntitlementTaskBeta> {
		console.log("> ISCClient.startEntitlementAggregation");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesBetaApi(apiConfig);
		const response = await api.importEntitlements({ id: sourceID }, DEFAULT_AXIOS_OPTIONS)
		return response.data
	}

	public async startEntitlementReset(
		sourceID: string
	): Promise<EntitlementSourceResetBaseReferenceDtoBeta> {
		console.log("> ISCClient.startEntitlementReset");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const response = await api.resetSourceEntitlements({
			id: sourceID
		}, DEFAULT_AXIOS_OPTIONS)
		return response.data
	}

	public async startAccountReset(
		sourceID: string
	): Promise<TaskResultDtoBeta> {
		console.log("> ISCClient.startAccountReset");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesBetaApi(apiConfig);
		const response = await api.deleteAccountsAsync({
			id: sourceID
		}, DEFAULT_AXIOS_OPTIONS)
		return response.data
	}

	public async startAccountAggregation(
		sourceID: string,
		disableOptimization = false,
		filePath: string | undefined = undefined
	): Promise<any> {
		console.log("> ISCClient.startAccountAggregation");

		const endpoint = `beta/sources/${sourceID}/load-accounts`;
		console.log("endpoint = " + endpoint);

		const formData = new FormData();

		if (disableOptimization) {
			formData.append("disableOptimization", "true");
		}

		if (filePath !== undefined) {
			const blob = createReadStream(filePath);
			formData.append('file', blob, basename(filePath));
		}

		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_DATA);
		const response = await httpClient.post(endpoint, formData);
		return response.data;

	}

	public async getTaskStatus(
		taskId: string,
	): Promise<TaskStatusBeta> {
		console.log("> getTaskStatus", taskId);
		const apiConfig = await this.getApiConfiguration();
		const api = new TaskManagementBetaApi(apiConfig);
		const response = await api.getTaskStatus({
			id: taskId
		}, DEFAULT_AXIOS_OPTIONS)
		return response.data;
	}

	public async updateLogConfiguration(
		clusterId: string, duration: number, logLevels: {
			[key: string]: StandardLevelBeta;
		}
	): Promise<void> {
		console.log("> updateLogConfiguration", clusterId);
		const apiConfig = await this.getApiConfiguration();
		const api = new ManagedClustersBetaApi(apiConfig);
		const response = await api.putClientLogConfiguration({
			id: clusterId,
			clientLogConfigurationBeta: {
				durationMinutes: duration,
				clientId: "VSCode",
				logLevels,
				rootLevel: "INFO"
			}
		}, DEFAULT_AXIOS_OPTIONS)
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
		const api = new TransformsApi(apiConfig);
		const result = await api.listTransforms({}, DEFAULT_AXIOS_OPTIONS);
		const transforms = result.data;
		if (transforms !== undefined && transforms instanceof Array) {
			transforms.sort(compareByName);
		}
		return transforms;
	}

	public async getTransformByName(name: string): Promise<TransformRead> {
		console.log("> getTransformByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new TransformsApi(apiConfig);
		const response = await api.listTransforms({
			filters: `name eq "${name}"`,
			limit: 1,
			count: true
		}, DEFAULT_AXIOS_OPTIONS);

		const transform = this.ensureOneBasedOnHeader(response, "transform", name);
		return transform;
	}
	////////////////////////
	//#endregion Transforms
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
		const response = await httpClient.delete(path);
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
			&& response.headers[CONTENT_TYPE_HEADER].toString().startsWith(CONTENT_TYPE_JSON)
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


		let endpoint = EndpointUtils.getV3Url(this.tenantName) + "/search";
		console.log("endpoint = " + endpoint);

		const headers = await this.prepareHeaders();

		const data = {
			indices: ["identities"],
			query: {
				query: '"' + identityNameOrId + '"',
				fields: ["name", "displayName", "id"],
			},
		};

		// @ts-ignore 
		let identity = await fetch(endpoint, {
			headers: headers,
			method: "POST",
			body: convertToText(data),
		})
			.then(async function (response) {
				if (response.status === 200) {
					let json: any = await response.json();

					if (json !== undefined) {
						if (json.length > 0) {
							return json[0];
						}
					}
				} else {
					console.error(response.statusText);
					vscode.window.showErrorMessage(
						`${endpoint} --> ${response.statusText}`
					);
					return;
				}
			})
			.catch(function (error) {
				console.log(error);
			});

		if (identity !== undefined) {
			return identity;
		}
	}

	public async searchAccessProfiles(query: string, limit?: number, fields?: string[], includeNested = false): Promise<AccessProfileDocument[]> {
		console.log("> searchAccessProfiles", query);

		const search: Search = {
			indices: [
				"accessprofiles"
			],
			query: {
				query: query
			},
			sort: ["name"],
			includeNested: includeNested,
			queryResultFilter: {
				includes: fields
			}
		};

		return await this.search(search, limit) as IdentityDocument[];
	}

	public async searchEntitlements(query: string, limit?: number, fields?: string[], includeNested = false): Promise<EntitlementDocument[]> {
		console.log("> searchIdentity", query);

		const search: Search = {
			indices: [
				"entitlements"
			],
			query: {
				query: query
			},
			sort: ["name"],
			includeNested: includeNested,
			queryResultFilter: {
				includes: fields
			}
		};

		return await this.search(search, limit) as EntitlementDocument[];
	}

	public async searchIdentities(query: string, limit?: number, fields?: string[]): Promise<IdentityDocument[]> {
		console.log("> searchIdentity", query);

		const search: Search = {
			indices: [
				"identities"
			],
			query: {
				query: query
			},
			sort: ["name"],
			includeNested: false,
			queryResultFilter: {
				includes: fields
			}
		};

		return await this.search(search, limit) as IdentityDocument[];
	}

	public async search(query: Search, limit?: number): Promise<SearchDocument[]> {
		console.log("> search", query);

		const increment = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;

		const apiConfig = await this.getApiConfiguration();
		const api = new SearchApi(apiConfig);
		const resp = await Paginator.paginateSearchApi(api, query, increment, limit);
		return resp.data;
	}


	public async paginatedSearchRoles(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"]): Promise<AxiosResponse<RoleDocument[]>> {
		console.log("> paginatedSearchRoles", query);

		const search: Search = {
			indices: [
				"roles"
			],
			query: {
				query: query
			},
			sort: ["name"],
			includeNested: false,
			queryResultFilter: {
				includes: fields
			}
		};

		return await this.paginatedSearch(search, limit, offset, count);
	}
	public async paginatedSearchAccessProfiles(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"], includeNested = false): Promise<AxiosResponse<AccessProfileDocument[]>> {
		console.log("> paginatedSearchAccessProfiles", query);

		const search: Search = {
			indices: [
				"accessprofiles"
			],
			query: {
				query: query
			},
			sort: ["name"],
			includeNested: includeNested,
			queryResultFilter: {
				includes: fields
			}
		};

		return await this.paginatedSearch(search, limit, offset, count);
	}
	public async paginatedSearchIdentities(query: string, limit?: number, offset?: number, count = false, fields = ["id", "name"], includeNested = false): Promise<AxiosResponse<IdentityDocument[]>> {
		console.log("> paginatedSearchIdentities", query);

		const search: Search = {
			indices: [
				"identities"
			],
			query: {
				query: query
			},
			sort: ["name"],
			includeNested,
			queryResultFilter: {
				includes: fields
			}
		};

		return await this.paginatedSearch(search, limit, offset, count);
	}

	public async paginatedSearch(query: Search, limit?: number, offset?: number, count?: boolean): Promise<AxiosResponse<SearchDocument[]>> {
		console.log("> paginatedSearch", query);

		limit = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;

		const apiConfig = await this.getApiConfiguration();
		const api = new SearchApi(apiConfig);
		const resp = await api.searchPost({
			search: query,
			limit,
			offset,
			count
		}, DEFAULT_AXIOS_OPTIONS);
		return resp;
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
		objectTypes: ExportPayloadBetaIncludeTypesEnum[],
		objectOptions: {
			[key: string]: ObjectExportImportOptionsBeta;
		} = {}
	): Promise<string> {
		console.log("> startExportJob", objectTypes, objectOptions);

		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		const response = await api.exportSpConfig({
			exportPayloadBeta: {
				description: `Export Job vscode ${new Date().toISOString()}`,
				includeTypes: objectTypes,
				objectOptions: objectOptions
			}
		}, DEFAULT_AXIOS_OPTIONS);
		const jobId = response.data.jobId;
		console.log("< startExportJob. jobId =", jobId);
		return jobId;
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportJobStatus
	 * @param jobId
	 * @returns
	 */
	public async getExportJobStatus(jobId: string): Promise<SpConfigJobBeta> {
		console.log("> getExportJobStatus", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		const response = await api.getSpConfigExportStatus({ id: jobId }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportDownload
	 * @param jobId
	 * @returns
	 */
	public async getExportJobResult(jobId: string): Promise<SpConfigExportResultsBeta> {
		console.log("> getExportJobResult", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		const response = await api.getSpConfigExport({ id: jobId }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}

	/**
	 *
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import
	 * @returns jobId
	 */
	public async startImportJob(
		data: string,
		options: ImportOptionsBeta = {}
	): Promise<string> {
		console.log("> startImportJob", options);
		/*
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		// const readable = Readable.from([data]);
		// const file = await blob(readable);
		// const buffer = Buffer.from(data);
		const formData = new FormData();
		let fileData = Buffer.from(data);
		formData.append("data", fileData, "import.json");
		const response = await api.importSpConfig(formData);
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
	public async getImportJobStatus(jobId: string): Promise<SpConfigJobBeta> {
		console.log("> getImportJobStatus", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		const response = await api.getSpConfigImportStatus({ id: jobId }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import-download
	 * @param jobId
	 * @returns
	 */
	public async getImportJobResult(jobId: string): Promise<SpConfigImportResultsBeta> {
		console.log("> getImportJobResult", jobId);

		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		const response = await api.getSpConfigImport({ id: jobId }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}
	/////////////////////////////
	//#endregion SP-Config
	/////////////////////////////

	///////////////////////
	//#region Workflows
	///////////////////////

	public async createWorflow(workflow: WorkflowBeta): Promise<WorkflowBeta> {
		const apiConfig = await this.getApiConfiguration()
		const api = new WorkflowsBetaApi(apiConfig)
		const resp = await api.createWorkflow({
			// @ts-ignore
			createWorkflowRequestBeta: workflow
		}, DEFAULT_AXIOS_OPTIONS)
		return resp.data;
	}


	public async getWorflow(id: string): Promise<WorkflowBeta> {
		const apiConfig = await this.getApiConfiguration()
		const api = new WorkflowsBetaApi(apiConfig)
		const resp = await api.getWorkflow({ id }, DEFAULT_AXIOS_OPTIONS)
		return resp.data;
	}

	public async getWorflows(): Promise<WorkflowBeta[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.listWorkflows(DEFAULT_AXIOS_OPTIONS);
		return resp.data.sort(compareByName);
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
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.patchWorkflow({
			id, jsonPatchOperationBeta: [
				{
					op: "replace",
					path: "/enabled",
					//@ts-ignore cf. https://github.com/sailpoint-oss/typescript-sdk/issues/18
					value: status,
				},
			]
		}, DEFAULT_AXIOS_OPTIONS);
		console.log("< updateWorkflowStatus");
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/list-workflow-executions
	 * There is a limit of 250 items by default
	 * @param id
	 * @returns
	 */
	public async getWorkflowExecutionHistory(id: string
	): Promise<WorkflowExecutionBeta[]> {
		console.log("> getWorkflowExecutionHistory", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.getWorkflowExecutions({ id }, DEFAULT_AXIOS_OPTIONS);
		return resp.data;
	}
	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/get-workflow-execution
	 * @param workflowExecutionId
	 * @returns
	 */
	public async getWorkflowExecution(workflowExecutionId: string): Promise<WorkflowExecutionBeta> {
		console.log("> getWorkflowExecution", workflowExecutionId);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.getWorkflowExecution({ id: workflowExecutionId }, DEFAULT_AXIOS_OPTIONS);
		return resp.data;
	}

	public async getWorflowTriggers(): Promise<WorkflowLibraryTriggerBeta[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.listWorkflowLibraryTriggers({}, DEFAULT_AXIOS_OPTIONS);
		return resp.data;
	}

	public async testWorkflow(id: string, payload: any): Promise<string> {
		console.log("> testWorkflow", id, payload);
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.testWorkflow({
			id,
			testWorkflowRequestBeta: {
				input: payload
			}
		}, DEFAULT_AXIOS_OPTIONS);
		return resp.data.workflowExecutionId;
	}

	///////////////////////
	//#endregion Workflows
	///////////////////////

	/////////////////////////////
	//#region Connector Rules
	/////////////////////////////

	public async getConnectorRules(): Promise<ConnectorRuleResponseBeta[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementBetaApi(apiConfig);
		const resp = await api.getConnectorRuleList(DEFAULT_AXIOS_OPTIONS);
		const rules = resp.data;
		rules.sort(compareByName);
		return rules;
	}

	public async getConnectorRuleById(id: string): Promise<ConnectorRuleResponseBeta> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementBetaApi(apiConfig);
		const resp = await api.getConnectorRule({ id }, DEFAULT_AXIOS_OPTIONS);
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
	): Promise<ConnectorRuleResponseBeta> {
		console.log("> getConnectorRuleByName", name);
		const rules = await this.getConnectorRules();
		return rules.find((r) => r.name === name);
	}

	public async validateConnectorRule(
		script: string
	): Promise<ConnectorRuleValidationResponseBeta> {
		console.log("> validateConnectorRule", script);

		const payload = {
			version: "1.0",
			script,
		};

		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementBetaApi(apiConfig);
		const resp = await api.validateConnectorRule({
			sourceCodeBeta: payload
		}, DEFAULT_AXIOS_OPTIONS);
		const jsonBody = resp.data;
		console.log("< validateConnectorRule", jsonBody);
		return jsonBody;
	}

	public async updateConnectorRule(rule: ConnectorRuleUpdateRequestBeta): Promise<ConnectorRuleResponseBeta> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementBetaApi(apiConfig);
		const resp = await api.updateConnectorRule({
			id: rule.id,
			connectorRuleUpdateRequestBeta: rule
		}, DEFAULT_AXIOS_OPTIONS);
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
		const api = new IdentityProfilesApi(apiConfig);
		const resp = await api.listIdentityProfiles({}, DEFAULT_AXIOS_OPTIONS);
		return resp.data;
	}

	public async getLifecycleStates(
		identityProfileId: string
	): Promise<LifecycleState[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new LifecycleStatesApi(apiConfig);
		const resp = await api.getLifecycleStates({ identityProfileId }, DEFAULT_AXIOS_OPTIONS);
		return resp.data;
	}

	public async refreshIdentityProfile(identityProfileId: string): Promise<void> {
		console.log("> refreshIdentityProfile", identityProfileId);
		const apiConfig = await this.getApiConfiguration();
		const httpClient = await this.getAxios();
		const api = new IdentityProfilesApi(apiConfig, "", httpClient);
		const resp = await api.syncIdentityProfile({ identityProfileId }, DEFAULT_AXIOS_OPTIONS);
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
		const api = new ServiceDeskIntegrationApi(apiConfig);
		const response = await api.getServiceDeskIntegrations({ sorters: "name" }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}

	/////////////////////////
	//#endregion ServiceDesk
	/////////////////////////

	/////////////////////////
	//#region Accounts
	/////////////////////////

	private async getAccounts(
		query: AccountsApiListAccountsRequest = DEFAULT_ACCOUNTS_QUERY_PARAMS
	): Promise<AxiosResponse<Account[], any>> {
		console.log("> getAccounts", query);
		const queryValues = {
			...DEFAULT_ACCOUNTS_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsApi(apiConfig);
		const response = await api.listAccounts(queryValues, DEFAULT_AXIOS_OPTIONS);
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
		const api = new AccountsApi(apiConfig);
		const response = await api.updateAccount({
			id: accountId,
			requestBody: [
				{
					op: "replace",
					path: "/identityId",
					value: identityId,
				},
			]
		}, DEFAULT_AXIOS_OPTIONS);
		console.log("< patchAccount");
	}

	/////////////////////////
	//#endregion Accounts
	/////////////////////////

	/////////////////////////
	//#region Entitlements
	/////////////////////////

	public async getEntitlement(id: string): Promise<EntitlementBeta> {
		console.log("> getEntitlement");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const response = await api.getEntitlement({ id }, DEFAULT_AXIOS_OPTIONS)
		return response.data
	}
	public async getAllEntitlements(query: string): Promise<EntitlementBeta[]> {
		console.log("> getAllEntitlements");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const result = await Paginator.paginate(api,
			api.listEntitlements,
			{ filters: query, sorters: "name" });
		return result.data;
	}

	/**
	 * This function is used to support "manual" pagination and only returns a maximum of 250 records
	 * @param query parameters for query
	 * @returns list of entitlements
	 */
	public async getEntitlements(
		query: EntitlementsBetaApiListEntitlementsRequest = DEFAULT_ENTITLEMENTS_QUERY_PARAMS
		// @ts-ignore 
	): Promise<AxiosResponse<EntitlementBeta[], any>> {
		console.log("> getEntitlements", query);
		const queryValues: EntitlementsBetaApiListEntitlementsRequest = {
			...DEFAULT_ENTITLEMENTS_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const response = await api.listEntitlements(queryValues, DEFAULT_AXIOS_OPTIONS);
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

	public async getEntitlementByName(sourceId: string, entitlementName: string): Promise<EntitlementBeta> {
		console.log("> getEntitlementByName", sourceId, entitlementName);

		const filters = `source.id eq "${sourceId}" and name eq "${entitlementName}"`;
		const response = await this.getEntitlements({
			filters,
			limit: 2,
			count: false
		});

		const entitlement = this.ensureOneElement(response.data, "entitlement", entitlementName);
		return entitlement;
	}

	/**
	 * This function is used to support "manual" pagination and only returns a maximum of 250 records
	 * @param sourceId Id of the source
	 * @returns list of entitlements
	*/
	public async getEntitlementsBySource(sourceId: string, offset = 0, limit = DEFAULT_PAGINATION): Promise<EntitlementBeta[]> {
		console.log("> getEntitlementsBySource", sourceId, offset, limit);
		const filters = `source.id eq "${sourceId}"`;
		const resp = await this.getEntitlements({
			filters,
			limit,
			offset
		});
		return await resp.data;
	}

	public async getAllEntitlementsBySource(sourceId: string): Promise<EntitlementBeta[]> {
		console.log("> getAllEntitlementsBySource", sourceId);
		const filters = `source.id eq "${sourceId}"`;
		const resp = await this.getAllEntitlements(filters);
		return resp;
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/patch-entitlement
	 * @param id
	 * @param payload
	  */
	public async updateEntitlement(
		id: string,
		payload: Array<JsonPatchOperationBeta>
	): Promise<void> {
		console.log("> updateEntitlement", id, payload);
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const response = await api.patchEntitlement({
			id,
			jsonPatchOperationBeta: payload
		}, DEFAULT_AXIOS_OPTIONS);
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
		query: PublicIdentitiesApiGetPublicIdentitiesRequest = DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS
	): Promise<AxiosResponse<PublicIdentity[], any>> {
		console.log("> getPublicIdentities", query);
		const queryValues: PublicIdentitiesApiGetPublicIdentitiesRequest = {
			...DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS,
			...query
		};

		const apiConfig = await this.getApiConfiguration();
		const api = new PublicIdentitiesApi(apiConfig);
		const response = await api.getPublicIdentities(queryValues, DEFAULT_AXIOS_OPTIONS);
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

	public async getGovernanceGroups(): Promise<WorkgroupDtoBeta[]> {
		console.log("> getGovernanceGroups");
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsBetaApi(apiConfig);
		const result = await Paginator.paginate(api, api.listWorkgroups, { sorters: "name" }, 50);
		return result.data;
	}

	public async getGovernanceGroupById(id: string): Promise<WorkgroupDtoBeta> {
		console.log("> getGovernanceGroupById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsBetaApi(apiConfig);
		const result = await api.getWorkgroup({ id }, DEFAULT_AXIOS_OPTIONS);
		return result.data;
	}
	public async getGovernanceGroupByName(name: string): Promise<WorkgroupDtoBeta> {
		console.log("> getGovernanceGroupByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsBetaApi(apiConfig);
		const response = await api.listWorkgroups({
			filters: `name eq "${name}"`,
			limit: 1,
			count: true
		}, DEFAULT_AXIOS_OPTIONS);
		const workgroup = this.ensureOneBasedOnHeader(response, "workgroup", name);

		return workgroup;
	}

	//////////////////////////////
	//#endregion Governance Groups
	//////////////////////////////

	//////////////////////////////
	//#region Access Profiles
	//////////////////////////////

	public async getAccessProfiles(
		query: AccessProfilesApiListAccessProfilesRequest = DEFAULT_ACCESSPROFILES_QUERY_PARAMS
	): Promise<AxiosResponse<AccessProfile[], any>> {
		console.log("> getAccessProfiles", query);
		const queryValues: AccessProfilesApiListAccessProfilesRequest = {
			...DEFAULT_ACCESSPROFILES_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new AccessProfilesApi(apiConfig);
		const response = await api.listAccessProfiles(queryValues, DEFAULT_AXIOS_OPTIONS);
		return response;
	}

	public async getAccessProfileByName(name: string): Promise<AccessProfile> {
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

	public async getRoles(
		query: RolesApiListRolesRequest = DEFAULT_ROLES_QUERY_PARAMS
	): Promise<AxiosResponse<Role[], any>> {
		console.log("> getRoles", query);
		const queryValues: RolesApiListRolesRequest = {
			...DEFAULT_ROLES_QUERY_PARAMS,
			...query
		};
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig);
		const response = await api.listRoles(queryValues, DEFAULT_AXIOS_OPTIONS);
		return response;
	}

	public async createRole(role: Role): Promise<Role> {
		console.log("> createRole", role);
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig);
		const response = await api.createRole({ role }, DEFAULT_AXIOS_OPTIONS);
		return response.data;
	}

	//////////////////////////////
	//#endregion Roles
	//////////////////////////////

	//////////////////////////////
	//#region Forms
	//////////////////////////////


	public async *getForms(filters: string | undefined = undefined): AsyncGenerator<FormBeta> {
		console.log("> getForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsBetaApi(apiConfig);
		let args = {
			offset: 0,
			limit: DEFAULT_PAGINATION,
			filters
		}
		let count = -1
		do {
			const response = await api.searchFormDefinitionsByTenant(args, DEFAULT_AXIOS_OPTIONS)
			count = response.data.count
			if (response.data.results) {
				for (const f of response.data.results) {
					yield f
				}
			}
			args.offset += DEFAULT_PAGINATION

			// if requesting an offset > text": "offset is greater than number of form definitions results"
			// By using this criteria, we may fall on some edge cases where the total number of forms is a muliple of 250
			// If using more than 200 Forms, the display would be slow, so it would mean that we would need to paginate like access profiles or roles.
			// For now, we will stay like this
		} while (count === DEFAULT_PAGINATION)
	}

	public async listForms(): Promise<FormDefinitionResponseBeta[]> {
		console.log("> listForms");
		const forms: FormDefinitionResponseBeta[] = []
		for await (const form of this.getForms()) {
			forms.push(form)
		}
		return forms
	}

	public async exportForms(filters: string | undefined = undefined): Promise<ExportFormDefinitionsByTenant200ResponseInnerBeta[]> {
		console.log("> exportForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsBetaApi(apiConfig);
		let args = {
			offset: 0,
			limit: DEFAULT_PAGINATION,
			filters
		}
		let count = -1
		const result: ExportFormDefinitionsByTenant200ResponseInnerBeta[] = []
		do {
			const response = await api.exportFormDefinitionsByTenant(args, DEFAULT_AXIOS_OPTIONS)
			count = response.data.length
			if (response.data && response.data.length > 0) {
				result.push(...response.data)
			}
			args.offset += DEFAULT_PAGINATION
		} while (count === DEFAULT_PAGINATION)

		return result
	}

	public async importForms(forms: ImportFormDefinitionsRequestInnerBeta[]) {
		console.log("> importForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsBetaApi(apiConfig);
		const response = await api.importFormDefinitions({
			body: forms
		}, DEFAULT_AXIOS_OPTIONS)
		return response.data
	}

	//////////////////////////////
	//#endregion Forms
	//////////////////////////////

	//////////////////////////////
	//region Applications
	//////////////////////////////
	public async createApplication({ name, description, sourceId }: { name: string; description: string; sourceId: string; }): Promise<any> {
		return await this.createResource("/beta/source-apps", {
			name,
			description,
			matchAllAccounts: false,
			accountSource: {
				id: sourceId,
				type: "SOURCE"
			}
		})
	}


	public async *getApplications(filters: string | undefined = undefined): AsyncGenerator<any> {
		console.log("> getApplications");
		const httpClient = await this.getAxios();
		const baseUrl = '/beta/source-apps/all'

		let args: Record<string, any> = {
			offset: 0,
			limit: DEFAULT_PAGINATION,
			filters,
			sorters: "name"
		}
		let count = -1
		do {
			const path = addQueryParams(baseUrl, args)
			const response = await httpClient.get(path);
			if (response.data) {
				count = response.data.length
				for (const f of response.data) {
					yield f
				}
			}
			args.offset += DEFAULT_PAGINATION
		} while (count === DEFAULT_PAGINATION)
	}

	public async getPaginatedApplications(filters: string, limit?: number, offset?: number, count?: boolean): Promise<AxiosResponse<any[]>> {
		console.log("> getPaginatedApplications", filters, limit, offset);

		limit = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;

		const httpClient = await this.getAxios();
		const baseUrl = '/beta/source-apps/all'
		const args: Record<string, any> = {
			offset,
			limit,
			filters,
			sorters: "name",
			count
		}
		const path = addQueryParams(baseUrl, args)
		const response = await httpClient.get(path);
		return response;
	}

	public async getPaginatedApplicationAccessProfiles(appId: string, limit?: number, offset?: number): Promise<AxiosResponse<any[]>> {
		console.log("> getPaginatedApplicationAccessProfile", limit, offset);

		limit = limit ? Math.min(DEFAULT_PAGINATION, limit) : DEFAULT_PAGINATION;

		const httpClient = await this.getAxios();
		const baseUrl = `/beta/source-apps/${appId}/access-profiles`
		const args: Record<string, any> = {
			offset,
			limit,
		}
		const path = addQueryParams(baseUrl, args)
		const response = await httpClient.get(path);
		return response;
	}

	public async removeAccessProfileFromApplication(appId: string, accessProfileId: string): Promise<void> {
		console.log("> removeAccessProfileFromApplication", appId, accessProfileId);
		const httpClient = await this.getAxios();
		const path = `/beta/source-apps/${appId}/access-profiles/bulk-remove`
		const response = await httpClient.post(path, [accessProfileId]);
	}

	public async addAccessProfileToApplication(appId: string, accessProfileId: string): Promise<void> {
		console.log("> addAccessProfileToApplication", appId, accessProfileId);
		const path = `/beta/source-apps/${appId}`
		const response = this.patchResource(path, [
			{
				"op": "add",
				"path": "/accessProfiles/-",
				"value": accessProfileId
			}
		]);
	}

	//////////////////////////////
	//#endregion Applications
	//////////////////////////////

	/////////////////////////
	//#region Notification Templates
	/////////////////////////

	public async getNotificationTemplates(): Promise<TemplateDtoBeta[]> {
		console.log("> getNotificationTemplates");
		const apiConfig = await this.getApiConfiguration();
		const api = new NotificationsBetaApi(apiConfig);
		const result = await Paginator.paginate(api, api.listNotificationTemplates);
		return result.data;
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
		const api = new SegmentsApi(apiConfig);
		const result = await Paginator.paginate(api, api.listSegments);
		return result.data;
	}
	/////////////////////////
	//#endregion Segments
	/////////////////////////

	/////////////////////////
	//#region Search attributes
	/////////////////////////

	public async getSearchAttributes(): Promise<SearchAttributeConfigBeta[]> {
		console.log("> getSearchAttributes");
		const apiConfig = await this.getApiConfiguration();
		const api = new SearchAttributeConfigurationBetaApi(apiConfig)
		const result = await api.getSearchAttributeConfig(DEFAULT_AXIOS_OPTIONS)
		return result.data.sort(compareByName)
	}

	public async createSearchAttribute(searchAttributeConfigBeta: SearchAttributeConfigBeta): Promise<void> {
		console.log("> createSearchAttribute");
		const apiConfig = await this.getApiConfiguration();
		const api = new SearchAttributeConfigurationBetaApi(apiConfig);
		await api.createSearchAttributeConfig({ searchAttributeConfigBeta }, DEFAULT_AXIOS_OPTIONS)
	}

	/////////////////////////
	//#endregion Search attributes
	/////////////////////////

	/////////////////////////
	//#region Identity attributes
	/////////////////////////

	public async getIdentityAttributes(): Promise<IdentityAttributeBeta[]> {
		console.log("> getIdentityAttributes");
		const apiConfig = await this.getApiConfiguration()
		const api = new IdentityAttributesBetaApi(apiConfig)
		const result = await api.listIdentityAttributes({}, DEFAULT_AXIOS_OPTIONS)
		return result.data
	}

	public async createIdentityAttribute(identityAttribute: IdentityAttributeBeta): Promise<IdentityAttributeBeta> {
		console.log("> createIdentityAttribute");
		const apiConfig = await this.getApiConfiguration()
		const api = new IdentityAttributesBetaApi(apiConfig)
		const result = await api.createIdentityAttribute({ identityAttributeBeta: identityAttribute }, DEFAULT_AXIOS_OPTIONS)
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
		const api = new PasswordConfigurationApi(apiConfig)
		const result = await api.getPasswordOrgConfig(DEFAULT_AXIOS_OPTIONS)
		return result.data
	}

	public async generateDigitToken(identityId: string, durationMinutes: number, length: number): Promise<string> {
		console.log("> generateDigitToken");
		const apiConfig = await this.getApiConfiguration()
		const api = new PasswordManagementBetaApi(apiConfig)
		const result = await api.generateDigitToken({
			passwordDigitTokenResetBeta: {
				userId: identityId,
				durationMinutes,
				length
			}

		}, DEFAULT_AXIOS_OPTIONS)
		console.log(`generateDigitToken: Request Id = ${result.data.requestId}`);

		return result.data.digitToken
	}

	/////////////////////////
	//#endregion Password Management
	/////////////////////////

	////////////////////////
	//#region Identity Management
	////////////////////////

	public async listIdentities(identityFilter: IdentitiesBetaApiListIdentitiesRequest): Promise<AxiosResponse<IdentityBeta[]>> {
		console.log("> listIdentities");
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesBetaApi(apiConfig);
		const result = await api.listIdentities(identityFilter, DEFAULT_AXIOS_OPTIONS);
		return result;
	}

	public async processIdentity(identityId: string): Promise<AxiosResponse<TaskResultResponseBeta, any>> {
		console.log("> processIdentity");
		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesBetaApi(apiConfig);
		const requestParameters = {
			processIdentitiesRequestBeta:
			{
				identityIds: [identityId]
			}
		};
		return await api.startIdentityProcessing(requestParameters, DEFAULT_AXIOS_OPTIONS);
	}

	public async syncIdentityAttributes(identityId: string): Promise<AxiosResponse<IdentitySyncJobBeta, any>> {
		console.log("> syncIdentityAttributes");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesBetaApi(apiConfig);

		//IdentitiesBetaApiSynchronizeAttributesForIdentityRequest
		return await api.synchronizeAttributesForIdentity(
			{ identityId: identityId }, DEFAULT_AXIOS_OPTIONS);
	}

	public async deleteIdentity(identityId: string): Promise<void> {
		console.log("> deleteIdentity");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesBetaApi(apiConfig);

		await api.deleteIdentity({ id: identityId }, DEFAULT_AXIOS_OPTIONS);
	}

	////////////////////////
	//#endregion Identity Management
	////////////////////////
}

