import "./vscodeStub";
import * as assert from "assert";
import { AccessRequestResponse, RequestedItemStatusRequestState } from "sailpoint-api-client";
import { ISCClient } from "../../services/ISCClient";

suite("access request outcome", () => {
	const client = new ISCClient("tenant-id", "acme");

	test("collects unique ids from new and existing requests", () => {
		const response = {
			newRequests: [{ accessRequestIds: ["req-1", "req-2"] }],
			existingRequests: [{ accessRequestIds: ["req-2", ""] }],
		} as AccessRequestResponse;

		assert.deepStrictEqual(client.extractAccessRequestIds(response), ["req-1", "req-2"]);
		assert.deepStrictEqual(client.extractAccessRequestIds({} as AccessRequestResponse), []);
	});

	test("a request is terminal only after completion, cancellation, rejection, or a provisioning error", () => {
		const terminal = [
			RequestedItemStatusRequestState.RequestCompleted,
			RequestedItemStatusRequestState.Cancelled,
			RequestedItemStatusRequestState.Terminated,
			RequestedItemStatusRequestState.Rejected,
			RequestedItemStatusRequestState.ProvisioningFailed,
			RequestedItemStatusRequestState.NotAllItemsProvisioned,
			RequestedItemStatusRequestState.Error,
		];
		for (const state of terminal) {
			assert.strictEqual(client.isAccessRequestTerminal(state), true, state);
		}

		assert.strictEqual(client.isAccessRequestTerminal(RequestedItemStatusRequestState.Executing), false);
		assert.strictEqual(client.isAccessRequestTerminal(RequestedItemStatusRequestState.ProvisioningVerificationPending), false);
		assert.strictEqual(client.isAccessRequestTerminal(undefined), false);
		assert.strictEqual(client.isAccessRequestTerminal(null), false);
	});
});
