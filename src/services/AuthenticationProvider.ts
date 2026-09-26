import { spawn } from 'child_process';
import {
    env,
    window,
} from 'vscode';
import { AuthenticationMethod, TenantCredentials, TenantToken } from '../models/TenantInfo';
import { parseJwt } from '../utils';
import { isEmpty } from '../utils/stringUtils';
import { EndpointUtils } from '../utils/EndpointUtils';
import { TenantService } from './TenantService';
import { OAuth2Client } from './OAuth2Client';
import {
    completeOAuthCodeLogin,
    parsePasteCode,
    refreshOAuthCodeToken,
    startOAuthCodeLogin,
    tenantTokenFromOAuthResponse,
} from './OAuthCodeClient';

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

/**
 * Opens the authorize URL in the system browser, once.
 *
 * vscode.env.openExternal sends https URLs through window.open. On macOS the
 * window-open handler then opens that same URL again, so the sign-in page
 * appears twice. The URL is passed as one argument so the encoded redirect URI
 * is left intact.
 */
function openSignInUrl(url: string): Promise<boolean> {
    const { file, args } = signInOpener(process.platform, url);
    return new Promise((resolve) => {
        const child = spawn(file, args, {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
        });
        let settled = false;
        const finish = (opened: boolean) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(opened);
        };
        child.on("error", () => finish(false));
        child.on("spawn", () => finish(true));
        child.unref();
    });
}

function signInOpener(platform: NodeJS.Platform, url: string): { file: string, args: string[] } {
    if (platform === "darwin") {
        return { file: "/usr/bin/open", args: [url] };
    }
    if (platform === "win32") {
        // rundll32 does not pass the URL through cmd, so "&" in the query stays one argument.
        return { file: "rundll32", args: ["url.dll,FileProtocolHandler", url] };
    }
    return { file: "xdg-open", args: [url] };
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
        // Check if an access token already exists
        let token = await this.tenantService.getTenantAccessToken(tenantId);
        const tenantInfo = this.tenantService.getTenant(tenantId);
        const oauthExpiring = tenantInfo?.authenticationMethod === AuthenticationMethod.oauthCode
            && token !== undefined
            && this.oauthAccessTokenExpiring(token);
        if (token === undefined || token.expired() || oauthExpiring) {
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
            } else if (tenantInfo?.authenticationMethod === AuthenticationMethod.oauthCode) {
                return await this.refreshOrSignInWithOAuthCode(tenantId, tenantInfo.tenantName, token);
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
        } else if (tenantInfo?.authenticationMethod === AuthenticationMethod.oauthCode) {
            return await this.signInWithOAuthCode(tenantId, tenantInfo.tenantName);
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

    /**
     * OAuth access tokens are refreshed shortly before they expire.
     */
    private oauthAccessTokenExpiring(token: TenantToken): boolean {
        const fiveMinutesMs = 5 * 60 * 1000;
        return token.expires.getTime() - Date.now() <= fiveMinutesMs;
    }

    private async refreshOrSignInWithOAuthCode(tenantId: string, tenantName: string, token: TenantToken | undefined): Promise<SailPointISCPatSession> {
        const refreshStillValid = token?.refreshExpires === undefined || token.refreshExpires.getTime() > Date.now();
        if (token?.refreshToken && refreshStillValid) {
            try {
                const refreshed = await refreshOAuthCodeToken(EndpointUtils.getBaseUrl(tenantName), token.refreshToken);
                const stored = tenantTokenFromOAuthResponse(refreshed);
                await this.tenantService.setTenantAccessToken(tenantId, stored);
                return new SailPointISCPatSession(stored.accessToken);
            } catch (error) {
                console.error("OAuth token refresh failed", error);
            }
        }
        return await this.signInWithOAuthCode(tenantId, tenantName);
    }

    /**
     * Opens the tenant sign-in page and exchanges the pasted one-time code.
     * The PKCE verifier stays in memory for this attempt and is not stored.
     */
    private async signInWithOAuthCode(tenantId: string, tenantName: string): Promise<SailPointISCPatSession> {
        const oauthSession = await startOAuthCodeLogin(EndpointUtils.getBaseUrl(tenantName));
        const opened = await openSignInUrl(oauthSession.authUrl);
        if (!opened) {
            await env.clipboard.writeText(oauthSession.authUrl);
            await window.showWarningMessage("Could not open the browser. The sign-in URL was copied to the clipboard.");
        }

        while (Date.now() < oauthSession.expiresAt) {
            const pasted = await window.showInputBox({
                title: "Identity Security Cloud",
                prompt: `Confirmation code: ${oauthSession.confirmationCode}. Paste the one-time code from the SailPoint page.`,
                placeHolder: "sp1....",
                ignoreFocusOut: true,
                validateInput: (text) => {
                    if (isEmpty((text || "").trim())) {
                        return "One-time code is required";
                    }
                    try {
                        parsePasteCode(text, oauthSession.state);
                        return null;
                    } catch (error) {
                        return error instanceof Error ? error.message : String(error);
                    }
                }
            });
            if (pasted === undefined || isEmpty(pasted.trim())) {
                throw new Error("One-time code is required");
            }

            try {
                parsePasteCode(pasted, oauthSession.state);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                const choice = await window.showErrorMessage(message, "Try again");
                if (choice !== "Try again") {
                    throw error instanceof Error ? error : new Error(message);
                }
                continue;
            }

            const tokenSet = await completeOAuthCodeLogin(oauthSession, pasted);
            const stored = tenantTokenFromOAuthResponse(tokenSet);
            await this.tenantService.setTenantAccessToken(tenantId, stored);
            return new SailPointISCPatSession(stored.accessToken);
        }

        throw new Error("OAuth authentication timed out");
    }

    // This function is called when the end user signs out of the account.
    async removeSession(tenantId: string): Promise<void> {
        console.log("> removeSession for", tenantId);
        // Remove PAT or just AccessToken?
        this.tenantService.removeTenantAccessToken(tenantId);
    }



}

