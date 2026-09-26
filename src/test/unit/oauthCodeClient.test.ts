import * as assert from "assert";

import {
	OAUTH_CLIENT_ID,
	OAUTH_REDIRECT_URI,
	assertHttpsUrl,
	buildAuthorizeUrl,
	codeChallenge,
	confirmationCodeFromState,
	parsePasteCode,
	tokenEndpointFor,
} from "../../services/OAuthCodeClient";

function encodePasteCode(code: string, state: string, version = 1): string {
	const payload = JSON.stringify({ v: version, code, state });
	return `sp1.${Buffer.from(payload, "utf8").toString("base64url")}`;
}

suite("OAuth code client", () => {
	test("builds an S256 authorize URL for the public SailPoint client", () => {
		const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
		const url = new URL(buildAuthorizeUrl(
			"https://tenant.login.sailpoint.com/oauth/authorize",
			"state-value-1234",
			verifier,
		));

		assert.strictEqual(codeChallenge(verifier), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
		assert.strictEqual(url.searchParams.get("client_id"), OAUTH_CLIENT_ID);
		assert.strictEqual(url.searchParams.get("response_type"), "code");
		assert.strictEqual(url.searchParams.get("redirect_uri"), OAUTH_REDIRECT_URI);
		assert.strictEqual(url.searchParams.get("state"), "state-value-1234");
		assert.strictEqual(url.searchParams.get("code_challenge"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
		assert.strictEqual(url.searchParams.get("code_challenge_method"), "S256");
	});

	test("keeps the token endpoint on the configured tenant origin", () => {
		assert.strictEqual(
			tokenEndpointFor("https://acme.api.identitynow.com"),
			"https://acme.api.identitynow.com/oauth/token",
		);
		assert.strictEqual(
			tokenEndpointFor("https://acme.api.identitynow.com/v3/"),
			"https://acme.api.identitynow.com/oauth/token",
		);
	});

	test("rejects authorize and tenant URLs that are not plain HTTPS", () => {
		assert.throws(() => assertHttpsUrl("http://acme.api.identitynow.com", "Tenant API URL"), /HTTPS/);
		assert.throws(() => assertHttpsUrl("https://user:secret@acme.api.identitynow.com", "Tenant API URL"), /credentials/);
		assert.throws(() => buildAuthorizeUrl("https://tenant.example/oauth/authorize#frag", "state-value", "verifier"), /fragment/);
	});

	test("formats the confirmation code from the first eight characters of state", () => {
		assert.strictEqual(confirmationCodeFromState("abcdefghijklmnop"), "abcd-efgh");
		assert.strictEqual(confirmationCodeFromState("short"), "");
	});

	test("reads an authorization code only when the pasted state matches", () => {
		const state = "expected-state-value";
		const pasted = encodePasteCode("auth-code", state);

		assert.strictEqual(parsePasteCode(`  ${pasted}  `, state), "auth-code");
		assert.throws(() => parsePasteCode(encodePasteCode("auth-code", "other-state"), state), /different sign-in/);
		assert.throws(() => parsePasteCode("not-a-sailpoint-code", state), /sp1\./);
		assert.throws(() => parsePasteCode(encodePasteCode("auth-code", state, 2), state), /version 2/);
		assert.throws(() => parsePasteCode("sp1.%%%", state), /damaged/);
	});
});
