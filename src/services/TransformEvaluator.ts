import * as vscode from 'vscode';
import { isEmpty } from '../utils/stringUtils.js';
import { OpenResourceCommand } from "../commands/openResource.js";
import { ISCClient } from './ISCClient.js';
import { TenantService } from './TenantService.js';
import { EvaluationContext } from './transforms/EvaluationContext.js';
import { TransformEngine } from './transforms/TransformEngine.js';
import { EvaluationCancelledError, NotImplementedError } from './transforms/TransformError.js';
import { requiredValidator } from '../validator/requiredValidator.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { QuickPickIdentityStep } from '../wizard/quickPickIdentityStep.js';
import { runWizard } from '../wizard/wizard.js';
import { WizardContext } from '../wizard/wizardContext.js';

/**
 * Evaluates locally the transform of the active editor
 */
export class TransformEvaluator {
    // Kept across evaluations, so that the next evaluation can reuse the last identity query
    private readonly lastInputs: LastInputs = {};

    constructor(
        private readonly tenantService: TenantService
    ) { }

    async evaluate(item?: any): Promise<void> {
        let tenantName: string;
        let tenantId = "";

        if (item?.tenantName) {
            tenantName = item.tenantName;
            tenantId = item.tenantId;
            await new OpenResourceCommand().execute(item);
        } else {
            tenantName = vscode.window.activeTextEditor?.document.uri.authority ?? "";
            if (tenantName) {
                const tenantInfo = await this.tenantService.getTenantByTenantName(tenantName);
                tenantId = tenantInfo?.id ?? "";
            }
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        try {
            const transform = JSON.parse(editor.document.getText());
            const engine = new TransformEngine(new EditorEvaluationContext(new ISCClient(tenantId, tenantName), this.lastInputs));
            const result = await engine.evaluate(transform);
            vscode.window.showInformationMessage("Validation of transform successful. Result = " + (typeof result === 'string' ? ("'" + result + "'") : result));
        } catch (error) {
            if (error instanceof EvaluationCancelledError) {
                return;
            }
            console.error(error);
            if (error instanceof NotImplementedError) {
                vscode.window.showWarningMessage(error.message);
            } else {
                vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
            }
        }
    }
}

interface LastInputs {
    identityQuery?: string;
}

/**
 * Prompts the user and queries the tenant with a progress notification
 */
class EditorEvaluationContext implements EvaluationContext {

    constructor(
        private readonly client: ISCClient,
        private readonly lastInputs: LastInputs
    ) { }

    getImplicitInput(): Promise<string> {
        return askInput("Input text", "Enter the text you want to use as transform's input");
    }

    /**
     * Searches the identities and lets the user pick one, as in EvaluateTransformCloudCommand
     */
    async getIdentityNameOrId(): Promise<string> {
        const values = await runWizard<WizardContext>({
            title: "Evaluate transform",
            hideStepCount: true,
            promptSteps: [
                new InputPromptStep({
                    name: "identityQuery",
                    displayName: "identity query",
                    options: {
                        validateInput: requiredValidator,
                        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-identity-data",
                        shouldPrompt: () => true
                    }
                }),
                new QuickPickIdentityStep(
                    "Target Identity",
                    () => this.client,
                    "identity",
                    "identityQuery"
                )
            ]
        }, { identityQuery: this.lastInputs.identityQuery });

        if (values === undefined) {
            throw new EvaluationCancelledError();
        }
        this.lastInputs.identityQuery = values["identityQuery"];
        return values["identity"].name;
    }

    getIdentity(identityNameOrId: string): Promise<any> {
        return withProgress(`Getting identity '${identityNameOrId}'...`, () => this.client.getIdentity(identityNameOrId));
    }

    getSourceId(sourceName: string): Promise<string | undefined> {
        return withProgress(`Getting source '${sourceName}' id...`, () => this.client.getSourceId(sourceName));
    }

    getAccountBySource(sourceId: string, nativeIdentity: string): Promise<any> {
        return withProgress(`Getting account for nativeIdentity '${nativeIdentity}'...`, () => this.client.getAccountBySource(sourceId, nativeIdentity));
    }

    getTransformByName(name: string): Promise<any> {
        return withProgress(`Getting transform '${name}' ...`, () => this.client.getTransformByName(name));
    }
}

async function askInput(placeHolder: string, prompt: string): Promise<string> {
    const input = await vscode.window.showInputBox({
        value: '',
        ignoreFocusOut: true,
        placeHolder,
        prompt,
        title: 'Identity Security Cloud transform'
    });

    if (input === undefined || isEmpty(input)) {
        throw new EvaluationCancelledError();
    }
    return input;
}

async function withProgress<T>(title: string, task: () => Promise<T>): Promise<T> {
    return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false
    }, task);
}
