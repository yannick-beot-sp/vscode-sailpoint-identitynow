// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as commands from './commands/constants';
import { AddTenantCommand } from './commands/addTenant';
import { NewTransformCommand } from './commands/newTransform';
import { OpenResourceCommand } from './commands/openResource';
import { IdentityNowResourceProvider } from './files/IdentityNowResourceProvider';
import { SailPointIdentityNowAuthenticationProvider } from './services/AuthenticationProvider';
import { TenantService } from './services/TenantService';
import { TreeManager } from './services/TreeManager';
import { IdentityNowDataProvider } from './views/IdentityNowDataProvider';
import { URL_PREFIX } from './constants';
import { deleteResource } from './commands/deleteResource';
import { newProvisioningPolicy } from './commands/newProvisioningPolicy';
import { newSchema } from './commands/newSchema';
import * as exportConfig from './commands/exportConfig';
import { disableWorkflow, enableWorkflow } from './commands/workflow';
import { viewWorkflowExecutionHistory } from './commands/viewWorkflowExecutionHistory';
import { WorkflowTesterWebviewViewProvider } from './views/WorkflowTesterWebviewViewProvider';
import { TestWorkflowCommand } from './commands/testWorkflow';
import { TransformEvaluator } from './services/TransformEvaluator';
import { ConnectorRuleCommand } from './commands/connectorRuleCommand';
import { ExportScriptFromRuleCommand } from './commands/exportScriptFromRuleCommand';
import { FileHandler } from './files/FileHandler';
import { RenameTenantCommand } from './commands/renameTenant';
import { IdentityNowUriHandler } from './uriHandler';
import { SortIdentityProfileCommand } from './commands/sortIdentityProfile';
import { MenuImporter, PaletteImporter, TreeViewImporter } from './commands/importConfig';
import { refreshIdentityProfile } from './commands/refreshIdentityProfile';
import { AccountExporterCommand, UncorrelatedAccountExporterCommand } from './commands/exportAccounts';
import { EntitlementExporterCommand as EntitlementDetailsExporterCommand } from './commands/exportEntitlementDetails';
import { AccountImportNodeCommand } from './commands/importAccount';
import { UncorrelatedAccountImportNodeCommand } from './commands/importUncorrelatedAccount';

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

	const identityNowDataProvider = new IdentityNowDataProvider(context, tenantService);
	vscode.window.registerTreeDataProvider(commands.TREE_VIEW, identityNowDataProvider);

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
		vscode.commands.registerCommand(commands.ENABLE_WORKFLOW,
			enableWorkflow));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.DISABLE_WORKFLOW,
			disableWorkflow));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.VIEW_WORKFLOW_EXECUTION_HISTORY,
			viewWorkflowExecutionHistory));

	const exportConfigViewCommand = new exportConfig.ExportConfigTreeView();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG_VIEW,
			exportConfigViewCommand.execute, exportConfigViewCommand));
	const exportConfigPaletteCommand = new exportConfig.ExportConfigPalette(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG_PALETTE,
			exportConfigPaletteCommand.execute, exportConfigPaletteCommand));
	const exportNodeConfig = new exportConfig.ExportNodeConfig(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_NODE_CONFIG_VIEW,
			exportNodeConfig.execute, exportNodeConfig));

	const paletteImporterCommand = new PaletteImporter(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_CONFIG_PALETTE,
			paletteImporterCommand.execute, paletteImporterCommand));

	const menuImporterCommand = new MenuImporter(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.IMPORT_CONFIG_MENU,
			menuImporterCommand.execute, menuImporterCommand));

	const treeviewImporterCommand = new TreeViewImporter(tenantService);
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

}

// this method is called when your extension is deactivated
export function deactivate() { }


