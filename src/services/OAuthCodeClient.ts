import axios from "axios";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import * as os from "os";
import { TenantCredentials, TenantToken } from "../models/TenantInfo";
import { parseJwt } from "../utils";

/**
 * Public OAuth client registered for the SailPoint developer tools.
 * A public client holds no secret, so it must use PKCE (RFC 7636).
 */
export const OAUTH_CLIENT_ID = "sailapps";

/**
 * Static page that displays the authorization code for the user to copy.
 * The page never receives a token and never calls an API.
 */
export const OAUTH_REDIRECT_URI = "https://developer.sailpoint.com/sailapps";

const PASTE_CODE_PREFIX = "sp1.";
const PASTE_CODE_VERSION = 1;

/** How long the user has to finish sign-in, in milliseconds. */
export const OAUTH_SESSION_LIFETIME_MS = 10 * 60 * 1000;

const USER_AGENT = `VSCode vscode-sailpoint-identitynow (${os.type()} ${os.arch()} ${os.release()})`;

export interface OAuthCodeSession {
    id: string;
    baseURL: string;
    tokenEndpoint: string;
    state: string;
    codeVerifier: string;
    expiresAt: number;
    authUrl: string;
    confirmationCode: string;
}

export interface OAuthTokenResponse {
    accessToken: string;
    refreshToken: string;
}

interface TokenEndpointBody {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token?: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    refresh_token?: string;
}

/**
 * Parses a URL and rejects it unless it is a plain HTTPS URL.
 * The host is not restricted, because a tenant can use a vanity domain.
 */
export function assertHttpsUrl(rawURL: string, label: string): URL {
    let parsed: URL;
    try {
        parsed = new URL(rawURL.trim());
    } catch {
        throw new Error(`${label} is not a valid URL`);
    }

    if (parsed.protocol !== "https:") {
        throw new Error(`${label} must use HTTPS`);
    }
    if (!parsed.hostname) {
        throw new Error(`${label} has no host`);
    }
    if (parsed.username || parsed.password) {
        throw new Error(`${label} must not include credentials`);
    }
    if (parsed.hash) {
        throw new Error(`${label} must not include a fragment`);
    }

    return parsed;
}

/** Returns the S256 PKCE challenge for a verifier (RFC 7636). */
export function codeChallenge(verifier: string): string {
    return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Short code shown by both this extension and the redirect page.
 * The user compares the two values before pasting the one-time code.
 */
export function confirmationCodeFromState(state: string): string {
    if (!state || state.length < 8) {
        return "";
    }
    return `${state.slice(0, 4)}-${state.slice(4, 8)}`;
}

/**
 * The token endpoint is always the tenant API origin from configuration.
 * A discovery document must not be able to move the authorization code
 * or the PKCE verifier to another host.
 */
export function tokenEndpointFor(baseAPIUrl: string): string {
    const baseParsed = assertHttpsUrl(baseAPIUrl.replace(/\/+$/, ""), "Tenant API URL");
    return `${baseParsed.origin}/oauth/token`;
}

export function buildAuthorizeUrl(authorizeEndpoint: string, state: string, codeVerifier: string): string {
    assertHttpsUrl(authorizeEndpoint, "Authorize endpoint");
    const authURL = new URL(authorizeEndpoint);
    authURL.searchParams.set("client_id", OAUTH_CLIENT_ID);
    authURL.searchParams.set("response_type", "code");
    authURL.searchParams.set("redirect_uri", OAUTH_REDIRECT_URI);
    authURL.searchParams.set("state", state);
    authURL.searchParams.set("code_challenge", codeChallenge(codeVerifier));
    authURL.searchParams.set("code_challenge_method", "S256");
    return authURL.toString();
}

/**
 * Unpacks the value copied from the redirect page and checks that its state
 * matches the state sent in the authorization request.
 */
export function parsePasteCode(pasted: string, expectedState: string): string {
    const trimmed = (pasted || "").trim();
    if (!trimmed) {
        throw new Error("No code was entered");
    }
    if (!trimmed.startsWith(PASTE_CODE_PREFIX)) {
        throw new Error(`The code must start with "${PASTE_CODE_PREFIX}", so it did not come from the SailPoint sign-in page`);
    }

    let payload: { v?: number, code?: string, state?: string };
    try {
        const decoded = Buffer.from(trimmed.slice(PASTE_CODE_PREFIX.length), "base64url").toString("utf8");
        payload = JSON.parse(decoded);
    } catch {
        throw new Error("The code is damaged, so copy it again");
    }

    if (payload.v !== PASTE_CODE_VERSION) {
        throw new Error(`The code uses version ${payload.v}, so update this application`);
    }
    if (!payload.code) {
        throw new Error("The code is missing the authorization code");
    }

    const received = Buffer.from(payload.state || "", "utf8");
    const expected = Buffer.from(expectedState, "utf8");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        throw new Error("The code belongs to a different sign-in attempt, so start again");
    }

    return payload.code;
}

async function discoverAuthorizeEndpoint(baseURL: string): Promise<string> {
    const response = await axios.get(`${baseURL}/oauth/info`, {
        maxRedirects: 0,
        validateStatus: () => true,
        headers: { "User-Agent": USER_AGENT },
    });
    if (response.status !== 200) {
        throw new Error(`Tenant OAuth information returned status ${response.status}`);
    }

    const info = response.data as { authorizeEndpoint?: string };
    if (!info.authorizeEndpoint) {
        throw new Error("Tenant OAuth information is missing the authorize endpoint");
    }

    assertHttpsUrl(info.authorizeEndpoint, "Authorize endpoint");
    return info.authorizeEndpoint;
}

async function requestToken(tokenEndpoint: string, form: URLSearchParams): Promise<OAuthTokenResponse> {
    form.set("client_id", OAUTH_CLIENT_ID);

    const response = await axios.post<TokenEndpointBody>(tokenEndpoint, form.toString(), {
        maxRedirects: 0,
        validateStatus: () => true,
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
    });

    if (response.status !== 200) {
        const body = typeof response.data === "string" ? response.data : JSON.stringify(response.data ?? "");
        throw new Error(`Token request failed with status ${response.status}: ${String(body).trim()}`);
    }

    const tokenData = response.data ?? {};
    if (!tokenData.access_token) {
        throw new Error("No access token in the token response");
    }
    if (!tokenData.refresh_token) {
        throw new Error("No refresh token in the token response");
    }

    return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
    };
}

/**
 * Starts the authorization code flow with PKCE.
 * The browser sends the authorization code to a static SailPoint page,
 * and the user copies it back into the extension.
 */
export async function startOAuthCodeLogin(baseAPIUrl: string): Promise<OAuthCodeSession> {
    const baseParsed = assertHttpsUrl(baseAPIUrl.replace(/\/+$/, ""), "Tenant API URL");
    const baseURL = baseParsed.origin;
    const authorizeEndpoint = await discoverAuthorizeEndpoint(baseURL);

    const codeVerifier = randomBytes(32).toString("base64url");
    const state = randomBytes(32).toString("base64url");

    return {
        id: randomUUID(),
        baseURL,
        tokenEndpoint: `${baseURL}/oauth/token`,
        state,
        codeVerifier,
        expiresAt: Date.now() + OAUTH_SESSION_LIFETIME_MS,
        authUrl: buildAuthorizeUrl(authorizeEndpoint, state, codeVerifier),
        confirmationCode: confirmationCodeFromState(state),
    };
}

/**
 * Exchanges the pasted one-time code for tokens, directly with the tenant.
 */
export async function completeOAuthCodeLogin(session: OAuthCodeSession, pastedCode: string): Promise<OAuthTokenResponse> {
    if (Date.now() >= session.expiresAt) {
        throw new Error("OAuth authentication timed out");
    }

    const authorizationCode = parsePasteCode(pastedCode, session.state);
    const form = new URLSearchParams();
    form.set("grant_type", "authorization_code");
    form.set("code", authorizationCode);
    form.set("redirect_uri", OAUTH_REDIRECT_URI);
    form.set("code_verifier", session.codeVerifier);

    return requestToken(session.tokenEndpoint, form);
}

export async function refreshOAuthCodeToken(baseAPIUrl: string, refreshToken: string): Promise<OAuthTokenResponse> {
    const form = new URLSearchParams();
    form.set("grant_type", "refresh_token");
    form.set("refresh_token", refreshToken);
    return requestToken(tokenEndpointFor(baseAPIUrl), form);
}

export function tenantTokenFromOAuthResponse(response: OAuthTokenResponse): TenantToken {
    const accessClaims = parseJwt(response.accessToken);
    const refreshClaims = parseJwt(response.refreshToken);
    const client: TenantCredentials = {
        clientId: OAUTH_CLIENT_ID,
        clientSecret: "",
    };
    return new TenantToken(
        response.accessToken,
        new Date(accessClaims.exp * 1000),
        client,
        response.refreshToken,
        new Date(refreshClaims.exp * 1000),
    );
}
