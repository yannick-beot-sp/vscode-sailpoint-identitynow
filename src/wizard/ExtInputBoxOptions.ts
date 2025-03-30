import { InputBoxOptions } from "vscode";
import { WizardContext } from "./wizardContext";

/**
 * Provides additional options for input boxes used in Azure Extensions
 */
export interface ExtInputBoxOptions extends InputBoxOptions {
    /**
     * Optional property that will display a ? button in the input window that opens a url when clicked
     */
    learnMoreLink?: string;

    /**
     * Optional default value
     */
    default?: string;


    /**
     * Handler after prompt
     * @param wizardContext 
     * @returns 
     */
    afterPrompt?: (wizardContext: WizardContext) => Promise<void>;

    shouldPrompt?: (wizardContext: WizardContext) => boolean
}