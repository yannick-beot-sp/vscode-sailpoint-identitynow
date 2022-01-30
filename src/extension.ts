// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AddTenantCommand } from './commands/addTenant';
import { SailPointIdentityNowAuthenticationProvider } from './services/AuthenticationProvider';
import { TenantService } from './services/TenantService';
import { IdentityNowDataProvider } from './views/IdentityNowDataProvider';

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
	context.subscriptions.push(vscode.authentication.registerAuthenticationProvider(
		SailPointIdentityNowAuthenticationProvider.id,
		'SailPoint Identity Now',
		new SailPointIdentityNowAuthenticationProvider(context.secrets, tenantService),
		{
			supportsMultipleAccounts: true
		}
	));


	const addTenantCommand : AddTenantCommand = new AddTenantCommand(tenantService);
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-sailpoint-identitynow.add-tenant', addTenantCommand.execute, addTenantCommand);
	context.subscriptions.push(disposable);

	const identityNowDataProvider = new IdentityNowDataProvider(context, tenantService);

	vscode.window.registerTreeDataProvider('vscode-sailpoint-identitynow.view', identityNowDataProvider);

}

// this method is called when your extension is deactivated
export function deactivate() { }
