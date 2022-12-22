import * as vscode from "vscode";
import { authentication } from "vscode";
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import "isomorphic-fetch";
const FormData = require("form-data");
import { withQuery } from "../utils/UriUtils";
import { Workflow, WorkflowExecution } from "../models/workflow";
import { IdentityProfile, LifeCycleState } from "../models/identityProfile";
import { compareByName, convertToText } from "../utils";
import { ConnectorRule, ValidationResult } from "../models/connectorRule";
import { ServiceDesk } from "../models/ServiceDesk";
import { ExportOptions, ObjectOptions } from "../models/ExportOptions";
import { Readable } from "stream";
import { ImportJobResults, JobStatus } from "../models/JobStatus";

export class IdentityNowClient {

	constructor(
		private readonly tenantId: string,
		private readonly tenantName: string
	) { }

	public async getSources(): Promise<any> {
		console.log("> getSources");
		const limit = 250;
		let result: any[] = [];
		let offset = 0;
		let total = 0;
		let firstQuery = true;
		let endpoint =
			EndpointUtils.getV3Url(this.tenantName) +
			`/sources?count=true&limit=${limit}&sorters=name`;
		do {
			console.log("endpoint = " + endpoint);
			const headers = await this.prepareHeaders();
			const req = await fetch(endpoint, {
				headers: headers,
			});

			if (!req.ok) {
				throw new Error(req.statusText);
			}
			result = result.concat(await req.json());
			if (firstQuery) {
				total = Number(req.headers.get("X-Total-Count"));
				firstQuery = false;
			}
			offset += limit;
			endpoint = withQuery(endpoint, { count: false, offset: offset });
		} while (offset < total);

		return result;
	}

	/**
	 *
	 * @param path Generic method to get resource
	 * @returns
	 */
	public async getResource(path: string): Promise<any> {
		console.log("> getResource", path);
		let endpoint = EndpointUtils.getBaseUrl(this.tenantName);
		endpoint += path;
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const req = await fetch(endpoint, {
			headers: headers,
		});
		if (!req.ok) {
			if (req.status === 404) {
				return null;
			}
			throw new Error(req.statusText);
		}
		const res = await req.json();

		return res;
	}

	/**
	 * NOTE: "List transforms" endpoint does not support sorters yet
	 * @returns return all transforms
	 */
	public async getTransforms(): Promise<any> {
		console.log("> getTransforms");
		const endpoint = EndpointUtils.getV3Url(this.tenantName) + "/transforms";
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const req = await fetch(endpoint, {
			headers: headers,
		});

		if (!req.ok) {
			throw new Error(req.statusText);
		}
		const res = await req.json();

		return res;
	}

	public async getTransformByName(name: string): Promise<any> {
		console.log("> getTransformByName", name);
		let endpoint = EndpointUtils.getV3Url(this.tenantName) + "/transforms";
		endpoint = withQuery(endpoint, { filters: `name eq "${name}"` });
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const req = await fetch(endpoint, {
			headers: headers,
		});

		if (!req.ok) {
			throw new Error(req.statusText);
		}
		const res = await req.json();

		if (!res || !(res instanceof Array) || res.length !== 1) {
			console.log("getTransformByName returns ", res);
			throw new Error('Could not find transform "' + name + '"');
		}
		// returning only one transform
		return res[0];
	}

	public async createResource(path: string, data: string): Promise<any> {
		console.log("> IdentityNowClient.createResource", path);
		const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const resp = await fetch(endpoint, {
			method: "POST",
			headers: headers,
			body: data,
		});

		if (!resp.ok) {
			if (resp.status === 404) {
				return null;
			}
			if (resp.status === 400) {
				const details: any = await resp.json();
				const detail = details?.messages[0]?.text || resp.statusText;
				throw new Error(detail);
			}
			throw new Error(resp.statusText);
		}
		const res = await resp.json();
		console.log("< IdentityNowClient.createResource", res);
		return res;
	}

	public async deleteResource(path: string): Promise<void> {
		console.log("> IdentityNowClient.deleteResource", path);
		const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const resp = await fetch(endpoint, {
			method: "DELETE",
			headers: headers,
		});

		if (!resp.ok) {
			if (resp.status === 404) {
				throw new Error("Resource not found");
			}
			if (resp.status === 400) {
				const details: any = await resp.json();
				const detail = details?.messages[0]?.text || resp.statusText;
				throw new Error(detail);
			}
			throw new Error(resp.statusText);
		}

		console.log("< IdentityNowClient.deleteResource");
	}

	public async updateResource(path: string, data: string): Promise<any> {
		console.log("> updateResource", path);
		const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const resp = await fetch(endpoint, {
			method: "PUT",
			headers: headers,
			body: data,
		});

		if (!resp.ok) {
			if (resp.status === 404) {
				return null;
			}
			if (resp.status === 400) {
				const details: any = await resp.json();
				const detail = details?.messages[0]?.text || resp.statusText;
				throw new Error(detail);
			}
			throw new Error(resp.statusText);
		}
		const res = await resp.json();

		return res;
	}

	public async patchResource(path: string, data: string): Promise<any> {
		console.log("> patchResource", path);
		const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		headers["Content-Type"] = "application/json-patch+json";
		const req = await fetch(endpoint, {
			method: "PATCH",
			headers: headers,
			body: data,
		});

		if (!req.ok) {
			if (req.status === 404) {
				return null;
			}
			if (req.status === 400) {
				const details: any = await req.json();
				const detail = details?.messages[0]?.text || req.statusText;
				throw new Error(detail);
			}
			throw new Error(req.statusText);
		}
		const res = await req.json();

		return res;
	}

	private async prepareHeaders(): Promise<any> {
		const session = await authentication.getSession(
			SailPointIdentityNowAuthenticationProvider.id,
			[this.tenantId]
		);
		return {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Authorization: `Bearer ${session?.accessToken}`,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"Content-Type": "application/json",
		};
	}

	public async startAggregation(
		sourceID: Number,
		disableOptimization = false
	): Promise<any> {
		console.log("> IdentityNowClient.startAggregation");
		const endpoint =
			EndpointUtils.getCCUrl(this.tenantName) +
			"/source/loadAccounts/" +
			sourceID;
		// const endpoint = 'https://webhook.site/9bd2674b-2c53-4cd0-8b04-bfd2571b8678';
		console.log("endpoint = " + endpoint);
		let headers = await this.prepareHeaders();

		var formData = new FormData();
		if (disableOptimization) {
			console.log("disableOptimization = true");
			formData.append("disableOptimization", "true");
		}
		const formHeaders = formData.getHeaders();
		headers = {
			...formHeaders,
			...headers,
		};

		const req = await fetch(endpoint, {
			method: "POST",
			headers: headers,
			body: formData,
		});
		if (!req.ok) {
			throw new Error("Could not start aggregation:" + req.statusText);
		}
		const res = await req.json();
		return res;
	}

	public async resetSource(sourceID: Number, skip: string | null = null): Promise<any> {
		console.log('> IdentityNowClient.resetSource', sourceID);
		let endpoint = EndpointUtils.getCCUrl(this.tenantName) + '/source/reset/' + sourceID;
		if (!!skip) {
			endpoint += "?skip=" + skip;
		}
		const headers = await this.prepareHeaders();
		headers['Content-Type'] = 'application/x-www-form-urlencoded';

		const req = await fetch(endpoint, {
			method: "POST",
			headers: headers,
		});
		if (!req.ok) {
			let detail = req.statusText;
			if (req.status === 400) {
				const res: any = await req.json();
				detail = res.exception_message;
			}
			throw new Error("Could not reset source: " + detail);
		}
		const res = await req.json();
		return res;
	}

	public async getAggregationJob(
		sourceID: Number,
		taskId: string,
		jobType = AggregationJob.CLOUD_ACCOUNT_AGGREGATION
	): Promise<any> {
		console.log("> getAggregationJob", sourceID, taskId, jobType);
		let endpoint = EndpointUtils.getCCUrl(this.tenantName) + "/event/list";
		const headers = await this.prepareHeaders();
		const queryParams = {
			page: 1,
			start: 0,
			limit: 3,
			sort: '[{"property":"timestamp","direction":"DESC"}]',
			filter: `[{"property":"type","value":"${AggregationJob[jobType]}"},{"property":"objectType","value":"source"},{"property":"objectId","value":"${sourceID}"}]`,
		};
		endpoint = withQuery(endpoint, queryParams);
		console.log("getAggregationJob: endpoint =", endpoint);
		const req = await fetch(endpoint, {
			headers: headers,
		});
		if (!req.ok) {
			throw new Error("Could not start aggregation:" + req.statusText);
		}
		const tasks: any = await req.json();
		if (tasks && tasks.items && tasks.items instanceof Array) {
			for (let index = 0; index < tasks.items.length; index++) {
				const task = tasks.items[index];
				if (task.details.id === taskId) {
					return task;
				}
			}
		}

		return null;
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
		let endpoint =
			EndpointUtils.getV3Url(this.tenantName) +
			'/sources?filters=name eq "' +
			sourceName +
			'" or id eq "' +
			sourceName +
			'"';
		console.log("endpoint = " + endpoint);

		const headers = await this.prepareHeaders();
		let sourceId = await fetch(endpoint, {
			headers: headers,
		})
			.then(async function (response) {
				if (response.status === 200) {
					let json: any = await response.json();

					if (json !== undefined) {
						if (json.length > 0) {
							if (json[0].id !== undefined) {
								return json[0].id;
							}
						} else {
							console.error(response.statusText);
							vscode.window.showErrorMessage(
								`Source '${sourceName}' does not exist`
							);
							return;
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

		return sourceId;
	}

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

	public async getAccount(
		nativeIdentity: string,
		sourceId: string
	): Promise<any> {
		console.log("> getAccount", nativeIdentity, sourceId);
		let endpoint =
			EndpointUtils.getV3Url(this.tenantName) +
			'/accounts?filters=sourceId eq "' +
			sourceId +
			'" and nativeIdentity eq "' +
			nativeIdentity +
			'"';
		console.log("endpoint = " + endpoint);

		const headers = await this.prepareHeaders();

		let account = await fetch(endpoint, {
			headers: headers,
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

		return account;
	}

	/**
	 *
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-export
	 * @returns jobId
	 */
	public async startExportJob(
		objectTypes: string[],
		objectOptions: ObjectOptions = {}
	): Promise<string> {
		console.log("> startExportJob", objectTypes, objectOptions);
		const endpoint = EndpointUtils.getBetaUrl(this.tenantName) + "/sp-config/export";
		console.log("endpoint = " + endpoint);

		const headers = await this.prepareHeaders();

		const payload = {
			"description": `Export Job vscode ${new Date().toISOString()}`,
			"includeTypes": objectTypes,
			"objectOptions": objectOptions,
		};

		console.log("startExportJob: requesting", payload);
		const payloadStr = JSON.stringify(
			payload,
			["description", "includeTypes", "objectOptions",
				"SOURCE", "RULE", "IDENTITY_PROFILE", "TRIGGER_SUBSCRIPTION", "TRANSFORM",
				"includedIds", "includedNames"]);
		console.log("startExportJob: payloadStr=" + payloadStr);
		const req = await fetch(endpoint, {
			method: "POST",
			headers: headers,
			body: payloadStr,
		});
		if (!req.ok) {
			throw new Error(req.statusText);
		}
		const res: any = await req.json();
		const jobId = res.jobId;
		console.log("< startExportJob. jobId =", jobId);
		return jobId;
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportJobStatus
	 * @param jobId
	 * @returns
	 */
	public async getExportJobStatus(jobId: String): Promise<any> {
		console.log("> getExportJobStatus", jobId);
		const path = `/beta/sp-config/export/${jobId}`;
		return this.getResource(path);
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportDownload
	 * @param jobId
	 * @returns
	 */
	public async getExportJobResult(jobId: String): Promise<any> {
		console.log("> getExportJobResult", jobId);
		const path = `/beta/sp-config/export/${jobId}/download`;
		return this.getResource(path);
	}

	/**
	 *
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import
	 * @returns jobId
	 */
	public async startImportJob(
		data: string,
		options: ExportOptions = {}
	): Promise<string> {
		console.log("> startImportJob", options);
		const endpoint = EndpointUtils.getBetaUrl(this.tenantName) + "/sp-config/import";
		// const endpoint = "https://webhook.site/584bc6da-1d4c-4062-980b-38e19ebea9ee";
		console.log("startImportJob: endpoint = " + endpoint);

		let headers = await this.prepareHeaders();

		let formData = new FormData();
		formData.append("data", data, "import.json");
		if (Object.keys(options).length !== 0 || options.constructor !== Object) {
			formData.append("options", JSON.stringify(options));
		}

		console.log("startImportJob: requesting", formData);

		const formHeaders = formData.getHeaders();
		headers = {
			...formHeaders,
			...headers,
		};

		const req = await fetch(endpoint, {
			method: "POST",
			headers: headers,
			body: formData,
		});

		if (!req.ok) {
			throw new Error(req.statusText);
		}
		const res: any = await req.json();
		const jobId = res.jobId;
		console.log("< startImportJob. jobId =", jobId);
		return jobId;
	}


	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import-job-status
	 * @param jobId
	 * @returns
	 */
	public async getImportJobStatus(jobId: String): Promise<JobStatus> {
		console.log("> getImportJobStatus", jobId);
		const path = `/beta/sp-config/import/${jobId}`;
		return this.getResource(path);
	}

	/**
	 * cf. https://developer.sailpoint.com/idn/api/beta/sp-config-import-download
	 * @param jobId
	 * @returns
	 */
	public async getImportJobResult(jobId: String): Promise<ImportJobResults> {
		console.log("> getImportJobResult", jobId);
		const path = `/beta/sp-config/import/${jobId}/download`;
		return this.getResource(path);
	}


	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/patchWorkflow
	 * @param jobId
	 * @returns
	 */
	public async updateWorkflowStatus(
		path: string,
		status: boolean
	): Promise<void> {
		console.log("> updateWorkflowStatus", path, status);

		const payload = [
			{
				op: "replace",
				path: "/enabled",
				value: status,
			},
		];

		await this.patchResource(path, JSON.stringify(payload));
		console.log("< updateWorkflowStatus");
	}

	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/listWorkflowExecutions
	 * @param workflowId
	 * @returns
	 */
	public async getWorkflowExecutionHistory(
		workflowId: string
	): Promise<WorkflowExecution[]> {
		console.log("> getWorkflowExecutionHistory", workflowId);
		const path = `/beta/workflows/${workflowId}/executions`;
		console.log("path =", path);
		return await this.getResource(path);
	}
	/**
	 * cf. https://developer.sailpoint.com/apis/beta/#operation/getWorkflowExecution
	 * @param workflowExecutionId
	 * @returns
	 */
	public async getWorkflowExecution(
		workflowExecutionId: string
	): Promise<WorkflowExecution> {
		console.log("> getWorkflowExecution", workflowExecutionId);
		const path = `/beta/workflow-executions/${workflowExecutionId}`;
		console.log("path =", path);
		return await this.getResource(path);
	}

	public async getWorflows(): Promise<Workflow[]> {
		const workflows = await this.getResource("/beta/workflows");
		if (workflows === undefined || !Array.isArray(workflows)) {
			return [];
		}
		workflows.sort(compareByName);
		return workflows;
	}

	public async getWorflowTriggers(): Promise<Workflow[]> {
		const workflowTriggers = await this.getResource(
			"/beta/workflow-library/triggers"
		);
		if (workflowTriggers === undefined || !Array.isArray(workflowTriggers)) {
			return [];
		}
		return workflowTriggers;
	}

	public async testWorkflow(workflowId: string, payload: any): Promise<string> {
		console.log("> testWorkflow", workflowId, payload);
		const path = `/beta/workflows/${workflowId}/test`;

		const workflowExecutionDetail = await this.createResource(
			path,
			JSON.stringify({
				input: payload,
			})
		);

		return workflowExecutionDetail.workflowExecutionId;
	}

	public async getConnectorRules(): Promise<ConnectorRule[]> {
		const rules = await this.getResource("/beta/connector-rules");
		if (rules === undefined || !Array.isArray(rules)) {
			return [];
		}
		rules.sort(compareByName);
		return rules;
	}

	public async getConnectorRuleById(
		id: string
	): Promise<ConnectorRule | undefined> {
		const rule = await this.getResource("/beta/connector-rules/" + id);
		return rule;
	}

	/**
	 * At this moment, it is not possible to get a rule by filtering on the name
	 * The filtering must be done client-side
	 * @param name
	 * @returns
	 */
	public async getConnectorRuleByName(
		name: string
	): Promise<ConnectorRule | undefined> {
		console.log("> getConnectorRuleByName", name);
		const rules = await this.getConnectorRules();
		return rules.find((r) => r.name === name);
	}

	public async validateConnectorRule(
		script: string
	): Promise<ValidationResult> {
		console.log("> validateConnectorRule", script);

		const payload = {
			version: "1.0",
			script,
		};

		const endpoint =
			EndpointUtils.getBetaUrl(this.tenantName) + "/connector-rules/validate";
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const resp = await fetch(endpoint, {
			method: "POST",
			headers: headers,
			body: JSON.stringify(payload),
		});

		if (!resp.ok) {
			if (resp.status === 500) {
				const details: any = await resp.json();
				const detail = details?.messages[0]?.text || resp.statusText;
				throw new Error(detail);
			}
			throw new Error(resp.statusText);
		}
		const jsonBody: any = await resp.json();
		console.log("< validateConnectorRule", jsonBody);
		return jsonBody;
	}

	public async getIdentityProfiles(): Promise<IdentityProfile[]> {
		const identityProfiles = await this.getResource(
			"/v3/identity-profiles?sorters=name"
		);
		if (identityProfiles === undefined || !Array.isArray(identityProfiles)) {
			return [];
		}
		// identityProfiles.sort(compareByName);
		return identityProfiles;
	}

	public async getLifecycleStates(
		identityProfileId: string
	): Promise<LifeCycleState[]> {
		const lifecycleStates = await this.getResource(
			`/v3/identity-profiles/${identityProfileId}/lifecycle-states`
		);
		if (lifecycleStates === undefined || !Array.isArray(lifecycleStates)) {
			return [];
		}
		// identityProfiles.sort(compareByName);
		return lifecycleStates;
	}

	public async getServiceDesks(): Promise<ServiceDesk[]> {
		const serviceDesks = await this.getResource(
			"/v3/service-desk-integrations?sorters=name"
		);
		if (serviceDesks === undefined || !Array.isArray(serviceDesks)) {
			return [];
		}
		// identityProfiles.sort(compareByName);
		return serviceDesks;
	}

	public async refreshIdentityProfile(identityProfileId: string): Promise<void> {
		console.log("> refreshIdentityProfile", identityProfileId);
		const endpoint = EndpointUtils.getBetaUrl(this.tenantName) + `/identity-profiles/${identityProfileId}/refresh-identities`;
		console.log("endpoint = " + endpoint);
		const headers = await this.prepareHeaders();
		const resp = await fetch(endpoint, {
			method: "POST",
			headers: headers
		});

		if (!resp.ok) {
			throw new Error(resp.statusText);
		}
	}
}

export enum AggregationJob {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	CLOUD_ACCOUNT_AGGREGATION,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	ENTITLEMENT_AGGREGATION,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	SOURCE_RESET,
}
