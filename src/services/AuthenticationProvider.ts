import {
    window,
} from 'vscode';
import { AuthenticationMethod, TenantCredentials, TenantToken } from '../models/TenantInfo';
import { parseJwt } from '../utils';
import { isEmpty } from '../utils/stringUtils';
import { EndpointUtils } from '../utils/EndpointUtils';
import { TenantService } from './TenantService';
import { OAuth2Client } from './OAuth2Client';

class SailPointISCPatSession {
    /**
     * 
     * @param accessToken The personal access token to use for authentication
     */
    constructor(
        public readonly accessToken: string,
    ) { }
}

async function askPATClientId(): Promise<string | undefined> {
    const result = await window.showInputBox({
        value: '',
        ignoreFocusOut: true,
        placeHolder: '806c451e057b442ba67b5d459716e97a',
        prompt: 'Enter a Personal Access Token (PAT) Client ID.',
        title: 'Identity Security Cloud',
        validateInput: text => {
            const regex = new RegExp('^[a-f0-9]{32}$');
            if (regex.test(text)) {
                return null;
            }
            return "Invalid client ID";
        }
    });

    return result;
}

async function askPATClientSecret(): Promise<string | undefined> {
    const result = await window.showInputBox({
        value: '',
        password: true,
        ignoreFocusOut: true,
        placeHolder: '***',
        prompt: 'Enter a Personal Access Token (PAT) Secret.',
        title: 'Identity Security Cloud',
        validateInput: text => {
            const regex = new RegExp('^[a-f0-9]{63,64}$');
            if (regex.test(text)) {
                return null;
            }
            return "Invalid secret";
        }
    });
    return result;
}

async function askAccessToken(): Promise<string | undefined> {
    const result = await window.showInputBox({
        value: '',
        password: true,
        ignoreFocusOut: true,
        placeHolder: '***',
        prompt: 'Enter an Access Token.',
        title: 'Identity Security Cloud',
        validateInput: text => {
            const regex = new RegExp('^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_+/=-]+)$');
            if (regex.test(text)) {
                return null;
            }
            return "Invalid access token";
        }
    });
    return result;
}
export class SailPointISCAuthenticationProvider {

    private static instance: SailPointISCAuthenticationProvider


    private constructor(private readonly tenantService: TenantService) { }

    public static initialize(tenantService: TenantService) {
        SailPointISCAuthenticationProvider.instance = new SailPointISCAuthenticationProvider(tenantService)
    }

    public static getInstance(): SailPointISCAuthenticationProvider {
        return SailPointISCAuthenticationProvider.instance;
    }

    public async getSessionByTenant(tenantId: string): Promise<SailPointISCPatSession | null> {
        console.log("> getSessionByTenant", tenantId);
        // Check if an access token already exists
        let token = await this.tenantService.getTenantAccessToken(tenantId);
        const tenantInfo = this.tenantService.getTenant(tenantId);
        if (token === undefined || token.expired()) {
            console.log("INFO: accessToken is expired. Updating Access Token");
            if (tenantInfo?.authenticationMethod === AuthenticationMethod.accessToken) {
                const accessToken = await askAccessToken() || "";
                if (isEmpty(accessToken)) {
                    throw new Error('Access Token is required');
                }
                const jwt = parseJwt(accessToken);
                const token = new TenantToken(accessToken, new Date(jwt.exp * 1000), { clientId: jwt.client_id } as TenantCredentials);
                this.tenantService.setTenantAccessToken(tenantId, token);

                return new SailPointISCPatSession(accessToken)
            } else {
                // If no access token or expired => create one
                const credentials = await this.tenantService.getTenantCredentials(tenantId);
                if (credentials !== undefined) {

                    try {

                        token = await this.createAccessToken(tenantInfo?.tenantName ?? "", credentials.clientId, credentials.clientSecret);
                        this.tenantService.setTenantAccessToken(tenantId, token);

                        console.log("< getSessionByTenant for", tenantId);
                        return new SailPointISCPatSession(token.accessToken);
                    } catch (error) {
                        console.error(error);
                    }
                    return null;
                } else {
                    console.log("WARNING: no credentials for tenant", tenantId);
                }
            }
        } else {
            console.log("< getSessionByTenant existing token");
            return new SailPointISCPatSession(token.accessToken)
        }

        console.log("< getSessionByTenant null");
        return null;
    }

    /**
     * Collect info depending on the tenant authentication method and return a session
     */
    async createSession(tenantId: string): Promise<SailPointISCPatSession> {
        console.log("> createSession", tenantId);
        const tenantInfo = this.tenantService.getTenant(tenantId);

        if (tenantInfo?.authenticationMethod === AuthenticationMethod.accessToken) {
            // Access Token
            const accessToken = await askAccessToken() || "";
            if (isEmpty(accessToken)) {
                throw new Error('Access Token is required');
            }
            const jwt = parseJwt(accessToken);
            const token = new TenantToken(accessToken, new Date(jwt.exp * 1000), {} as TenantCredentials);
            this.tenantService.setTenantAccessToken(tenantId, token);
            return new SailPointISCPatSession(accessToken);
        } else {
            // Prompt for the PAT.
            const clientId = await askPATClientId() || "";
            if (isEmpty(clientId)) {
                throw new Error('Client ID is required');
            }

            const clientSecret = await askPATClientSecret() || "";
            if (isEmpty(clientSecret)) {
                throw new Error('Client Secret is required');
            }

            const token = await this.createAccessToken(tenantInfo?.tenantName ?? "", clientId, clientSecret);
            this.tenantService.setTenantCredentials(tenantId,
                {
                    clientId: clientId,
                    clientSecret: clientSecret
                });

            return new SailPointISCPatSession(token.accessToken)
        }
    }

    /**
     * Create an access Token and update secret storage
     * @param tenantName 
     * @param clientId 
     * @param clientSecret 
     */
    private async createAccessToken(tenantName: string, clientId: string, clientSecret: string): Promise<TenantToken> {
        console.log('> createAccessToken', tenantName, clientId);
        const iscAuth = new OAuth2Client(
            clientId,
            clientSecret,
            EndpointUtils.getAccessTokenUrl(tenantName)
        );

        const oauth2token = await iscAuth.getAccessToken();
        console.log('Successfully logged in to ISC');
        const token = new TenantToken(
            oauth2token.accessToken,
            oauth2token.expiresIn,
            {
                clientId: clientId,
                clientSecret: clientSecret
            });
        this.tenantService.setTenantAccessToken(tenantName, token);
        return token;
    }

    // This function is called when the end user signs out of the account.
    async removeSession(tenantId: string): Promise<void> {
        console.log("> removeSession for", tenantId);
        // Remove PAT or just AccessToken?
        this.tenantService.removeTenantAccessToken(tenantId);
    }



}

