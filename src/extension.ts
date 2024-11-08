import * as vscode from 'vscode';
import * as commands from './commands/constants';
import { AccessProfileImporterExplorerCommand } from './commands/access-profile/AccessProfileImporterExplorerCommand';
import { AccessProfileImporterTreeViewCommand } from './commands/access-profile/AccessProfileImporterTreeViewCommand';
import { AccessProfileExporterCommand } from './commands/access-profile/ExportAccessProfiles';
import { NewAccessProfileCommand } from './commands/access-profile/NewAccessProfileCommand';
import { AddTenantCommand } from './commands/addTenant';
import { ConnectorRuleCommand } from './commands/rule/connectorRuleCommand';
import { DeleteResourceCommand } from './commands/deleteResourceCommand';
import { AccountExporterCommand, UncorrelatedAccountExporterCommand } from './commands/source/exportAccounts';
import { EntitlementExporterCommand as EntitlementDetailsExporterCommand } from './commands/source/exportEntitlementDetails';
import { ExportScriptFromRuleCommand } from './commands/rule/exportScriptFromRuleCommand';
import { AccessProfileFilterCommand, RoleFilterCommand, IdentityDefinitionFilterCommand } from './commands/filterCommand';
import { AccountImportNodeCommand } from './commands/source/importAccount';
import { EntitlementDetailsImportNodeCommand } from './commands/source/importEntitlementDetails';
import { UncorrelatedAccountImportNodeCommand } from './commands/source/importUncorrelatedAccount';
import { NewProvisioningPolicyCommand } from './commands/newProvisioningPolicy';
import { NewSchemaCommand } from './commands/newSchemaCommand';
import { NewTransformCommand } from './commands/newTransformCommand';
import { OpenResourceCommand } from './commands/openResource';
import { refreshIdentityProfile } from './commands/refreshIdentityProfile';
import { RenameTenantCommand } from './commands/renameTenant';
import { RoleExporterCommand } from './commands/role/ExportRoles';
import { NewRoleCommand } from './commands/role/NewRoleCommand';
import { RoleImporterExplorerCommand } from './commands/role/RoleImporterExplorerCommand';
import { RoleImporterTreeViewCommand } from './commands/role/RoleImporterTreeViewCommand';
import { SortIdentityProfileCommand } from './commands/sortIdentityProfile';
import { ExportConfigNodeTreeViewCommand } from './commands/spconfig-export/ExportConfigNodeTreeViewCommand';
import { ExportConfigPaletteCommand } from './commands/spconfig-export/ExportConfigPaletteCommand';
import { ExportConfigTreeViewCommand } from './commands/spconfig-export/ExportConfigTreeViewCommand';
import { ImportConfigExplorerCommand } from './commands/spconfig-import/ImportConfigExplorerCommand';
import { ImportConfigPaletteCommand } from './commands/spconfig-import/ImportConfigPaletteCommand';
import { ImportConfigTreeViewCommand } from './commands/spconfig-import/ImportConfigTreeViewCommand';
import { viewWorkflowExecutionHistory } from './commands/workflow/viewWorkflowExecutionHistory';
import { UpdateWorkflowStatusCommand } from './commands/workflow/updateWorkflowStatusCommand';
import { URL_PREFIX } from './constants';
import { FileHandler } from './files/FileHandler';
import { ISCResourceProvider } from './files/ISCResourceProvider';
import { LoadMoreNode } from './models/ISCTreeItem';
import { SailPointISCAuthenticationProvider } from './services/AuthenticationProvider';
import { TenantService } from './services/TenantService';
import { TransformEvaluator } from './services/TransformEvaluator';
import { TreeManager } from './services/TreeManager';
import { ISCUriHandler } from './ISCUriHandler';
import { ISCDataProvider } from './views/ISCDataProvider';
import { TestConnectionCommand } from './commands/source/TestConnectionCommand';
import { PeekSourceCommand } from './commands/source/PeekSourceCommand';
import { PingClusterCommand } from './commands/source/PingClusterCommand';
import { CloneSourceCommand } from './commands/source/CloneSourceCommand';
import { FormDefinitionExportCommand } from './commands/form/FormDefinitionExportCommand';
import { FormDefinitionImporterTreeViewCommand } from './commands/form/FormDefinitionImporterTreeViewCommand';
import { WorkflowExportCommand } from './commands/workflow/WorkflowExportCommand';
import { WorkflowImporterTreeViewCommand } from './commands/workflow/WorkflowImporterTreeViewCommand';
import { EditPublicIdentitiesConfigCommand } from './commands/tenant/editPublicIdentitiesConfigCommand';
import { EditAccessRequestConfigCommand } from './commands/tenant/editAccessRequestConfigCommand';
import { NewAttributeSearchConfigCommand } from './commands/NewAttributeSearchConfigCommand';
import { EditPasswordConfigCommand } from './commands/tenant/editPasswordConfigCommand';
import { GenerateDigitTokenCommand } from './commands/tenant/generateDigitTokenCommand';
import { onErrorResponse, onRequest, onResponse } from './services/AxiosHandlers';
import globalAxios from 'axios';
import { OpenScriptCommand } from './commands/rule/openScriptCommand';
import { IdentityTreeViewCommand } from './commands/identity/IdentityTreeViewCommand';
import { TenantReadOnlyConfigCommand } from './commands/tenant/tenantReadOnlyConfigCommand';
import { NewIdentityAttributeCommand } from './commands/newIdentityAttributeCommand';
import { EnableLoggingCommand } from './commands/source/enableLoggingCommand';
import { ApplicationSourceFilterCommand } from './commands/applications/applicationSourceFilterCommand';
import { ApplicationNameFilterCommand } from './commands/applications/applicationNameFilterCommand';
import { RemoveAccessProfileFromAppCommand } from './commands/applications/removeAccessProfileFromAppCommand';
import { AddAccessProfileToApplication } from './commands/applications/addAccessProfileToApplication';
import { NewApplicationCommand } from './commands/applications/newApplicationCommand';
import { CampaignPanel } from './campaign-webview/CampaignPanel';
import { OpenCampaignPanelCommand } from './campaign-webview/openCampaignPanelCommand';
import { ConfigureReminderWorkflowCommand } from './campaign-webview/configureReminderWorkflow';
import { ExportCampaignReportCommand } from './campaign-webview/exportCampaignReportCommand';
import { SendReminderCommand } from './campaign-webview/sendReminderCommand';
import { EscalateCertificationCommand } from './campaign-webview/escalateCertificationCommand';
import { CampaignConfigurationService } from './services/CampaignConfigurationService';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-sailpoint-identitynow" is now active!');

	// Add global interceptor for axios, to applied with the sailpoint SDK
	// Add a request interceptor
	globalAxios.interceptors.request.use(onRequest)

	// Add a response interceptor
	globalAxios.interceptors.response.use(
		onResponse,
		onErrorResponse)


	const tenantService = new TenantService(context.globalState, context.secrets);

	SailPointISCAuthenticationProvider.initialize(tenantService)

	const addTenantCommand = new AddTenantCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ADD_TENANT, addTenantCommand.execute,
			addTenantCommand));
	const renameTenantCommand = new RenameTenantCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RENAME_TENANT, renameTenantCommand.execute,
			renameTenantCommand));

	const editPublicIdentitiesConfigCommand = new EditPublicIdentitiesConfigCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EDIT_PUBLIC_IDENTITIES_CONFIG,
			editPublicIdentitiesConfigCommand.execute,
			editPublicIdentitiesConfigCommand));

	const editAccessRequestConfigCommand = new EditAccessRequestConfigCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EDIT_ACCESS_REQUEST_CONFIG,
			editAccessRequestConfigCommand.execute,
			editAccessRequestConfigCommand));

	const editPasswordConfigCommand = new EditPasswordConfigCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EDIT_PASSWORD_ORG_CONFIG,
			editPasswordConfigCommand.execute,
			editPasswordConfigCommand));

	const generateDigitTokenCommand = new GenerateDigitTokenCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.GENERATE_DIGIT_TOKEN,
			generateDigitTokenCommand.execute,
			generateDigitTokenCommand));

	const identityNowDataProvider = new ISCDataProvider(context, tenantService);
	vscode.window.registerTreeDataProvider(commands.TREE_VIEW, identityNowDataProvider);

	vscode.commands.registerCommand(commands.REFRESH_FORCED, identityNowDataProvider.forceRefresh, identityNowDataProvider);
	vscode.commands.registerCommand(commands.REFRESH, identityNowDataProvider.refresh, identityNowDataProvider);

	const transformEvaluator = new TransformEvaluator(tenantService);
	const treeManager = new TreeManager(tenantService, transformEvaluator);

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EVALUATE_TRANSFORM_EDITOR, transformEvaluator.evaluate, transformEvaluator));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REMOVE_TENANT,
			(tenantTreeItem) => treeManager.removeTenant(tenantTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.AGGREGATE,
			(sourceTreeItem) => treeManager.aggregateSource(sourceTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.AGGREGATE_DISABLE_OPTIMIZATION,
			(sourceTreeItem) => treeManager.aggregateSource(sourceTreeItem, true)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.AGGREGATE_ENTITLEMENTS,
			(sourceTreeItem) => treeManager.aggregateEntitlements(sourceTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RESET_SOURCE,
			(sourceTreeItem) => treeManager.resetSource(sourceTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RESET_SOURCE_ACCOUNTS,
			(sourceTreeItem) => treeManager.resetAccounts(sourceTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RESET_SOURCE_ENTITLEMENTS,
			(tenantTreeItem) => treeManager.resetEntitlements(tenantTreeItem)));
	const testConnectionCommand = new TestConnectionCommand(tenantService);

	const tenantReadOnlyConfigCommand = new TenantReadOnlyConfigCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.TENANT_SET_READONLY,
			tenantReadOnlyConfigCommand.setReadOnly, tenantReadOnlyConfigCommand))
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.TENANT_SET_WRITABLE,
			tenantReadOnlyConfigCommand.setWritable, tenantReadOnlyConfigCommand))

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.TEST_SOURCE,
			testConnectionCommand.execute, testConnectionCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.TEST_SOURCE_PALETTE,
			testConnectionCommand.execute, testConnectionCommand));
	const peekConnectionCommand = new PeekSourceCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.PEEK_SOURCE,
			peekConnectionCommand.execute, peekConnectionCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.PEEK_SOURCE_PALETTE,
			peekConnectionCommand.execute, peekConnectionCommand));
	const pingClusterCommand = new PingClusterCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.PING_SOURCE,
			pingClusterCommand.execute, pingClusterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.PING_SOURCE_PALETTE,
			pingClusterCommand.execute, pingClusterCommand));

	const cloneSourceCommand = new CloneSourceCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.CLONE_SOURCE,
			cloneSourceCommand.execute, cloneSourceCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.CLONE_SOURCE_PALETTE,
			cloneSourceCommand.execute, cloneSourceCommand));

	const enableLoggingCommand = new EnableLoggingCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ENABLE_LOGGING,
			enableLoggingCommand.execute, enableLoggingCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ENABLE_LOGGING_PALETTE,
			enableLoggingCommand.execute, enableLoggingCommand));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EVALUATE_TRANSFORM,
			(tenantTreeItem) => treeManager.evaluateTransform(tenantTreeItem)));

	const accountImportNodeCommand = new AccountImportNodeCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ACCOUNTS_VIEW,
			accountImportNodeCommand.execute, accountImportNodeCommand));

	const uncorrelatedAccountImportNodeCommand = new UncorrelatedAccountImportNodeCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_UNCORRELATED_ACCOUNTS_VIEW,
			uncorrelatedAccountImportNodeCommand.execute, uncorrelatedAccountImportNodeCommand));
	const entitlementDetailsImportNodeCommand = new EntitlementDetailsImportNodeCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ENTITLEMENT_DETAILS_VIEW,
			entitlementDetailsImportNodeCommand.execute, entitlementDetailsImportNodeCommand));

	const accountExporterCommand = new AccountExporterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_ACCOUNTS_VIEW,
			accountExporterCommand.execute, accountExporterCommand));
	const uncorrelatedAccountExporterCommand = new UncorrelatedAccountExporterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_UNCORRELATED_ACCOUNTS_VIEW,
			uncorrelatedAccountExporterCommand.execute, uncorrelatedAccountExporterCommand));
	const entitlementDetailsExporterCommand = new EntitlementDetailsExporterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_ENTITLEMENT_DETAILS_VIEW,
			entitlementDetailsExporterCommand.execute, entitlementDetailsExporterCommand));

	const openResourceCommand = new OpenResourceCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.OPEN_RESOURCE,
			openResourceCommand.execute));


	const deleteResourceCommand = new DeleteResourceCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REMOVE_RESOURCE,
			deleteResourceCommand.execute, deleteResourceCommand));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.LOAD_MORE,
			async (n: LoadMoreNode) => { await n.loadMore(); }));

	const rolefilterCommand = new RoleFilterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ROLE_FILTER_VIEW,
			rolefilterCommand.execute, rolefilterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ROLE_UPDATE_FILTER_VIEW,
			rolefilterCommand.execute, rolefilterCommand));
	const accessProfileFilterCommand = new AccessProfileFilterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ACCESS_PROFILE_FILTER_VIEW,
			accessProfileFilterCommand.execute, accessProfileFilterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ACCESS_PROFILE_UPDATE_FILTER_VIEW,
			accessProfileFilterCommand.execute, accessProfileFilterCommand));

	const updateWorkflowStatusCommand = new UpdateWorkflowStatusCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ENABLE_WORKFLOW,
			updateWorkflowStatusCommand.enableWorkflow, updateWorkflowStatusCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.DISABLE_WORKFLOW,
			updateWorkflowStatusCommand.disableWorkflow, updateWorkflowStatusCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.VIEW_WORKFLOW_EXECUTION_HISTORY,
			viewWorkflowExecutionHistory));
	const workflowExportCommand = new WorkflowExportCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_WORKFLOW,
			workflowExportCommand.execute, workflowExportCommand))
	const workflowImporterTreeViewCommand = new WorkflowImporterTreeViewCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_WORKFLOW,
			workflowImporterTreeViewCommand.execute, workflowImporterTreeViewCommand))
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_WORKFLOW_VIEW_ICON,
			workflowImporterTreeViewCommand.execute, workflowImporterTreeViewCommand))

	const exportConfigViewCommand = new ExportConfigTreeViewCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG_VIEW,
			exportConfigViewCommand.execute, exportConfigViewCommand));
	const exportConfigPaletteCommand = new ExportConfigPaletteCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG_PALETTE,
			exportConfigPaletteCommand.execute, exportConfigPaletteCommand));
	const exportNodeConfig = new ExportConfigNodeTreeViewCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_NODE_CONFIG_VIEW,
			exportNodeConfig.execute, exportNodeConfig));

	const paletteImporterCommand = new ImportConfigPaletteCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_CONFIG_PALETTE,
			paletteImporterCommand.execute, paletteImporterCommand));

	const menuImporterCommand = new ImportConfigExplorerCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_CONFIG_MENU,
			menuImporterCommand.execute, menuImporterCommand));

	const treeviewImporterCommand = new ImportConfigTreeViewCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_CONFIG_VIEW,
			treeviewImporterCommand.execute, treeviewImporterCommand));

	const iscClientResourceProvider = new ISCResourceProvider(tenantService)
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider(
			URL_PREFIX,
			iscClientResourceProvider
		));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.MODIFIED_RESOURCE,
			iscClientResourceProvider.triggerModified, iscClientResourceProvider));

	const newTransformCommand = new NewTransformCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_TRANSFORM,
			newTransformCommand.execute, newTransformCommand));

	const newProvisioningPolicyCommand = new NewProvisioningPolicyCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_PROVISIONING_POLICY,
			newProvisioningPolicyCommand.execute, newProvisioningPolicyCommand));

	const newSchemaCommand = new NewSchemaCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_SCHEMA,
			newSchemaCommand.execute, newSchemaCommand));

	const newConnectorRuleCommand = new ConnectorRuleCommand(tenantService);

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_CONNECTOR_RULE,
			newConnectorRuleCommand.newRule, newConnectorRuleCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.UPLOAD_CONNECTOR_RULE,
			newConnectorRuleCommand.upload, newConnectorRuleCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.VALIDATE_CONNECTOR_RULE,
			newConnectorRuleCommand.validateScript, newConnectorRuleCommand));

	const openScriptCommand = new OpenScriptCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EDIT_CONNECTOR_RULE,
			openScriptCommand.execute, openScriptCommand));

	const exportScriptFromRuleCommand = new ExportScriptFromRuleCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONNECTOR_RULE_SCRIPT_EDITOR,
			exportScriptFromRuleCommand.exportScriptEditor, exportScriptFromRuleCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONNECTOR_RULE_SCRIPT_VIEW,
			exportScriptFromRuleCommand.exportScriptView, exportScriptFromRuleCommand));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REFRESH_IDENTITY_PROFILE,
			refreshIdentityProfile));

	const sortIdentityProfileCommand = new SortIdentityProfileCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.SORT_IDENTITY_PROFILES_BY_NAME,
			sortIdentityProfileCommand.sortByName, sortIdentityProfileCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.SORT_IDENTITY_PROFILES_BY_PRIORITY,
			sortIdentityProfileCommand.sortByPriority, sortIdentityProfileCommand));

	const fileHandler = new FileHandler(tenantService);
	vscode.workspace.onDidSaveTextDocument(fileHandler.onFileSaved, fileHandler);

	const uriHandler = new ISCUriHandler(tenantService);
	context.subscriptions.push(
		vscode.window.registerUriHandler(uriHandler));

	// Access Profile Exporter
	const accessProfileExporterCommand = new AccessProfileExporterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_ACCESS_PROFILE_VIEW,
			accessProfileExporterCommand.execute, accessProfileExporterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_ACCESS_PROFILE_ICON_VIEW,
			accessProfileExporterCommand.execute, accessProfileExporterCommand));

	// Access Profile Importer
	const accessProfileImporterCommand = new AccessProfileImporterTreeViewCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ACCESS_PROFILE_VIEW,
			accessProfileImporterCommand.execute, accessProfileImporterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ACCESS_PROFILE_ICON_VIEW,
			accessProfileImporterCommand.execute, accessProfileImporterCommand));
	const accessProfileImporterExplorerCommand = new AccessProfileImporterExplorerCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ACCESS_PROFILE_EXPLORER,
			accessProfileImporterExplorerCommand.execute, accessProfileImporterExplorerCommand));

	// Role Exporter
	const roleExporterCommand = new RoleExporterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_ROLE_VIEW,
			roleExporterCommand.execute, roleExporterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_ROLE_ICON_VIEW,
			roleExporterCommand.execute, roleExporterCommand));

	// Role Importer
	const roleImporterCommand = new RoleImporterTreeViewCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ROLE_VIEW,
			roleImporterCommand.execute, roleImporterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ROLE_ICON_VIEW,
			roleImporterCommand.execute, roleImporterCommand));
	const roleImporterExplorerCommand = new RoleImporterExplorerCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ROLE_EXPLORER,
			roleImporterExplorerCommand.execute, roleImporterExplorerCommand));

	const newRoleCommand = new NewRoleCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_ROLE_VIEW,
			newRoleCommand.newRole, newRoleCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_ROLE_VIEW_ICON,
			newRoleCommand.newRole, newRoleCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_ROLE_PALETTE,
			newRoleCommand.newRole, newRoleCommand));

	const newAccessProfileCommand = new NewAccessProfileCommand(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_ACCESS_PROFILE_VIEW,
			newAccessProfileCommand.newAccessProfile, newAccessProfileCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_ACCESS_PROFILE_VIEW_ICON,
			newAccessProfileCommand.newAccessProfile, newAccessProfileCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_ACCESS_PROFILE_PALETTE,
			newAccessProfileCommand.newAccessProfile, newAccessProfileCommand));


	//Forms
	const formDefinitionExportCommand = new FormDefinitionExportCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_FORM_VIEW,
			formDefinitionExportCommand.execute, formDefinitionExportCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_FORMS_VIEW,
			formDefinitionExportCommand.execute, formDefinitionExportCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_FORMS_ICON_VIEW,
			formDefinitionExportCommand.execute, formDefinitionExportCommand));

	const formDefinitionImporterTreeViewCommand = new FormDefinitionImporterTreeViewCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_FORMS_VIEW,
			formDefinitionImporterTreeViewCommand.execute, formDefinitionImporterTreeViewCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_FORMS_ICON_VIEW,
			formDefinitionImporterTreeViewCommand.execute, formDefinitionImporterTreeViewCommand));

	// Attribute Search Config
	const newAttributeSearchConfigCommand = new NewAttributeSearchConfigCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_SEARCH_ATTRIBUTE,
			newAttributeSearchConfigCommand.execute, newAttributeSearchConfigCommand));
	// Identity Attribute 
	const newIdentityAttributeCommand = new NewIdentityAttributeCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_IDENTITY_ATTRIBUTE,
			newIdentityAttributeCommand.execute, newIdentityAttributeCommand));

	// Identity Definition Config
	const newIdentityCommand = new IdentityTreeViewCommand()
	const identityFilterCommand = new IdentityDefinitionFilterCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IDENTITIES_SEARCH,
			identityFilterCommand.execute, identityFilterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IDENTITIES_ICON_SEARCH,
			identityFilterCommand.execute, identityFilterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IDENTITIES_ATT_SYNC,
			newIdentityCommand.attSyncIdentity, newIdentityCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IDENTITIES_DELETE,
			newIdentityCommand.deleteIdentity, newIdentityCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IDENTITIES_PROCESS,
			newIdentityCommand.processIdentity, newIdentityCommand));

	// Applications
	const applicationSourceFilterCommand = new ApplicationSourceFilterCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.APPLICATIONS_FILTER_SOURCE_VIEW,
			applicationSourceFilterCommand.execute, applicationSourceFilterCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.APPLICATIONS_UPDATE_FILTER_SOURCE_VIEW,
			applicationSourceFilterCommand.removeFilter, applicationSourceFilterCommand));
	const applicationNameFilterCommand = new ApplicationNameFilterCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.APPLICATIONS_FILTER_NAME_VIEW,
			applicationNameFilterCommand.execute, applicationNameFilterCommand));


	const removeAccessProfileFromAppCommand = new RemoveAccessProfileFromAppCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REMOVE_ACCESS_PROFILE_FROM_APPLICATION,
			removeAccessProfileFromAppCommand.execute, removeAccessProfileFromAppCommand));

	const addAccessProfileToApplication = new AddAccessProfileToApplication(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ADD_ACCESS_PROFILE_FROM_APPLICATION,
			addAccessProfileToApplication.execute, addAccessProfileToApplication));

	const newApplicationCommand = new NewApplicationCommand(tenantService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_APPLICATION,
			newApplicationCommand.execute, newApplicationCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_APPLICATION_PALETTE,
			newApplicationCommand.execute, newApplicationCommand));

	// Certification Campaigns
	const openCampaignPanel = new OpenCampaignPanelCommand(context.extensionUri)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.VIEW_CAMPAIGN_PANEL,
			openCampaignPanel.execute, openCampaignPanel))

	const exportCampaignReportCommand = new ExportCampaignReportCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CAMPAIGN_REPORT,
			exportCampaignReportCommand.execute, exportCampaignReportCommand))

	const escalateCertificationCommand = new EscalateCertificationCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ESCALATE_CERTIFICATION,
			escalateCertificationCommand.execute, escalateCertificationCommand))



	const campaignService = new CampaignConfigurationService(context.secrets, tenantService,)
	const configureReminderWorkflow = new ConfigureReminderWorkflowCommand(tenantService, campaignService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.CAMPAIGN_CONFIGURE_REMINDER,
			configureReminderWorkflow.execute, configureReminderWorkflow))

	const sendReminderCommand = new SendReminderCommand(tenantService, campaignService)
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.CAMPAIGN_SEND_REMINDER,
			sendReminderCommand.execute, sendReminderCommand))
}

// this method is called when your extension is deactivated
export function deactivate() { }


