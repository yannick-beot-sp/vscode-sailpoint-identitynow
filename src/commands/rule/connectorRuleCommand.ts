import * as vscode from 'vscode';
import * as commands from '../constants';
import { NEW_ID, RESOURCE_TYPES } from '../../constants';
import { RulesTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from '../../services/ISCClient';
import { TenantService } from '../../services/TenantService';
import { compareByName } from '../../utils';
import { buildResourceUri } from '../../utils/UriUtils';
import { chooseTenant, createNewFile, getSelectionContent, openPreview } from '../../utils/vsCodeHelpers';
import { ConnectorRuleResponseBeta } from 'sailpoint-api-client';
import { Validator } from '../../validator/validator';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickPromptStep } from '../../wizard/quickPickPromptStep';
import { runWizard } from '../../wizard/wizard';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { IWizardOptions } from '../../wizard/wizardOptions';
import { WizardPromptStep } from '../../wizard/wizardPromptStep';
import { InputPromptStep } from '../../wizard/inputPromptStep';

const ruleTypes: ConnectorRuleResponseBeta[] = require('../../../snippets/connector-rules.json')

const ruleNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});

// QuickPickItem use label instead of name
// Relying on "detail" instead of "description" as "detail" provides a longer view
// therefore label and detail must be added and removed before returning the rule

const mapRulesToPickItems = x => x.sort(compareByName)
    .map(obj => ({ ...obj, label: obj.name, detail: obj.description }))
    .filter(obj => {
        delete obj.description
        return true
    })

const mapPickItemToRule = rule => {
    rule.description = rule.detail
    // @ts-ignore
    delete rule.label
    delete rule.detail
    return rule
}

const askRuleType = () => new QuickPickPromptStep({
    name: "rule",
    options: {
        matchOnDetail: true
    },
    items: (context: WizardContext): vscode.QuickPickItem[] => mapRulesToPickItems(ruleTypes),
    project: (value: vscode.QuickPickItem) => mapPickItemToRule(value)
})

const askRuleName = () => new InputPromptStep({
    name: "ruleName",
    displayName: "rule",
    options: {
        validateInput: (s: string) => { return ruleNameValidator.validate(s); }
    }
})

class QuickPickUpdateExistingRuleStep extends QuickPickPromptStep<WizardContext, vscode.QuickPickItem> {
    constructor(
        private readonly yesSteps: WizardPromptStep<WizardContext>[],
        private readonly noSteps: WizardPromptStep<WizardContext>[]
    ) {
        super({
            name: "answer",
            options: {
                canPickMany: false,
                placeHolder: "Do you want to update an existing rule?"
            },
            items: [
                { label: "Yes", picked: false },
                { label: "No", picked: false }
            ]
        });
    }

    public async getSubWizard(wizardContext: WizardContext): Promise<IWizardOptions<WizardContext> | undefined> {
        return {
            promptSteps: wizardContext["answer"].label === "Yes" ? this.yesSteps : this.noSteps
        }
    }
}


/**
 * Command used to open a source or a transform
 */
export class ConnectorRuleCommand {

    constructor(private readonly tenantService: TenantService) { }

    async upload() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.error('No editor');
            return;
        }

        const selection = getSelectionContent(editor);
        if (!selection) {
            return;
        }

        const context: WizardContext = {};
        let client: ISCClient | undefined = undefined;

        const tenantStep = new QuickPickTenantStep(
            this.tenantService,
            async (wizardContext) => {
                client = new ISCClient(
                    wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
            },
            "upload a connector rule")

        const values = await runWizard({
            title: "Upload a connector rule",
            hideStepCount: false,
            promptSteps: [
                new QuickPickUpdateExistingRuleStep(
                    [ // update existing rule
                        tenantStep,
                        new QuickPickPromptStep({
                            name: "rule",
                            options: {
                                matchOnDetail: true
                            },
                            items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => mapRulesToPickItems(await client.getConnectorRules()),
                            project: (value: vscode.QuickPickItem) => mapPickItemToRule(value)
                        })
                    ],
                    [ // New rule
                        tenantStep,
                        askRuleName(),
                        askRuleType()
                    ]
                )
            ]
        }, context);
        
        if (values === undefined) { return; }

        let newUri: vscode.Uri;
        const answer = values["answer"]
        const rule = values["rule"]

        rule.sourceCode.script = selection;
        try {
            if (answer.label === "Yes") {
                // UPDATE_RULE
                await client.updateConnectorRule(rule)
                newUri = buildResourceUri({
                    tenantName: values["tenant"].tenantName,
                    resourceType: RESOURCE_TYPES.connectorRule,
                    id: rule.id,
                    name: rule.name
                });
            } else {
                // NEW_RULE
                rule.name = values["ruleName"];
                const data = await client.createResource('/beta/connector-rules', JSON.stringify(rule));
                newUri = buildResourceUri({
                    tenantName: values["tenant"].tenantName,
                    resourceType: RESOURCE_TYPES.connectorRule,
                    id: data.id,
                    name: data.name
                });
            }
            openPreview(newUri)
            vscode.commands.executeCommand(commands.REFRESH_FORCED)
        } catch (error) {
            const errorMessage = `Could not ${answer.label === "Yes" ? "update" : "create"} the rule: ${error}`
            vscode.window.showErrorMessage(errorMessage)
        }

    }

    async validateScript() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.error('No editor');
            return;
        }

        const selection = getSelectionContent(editor);
        if (!selection) {
            return;
        }
        const tenantInfo = await chooseTenant(this.tenantService, 'Choose a tenant to validate the script');
        console.log("validateScript: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        const client = new ISCClient(tenantInfo.id, tenantInfo.tenantName);
        const res = await client.validateConnectorRule(selection);

        if (res.state === "OK") {
            await vscode.window.showInformationMessage('The script is valid');
        } else {
            let message = "Could not validate script. ";
            message += res.details?.map(detail => `${detail.line}:${detail.column}: ${detail.messsage}`).join('\n') ?? "";
            await vscode.window.showErrorMessage(message);
        }
    }

    async newRule(node: RulesTreeItem): Promise<void> {
        console.log("> NewConnectorRuleCommand.newRule", node);
        const context: WizardContext = {};
        context["tenant"] = this.tenantService.getTenant(node.tenantId);
        const values = await runWizard({
            title: "Creation of a new connector rule",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => { },
                    "create a new connector rule"),
                askRuleName(),
                askRuleType()
            ]
        }, context)

        if (values === undefined) { return; }

        const rule = values["rule"]
        const tenantName = values["tenant"].tenantName
        const ruleName = values["ruleName"]

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {
            rule.name = ruleName;
            const newUri = buildResourceUri({
                tenantName,
                resourceType: RESOURCE_TYPES.connectorRule,
                id: NEW_ID,
                name: ruleName
            })
            await createNewFile(newUri, rule);
        });
    }
}
