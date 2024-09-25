import * as vscode from 'vscode';

import { ServiceDeskTreeItem, SourceTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { TenantService } from '../../services/TenantService';
import { WizardContext } from '../../wizard/wizardContext';
import { runWizard } from '../../wizard/wizard';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep';
import { QuickPickPromptStep } from '../../wizard/quickPickPromptStep';
import { LOG_LEVELS, LOGGING_CLASSES } from '../../models/Logging';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { Validator } from '../../validator/validator';

const durationValidator = new Validator({
    required: true,
    min: 5,
    max: 1440,
    regexp: "^\\d+$",
    errorMessages: {
        regexp: "You must enter an number"
    }
});


export class EnableLoggingCommand {

    constructor(private readonly tenantService: TenantService) { }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem | ServiceDeskTreeItem) {

        console.log("> EnableLoggingCommand.execute")
        const context: WizardContext = {}

        // if the command is called from the Tree View
        if (node !== undefined) {

            if (LOGGING_CLASSES.find(x => x.connector === node.type) === undefined) {
                vscode.window.showWarningMessage(`Could not find any logger for ${node.type}`)
                return
            }

            context["tenant"] = this.tenantService.getTenant(node.tenantId);
            context["source"] = {
                id: node.id!,
                name: node.label!
            }
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Enable logging",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),
                new QuickPickSourceStep(() => { return client!; }),
                new QuickPickPromptStep({
                    name: "logLevel",
                    items: LOG_LEVELS
                }),
                new InputPromptStep({
                    name: "duration",
                    options: {
                        prompt: "Duration in minutes for log configuration to remain in effect before resetting to defaults?",
                        default: "60",
                        validateInput: (s: string) => { return durationValidator.validate(s); }

                    }
                }),
            ]
        }, context);
        
        if (values === undefined) { return; }

        let loggers = LOGGING_CLASSES.find(x => x.connector === values["source"].type)

        if (loggers === undefined) {
            vscode.window.showWarningMessage(`Could not find any logger for ${values["source"].type}`)
            return
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Set  ${values["logLevel"].label} log level for ${values["source"].name}...`,
            cancellable: false
        }, async (task, token) => {
            const source = await client.getSourceById(values["source"].id)
            //  Object.fromEntries() turns key-value pairs (an array with two elements) into an object.
            const logLevels = Object.fromEntries(
                loggers.loggingClasses.map(className => [className, values["logLevel"].label])
            );

            client.updateLogConfiguration(source.cluster.id,
                values["duration"],
                logLevels)
        })
            .then(() => {
                vscode.window.showInformationMessage(
                    `Log level updated successfully for ${values["source"].name}`
                )
            }, async (err) => {
                console.error(`Could not update the log level updated for ${values["source"].name}`);
                console.error(err);
                vscode.window.showErrorMessage(
                    `Could not update the log level updated for ${values["source"].name}; ${err}`
                )
            });
    }
}






