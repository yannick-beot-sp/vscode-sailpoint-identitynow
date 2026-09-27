import * as assert from "assert";
import { AccessDurationV2025TimeUnitV2025, AccessProfileApprovalSchemeV2025ApproverTypeV2025, ApprovalSchemeForRoleV2025ApproverTypeV2025, AuthUserV2025CapabilitiesV2025, BackupResponseV2024StatusV2024, CampaignStatusV3, CertificationDecisionV2025, CompletionStatus, DimensionCriteriaKeyTypeV2025, DimensionCriteriaOperationV2025, DtoType, ExecutionStatus, IndexV2025, JsonPatchOperationV2025OpV2025, ListIdentityAccessItemsTypeV2025, ProvisioningState, ReassignReferenceTypeV3, RequestedItemStatusRequestState, RoleCriteriaKeyType, RoleCriteriaOperation, RoleMembershipSelectorType, SpConfigJobBetaStatusBeta, StatusResponseBetaStatusBeta, TaskStatusBetaCompletionStatusBeta, UsageTypeBeta, WorkflowExecutionV2025StatusV2025 } from "sailpoint-api-client";

suite("sailpoint-api-client public wire values", () => {
	test("search indexes and identity access item types", () => {
		assert.deepStrictEqual(IndexV2025, {
			Accessprofiles: "accessprofiles",
			Accountactivities: "accountactivities",
			Entitlements: "entitlements",
			Events: "events",
			Identities: "identities",
			Roles: "roles",
			Star: "*",
		});
		assert.deepStrictEqual(ListIdentityAccessItemsTypeV2025, {
			Account: "account",
			Entitlement: "entitlement",
			App: "app",
			AccessProfile: "accessProfile",
			Role: "role",
		});
	});

	test("access duration, provisioning, and access-request states", () => {
		assert.deepStrictEqual(AccessDurationV2025TimeUnitV2025, {
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
		assert.deepStrictEqual(DimensionCriteriaKeyTypeV2025, {
			Identity: "IDENTITY",
		});
		assert.deepStrictEqual(DimensionCriteriaOperationV2025, {
			Equals: "EQUALS",
			And: "AND",
			Or: "OR",
		});
	});

	test("approval schemes, user levels, and JSON patch operations", () => {
		assert.deepStrictEqual(AccessProfileApprovalSchemeV2025ApproverTypeV2025, {
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
		assert.deepStrictEqual(ApprovalSchemeForRoleV2025ApproverTypeV2025, {
			Owner: "OWNER",
			Manager: "MANAGER",
			GovernanceGroup: "GOVERNANCE_GROUP",
			Workflow: "WORKFLOW",
			AllOwners: "ALL_OWNERS",
			AdditionalOwner: "ADDITIONAL_OWNER",
			AdditionalGovernanceGroup: "ADDITIONAL_GOVERNANCE_GROUP",
		});
		assert.deepStrictEqual(AuthUserV2025CapabilitiesV2025, {
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
		});
		assert.deepStrictEqual(JsonPatchOperationV2025OpV2025, {
			Add: "add",
			Remove: "remove",
			Replace: "replace",
			Move: "move",
			Copy: "copy",
			Test: "test",
		});
	});

	test("job, campaign, workflow, and certification status values", () => {
		assert.deepStrictEqual(CampaignStatusV3, {
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
		assert.deepStrictEqual(TaskStatusBetaCompletionStatusBeta, {
			Success: "SUCCESS",
			Warning: "WARNING",
			Error: "ERROR",
			Terminated: "TERMINATED",
			Temperror: "TEMPERROR",
		});
		assert.deepStrictEqual(StatusResponseBetaStatusBeta, {
			Success: "SUCCESS",
			Failure: "FAILURE",
		});
		assert.deepStrictEqual(SpConfigJobBetaStatusBeta, {
			NotStarted: "NOT_STARTED",
			InProgress: "IN_PROGRESS",
			Complete: "COMPLETE",
			Cancelled: "CANCELLED",
			Failed: "FAILED",
		});
		assert.deepStrictEqual(BackupResponseV2024StatusV2024, {
			NotStarted: "NOT_STARTED",
			InProgress: "IN_PROGRESS",
			Complete: "COMPLETE",
			Cancelled: "CANCELLED",
			Failed: "FAILED",
		});
		assert.deepStrictEqual(WorkflowExecutionV2025StatusV2025, {
			Completed: "Completed",
			Failed: "Failed",
			Canceled: "Canceled",
			Running: "Running",
			Queued: "Queued",
		});
		assert.deepStrictEqual(CertificationDecisionV2025, {
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
		assert.deepStrictEqual(UsageTypeBeta.Create, "CREATE");
		assert.strictEqual(UsageTypeBeta.ChangePassword, "CHANGE_PASSWORD");
	});
});
