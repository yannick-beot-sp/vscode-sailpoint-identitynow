import { InputBoxOptions } from "vscode";

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
}