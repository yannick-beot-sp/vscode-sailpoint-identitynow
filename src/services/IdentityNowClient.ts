import * as vscode from 'vscode';
import { authentication } from "vscode";
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import 'isomorphic-fetch';
import 'isomorphic-form-data';
import { withQuery } from "../utils/UriUtils";
import { Workflow, WorkflowExecution } from "../models/workflow";
import { convertToText } from '../utils';

export class IdentityNowClient {

    constructor(private readonly tenantName: string) { };

    public async getSources(): Promise<any> {
        console.log('> getSources');
        const endpoint = EndpointUtils.getV3Url(this.tenantName) + '/sources?sorters=name';
        // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            headers: headers
        });

        if (!req.ok) {

            throw new Error(req.statusText);
        }
        const res = await req.json();

        return res;
    }

    /**
     * 
     * @param path Generic method to get resource
     * @returns 
     */
    public async getResource(path: string): Promise<any> {
        console.log('> getResource', path);
        let endpoint = EndpointUtils.getBaseUrl(this.tenantName);
        endpoint += path;
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            headers: headers
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
        console.log('> getTransforms');
        const endpoint = EndpointUtils.getV3Url(this.tenantName) + '/transforms';
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            headers: headers
        });

        if (!req.ok) {

            throw new Error(req.statusText);
        }
        const res = await req.json();

        return res;
    }

    public async getTransformByName(name: string): Promise<any> {
        console.log('> getTransformByName', name);
        let endpoint = EndpointUtils.getV3Url(this.tenantName) + '/transforms';
        endpoint = withQuery(endpoint, { filters: `name eq "${name}"` });
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            headers: headers
        });

        if (!req.ok) {

            throw new Error(req.statusText);
        }
        const res = await req.json();

        return res;
    }

    public async createResource(path: string, data: string): Promise<any> {
        console.log('> IdentityNowClient.createResource', path);
        const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: data
        });

        if (!req.ok) {
            if (req.status === 404) {
                return null;
            }
            if (req.status === 400) {
                const details = await req.json();
                const detail = details?.messages[0]?.text || req.statusText;
                throw new Error(detail);
            }
            throw new Error(req.statusText);
        }
        const res = await req.json();
        console.log('< IdentityNowClient.createResource', res);
        return res;
    }

    public async deleteResource(path: string): Promise<void> {
        console.log('> IdentityNowClient.deleteResource', path);
        const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            method: 'DELETE',
            headers: headers
        });

        if (!req.ok) {
            if (req.status === 404) {
                throw new Error("Resource not found");
            }
            if (req.status === 400) {
                const details = await req.json();
                const detail = details?.messages[0]?.text || req.statusText;
                throw new Error(detail);
            }
            throw new Error(req.statusText);
        }

        console.log('< IdentityNowClient.deleteResource');
    }

    public async updateResource(path: string, data: string): Promise<any> {
        console.log('> updateResource', path);
        const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        const req = await fetch(endpoint, {
            method: 'PUT',
            headers: headers,
            body: data
        });

        if (!req.ok) {
            if (req.status === 404) {
                return null;
            }
            if (req.status === 400) {
                const details = await req.json();
                const detail = details?.messages[0]?.text || req.statusText;
                throw new Error(detail);
            }
            throw new Error(req.statusText);
        }
        const res = await req.json();

        return res;
    }

    public async patchResource(path: string, data: string): Promise<any> {
        console.log('> patchResource', path);
        const endpoint = EndpointUtils.getBaseUrl(this.tenantName) + path;
        console.log('endpoint = ' + endpoint);
        const headers = await this.prepareHeaders();
        headers['Content-Type'] = 'application/json-patch+json';
        const req = await fetch(endpoint, {
            method: 'PATCH',
            headers: headers,
            body: data
        });

        if (!req.ok) {
            if (req.status === 404) {
                return null;
            }
            if (req.status === 400) {
                const details = await req.json();
                const detail = details?.messages[0]?.text || req.statusText;
                throw new Error(detail);
            }
            throw new Error(req.statusText);
        }
        const res = await req.json();

        return res;
    }

    private async prepareHeaders(): Promise<any> {
        const session = await authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [this.tenantName]);
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Authorization": `Bearer ${session?.accessToken}`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json"
        };
    }

    public async startAggregation(sourceID: Number, disableOptimization = false): Promise<any> {
        const endpoint = EndpointUtils.getCCUrl(this.tenantName) + '/source/loadAccounts/' + sourceID;
        const headers = await this.prepareHeaders();

        var formData = new FormData();
        if (disableOptimization) {
            formData.append('disableOptimization', 'true');
        }
        const req = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        if (!req.ok) {
            throw new Error("Could not start aggregation:" + req.statusText);
        }
        const res = await req.json();
        return res;
    }

    public async resetSource(sourceID: Number): Promise<any> {
        console.log('> IdentityNowClient.resetSource', sourceID);
        const endpoint = EndpointUtils.getCCUrl(this.tenantName) + '/source/reset/' + sourceID;
        const headers = await this.prepareHeaders();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';

        const req = await fetch(endpoint, {
            method: 'POST',
            headers: headers
        });
        if (!req.ok) {
            let detail = req.statusText;
            if (req.status === 400) {
                const res = await req.json();
                detail = res.exception_message;
            }
            throw new Error("Could not reset source: " + detail);
        }
        const res = await req.json();
        return res;
    }

    public async getAggregationJob(sourceID: Number, taskId: string, jobType = AggregationJob.CLOUD_ACCOUNT_AGGREGATION): Promise<any> {
        console.log('> getAggregationJob', sourceID, taskId, jobType);
        let endpoint = EndpointUtils.getCCUrl(this.tenantName) + '/event/list';
        const headers = await this.prepareHeaders();
        const queryParams = {
            page: 1,
            start: 0,
            limit: 3,
            sort: '[{"property":"timestamp","direction":"DESC"}]',
            filter: `[{"property":"type","value":"${AggregationJob[jobType]}"},{"property":"objectType","value":"source"},{"property":"objectId","value":"${sourceID}"}]`
        };
        endpoint = withQuery(endpoint, queryParams);
        console.log('getAggregationJob: endpoint =', endpoint);
        const req = await fetch(endpoint, {
            headers: headers
        });
        if (!req.ok) {
            throw new Error("Could not start aggregation:" + req.statusText);
        }
        const tasks = await req.json();
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
        console.log('> getSourceId', sourceName);
        let endpoint = EndpointUtils.getV3Url(this.tenantName) + '/sources?filters=name eq "' + sourceName + '" or id eq "' + sourceName + '"';
        console.log('endpoint = ' + endpoint);

        const headers = await this.prepareHeaders();
        let sourceId = await fetch(endpoint, {
            headers: headers
        }).then(async function(response) {
            if (response.status === 200) {
                let json = await response.json();

                if (json !== undefined) {
                    if (json.length > 0) {
                        if (json[0].id !== undefined) {
                            return json[0].id;
                        }
                    } else {
                        console.error(response.statusText);
                        vscode.window.showErrorMessage(`Source '${sourceName}' does not exist`);
                        return;
                    }
                }
            } else {
                console.error(response.statusText);
                vscode.window.showErrorMessage(`${endpoint} --> ${response.statusText}`);
                return;
            }
        }).catch(function(error) {
            console.log(error);
        });
 
        return sourceId;
    }
    
    public async getIdentity(identityNameOrId: string): Promise<any> {
        console.log('> getIdentity', identityNameOrId);
        let endpoint = EndpointUtils.getV3Url(this.tenantName) + '/search';
        console.log('endpoint = ' + endpoint);

        const headers = await this.prepareHeaders();

        const data = {
            "indices": [
                "identities"
            ],
            "query": {
                "query": "\"" + identityNameOrId + "\"",
                "fields": [
                    "name",
                    "displayName",
                    "id"
                ]
            }
        };
        
        let identity = await fetch(endpoint, {
            headers: headers,
            method: 'POST',
            body: convertToText(data)
        }).then(async function(response) {
            if (response.status === 200) {
                let json = await response.json();

                if (json !== undefined) {
                    if (json.length > 0) {
                        return json[0];
                    }
                } 
            } else {
                console.error(response.statusText);
                vscode.window.showErrorMessage(`${endpoint} --> ${response.statusText}`);
                return;
            }
        }).catch(function(error) {
            console.log(error);
        });

        if (identity !== undefined) {
            return identity;
        }        
    }

    public async getAccount(nativeIdentity: string, sourceId: string): Promise<any> {
        console.log('> getAccount', nativeIdentity, sourceId);
        let endpoint = EndpointUtils.getV3Url(this.tenantName) + '/accounts?filters=sourceId eq "' + sourceId + '" and nativeIdentity eq "' + nativeIdentity + '"';
        console.log('endpoint = ' + endpoint);

        const headers = await this.prepareHeaders();
        
        let account = await fetch(endpoint, {
            headers: headers
        }).then(async function(response) {
            if (response.status === 200) {
                let json = await response.json();

                if (json !== undefined) {
                    if (json.length > 0) {
                        return json[0];
                    }
                } 
            } else {
                console.error(response.statusText);
                vscode.window.showErrorMessage(`${endpoint} --> ${response.statusText}`);
                return;
            }
        }).catch(function(error) {
            console.log(error);
        });

        return account;
    }

    /**
     * 
     * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExport
     * @returns jobId
     */
    public async startExportJob(objectTypes: string[], objectOptions = {}): Promise<string> {
        console.log('> startExportJob', objectTypes);
        let endpoint = EndpointUtils.getBetaUrl(this.tenantName);
        endpoint += '/sp-config/export';
        console.log('endpoint = ' + endpoint);

        const headers = await this.prepareHeaders();

        const payload = {
            "description": `Export Job vscode ${(new Date()).toISOString()}`,
            "includeTypes": objectTypes,
            "objectOptions": objectOptions
        };

        console.log('startExportJob: requesting', payload);
        const req = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        if (!req.ok) {
            throw new Error(req.statusText);
        }
        const res = await req.json();
        const jobId = res.jobId;
        console.log('< startExportJob. jobId =', jobId);
        return jobId;
    }

    /**
     * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportJobStatus
     * @param jobId 
     * @returns 
     */
    public async getExportJobStatus(jobId: String): Promise<any> {
        console.log('> getExportJobStatus', jobId);
        const path = '/beta/sp-config/export/' + jobId;
        console.log('path = ' + path);
        return this.getResource(path);
    }

    /**
     * cf. https://developer.sailpoint.com/apis/beta/#operation/spConfigExportDownload
     * @param jobId 
     * @returns 
     */
    public async getExportJobResult(jobId: String): Promise<any> {
        console.log('> getExportJobResult', jobId);
        const path = '/beta/sp-config/export/' + jobId + '/download';
        console.log('path = ' + path);
        return this.getResource(path);
    }

    /**
     * cf. https://developer.sailpoint.com/apis/beta/#operation/patchWorkflow
     * @param jobId 
     * @returns 
     */
    public async updateWorkflowStatus(path: string, status: boolean): Promise<void> {
        console.log('> updateWorkflowStatus', path, status);

        const payload = [
            {
                "op": "replace",
                "path": "/enabled",
                "value": status
            }
        ];

        await this.patchResource(path, JSON.stringify(payload));
        console.log('< updateWorkflowStatus');
    }

    /**
     * cf. https://developer.sailpoint.com/apis/beta/#operation/listWorkflowExecutions
     * @param workflowId 
     * @returns 
     */
    public async getWorkflowExecutionHistory(workflowId: string): Promise<WorkflowExecution[]> {
        console.log('> getWorkflowExecutionHistory', workflowId);
        const path = `/beta/workflows/${workflowId}/executions`;
        console.log("path =", path);
        return await this.getResource(path);
    }
/**
 * cf. https://developer.sailpoint.com/apis/beta/#operation/getWorkflowExecution
 * @param workflowExecutionId 
 * @returns 
 */
    public async getWorkflowExecution(workflowExecutionId:string): Promise<WorkflowExecution> {
        console.log('> getWorkflowExecution', workflowExecutionId);
        const path = `/beta/workflow-executions/${workflowExecutionId}`;
        console.log("path =", path);
        return await this.getResource(path);
    }

    public async getWorflows(): Promise<Workflow[]> {
        const workflows = await this.getResource('/beta/workflows');
        if (workflows === undefined || !Array.isArray(workflows)) {
            return [];
        }
        workflows.sort((a:Workflow, b:Workflow) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
        return workflows;
    }

    public async getWorflowTriggers(): Promise<Workflow[]> {
        const workflowTriggers = await this.getResource('/beta/workflow-library/triggers');
        if (workflowTriggers === undefined || !Array.isArray(workflowTriggers)) {
            return [];
        }
        return workflowTriggers;
    }

    public async testWorkflow(workflowId:string, payload:any): Promise<string> {
        console.log('> testWorkflow', workflowId, payload);
        const path = `/beta/workflows/${workflowId}/test`;
        
        const workflowExecutionDetail = await this.createResource(path, JSON.stringify({
            input: payload
        }));
        
        return workflowExecutionDetail.workflowExecutionId;
    }

    

}

export enum AggregationJob {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CLOUD_ACCOUNT_AGGREGATION,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ENTITLEMENT_AGGREGATION,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SOURCE_RESET
}