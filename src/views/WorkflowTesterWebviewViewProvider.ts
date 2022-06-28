import * as vscode from 'vscode';
import * as commands from '../commands/constants';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';
import { delay } from '../utils';
import { getWorkflowExecutionDetailUri } from '../utils/UriUtils';


export class WorkflowTesterWebviewViewProvider implements vscode.WebviewViewProvider {


    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;

    constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _tenantService: TenantService
    ) {
        this._extensionUri = this._context.extensionUri;
    }

    public activate() {

        this._context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(commands.WORKFLOW_TESTER_VIEW, this));
        /*
                context.subscriptions.push(
                    vscode.commands.registerCommand('calicoColors.addColor', () => {
                        provider.addColor();
                    }));
        
                context.subscriptions.push(
                    vscode.commands.registerCommand('calicoColors.clearColors', () => {
                        provider.clearColors();
                    }));
                    */
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = await this.getHtmlForWebview(webviewView.webview);

        // Sets up an event listener to listen for messages passed from the webview view context
        // and executes code based on the message that is recieved
        this.setWebviewMessageListener(webviewView);

    }

    private setWebviewMessageListener(webviewView: vscode.WebviewView) {
        webviewView.webview.onDidReceiveMessage(async data => {
            const command = data.command;
            switch (command) {
                case 'getWorkflows':
                    {
                        this.showWorkflow(data.tenant);
                        break;
                    }
                case 'getWorkflowTriggers':
                    {
                        const client = new IdentityNowClient(data.tenant);
                        const workflowTriggers = await client.getWorflowTriggers();

                        if (this._view) {
                            this._view.webview.postMessage({
                                command: 'setWorkflowTriggers',
                                payload: JSON.stringify({
                                    workflowTriggers: workflowTriggers
                                })

                            });
                        }
                        break;
                    }
                case 'testWorkflow':
                    {
                        const client = new IdentityNowClient(data.tenant);
                        await vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: `Testing workflow ${data.workflowName}...`,
                            cancellable: false
                        }, async (task, token) => {

                            const workflowExecutionId = await client.testWorkflow(data.workflowId, JSON.parse(data.payload));
                            let workflowStatus;
                            do {
                                await delay(1000);
                                workflowStatus = await client.getWorkflowExecution(workflowExecutionId);
                                console.log({ workflowStatus });
                            }
                            while (workflowStatus.status === "Running");
                            if (workflowStatus.status === "Failed") {
                                vscode.window.showErrorMessage("Workflow test has failed");
                            }

                            const uri = getWorkflowExecutionDetailUri(data.tenant, workflowExecutionId);
                            console.log('testWorkflow: uri:', uri);

                            let document = await vscode.workspace.openTextDocument(uri);
                            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
                            await vscode.window.showTextDocument(document, { preview: true });
                            console.log("< testWorkflow");

                        });
                        break;
                    }
            }
        });
    }

    public async showWorkflow(tenantName: string, workflowId?: string) {

        if (this._view) {
            this._view.show?.(true);
            const client = new IdentityNowClient(tenantName);

            const workflows = await client.getWorflows();
            // subset of info from workflows
            const workflowModels = workflows.map(w => ({
                id: w.id,
                name: w.name,
                triggerType: w.trigger.type,
                triggerAttributes: w.trigger.attributes
            }));

            const payload: any = {
                tenant: tenantName,
                workflows: workflowModels
            };
            if (workflowId) {
                payload.selected = workflowId;
            }

            this._view.webview.postMessage({
                command: 'setWorkflows',
                payload: JSON.stringify(payload)
            });
        }
    }

    private async getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'views', 'workflow', 'main.js'));
        const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri,
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js",
        ));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'views', 'workflow', 'main.css'));


        const tenantNames = await this._tenantService.getTenants();

        let tenantOptions = '';
        if (tenantNames.length !== 1) {
            // Add default empty value, to force to choose one tenant
            tenantOptions = '<vscode-option value=""></vscode-option>';
        } else {
            for (const tenantName of tenantNames) {
                tenantOptions += `<vscode-option value="${tenantName.id}">${tenantName.name}</vscode-option>`;
            }
        }
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script type="module" src="${toolkitUri}"></script>
                <script type="module" src="${scriptUri}"></script>
				<link href="${styleMainUri}" rel="stylesheet">	
				<title>Workflow tester</title>
			</head>
			<body id="workflow-tester-body>
            <section id="params-container">
            <section class="param-container">
            <p>Tenant</p>
            <vscode-dropdown id="tenant">
            ${tenantOptions}
            </vscode-dropdown>
            </section>
            <section class="param-container">
            <p>Workflow</p>
            <vscode-dropdown id="workflow" disabled>
            
            </vscode-dropdown>
            </section>
            <section class="param-container">
            <vscode-text-area id="payload" value="" placeholder="Write your payload" resize="vertical" rows=15>Payload</vscode-text-area>
            </section>
            <section class="param-container">
            <vscode-button id="submit-button" disabled>Test</vscode-button>

            </section>
            </section>
			</body>
			</html>`;
    }
}

