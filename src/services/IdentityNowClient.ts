import { authentication } from "vscode";
import { withQuery, EndpointUtil } from "../utils";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import 'isomorphic-fetch';
import 'isomorphic-form-data';

// import FormData = require('form-data');



export class IdentityNowClient {

    constructor(private readonly tenantName: string) { };

    public async getSources(): Promise<any> {
        console.log('> getSources');
        const endpoint = EndpointUtil.getV3Url(this.tenantName) + '/sources?sorters=name';
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

    private async prepareHeaders(): Promise<any> {
        const session = await authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [this.tenantName]);
        return {
            "Authorization": `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json"
        };
    }

    public async startAggregation(sourceID: Number, disableOptimization = false): Promise<any> {
        const endpoint = EndpointUtil.getCCUrl(this.tenantName) + '/source/loadAccounts/' + sourceID;
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

    public async getAggregationJob(sourceID: Number, taskId: string, jobType = AggregationJob.CLOUD_ACCOUNT_AGGREGATION): Promise<any> {
        console.log('> getAggregationJob', sourceID, taskId, jobType);
        let endpoint = EndpointUtil.getCCUrl(this.tenantName) + '/event/list';
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
    CLOUD_ACCOUNT_AGGREGATION,
    ENTITLEMENT_AGGREGATION
}