// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as commands from './commands/constants';
import { AddTenantCommand } from './commands/addTenant';
import { NewTransformCommand } from './commands/newTransform';
import { onFileSaved } from './commands/onFileSave';
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-sailpoint-identitynow" is now active!');

	const tenantService = new TenantService(context.globalState);

	// Register our authentication provider. NOTE: this will register the provider globally which means that
	// any other extension can use this provider via the `getSession` API.
	// NOTE: when implementing an auth provider, don't forget to register an activation event for that provider
	// in your package.json file: "onAuthenticationRequest:AzureDevOpsPAT"
	const authProvider = new SailPointIdentityNowAuthenticationProvider(context.secrets, tenantService);

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

	const identityNowDataProvider = new IdentityNowDataProvider(context, tenantService);
	vscode.window.registerTreeDataProvider(commands.TREE_VIEW, identityNowDataProvider);

	vscode.commands.registerCommand(commands.REFRESH, identityNowDataProvider.refresh, identityNowDataProvider);

	const transformEvaluator = new TransformEvaluator();
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
		vscode.commands.registerCommand(commands.RESET_SOURCE,
			(tenantTreeItem) => treeManager.resetSource(tenantTreeItem)));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EVALUATE_TRANSFORM,
			(tenantTreeItem) => treeManager.evaluateTransform(tenantTreeItem)));

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
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG_VIEW,
			exportConfig.exportConfigView));

	const exportConfigPaletteCommand = new exportConfig.ExportConfigPalette(tenantService);
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG_PALETTE,
			exportConfigPaletteCommand.execute, exportConfigPaletteCommand));

	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider(
			URL_PREFIX,
			new IdentityNowResourceProvider()
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

    const newConnectorRuleCommand = new ConnectorRuleCommand();

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.NEW_CONNECTOR_RULE,
			newConnectorRuleCommand.execute, newConnectorRuleCommand));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.UPLOAD_CONNECTOR_RULE,
			newConnectorRuleCommand.upload, newConnectorRuleCommand));

	
	vscode.workspace.onDidSaveTextDocument(onFileSaved);
}

// this method is called when your extension is deactivated
export function deactivate() { }


