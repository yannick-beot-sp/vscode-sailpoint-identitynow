import { authentication } from "vscode";
import { EndpointUtil } from "../utils";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import 'isomorphic-fetch';


export class IdentityNowClient {

    constructor(private readonly tenantName: string) { };

    async getSources(): Promise<any> {
        console.log('> getSources');
        const endpoint = EndpointUtil.getV3Url(this.tenantName) + '/sources?sorters=name';
        // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
        console.log('endpoint = ' + endpoint);
        const session = await authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [this.tenantName]);
        const req = await fetch(endpoint, {
            headers: {
                "Authorization": `Bearer ${session?.accessToken}`
            }
        });
        if (!req.ok) {
            throw new Error(req.statusText);
        }
        const res = await req.json();

        return res;
    }

}