import { InputBoxOptions } from "vscode";
import { WizardContext } from "./wizardContext";
import { Validator } from "../validator/validator";

/**
 * Provides additional options for input boxes used in Azure Extensions
 */
export interface ExtInputBoxOptions extends Omit<InputBoxOptions, 'validateInput'> {
    /**
     * Optional property that will display a ? button in the input window that opens a url when clicked
     */
    learnMoreLink?: string;

    /**
     * Optional default value
     */
    default?: string;

    /**
         * An optional function that will be called to validate input and to give a hint
         * to the user.
         *
         * @param value The current value of the input box.
         * @returns Either a human-readable string which is presented as an error message or an {@link InputBoxValidationMessage}
         *  which can provide a specific message severity. Return `undefined`, `null`, or the empty string when 'value' is valid.
         */
    validateInput?: Validator | ((value: string) => string | undefined | null | Thenable<string | undefined | null>);


    /**
     * Handler after prompt
     * @param wizardContext 
     * @returns 
     */
    afterPrompt?: (wizardContext: WizardContext) => Promise<void>;

    shouldPrompt?: (wizardContext: WizardContext) => boolean
}