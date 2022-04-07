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
import { exportConfig } from './commands/exportConfig';

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
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-sailpoint-identitynow.add-tenant', addTenantCommand.execute, addTenantCommand);
	context.subscriptions.push(disposable);

	const identityNowDataProvider = new IdentityNowDataProvider(context, tenantService);
	vscode.window.registerTreeDataProvider('vscode-sailpoint-identitynow.view', identityNowDataProvider);
	vscode.commands.registerCommand(commands.REFRESH, identityNowDataProvider.refresh, identityNowDataProvider);


	const treeManager = new TreeManager(identityNowDataProvider, tenantService, authProvider);


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

	const openResourceCommand = new OpenResourceCommand();
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.OPEN_RESOURCE,
			openResourceCommand.execute));

	context.subscriptions.push(
		vscode.commands.registerCommand(commands.REMOVE_RESOURCE,
			deleteResource));
	context.subscriptions.push(
		vscode.commands.registerCommand(commands.EXPORT_CONFIG,
			exportConfig));

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

	vscode.workspace.onDidSaveTextDocument(onFileSaved);
}

// this method is called when your extension is deactivated
export function deactivate() { }
