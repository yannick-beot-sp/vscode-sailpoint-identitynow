import { authentication } from "vscode";
import { EndpointUtils } from "../utils/EndpointUtils";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import 'isomorphic-fetch';
import 'isomorphic-form-data';
import { withQuery } from "../utils/UriUtils";

// import FormData = require('form-data');



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

}

export enum AggregationJob {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CLOUD_ACCOUNT_AGGREGATION,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ENTITLEMENT_AGGREGATION,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SOURCE_RESET
}