import * as vscode from "vscode";
import { WizardPromptStep } from "./wizardPromptStep";
import { Wizard } from "./wizard";
import { WizardContext } from "./wizardContext";
import { chooseFileExtended } from "../utils/vsCodeHelpers";


export interface ChooseFileStepOptions {
    name: string
    displayName?: string
    options?: vscode.OpenDialogOptions
    /**
     * Handler after prompt
     * @param wizardContext 
     * @returns 
     */
    afterPrompt?: (wizardContext: WizardContext) => Promise<void>;
}


export class ChooseFileStep<WizardContext> extends WizardPromptStep<WizardContext> {

    constructor(
        private readonly stepOptions: ChooseFileStepOptions
    ) {
        super();
        this.id = this.stepOptions.name;
        this.afterPrompt = stepOptions.afterPrompt
    }

    public async prompt(wizard: Wizard<WizardContext>, wizardContext: WizardContext): Promise<void> {
        wizardContext[this.id] = await chooseFileExtended(this.stepOptions.options)
    }
}