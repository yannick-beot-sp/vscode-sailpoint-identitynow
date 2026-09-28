import * as assert from "assert";
import { Configuration } from "sailpoint-api-client/dist/index.js";

suite("sailpoint-api-client Configuration", () => {
	test("maps the tenant base URL and keeps a provided access token", () => {
		const config = new Configuration({
			baseurl: "https://acme.api.identitynow.com",
			tokenUrl: "https://acme.api.identitynow.com/oauth/token",
			accessToken: "pat-token",
		});

		assert.strictEqual(config.basePath, "https://acme.api.identitynow.com");
		assert.strictEqual(config.tokenUrl, "https://acme.api.identitynow.com/oauth/token");
		assert.strictEqual(config.accessToken, "pat-token");
	});

	test("accepts the experimental flag used for beta endpoints", () => {
		const config = new Configuration({
			baseurl: "https://acme.api.identitynow-demo.com",
			tokenUrl: "https://acme.api.identitynow-demo.com/oauth/token",
			accessToken: "pat-token",
		});

		assert.ok(!config.experimental);
		config.experimental = true;
		assert.strictEqual(config.experimental, true);
	});
});
