import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent,
    AuthenticationSession,
    AuthenticationSessionAccountInformation,
    Disposable,
    Event,
    EventEmitter,
    window,
} from 'vscode';
import { AuthenticationMethod, TenantCredentials, TenantToken } from '../models/TenantInfo';
import { parseJwt } from '../utils';
import { isEmpty } from '../utils/stringUtils';
import { EndpointUtils } from '../utils/EndpointUtils';
import { TenantService } from './TenantService';
import { OAuth2Client } from './OAuth2Client';

class SailPointISCPatSession implements AuthenticationSession {
    readonly account: AuthenticationSessionAccountInformation;
    // readonly id: string;
    // No scope management for now
    readonly scopes = [];

    /**
     * 
     * @param tenantName The tenant name
     * @param clientId The client ID of the PAT
     * @param accessToken The personal access token to use for authentication
     * 
     */
    constructor(tenantName: string,
        clientId: string,
        public readonly accessToken: string,
        public readonly id: string

    ) {
        this.account = { id: clientId, label: `Personal Access Token for ${tenantName}` };
    }
}

export class SailPointISCAuthenticationProvider implements AuthenticationProvider, Disposable {


    static id = 'SailPointIdentityNowPAT';


    // this property is used to determine if the token has been changed in another window of VS Code.
    // It is used in the checkForUpdates function.
    private currentToken: Promise<string | undefined> | undefined;
    private initializedDisposable: Disposable | undefined;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
        return this._onDidChangeSessions.event;
    }

    constructor(private readonly tenantService: TenantService) { }

    dispose(): void {
        this.initializedDisposable?.dispose();
    }

    private ensureInitialized(): void {
        if (this.initializedDisposable === undefined) {

            this.initializedDisposable = Disposable.from(
                // This onDidChange event happens when the secret storage changes in _any window_ since
                // secrets are shared across all open windows.
                // this.secretStorage.onDidChange(e => {
                //     if (e.key.startsWith(SailPointIdentityNowAuthenticationProvider.SECRET_AT_PREFIX)
                //         || e.key.startsWith(SailPointIdentityNowAuthenticationProvider.SECRET_PAT_PREFIX)) {
                //         //void this.checkForUpdates();
                //     }
                // }),
                // This fires when the user initiates a "silent" auth flow via the Accounts menu.
                authentication.onDidChangeSessions(e => {
                    if (e.provider.id === SailPointISCAuthenticationProvider.id) {
                        //void this.checkForUpdates();
                    }
                }),
            );
        }
    }

    /**
     *This is a crucial function that handles whether or not the token has changed in
     *a different window of VS Code and sends the necessary event if it has.
     */
    private async checkForUpdates(): Promise<void> {
        const added: AuthenticationSession[] = [];
        const removed: AuthenticationSession[] = [];
        const changed: AuthenticationSession[] = [];

        const previousToken = await this.currentToken;
        /*
        const session = (await this.getSessions())[0];

        if (session?.accessToken && !previousToken) {
            added.push(session);
        } else if (!session?.accessToken && previousToken) {
            removed.push(session);
        } else if (session?.accessToken !== previousToken) {
            changed.push(session);
        } else {
            return;
        }

        this._onDidChangeSessions.fire({ added: added, removed: removed, changed: changed });
        */
    }


    private async getTenants(): Promise<string[]> {
        return (await this.tenantService.getTenants()).map(t => t.id);
    }

    /**
     * This function is called first when `vscode.authentication.getSessions` is called.
     */
    async getSessions(_scopes?: string[]): Promise<readonly AuthenticationSession[]> {
        console.log("> getSessions", _scopes);
        this.ensureInitialized();
        const result: SailPointISCPatSession[] = [];
        if (_scopes === undefined || _scopes.length === 0) {
            // return all scopes
            _scopes = await this.getTenants();
        }
        for (let index = 0; index < _scopes.length; index++) {
            const tenantId = _scopes[index];
            const session = await this.getSessionByTenant(tenantId);
            if (session !== null) {
                result.push(session);
            }
        }
        console.log("< getSessions");
        return result;
    }

    private async getSessionByTenant(tenantId: string): Promise<SailPointISCPatSession | null> {
        console.log("> getSessionByTenant", tenantId);
        // Check if an access token already exists
        let token = await this.tenantService.getTenantAccessToken(tenantId);
        const tenantInfo = await this.tenantService.getTenant(tenantId);
        if (token === undefined || token.expired()) {
            console.log("INFO: accessToken is expired. Updating Access Token");
            if (tenantInfo?.authenticationMethod === AuthenticationMethod.accessToken) {
                const accessToken = await this.askAccessToken() || "";
                if (isEmpty(accessToken)) {
                    throw new Error('Access Token is required');
                }
                const jwt = parseJwt(accessToken);
                const token = new TenantToken(accessToken, new Date(jwt.exp * 1000), { clientId: jwt.client_id } as TenantCredentials);
                this.tenantService.setTenantAccessToken(tenantId, token);

                return new SailPointISCPatSession(
                    tenantInfo?.tenantName ?? "",
                    jwt.client_id,
                    accessToken,
                    this.getSessionId(tenantId));
            } else {
                // If no access token or expired => create one
                const credentials = await this.tenantService.getTenantCredentials(tenantId);
                if (credentials !== undefined) {

                    token = await this.createAccessToken(tenantInfo?.tenantName ?? "", credentials.clientId, credentials.clientSecret);
                    this.tenantService.setTenantAccessToken(tenantId, token);
                    
                    console.log("< getSessionByTenant for", tenantId);
                    return new SailPointISCPatSession(tenantInfo?.tenantName ?? "",
                        credentials.clientId,
                        token.accessToken,
                        this.getSessionId(tenantId)
                    );
                } else {
                    console.log("WARNING: no credentials for tenant", tenantId);
                }
            }
        } else {
            console.log("< getSessionByTenant existing token");
            return new SailPointISCPatSession(
                tenantInfo?.tenantName ?? "",
                token.client.clientId,
                token.accessToken,
                this.getSessionId(tenantId));
        }

        console.log("< getSessionByTenant null");
        return null;
    }

    /**
     * This function is called after `this.getSessions` is called and only when:
     * - `this.getSessions` returns nothing but `createIfNone` was set to `true` in `vscode.authentication.getSessions`
     * - `vscode.authentication.getSessions` was called with `forceNewSession: true`
     * - The end user initiates the "silent" auth flow via the Accounts menu
     */
    async createSession(_scopes: string[]): Promise<AuthenticationSession> {
        console.log("> createSession", _scopes);
        if (_scopes.length !== 1 || isEmpty(_scopes[0])) {
            throw new Error('Scope is required');
        }
        this.ensureInitialized();
        const tenantId = _scopes[0];
        const tenantInfo = await this.tenantService.getTenant(tenantId);

        if (tenantInfo?.authenticationMethod === AuthenticationMethod.accessToken) {
            // Access Token
            const accessToken = await this.askAccessToken() || "";
            if (isEmpty(accessToken)) {
                throw new Error('Access Token is required');
            }
            const jwt = parseJwt(accessToken);
            const token = new TenantToken(accessToken, new Date(jwt.exp * 1000), {} as TenantCredentials);
            this.tenantService.setTenantAccessToken(tenantId, token);
            return new SailPointISCPatSession(
                tenantInfo?.tenantName ?? "",
                jwt.client_id,
                accessToken,
                this.getSessionId(tenantId));

        } else {
            // Prompt for the PAT.
            const clientId = await this.askPATClientId() || "";
            if (isEmpty(clientId)) {
                throw new Error('Client ID is required');
            }

            const clientSecret = await this.askPATClientSecret() || "";
            if (isEmpty(clientSecret)) {
                throw new Error('Client Secret is required');
            }

            const token = await this.createAccessToken(tenantInfo?.tenantName ?? "", clientId, clientSecret);
            this.tenantService.setTenantCredentials(tenantId,
                {
                    clientId: clientId,
                    clientSecret: clientSecret
                });

            return new SailPointISCPatSession(
                tenantInfo?.tenantName ?? "",
                clientId,
                token.accessToken,
                this.getSessionId(tenantId));
        }
    }

    /**
     * Create an access Token and update secret storage
     * @param tenantName 
     * @param clientId 
     * @param clientSecret 
     */
    async createAccessToken(tenantName: string, clientId: string, clientSecret: string): Promise<TenantToken> {
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

    private getSessionId(tenantId: string): string {
        return SailPointISCAuthenticationProvider.id + '_' + tenantId;
    }

    private getTenantNameFromSessionId(sessionId: string) {
        const regexp = new RegExp(SailPointISCAuthenticationProvider.id + '_' + '(.*)');
        return sessionId.replace(regexp, "$1");
    }


    // This function is called when the end user signs out of the account.
    async removeSession(_sessionId: string): Promise<void> {
        console.log("> removeSession for", _sessionId);
        const tenantId = this.getTenantNameFromSessionId(_sessionId);
        // Remove PAT or just AccessToken?
        this.tenantService.removeTenantAccessToken(tenantId);
    }


    private async askPATClientId(): Promise<string | undefined> {
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

    private async askPATClientSecret(): Promise<string | undefined> {
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

    private async askAccessToken(): Promise<string | undefined> {
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
}

