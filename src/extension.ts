import * as vscode from 'vscode';
import * as commands from './commands/constants';
import { AccessProfileImporterExplorerCommand } from './commands/access-profile/AccessProfileImporterExplorerCommand';
import { AccessProfileImporterTreeViewCommand } from './commands/access-profile/AccessProfileImporterTreeViewCommand';
import { AccessProfileExporterCommand } from './commands/access-profile/ExportAccessProfiles';
import { NewAccessProfileCommand } from './commands/access-profile/NewAccessProfileCommand';
import { AddTenantCommand } from './commands/addTenant';
import { ConnectorRuleCommand } from './commands/connectorRuleCommand';
import { deleteResource } from './commands/deleteResource';
import { AccountExporterCommand, UncorrelatedAccountExporterCommand } from './commands/source/exportAccounts';
import { EntitlementExporterCommand as EntitlementDetailsExporterCommand } from './commands/source/exportEntitlementDetails';
import { ExportScriptFromRuleCommand } from './commands/exportScriptFromRuleCommand';
import { AccessProfileFilterCommand, FilterCommand, RoleFilterCommand } from './commands/filterCommand';
import { AccountImportNodeCommand } from './commands/source/importAccount';
import { EntitlementDetailsImportNodeCommand } from './commands/source/importEntitlementDetails';
import { UncorrelatedAccountImportNodeCommand } from './commands/source/importUncorrelatedAccount';
import { newProvisioningPolicy } from './commands/newProvisioningPolicy';
import { newSchema } from './commands/newSchema';
import { NewTransformCommand } from './commands/newTransform';
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
import { TestWorkflowCommand } from './commands/workflow/testWorkflow';
import { viewWorkflowExecutionHistory } from './commands/workflow/viewWorkflowExecutionHistory';
import { disableWorkflow, enableWorkflow } from './commands/workflow/updateWorkflowStatus';
import { URL_PREFIX } from './constants';
import { FileHandler } from './files/FileHandler';
import { IdentityNowResourceProvider } from './files/IdentityNowResourceProvider';
import { LoadMoreNode } from './models/IdentityNowTreeItem';
import { SailPointIdentityNowAuthenticationProvider } from './services/AuthenticationProvider';
import { TenantService } from './services/TenantService';
import { TransformEvaluator } from './services/TransformEvaluator';
import { TreeManager } from './services/TreeManager';
import { IdentityNowUriHandler } from './uriHandler';
import { IdentityNowDataProvider } from './views/IdentityNowDataProvider';
import { WorkflowTesterWebviewViewProvider } from './views/WorkflowTesterWebviewViewProvider';
import { TestConnectionCommand } from './commands/source/TestConnectionCommand';
import { PeekSourceCommand } from './commands/source/PeekSourceCommand';
import { PingClusterCommand } from './commands/source/PingClusterCommand';
import { CloneSourceCommand } from './commands/source/CloneSourceCommand';
import { FormDefinitionExportCommand } from './commands/form/FormDefinitionExportCommand';
import { FormDefinitionImporter } from './commands/form/FormDefinitionImporter';
import { FormDefinitionImporterTreeViewCommand } from './commands/form/FormDefinitionImporterTreeViewCommand';
import { WorkflowExportCommand } from './commands/workflow/WorkflowExportCommand';
import { WorkflowImporterTreeViewCommand } from './commands/workflow/WorkflowImporterTreeViewCommand';
import { EditPublicIdentitiesConfigCommand } from './commands/editPublicIdentitiesConfigCommand';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-sailpoint-identitynow" is now active!');

	const tenantService = new TenantService(context.globalState, context.secrets);

	// Register our authentication provider. NOTE: this will register the provider globally which means that
	// any other extension can use this provider via the `getSession` API.
	// NOTE: when implementing an auth provider, don't forget to register an activation event for that provider
	// in your package.json file: "onAuthenticationRequest:AzureDevOpsPAT"
	const authProvider = new SailPointIdentityNowAuthenticationProvider(tenantService);

	context.subscriptions.push(vscode.authentication.registerAuthenticationProvider(
		SailPointIdentityNowAuthenticationProvider.id,
		'SailPoint Identity Now',
		authProvider,
		{
			supportsMultipleAccounts: true
		}
	));

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
			
	const identityNowDataProvider = new IdentityNowDataProvider(context, tenantService);
	vscode.window.registerTreeDataProvider(commands.TREE_VIEW, identityNowDataProvider);

	vscode.commands.registerCommand(commands.REFRESH_FORCED, identityNowDataProvider.forceRefresh, identityNowDataProvider);
	vscode.commands.registerCommand(commands.REFRESH, identityNowDataProvider.refresh, identityNowDataProvider);

	const transformEvaluator = new TransformEvaluator(tenantService);
	const treeManager = new TreeManager(identityNowDataProvider, tenantService, authProvider, transformEvaluator);

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EVALUATE_TRANSFORM_EDITOR, transformEvaluator.evaluate, transformEvaluator));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REMOVE_TENANT,
			(tenantTreeItem) => treeManager.removeTenant(tenantTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.AGGREGATE,
			(tenantTreeItem) => treeManager.aggregateSource(tenantTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.AGGREGATE_DISABLE_OPTIMIZATION,
			(tenantTreeItem) => treeManager.aggregateSource(tenantTreeItem, true)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.AGGREGATE_ENTITLEMENTS,
			(tenantTreeItem) => treeManager.aggregateSource(tenantTreeItem, false, "entitlements")));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RESET_SOURCE,
			(tenantTreeItem) => treeManager.resetSource(tenantTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RESET_SOURCE_ACCOUNTS,
			(tenantTreeItem) => treeManager.resetSource(tenantTreeItem, "entitlements")));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.RESET_SOURCE_ENTITLEMENTS,
			(tenantTreeItem) => treeManager.resetSource(tenantTreeItem, "accounts")));
	const testConnectionCommand = new TestConnectionCommand(tenantService);
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

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EVALUATE_TRANSFORM,
			(tenantTreeItem) => treeManager.evaluateTransform(tenantTreeItem)));

	const accountImportNodeCommand = new AccountImportNodeCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_ACCOUNTS_VIEW,
			accountImportNodeCommand.execute, accountImportNodeCommand));

	const uncorrelatedAccountImportNodeCommand = new UncorrelatedAccountImportNodeCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_UNCORRELATED_ACCOUNTS_VIEW,
			uncorrelatedAccountImportNodeCommand.execute, uncorrelatedAccountImportNodeCommand));
	const entitlementDetailsImportNodeCommand = new EntitlementDetailsImportNodeCommand();
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

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REMOVE_RESOURCE,
			deleteResource));

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

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.ENABLE_WORKFLOW,
			enableWorkflow));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.DISABLE_WORKFLOW,
			disableWorkflow));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.VIEW_WORKFLOW_EXECUTION_HISTORY,
			viewWorkflowExecutionHistory));
	const workflowExportCommand = new WorkflowExportCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_WORKFLOW,
			workflowExportCommand.execute, workflowExportCommand))
	const workflowImporterTreeViewCommand = new WorkflowImporterTreeViewCommand()
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

	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider(
			URL_PREFIX,
			new IdentityNowResourceProvider(tenantService)
		));

	const newTransformCommand = new NewTransformCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_TRANSFORM,
			newTransformCommand.execute, newTransformCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_PROVISIONING_POLICY,
			newProvisioningPolicy));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_SCHEMA,
			newSchema));

	const workflowTester = new WorkflowTesterWebviewViewProvider(context, tenantService);
	workflowTester.activate();

	const testWorkflowCommand = new TestWorkflowCommand(workflowTester);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.TEST_WORKFLOW,
			testWorkflowCommand.execute, testWorkflowCommand));

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

	const uriHandler = new IdentityNowUriHandler(tenantService);
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
	const accessProfileImporterCommand = new AccessProfileImporterTreeViewCommand();
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
	const roleImporterCommand = new RoleImporterTreeViewCommand();
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

	const formDefinitionImporterTreeViewCommand = new FormDefinitionImporterTreeViewCommand()
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_FORMS_VIEW,
			formDefinitionImporterTreeViewCommand.execute, formDefinitionImporterTreeViewCommand));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_FORMS_ICON_VIEW,
			formDefinitionImporterTreeViewCommand.execute, formDefinitionImporterTreeViewCommand));
}

// this method is called when your extension is deactivated
export function deactivate() { }


