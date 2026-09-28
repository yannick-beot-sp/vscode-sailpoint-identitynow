import * as assert from "assert";
import { AccessDurationTimeUnitEnum as AccessDurationTimeUnit, AccessProfileApprovalSchemeApproverTypeEnum as AccessProfileApprovalSchemeApproverType, JsonPatchOperationOpEnum as JsonPatchOperationOp } from "sailpoint-api-client/dist/access_profiles/api.js";
import { RequestedItemStatusRequestState } from "sailpoint-api-client/dist/access_requests/api.js";
import { CompletionStatus, ExecutionStatus, ProvisioningState } from "sailpoint-api-client/dist/account_activities/api.js";
import { DtoType } from "sailpoint-api-client/dist/accounts/api.js";
import { AuthUserCapabilitiesEnum as AuthUserCapabilities } from "sailpoint-api-client/dist/auth_users/api.js";
import { Campaign2StatusEnum } from "sailpoint-api-client/dist/certification_campaigns/api.js";
import { CertificationDecision, ReassignReferenceTypeEnum as ReassignReferenceTypeV3 } from "sailpoint-api-client/dist/certifications/api.js";
import { BackupResponseStatusEnum as BackupResponseStatus } from "sailpoint-api-client/dist/configuration_hub/api.js";
import { DimensionCriteriaKeyType, DimensionCriteriaOperation } from "sailpoint-api-client/dist/dimensions/api.js";
import { ListIdentityAccessItemsV1TypeEnum } from "sailpoint-api-client/dist/identity_history/api.js";
import { ApprovalSchemeForRoleApproverTypeEnum as ApprovalSchemeForRoleApproverType, RoleCriteriaKeyType, RoleCriteriaOperation, RoleMembershipSelectorType } from "sailpoint-api-client/dist/roles/api.js";
import { Index } from "sailpoint-api-client/dist/search/api.js";
import { StatusResponseStatusEnum as StatusResponseStatus, UsageType } from "sailpoint-api-client/dist/sources/api.js";
import { SpConfigJobStatusEnum as SpConfigJobStatus } from "sailpoint-api-client/dist/sp_config/api.js";
import { TaskStatusCompletionStatusEnum as TaskStatusCompletionStatus } from "sailpoint-api-client/dist/task_management/api.js";
import { WorkflowExecutionStatusEnum as WorkflowExecutionStatus } from "sailpoint-api-client/dist/workflows/api.js";

suite("sailpoint-api-client public wire values", () => {
	test("search indexes and identity access item types", () => {
		assert.deepStrictEqual(Index, {
			Accessprofiles: "accessprofiles",
			Accountactivities: "accountactivities",
			Entitlements: "entitlements",
			Events: "events",
			Identities: "identities",
			Roles: "roles",
			Star: "*",
		});
		assert.deepStrictEqual(ListIdentityAccessItemsV1TypeEnum, {
			Account: "account",
			Entitlement: "entitlement",
			App: "app",
			AccessProfile: "accessProfile",
			Role: "role",
		});
	});

	test("access duration, provisioning, and access-request states", () => {
		assert.deepStrictEqual(AccessDurationTimeUnit, {
			Hours: "HOURS",
			Days: "DAYS",
			Weeks: "WEEKS",
			Months: "MONTHS",
		});
		assert.deepStrictEqual(ProvisioningState, {
			Pending: "PENDING",
			Finished: "FINISHED",
			Unverifiable: "UNVERIFIABLE",
			Commited: "COMMITED",
			Failed: "FAILED",
			Retry: "RETRY",
		});
		assert.deepStrictEqual(ExecutionStatus, {
			Executing: "EXECUTING",
			Verifying: "VERIFYING",
			Terminated: "TERMINATED",
			Completed: "COMPLETED",
		});
		assert.deepStrictEqual(CompletionStatus, {
			Success: "SUCCESS",
			Failure: "FAILURE",
			Incomplete: "INCOMPLETE",
			Pending: "PENDING",
		});
		assert.deepStrictEqual(RequestedItemStatusRequestState, {
			Executing: "EXECUTING",
			RequestCompleted: "REQUEST_COMPLETED",
			Cancelled: "CANCELLED",
			Terminated: "TERMINATED",
			ProvisioningVerificationPending: "PROVISIONING_VERIFICATION_PENDING",
			Rejected: "REJECTED",
			ProvisioningFailed: "PROVISIONING_FAILED",
			NotAllItemsProvisioned: "NOT_ALL_ITEMS_PROVISIONED",
			Error: "ERROR",
		});
	});

	test("role and dimension membership criteria", () => {
		assert.deepStrictEqual(RoleCriteriaKeyType, {
			Identity: "IDENTITY",
			Account: "ACCOUNT",
			Entitlement: "ENTITLEMENT",
		});
		assert.deepStrictEqual(RoleCriteriaOperation, {
			Equals: "EQUALS",
			NotEquals: "NOT_EQUALS",
			Contains: "CONTAINS",
			DoesNotContain: "DOES_NOT_CONTAIN",
			StartsWith: "STARTS_WITH",
			EndsWith: "ENDS_WITH",
			GreaterThan: "GREATER_THAN",
			LessThan: "LESS_THAN",
			GreaterThanEquals: "GREATER_THAN_EQUALS",
			LessThanEquals: "LESS_THAN_EQUALS",
			And: "AND",
			Or: "OR",
		});
		assert.deepStrictEqual(RoleMembershipSelectorType, {
			Standard: "STANDARD",
			IdentityList: "IDENTITY_LIST",
		});
		assert.deepStrictEqual(DimensionCriteriaKeyType, {
			Identity: "IDENTITY",
		});
		assert.deepStrictEqual(DimensionCriteriaOperation, {
			Equals: "EQUALS",
			And: "AND",
			Or: "OR",
		});
	});

	test("approval schemes, user levels, and JSON patch operations", () => {
		assert.deepStrictEqual(AccessProfileApprovalSchemeApproverType, {
			AppOwner: "APP_OWNER",
			Owner: "OWNER",
			SourceOwner: "SOURCE_OWNER",
			Manager: "MANAGER",
			GovernanceGroup: "GOVERNANCE_GROUP",
			Workflow: "WORKFLOW",
			AllOwners: "ALL_OWNERS",
			AdditionalOwner: "ADDITIONAL_OWNER",
			AdditionalGovernanceGroup: "ADDITIONAL_GOVERNANCE_GROUP",
		});
		assert.deepStrictEqual(ApprovalSchemeForRoleApproverType, {
			Owner: "OWNER",
			Manager: "MANAGER",
			GovernanceGroup: "GOVERNANCE_GROUP",
			Workflow: "WORKFLOW",
			AllOwners: "ALL_OWNERS",
			AdditionalOwner: "ADDITIONAL_OWNER",
			AdditionalGovernanceGroup: "ADDITIONAL_GOVERNANCE_GROUP",
		});
		assert.deepStrictEqual(AuthUserCapabilities, {
			CertAdmin: "CERT_ADMIN",
			CloudGovAdmin: "CLOUD_GOV_ADMIN",
			CloudGovUser: "CLOUD_GOV_USER",
			Helpdesk: "HELPDESK",
			OrgAdmin: "ORG_ADMIN",
			ReportAdmin: "REPORT_ADMIN",
			RoleAdmin: "ROLE_ADMIN",
			RoleSubadmin: "ROLE_SUBADMIN",
			SaasManagementAdmin: "SAAS_MANAGEMENT_ADMIN",
			SaasManagementReader: "SAAS_MANAGEMENT_READER",
			SourceAdmin: "SOURCE_ADMIN",
			SourceSubadmin: "SOURCE_SUBADMIN",
			DasUiAdministrator: "das:ui-administrator",
			DasUiComplianceManager: "das:ui-compliance_manager",
			DasUiAuditor: "das:ui-auditor",
			DasUiDataScope: "das:ui-data-scope",
			SpAicDashboardRead: "sp:aic-dashboard-read",
			SpAicDashboardWrite: "sp:aic-dashboard-write",
			SpUiConfigHubAdmin: "sp:ui-config-hub-admin",
			SpUiConfigHubBackupAdmin: "sp:ui-config-hub-backup-admin",
			SpUiConfigHubRead: "sp:ui-config-hub-read",
			Internal: "INTERNAL",
			PolicyAdmin: "POLICY_ADMIN"
		});
		assert.deepStrictEqual(JsonPatchOperationOp, {
			Add: "add",
			Remove: "remove",
			Replace: "replace",
			Move: "move",
			Copy: "copy",
			Test: "test",
		});
	});

	test("job, campaign, workflow, and certification status values", () => {
		assert.deepStrictEqual(Campaign2StatusEnum, {
			Pending: "PENDING",
			Staged: "STAGED",
			Canceling: "CANCELING",
			Activating: "ACTIVATING",
			Active: "ACTIVE",
			Completing: "COMPLETING",
			Completed: "COMPLETED",
			Error: "ERROR",
			Archived: "ARCHIVED",
		});
		assert.deepStrictEqual(TaskStatusCompletionStatus, {
			Success: "SUCCESS",
			Warning: "WARNING",
			Error: "ERROR",
			Terminated: "TERMINATED",
			Temperror: "TEMPERROR",
		});
		assert.deepStrictEqual(StatusResponseStatus, {
			Success: "SUCCESS",
			Failure: "FAILURE",
		});
		assert.deepStrictEqual(SpConfigJobStatus, {
			NotStarted: "NOT_STARTED",
			InProgress: "IN_PROGRESS",
			Complete: "COMPLETE",
			Cancelled: "CANCELLED",
			Failed: "FAILED",
		});
		assert.deepStrictEqual(BackupResponseStatus, {
			NotStarted: "NOT_STARTED",
			InProgress: "IN_PROGRESS",
			Complete: "COMPLETE",
			Cancelled: "CANCELLED",
			Failed: "FAILED",
		});
		assert.deepStrictEqual(WorkflowExecutionStatus, {
			Completed: "Completed",
			Failed: "Failed",
			Canceled: "Canceled",
			Running: "Running",
			Queued: "Queued",
		});
		assert.deepStrictEqual(CertificationDecision, {
			Approve: "APPROVE",
			Revoke: "REVOKE",
		});
		assert.deepStrictEqual(ReassignReferenceTypeV3, {
			TargetSummary: "TARGET_SUMMARY",
			Item: "ITEM",
			IdentitySummary: "IDENTITY_SUMMARY",
		});
		assert.deepStrictEqual(DtoType.Identity, "IDENTITY");
		assert.deepStrictEqual(DtoType.GovernanceGroup, "GOVERNANCE_GROUP");
		assert.deepStrictEqual(UsageType.Create, "CREATE");
		assert.strictEqual(UsageType.ChangePassword, "CHANGE_PASSWORD");
	});
});
