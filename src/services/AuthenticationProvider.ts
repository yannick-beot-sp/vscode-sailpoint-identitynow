import ClientOAuth2 = require('client-oauth2');
import { cpuUsage } from 'process';
import {
    authentication,
    AuthenticationProvider,
    AuthenticationProviderAuthenticationSessionsChangeEvent,
    AuthenticationSession,
    AuthenticationSessionAccountInformation,
    Disposable,
    Event,
    EventEmitter,
    SecretStorage,
    window,
} from 'vscode';
import { TenantCredentials } from '../models/TenantInfo';
import { EndpointUtil, isEmpty } from '../utils';
import { TenantService } from './TenantService';

class SailPointIdentityNowPatSession implements AuthenticationSession {
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
        // this.id = SailPointIdentityNowAuthenticationProvider.id + '-' + tenantName;
    }
}

export class SailPointIdentityNowAuthenticationProvider implements AuthenticationProvider, Disposable {
    private static SECRET_PAT_PREFIX = "IDENTITYNOW_SECRET_PAT_";
    private static SECRET_AT_PREFIX = "IDENTITYNOW_SECRET_AT_";
    static id = 'SailPointIdentityNowPAT';


    // this property is used to determine if the token has been changed in another window of VS Code.
    // It is used in the checkForUpdates function.
    private currentToken: Promise<string | undefined> | undefined;
    private initializedDisposable: Disposable | undefined;

    private _onDidChangeSessions = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
    get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
        return this._onDidChangeSessions.event;
    }

    constructor(private readonly secretStorage: SecretStorage,
        private readonly tenantService: TenantService) { }

    dispose(): void {
        this.initializedDisposable?.dispose();
    }

    private ensureInitialized(): void {
        if (this.initializedDisposable === undefined) {
            //void this.cacheTokenFromStorage();

            this.initializedDisposable = Disposable.from(
                // This onDidChange event happens when the secret storage changes in _any window_ since
                // secrets are shared across all open windows.
                this.secretStorage.onDidChange(e => {
                    if (e.key.startsWith(SailPointIdentityNowAuthenticationProvider.SECRET_AT_PREFIX)
                        || e.key.startsWith(SailPointIdentityNowAuthenticationProvider.SECRET_PAT_PREFIX)) {
                        void this.checkForUpdates();
                    }
                }),
                // This fires when the user initiates a "silent" auth flow via the Accounts menu.
                authentication.onDidChangeSessions(e => {
                    if (e.provider.id === SailPointIdentityNowAuthenticationProvider.id) {
                        void this.checkForUpdates();
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
    }


    private getTenants(): string[] {
        return this.tenantService.getTenants();
    }

    /**
     * This function is called first when `vscode.authentication.getSessions` is called.
     */
    async getSessions(_scopes?: string[]): Promise<readonly AuthenticationSession[]> {
        console.log("> getSessions", _scopes);
        this.ensureInitialized();
        const result: SailPointIdentityNowPatSession[] = [];
        if (_scopes === undefined || _scopes.length === 0) {
            // return all scopes
            _scopes = this.getTenants();
        }
        for (let index = 0; index < _scopes.length; index++) {
            const tenantName = _scopes[index];
            const session = await this.getSessionByTenant(tenantName);
            if (session !== null) {
                result.push(session);
            }
        }
        return result;
    }

    async getSessionByTenant(tenantName: string): Promise<SailPointIdentityNowPatSession | null> {
        const credentialsStr = await this.secretStorage.get(this.getPatKey(tenantName));
        if (credentialsStr !== undefined) {

            const credentials = JSON.parse(credentialsStr) as TenantCredentials;
            const accessToken = await this.secretStorage.get(this.getAccessTokenKey(tenantName));
            if (!isEmpty(accessToken)) {
                return new Promise((resolve) => new SailPointIdentityNowPatSession(tenantName,
                    credentials.clientId,
                    accessToken as string,
                    this.getSessionId(tenantName)
                ));
            } else {
                console.log("WARNING: no accessToken for tenant ", tenantName);
            }
        } else {
            console.log("WARNING: no credentials for tenant ", tenantName);
        }
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
        if (_scopes.length !== 1) {
            throw new Error('Scope is required');
        }
        const tenantName = _scopes[0];

        this.ensureInitialized();

        // Prompt for the PAT.
        const clientId = await this.askPATClientId();
        if (isEmpty(clientId)) {
            throw new Error('Client ID is required');
        }

        const clientSecret = await this.askPATClientSecret();
        if (isEmpty(clientSecret)) {
            throw new Error('Client Secret is required');
        }

        const idnAuth = new ClientOAuth2({
            clientId: clientId,
            clientSecret: clientSecret,
            accessTokenUri: EndpointUtil.getAccessTokenUrl(tenantName)
        });
        const resp = await idnAuth.credentials.getToken();
        console.log('Successfully logged in to IdentityNow');

        // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
        await this.secretStorage.store(this.getPatKey(tenantName), JSON.stringify({
            clientId: clientId,
            clientSecret: clientSecret
        }));

        await this.secretStorage.store(this.getAccessTokenKey(tenantName), resp.accessToken);

        return new SailPointIdentityNowPatSession(tenantName, clientId as string, resp.accessToken, this.getSessionId(tenantName));
    }

    /**
     * Returns the key for the ClientID/ClientSecret (PAT )
     * @param tenantName 
     * @returns The key
     */
    private getPatKey(tenantName: string): string {
        return SailPointIdentityNowAuthenticationProvider.SECRET_PAT_PREFIX
            + tenantName;
    }

    private getAccessTokenKey(tenantName: string): string {
        return SailPointIdentityNowAuthenticationProvider.SECRET_AT_PREFIX
            + tenantName;
    }

    private getSessionId(tenantName: string): string {
        return SailPointIdentityNowAuthenticationProvider.id + '_' + tenantName;
    }

    private getTenantNameFromSessionId(sessionId: string) {
        const regexp = new RegExp(SailPointIdentityNowAuthenticationProvider.id + '_' + '(.*)');
        return sessionId.replace(regexp, "$1");
    }


    // This function is called when the end user signs out of the account.
    async removeSession(_sessionId: string): Promise<void> {
        console.log(">removeSession for", _sessionId);
        const tenantName = this.getTenantNameFromSessionId(_sessionId);
        // Remove PAT or just AccessToken?
        await this.secretStorage.delete(this.getAccessTokenKey(tenantName));
    }

    private async askPATClientId(): Promise<string | undefined> {
        const result = await window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: '806c451e057b442ba67b5d459716e97a',
            prompt: 'Enter a Personal Access Token (PAT) Client ID.',
            title: 'IdentityNow',
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
            title: 'IdentityNow',
            validateInput: text => {
                const regex = new RegExp('^[a-f0-9]{64}$');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid secret";
            }
        });
        return result;
    }
}
