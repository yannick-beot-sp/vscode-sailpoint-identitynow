import * as vscode from "vscode";
import { authentication } from "vscode";
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import { withQuery } from "../utils/UriUtils";
import { compareByName, convertToText } from "../utils";
import { DEFAULT_ACCOUNTS_QUERY_PARAMS } from "../models/Account";
import { DEFAULT_ENTITLEMENTS_QUERY_PARAMS } from "../models/Entitlements";
import { Configuration, IdentityProfilesApi, IdentityProfile, LifecycleState, LifecycleStatesApi, Paginator, ServiceDeskIntegrationApi, ServiceDeskIntegrationDto, Source, SourcesApi, Transform, TransformsApi, WorkflowsBetaApi, WorkflowBeta, WorkflowExecutionBeta, WorkflowLibraryTriggerBeta, ConnectorRuleManagementBetaApi, ConnectorRuleResponseBeta, ConnectorRuleValidationResponseBeta, AccountsApi, AccountsApiListAccountsRequest, Account, EntitlementsBetaApi, EntitlementsBetaApiListEntitlementsRequest, PublicIdentitiesApi, PublicIdentitiesApiGetPublicIdentitiesRequest, Entitlement, PublicIdentity, JsonPatchOperationBeta, SPConfigBetaApi, SpConfigImportResultsBeta, SpConfigJobBeta, ImportOptionsBeta, SpConfigExportResultsBeta, ObjectExportImportOptionsBeta, ExportPayloadBetaIncludeTypesEnum, ImportSpConfigRequestBeta, TransformRead, GovernanceGroupsBetaApi, WorkgroupDtoBeta, AccessProfilesApi, AccessProfilesApiListAccessProfilesRequest, AccessProfile, RolesApi, Role, RolesApiListRolesRequest } from 'sailpoint-api-client';
import { DEFAULT_PUBLIC_IDENTITIES_QUERY_PARAMS } from '../models/PublicIdentity';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ImportEntitlementsResult } from '../models/JobStatus';
import { basename } from 'path';
import { createReadStream } from 'fs';
import { onErrorResponse, onRequest, onResponse } from "./AxiosHandlers";
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
const CONTENT_TYPE_FORM_JSON_PATCH = "application/json-patch+json";

export class IdentityNowClient {

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
		const session = await authentication.getSession(
			SailPointIdentityNowAuthenticationProvider.id,
			[this.tenantId]
		);
		return {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Authorization: `Bearer ${session?.accessToken}`,

		};
	}

	/**
	 * Returns the Configuration needed by sailpoint typescript SDK 
	 */
	private async getApiConfiguration(): Promise<Configuration> {
		const session = await authentication.getSession(
			SailPointIdentityNowAuthenticationProvider.id,
			[this.tenantId]
		);
		const apiConfig = new Configuration({
			baseurl: EndpointUtils.getBaseUrl(this.tenantName),
			tokenUrl: EndpointUtils.getAccessTokenUrl(this.tenantName),
			accessToken: session?.accessToken
		});

		return apiConfig;
	}

	/**
	 * 
	 * @param contentType 
	 * @returns Create an Axios Instance
	 */
	private async getAxios(contentType = CONTENT_TYPE_JSON): Promise<AxiosInstance> {
		const session = await authentication.getSession(
			SailPointIdentityNowAuthenticationProvider.id,
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
	public async getSources(): Promise<Source[]> {
		console.log("> getSources");
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await Paginator.paginate(api, api.listSources, { sorters: "name" });
		return result.data;
	}

	public async getSourceById(id: string): Promise<any> {
		console.log("> getSourceById", id);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const result = await api.getSource({ id });
		return result.data;
	}

	public async startEntitlementAggregation(
		sourceID: number,
		types: string[] | null = null
	): Promise<any> {
		console.log("> IdentityNowClient.startEntitlementAggregation");

		const httpClient = await this.getAxios();
		let endpoint =
			EndpointUtils.getCCUrl(this.tenantName) + `/source/loadEntitlements/${sourceID}`;

		if (types !== null && types.length > 0) {
			const objectTypes = types.join(",");
			endpoint = withQuery(endpoint, { objectType: objectTypes });
		}
		console.log("endpoint = " + endpoint);
		const response = await httpClient.post(endpoint);
		return response.data;
	}

	public async startAccountAggregation(
		sourceID: number,
		disableOptimization = false,
		deleteThreshold: number | undefined = undefined,
		filePath: string | undefined = undefined
	): Promise<any> {
		console.log("> IdentityNowClient.startAccountAggregation");
		/*
				const apiConfig = await this.getApiConfiguration();
				const api = new SourcesAggregationCCApi(apiConfig);
				let requestParameter: SourcesAggregationCCApiLoadAccountsRequest;
				if (disableOptimization) {
					requestParameter = {
						id: sourceID.toString(),
						disableOptimization: disableOptimization
					};
				} else {
					requestParameter = {
						id: sourceID.toString()
					};
				}
				const response = await api.loadAccounts(requestParameter);
		
				return response.data;
		*/

		const endpoint = `cc/api/source/loadAccounts/${sourceID}`;
		console.log("endpoint = " + endpoint);

		const formData = new FormData();

		if (disableOptimization) {
			formData.append("disableOptimization", "true");
		}

		if (deleteThreshold !== undefined) {
			formData.append("update-delete-threshold-combobox-inputEl", `${deleteThreshold}%`);
		}

		if (filePath !== undefined) {
			const blob = createReadStream(filePath);
			formData.append('file', blob, basename(filePath));
		}

		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_URLENCODED);
		const response = await httpClient.post(endpoint, formData);
		return response.data;
	}

	public async resetSource(sourceID: number, skip: string | null = null): Promise<any> {
		console.log('> IdentityNowClient.resetSource', sourceID);
		let endpoint = EndpointUtils.getCCUrl(this.tenantName) + `/source/reset/${sourceID}`;
		if (!!skip) {
			endpoint += "?skip=" + skip;
		}
		console.log("resetSource: endpoint = " + endpoint);
		const httpClient = await this.getAxios(CONTENT_TYPE_FORM_URLENCODED);
		const response = await httpClient.post(endpoint);
		return response.data;
	}

	public async getAggregationJob(
		sourceID: number,
		taskId: string,
		jobType = AggregationJob.CLOUD_ACCOUNT_AGGREGATION
	): Promise<any> {
		console.log("> getAggregationJob", sourceID, taskId, jobType);
		const httpClient = await this.getAxios();
		let endpoint = EndpointUtils.getCCUrl(this.tenantName) + "/event/list";
		const queryParams = {
			page: 1,
			start: 0,
			limit: 3,
			sort: '[{"property":"timestamp","direction":"DESC"}]',
			filter: `[{"property":"type","value":"${AggregationJob[jobType]}"},{"property":"objectType","value":"source"},{"property":"objectId","value":"${sourceID}"}]`,
		};
		endpoint = withQuery(endpoint, queryParams);
		console.log("getAggregationJob: endpoint =", endpoint);
		const response = await httpClient.get(endpoint);
		const tasks: any = response.data;
		if (tasks && tasks.items && tasks.items instanceof Array) {
			return tasks.items.find(task => task.details.id === taskId);
		}

		return undefined;
	}

	public async getSourceId(sourceName: string): Promise<string> {
		/*
			sourceName - A reference to the source to search for accounts.
	
			This is a reference by a source's display name attribute (e.g. Active Directory). If the display name is updated, this reference will also need to be updated.
	
			As an alternative an applicationId or applicationName can be provided instead.
	
			applicationId - This is a reference by a source's external GUID/ID attribute (e.g. "ff8081815a8b3925015a8b6adac901ff")
			applicationName - This is a reference by a source's immutable name attribute (e.g. "Active Directory [source]")
		*/
		console.log("> getSourceId", sourceName);
		const apiConfig = await this.getApiConfiguration();
		const api = new SourcesApi(apiConfig);
		const response = await api.listSources({
			filters: `name eq "${sourceName}" or id eq "${sourceName}"`
		});
		const sources = response.data;
		if (sources.length !== 1) {
			vscode.window.showErrorMessage(
				`Source '${sourceName}' does not exist`
			);
		}
		return sources[0].id;
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
		const result = await api.listTransforms({ filters: `name eq "${name}"` });

		const res = result.data;

		if (!res || !(res instanceof Array) || res.length !== 1) {
			console.log("getTransformByName returns ", res);
			throw new Error(`Could not find transform "${name} "`);
		}
		// returning only one transform
		return res[0];
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
		console.log("> IdentityNowClient.getResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.get(path);
		return response.data;
	}

	public async createResource(path: string, data: string): Promise<any> {
		console.log("> IdentityNowClient.createResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.post(path, data);
		const res = await response.data;
		console.log("< IdentityNowClient.createResource", res);
		return res;
	}

	public async deleteResource(path: string): Promise<void> {
		console.log("> IdentityNowClient.deleteResource", path);
		const httpClient = await this.getAxios();
		const response = await httpClient.delete(path);
		console.log("< IdentityNowClient.deleteResource");
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

	public async getAccountsBySource(sourceId: string, exportUncorrelatedAccountOnly = false, offset = 0, limit = 250): Promise<Account[]> {
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
		const filters = `source.id eq "${sourceId}"`;
		const resp = await this.getEntitlements({
			filters,
			count: true,
			limit: 1,
			offset: 0
		});
		return Number(resp.headers[TOTAL_COUNT_HEADER]);
	}

	public async getEntitlementsBySource(sourceId: string, offset = 0, limit = 250): Promise<Entitlement[]> {
		const filters = `source.id eq "${sourceId}"`;
		const resp = await this.getEntitlements({
			filters,
			limit,
			offset
		});
		return await resp.data;
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
		console.log("> IdentityNowClient.importEntitlements");
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

	public async getPublicIdentitiesByAlias(alias: string): Promise<PublicIdentity> {
		const filters = `alias eq "${alias}"`;
		const resp = await this.getPublicIdentities({
			filters,
			limit: 1,
			offset: 0,
			count: true
		});
		const nbIdentity = Number(resp.headers[TOTAL_COUNT_HEADER]);
		if (nbIdentity !== 1) {
			throw new Error("Could Not Find Identity");
		}
		return resp.data[0];
	}
	//////////////////////////////
	//#endregion Public Identities
	//////////////////////////////

	//////////////////////////////
	//#region Roles
	//////////////////////////////

	public async getGovernanceGroups(): Promise<WorkgroupDtoBeta[]> {
		console.log("> getGovernanceGroups");
		const apiConfig = await this.getApiConfiguration();
		const api = new GovernanceGroupsBetaApi(apiConfig);
		const result = await Paginator.paginate(api, api.listWorkgroups, { sorters: "name" });
		return result.data;
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
			filters
		});

		const result = response.data;

		if (!result || !(result instanceof Array) || result.length !== 1) {
			console.log("getAccessProfileByName returns ", result);
			throw new Error(`Could not find Access Profile "${name}"`);
		}
		return result[0];
	}

	//////////////////////////////
	//#endregion Access Profiles
	//////////////////////////////

	//////////////////////////////
	//#region Roles
	//////////////////////////////
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
		const response = await api.createRole({role});
		return response.data;
	}

	//////////////////////////////
	//#endregion Roles
	//////////////////////////////
}

export enum AggregationJob {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	CLOUD_ACCOUNT_AGGREGATION,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ENTITLEMENT_AGGREGATION,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	SOURCE_RESET,
}
