import { WizardContext } from "./wizardContext";
import { WizardPromptStep } from "./wizardPromptStep";

export interface IWizardOptions<T extends WizardContext> {
    /**
     * The steps to prompt for user input, in order
     */
    promptSteps?: WizardPromptStep<T>[];
    
    /**
     * A title used when prompting
     */
    title?: string;

    /**
     * If true, step count will not be displayed for the entire wizard. Defaults to false.
     */
    hideStepCount?: boolean;

    /**
    * If true, a loading prompt will be displayed if there are long delays between wizard steps.
    */
    showLoadingPrompt?: boolean;
}