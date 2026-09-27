import "./vscodeStub";
import * as assert from "assert";
import { Account, AccountActivity, CompletionStatus, ExecutionStatus, ProvisioningState } from "sailpoint-api-client";
import { isAccountRemovable } from "../../commands/account/accountUtils";
import { isAccountActivityInProgress } from "../../commands/identity/identityUtils";

function activity(partial: Partial<AccountActivity>): AccountActivity {
	return partial as AccountActivity;
}

function account(partial: Partial<Account>): Account {
	return partial as Account;
}

suite("account activity and removable accounts", () => {
	test("an account is removable unless it is authoritative or a system account", () => {
		assert.strictEqual(isAccountRemovable(account({ id: "1" })), true);
		assert.strictEqual(isAccountRemovable(account({ id: "1", authoritative: false, systemAccount: false })), true);
		assert.strictEqual(isAccountRemovable(account({ id: "1", authoritative: true })), false);
		assert.strictEqual(isAccountRemovable(account({ id: "1", systemAccount: true })), false);
	});

	test("treats a finished execution, completion, or fully provisioned activity as done", () => {
		assert.strictEqual(isAccountActivityInProgress(activity({
			executionStatus: ExecutionStatus.Completed,
			completionStatus: CompletionStatus.Pending,
		})), false);
		assert.strictEqual(isAccountActivityInProgress(activity({
			executionStatus: ExecutionStatus.Terminated,
		})), false);
		assert.strictEqual(isAccountActivityInProgress(activity({ completed: "2026-01-01T00:00:00.000Z" })), false);
		assert.strictEqual(isAccountActivityInProgress(activity({
			completionStatus: CompletionStatus.Failure,
		})), false);
		assert.strictEqual(isAccountActivityInProgress(activity({
			items: [
				{ provisioningStatus: ProvisioningState.Finished },
				{ provisioningStatus: ProvisioningState.Commited },
				{ provisioningStatus: ProvisioningState.Failed },
				{ provisioningStatus: ProvisioningState.Unverifiable },
			],
		})), false);
	});

	test("keeps a pending activity in progress while an item can still be retried", () => {
		assert.strictEqual(isAccountActivityInProgress(activity({
			executionStatus: ExecutionStatus.Executing,
			completionStatus: CompletionStatus.Pending,
			items: [{ provisioningStatus: ProvisioningState.Retry }],
		})), true);
		assert.strictEqual(isAccountActivityInProgress(activity({
			completionStatus: null,
			items: [],
		})), true);
		assert.strictEqual(isAccountActivityInProgress(activity({})), true);
	});
});
