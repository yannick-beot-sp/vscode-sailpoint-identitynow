import * as vscode from "vscode";
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointISCAuthenticationProvider } from "./AuthenticationProvider";
import { compareByName, convertToText } from "../utils";
import { DEFAULT_ACCOUNTS_QUERY_PARAMS } from "../models/Account";
import { DEFAULT_ENTITLEMENTS_QUERY_PARAMS } from "../models/Entitlements";
import { Configuration, IdentityProfilesApi, IdentityProfile, LifecycleState, LifecycleStatesApi, Paginator, ServiceDeskIntegrationApi, ServiceDeskIntegrationDto, Source, SourcesApi, TransformsApi, WorkflowsBetaApi, WorkflowBeta, WorkflowExecutionBeta, WorkflowLibraryTriggerBeta, ConnectorRuleManagementBetaApi, ConnectorRuleResponseBeta, ConnectorRuleValidationResponseBeta, AccountsApi, AccountsApiListAccountsRequest, Account, EntitlementsBetaApi, EntitlementsBetaApiListEntitlementsRequest, PublicIdentitiesApi, PublicIdentitiesApiGetPublicIdentitiesRequest, PublicIdentity, JsonPatchOperationBeta, SPConfigBetaApi, SpConfigImportResultsBeta, SpConfigJobBeta, ImportOptionsBeta, SpConfigExportResultsBeta, ObjectExportImportOptionsBeta, ExportPayloadBetaIncludeTypesEnum, TransformRead, GovernanceGroupsBetaApi, WorkgroupDtoBeta, AccessProfilesApi, AccessProfilesApiListAccessProfilesRequest, AccessProfile, RolesApi, Role, RolesApiListRolesRequest, Search, SearchApi, IdentityDocument, SearchDocument, AccessProfileDocument, EntitlementDocument, EntitlementBeta, RoleDocument, SourcesBetaApi, StatusResponseBeta, Schema, FormBeta, CustomFormsBetaApi, ExportFormDefinitionsByTenant200ResponseInnerBeta, FormDefinitionResponseBeta, NotificationsBetaApi, TemplateDtoBeta, SegmentsApi, Segment, SODPolicyApi, SodPolicy, SearchAttributeConfigurationBetaApi, SearchAttributeConfigBeta, IdentityAttributesBetaApi, IdentityAttributeBeta, PasswordConfigurationApi, PasswordOrgConfig, PasswordManagementBetaApi, ConnectorRuleUpdateRequestBeta, IdentitiesBetaApi, IdentitiesBetaApiListIdentitiesRequest, IdentityBeta, IdentitySyncJobBeta, TaskResultResponseBeta, LoadEntitlementTaskBeta, TaskManagementBetaApi, TaskStatusBeta, EntitlementSourceResetBaseReferenceDtoBeta, AccountsBetaApi, TaskResultDtoBeta, ProvisioningPolicyDto } from 'sailpoint-api-client';
import { DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS } from '../models/PublicIdentity';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ImportEntitlementsResult } from '../models/JobStatus';
import { basename } from 'path';
import { createReadStream } from 'fs';
import { DEFAULT_ACCESSPROFILES_QUERY_PARAMS } from "../models/AccessProfiles";
import { DEFAULT_ROLES_QUERY_PARAMS } from "../models/Roles";
// eslint-disable-next-line @typescript-eslint/naming-convention
const FormData = require('form-data');

// cf. https://axios-http.com/docs/res_schema
// All header names are lower cased.
const CONTENT_TYPE_HEADER = "Content-Type";
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
		return headers;
	}

	private async prepareAuthenticationHeader(): Promise<any> {
		const session = await vscode.authentication.getSession(
			SailPointISCAuthenticationProvider.id,
			[this.tenantId]
		);
		return {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Authorization: `Bearer ${session?.accessToken}`,

		};
	}

	private ensureOne<T>(response: AxiosResponse<T[]>, type: string, value: string): T {
		const nb = Number(response.headers[TOTAL_COUNT_HEADER]);
		if (nb !== 1) {
			const message = `Could not find ${type} ${value}. Found ${nb}`;
			console.error(message);
			throw new Error(message);
		}
		return response.data[0] as T;
	}

	/**
	 * Returns the Configuration needed by sailpoint typescript SDK 
	 */
	private async getApiConfiguration(): Promise<Configuration> {
		const session = await vscode.authentication.getSession(
			SailPointISCAuthenticationProvider.id,
			[this.tenantId]
		);
		const apiConfig = new Configuration({
			baseurl: EndpointUtils.getBaseUrl(this.tenantName),
			tokenUrl: EndpointUtils.getAccessTokenUrl(this.tenantName),
			accessToken: session?.accessToken,
			// TODO https://github.com/sailpoint-oss/typescript-sdk/issues/30
			clientId: "",
			clientSecret: ""
		});

		return apiConfig;
	}

	/**
	 * 
	 * @param contentType 
	 * @returns Create an Axios Instance
	 */
	private async getAxios(contentType = CONTENT_TYPE_JSON): Promise<AxiosInstance> {
		const session = await vscode.authentication.getSession(
			SailPointISCAuthenticationProvider.id,
			[this.tenantId]
		);
		const instance = axios.create({
			baseURL: EndpointUtils.getBaseUrl(this.tenantName),
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"Content-Type": contentType,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"Authorization": `Bearer ${session?.accessToken}`
			}

		});
		return instance;
	}

	/////////////////////
	//#region Sources
	/////////////////////
	public async pingCluster(sourceId: string): Promise<StatusResponseBeta> {
		console.log("> pingClusterConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesBetaApi(apiConfig)

		const response = await api.pingCluster({ sourceId })
		return response.data;
	}

	public async testSourceConnection(sourceId: string): Promise<StatusResponseBeta> {
		console.log("> testSourceConnection")
		const apiConfig = await this.getApiConfiguration()
		const api = new SourcesBetaApi(apiConfig)
		const response = await api.testSourceConnection({ sourceId })
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
		})
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
		const result = await api.getSource({ id });
		return result.data;
	}

	public async getSourceByName(name: string): Promise<Source> {
		console.log("> getSourceByName", name);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await api.listSources({
			filters: `name eq "${name}"`,
			limit: 2
		})

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
		})
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
		});
		const source = this.ensureOne(response, "source", sourceName);
		return source.id!;
	}

	public async getSchemas(sourceId: string): Promise<Schema[]> {
		console.log("> getSchemas", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const response = await api.listSourceSchemas({ sourceId });

		return response.data;
	}

	public async createSchema(sourceId: string, schema: Schema): Promise<Schema> {
		console.log("> createSchema", sourceId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const response = await api.createSourceSchema({ sourceId, schema });
		return response.data;
	}


	public async startEntitlementAggregation(
		sourceID: string
	): Promise<LoadEntitlementTaskBeta> {
		console.log("> ISCClient.startEntitlementAggregation");
		/* https://github.com/sailpoint-oss/typescript-sdk/issues/36
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const response = await api.importEntitlements({
			id: sourceID,
			csvFile: null
		})
		return response.data
		*/
		const endpoint = `beta/entitlements/aggregate/sources/${sourceID}`;
		console.log("endpoint = " + endpoint);

		const formData = new FormData();

		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_DATA);
		const response = await httpClient.post(endpoint, formData);
		return response.data;
	}

	public async startEntitlementReset(
		sourceID: string
	): Promise<EntitlementSourceResetBaseReferenceDtoBeta> {
		console.log("> ISCClient.startEntitlementReset");
		const apiConfig = await this.getApiConfiguration();
		const api = new EntitlementsBetaApi(apiConfig);
		const response = await api.resetSourceEntitlements({
			id: sourceID
		})
		return response.data
	}

	public async startAccountReset(
		sourceID: string
	): Promise<TaskResultDtoBeta> {
		console.log("> ISCClient.startAccountReset");
		const apiConfig = await this.getApiConfiguration();
		const api = new AccountsBetaApi(apiConfig);
		const response = await api.deleteAccountsAsync({
			id: sourceID
		})
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
		})
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
		const api = new TransformsApi(apiConfig);
		const result = await api.listTransforms();
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
		});

		const transform = this.ensureOne(response, "transform", name);
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

	public async createResource(path: string, data: string): Promise<any> {
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

	public async patchResource(path: string, data: string): Promise<any> {
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
		});
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
	public async getExportJobStatus(jobId: string): Promise<SpConfigJobBeta> {
		console.log("> getExportJobStatus", jobId);
		const apiConfig = await this.getApiConfiguration();
		const api = new SPConfigBetaApi(apiConfig);
		const response = await api.getSpConfigExportStatus({ id: jobId });
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
		const response = await api.getSpConfigExport({ id: jobId });
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
		const response = await api.getSpConfigImportStatus({ id: jobId });
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
		const response = await api.getSpConfigImport({ id: jobId });
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
		})
		return resp.data;
	}


	public async getWorflow(id: string): Promise<WorkflowBeta> {
		const apiConfig = await this.getApiConfiguration()
		const api = new WorkflowsBetaApi(apiConfig)
		const resp = await api.getWorkflow({ id })
		return resp.data;
	}

	public async getWorflows(): Promise<WorkflowBeta[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.listWorkflows();
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
		});
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
		const resp = await api.listWorkflowExecutions({ id });
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
		const resp = await api.getWorkflowExecution({ id: workflowExecutionId });
		return resp.data;
	}

	public async getWorflowTriggers(): Promise<WorkflowLibraryTriggerBeta[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new WorkflowsBetaApi(apiConfig);
		const resp = await api.listWorkflowLibraryTriggers();
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
		});
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
		const resp = await api.getConnectorRuleList();
		const rules = resp.data;
		rules.sort(compareByName);
		return rules;
	}

	public async getConnectorRuleById(id: string): Promise<ConnectorRuleResponseBeta> {
		const apiConfig = await this.getApiConfiguration();
		const api = new ConnectorRuleManagementBetaApi(apiConfig);
		const resp = await api.getConnectorRule({ id });
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
		});
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
		const api = new IdentityProfilesApi(apiConfig);
		const resp = await api.listIdentityProfiles();
		return resp.data;
	}

	public async getLifecycleStates(
		identityProfileId: string
	): Promise<LifecycleState[]> {
		const apiConfig = await this.getApiConfiguration();
		const api = new LifecycleStatesApi(apiConfig);
		const resp = await api.listLifecycleStates({ identityProfileId });
		return resp.data;
	}

	public async refreshIdentityProfile(identityProfileId: string): Promise<void> {
		console.log("> refreshIdentityProfile", identityProfileId);
		const apiConfig = await this.getApiConfiguration();
		const httpClient = await this.getAxios();
		const api = new IdentityProfilesApi(apiConfig, "", httpClient);
		const resp = await api.syncIdentityProfile({ identityProfileId });
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
		const response = await api.getServiceDeskIntegrations({ sorters: "name" });
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
		const response = await api.listAccounts(queryValues);
		return response;
	}

	public async getAccountCountBySource(sourceId: string, exportUncorrelatedAccountOnly = false): Promise<number> {
		let filters = `sourceId eq "${sourceId}"`;
		if (exportUncorrelatedAccountOnly) {
			filters += " and uncorrelated eq true";
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
			filters += " and uncorrelated eq true";
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
			jsonPatchOperation: [
				{
					op: "replace",
					path: "/identityId",
					value: identityId,
				},
			]
		});
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
		const response = await api.getEntitlement({ id })
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
		const response = await api.listEntitlements(queryValues);
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
			limit: 1,
			count: true
		});

		const entitlement = this.ensureOne(response, "entitlement", entitlementName);
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
		query: PublicIdentitiesApiGetPublicIdentitiesRequest = DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS
	): Promise<AxiosResponse<PublicIdentity[], any>> {
		console.log("> getPublicIdentities", query);
		const queryValues: PublicIdentitiesApiGetPublicIdentitiesRequest = {
			...DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS,
			...query
		};

		const apiConfig = await this.getApiConfiguration();
		const api = new PublicIdentitiesApi(apiConfig);
		const response = await api.getPublicIdentities(queryValues);
		return response;
	}

	public async getPublicIdentityByAlias(alias: string): Promise<PublicIdentity> {
		const filters = `alias eq "${alias}"`;
		const response = await this.getPublicIdentities({
			filters,
			limit: 1,
			count: true
		});
		const identity = this.ensureOne(response, "identity", alias);

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

		const identity = this.ensureOne(response, "identity", id);
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
		const result = await api.getWorkgroup({ id });
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
		});
		const workgroup = this.ensureOne(response, "workgroup", name);

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
		const response = await api.listAccessProfiles(queryValues);
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

		const accessProfile = this.ensureOne(response, "access profile", name);
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
		const role = this.ensureOne(result, "role", name);
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
		const response = await api.listRoles(queryValues);
		return response;
	}

	public async createRole(role: Role): Promise<Role> {
		console.log("> createRole", role);
		const apiConfig = await this.getApiConfiguration();
		const api = new RolesApi(apiConfig);
		const response = await api.createRole({ role });
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
			const response = await api.searchFormDefinitionsByTenant(args)
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
			const response = await api.exportFormDefinitionsByTenant(args)
			count = response.data.length
			if (response.data && response.data.length > 0) {
				result.push(...response.data)
			}
			args.offset += DEFAULT_PAGINATION
		} while (count === DEFAULT_PAGINATION)

		return result
	}

	public async importForms(forms: ExportFormDefinitionsByTenant200ResponseInnerBeta[]) {
		console.log("> importForms");
		const apiConfig = await this.getApiConfiguration();
		const api = new CustomFormsBetaApi(apiConfig);
		const response = await api.importFormDefinitions({
			body: forms
		})
		return response.data
	}

	//////////////////////////////
	//#endregion Forms
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
	//#region SoD policies
	/////////////////////////

	public async getSoDPolicies(): Promise<SodPolicy[]> {
		console.log("> getSoDPolicies");
		const apiConfig = await this.getApiConfiguration();
		const api = new SODPolicyApi(apiConfig);
		const result = await Paginator.paginate(api, api.listSodPolicies);
		return result.data;
	}
	/////////////////////////
	//#endregion SoD policies
	/////////////////////////

	/////////////////////////
	//#region Search attributes
	/////////////////////////

	public async getSearchAttributes(): Promise<SearchAttributeConfigBeta[]> {
		console.log("> getSearchAttributes");
		const apiConfig = await this.getApiConfiguration();
		const api = new SearchAttributeConfigurationBetaApi(apiConfig)
		const result = await api.getSearchAttributeConfig()
		return result.data.sort(compareByName)
	}

	public async createSearchAttribute(searchAttributeConfigBeta: SearchAttributeConfigBeta): Promise<void> {
		console.log("> createSearchAttribute");
		const apiConfig = await this.getApiConfiguration();
		const api = new SearchAttributeConfigurationBetaApi(apiConfig);
		await api.createSearchAttributeConfig({ searchAttributeConfigBeta })
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
		const result = await api.listIdentityAttributes()
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
		const result = await api.getPasswordOrgConfig()
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

		})
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
		const result = await api.listIdentities(identityFilter);
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
		return await api.startIdentityProcessing(requestParameters);
	}

	public async syncIdentityAttributes(identityId: string): Promise<AxiosResponse<IdentitySyncJobBeta, any>> {
		console.log("> syncIdentityAttributes");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesBetaApi(apiConfig);

		//IdentitiesBetaApiSynchronizeAttributesForIdentityRequest
		return await api.synchronizeAttributesForIdentity(
			{
				identityId: identityId
			});
	}

	public async deleteIdentity(identityId: string): Promise<void> {
		console.log("> deleteIdentity");

		const apiConfig = await this.getApiConfiguration();
		const api = new IdentitiesBetaApi(apiConfig);

		await api.deleteIdentity({
			id: identityId
		});
	}

	////////////////////////
	//#endregion Identity Management
	////////////////////////
}
