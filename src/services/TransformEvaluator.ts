import * as vscode from 'vscode';
import { isEmpty } from '../utils/stringUtils.js';
import { OpenResourceCommand } from "../commands/openResource.js";
import { ISCClient } from './ISCClient.js';
import { TenantService } from './TenantService.js';
import { EvaluationContext } from './transforms/EvaluationContext.js';
import { TransformEngine } from './transforms/TransformEngine.js';
import { EvaluationCancelledError, NotImplementedError, TransformError } from './transforms/TransformError.js';
import { requiredValidator } from '../validator/requiredValidator.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { QuickPickAccountSchemaStep } from '../wizard/quickPickAccountSchemaStep.js';
import { QuickPickIdentityStep } from '../wizard/quickPickIdentityStep.js';
import { QuickPickSourceStep } from '../wizard/quickPickSourceStep.js';
import { runWizard } from '../wizard/wizard.js';
import { WizardContext } from '../wizard/wizardContext.js';

const LBL_RETEST = "Test Again";

/**
 * Inputs kept across evaluations, so that the next evaluation can reuse them
 */
interface LastInputs {
    identityQuery?: string;
    inputValue?: string;
    inputAccountAttribute?: { sourceName: string, attributeName: string };
    inputFromAccount?: boolean;
}

/**
 * Evaluates locally the transform of the active editor
 */
export class TransformEvaluator {
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

        await this.evaluateActiveEditor(tenantId, tenantName);
    }

    private async evaluateActiveEditor(tenantId: string, tenantName: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        let action: Thenable<string | undefined>;
        try {
            const transform = JSON.parse(editor.document.getText());
            const engine = new TransformEngine(new EditorEvaluationContext(new ISCClient(tenantId, tenantName), this.lastInputs));
            const result = await engine.evaluate(transform);
            action = vscode.window.showInformationMessage("Validation of transform successful. Result = " + (typeof result === 'string' ? ("'" + result + "'") : result), LBL_RETEST);
        } catch (error) {
            if (error instanceof EvaluationCancelledError) {
                return;
            }
            console.error(error);
            action = error instanceof NotImplementedError
                ? vscode.window.showWarningMessage(error.message, LBL_RETEST)
                : vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error), LBL_RETEST);
        }

        action.then(label => {
            if (label === LBL_RETEST) {
                this.evaluateActiveEditor(tenantId, tenantName);
            }
        });
    }
}

/**
 * Prompts the user and queries the tenant with a progress notification
 */
class EditorEvaluationContext implements EvaluationContext {

    constructor(
        private readonly client: ISCClient,
        private readonly lastInputs: LastInputs
    ) { }

    /**
     * The input is typed, or read from an account of the evaluated identity.
     * The last choice is listed first.
     */
    async getImplicitInput(readAccountAttribute: (sourceName: string, attributeName: string) => Promise<any>): Promise<any> {
        const last = this.lastInputs;
        const typeValue: vscode.QuickPickItem = {
            label: "$(edit) Enter a value",
            description: last.inputValue !== undefined ? `last: '${last.inputValue}'` : undefined
        };
        const lastAttribute: vscode.QuickPickItem | undefined = last.inputAccountAttribute && {
            label: `$(history) Account attribute '${last.inputAccountAttribute.attributeName}' of source '${last.inputAccountAttribute.sourceName}'`
        };
        const pickAttribute: vscode.QuickPickItem = { label: "$(account) Pick an account attribute of the identity" };

        let items = [typeValue, lastAttribute, pickAttribute].filter(item => item !== undefined) as vscode.QuickPickItem[];
        if (last.inputFromAccount) {
            items = [...items.filter(item => item !== typeValue), typeValue];
        }

        const choice = await vscode.window.showQuickPick(items, {
            title: "Identity Security Cloud transform",
            placeHolder: "Input of the transform",
            ignoreFocusOut: true
        });

        if (choice === undefined) {
            throw new EvaluationCancelledError();
        }
        if (choice === typeValue) {
            const value = await askInput("Input text", "Enter the text you want to use as transform's input", last.inputValue);
            last.inputValue = value;
            last.inputFromAccount = false;
            return value;
        }

        const accountAttribute = choice === lastAttribute ? last.inputAccountAttribute! : await this.pickAccountAttribute();
        last.inputAccountAttribute = accountAttribute;
        last.inputFromAccount = true;
        return await readAccountAttribute(accountAttribute.sourceName, accountAttribute.attributeName);
    }

    private async pickAccountAttribute(): Promise<{ sourceName: string, attributeName: string }> {
        const values = await runWizard<WizardContext>({
            title: "Input of the transform",
            hideStepCount: true,
            promptSteps: [
                new QuickPickSourceStep(() => this.client),
                new QuickPickAccountSchemaStep(() => this.client)
            ]
        });
        if (values === undefined) {
            throw new EvaluationCancelledError();
        }
        return { sourceName: values["source"].name, attributeName: values["attribute"].name };
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

    /**
     * Gets the whole identity document (attributes, manager, accounts) by exact id or name.
     * ISCClient.getIdentity only returns the name, display name and id.
     */
    async getIdentity(identityNameOrId: string): Promise<any> {
        const value = identityNameOrId.replace(/[\\"]/g, '\\$&');
        const results = await withProgress(`Getting identity '${identityNameOrId}'...`,
            () => this.client.searchAllIdentities(`id:"${value}" OR name:"${value}"`, 10));

        const identities = results.filter(identity => identity.id === identityNameOrId || identity.name?.toLowerCase() === identityNameOrId.toLowerCase());
        if (identities.length > 1) {
            throw new TransformError(`Several identities match '${identityNameOrId}'`);
        }
        return identities[0];
    }

    getSourceId(sourceName: string): Promise<string | undefined> {
        return withProgress(`Getting source '${sourceName}' id...`, () => this.client.getSourceId(sourceName));
    }

    getAccountsByIdentity(identityId: string): Promise<any[]> {
        return withProgress(`Getting accounts of identity '${identityId}'...`, () => this.client.getAccountsByIdentity(identityId));
    }

    getTransformByName(name: string): Promise<any> {
        return withProgress(`Getting transform '${name}' ...`, () => this.client.getTransformByName(name));
    }
}

async function askInput(placeHolder: string, prompt: string, value = ''): Promise<string> {
    const input = await vscode.window.showInputBox({
        value,
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
