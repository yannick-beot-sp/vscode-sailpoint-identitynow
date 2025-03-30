import { WizardPromptStep } from "./wizardPromptStep";
import { capitalizeFirstLetter, convertPascalCase2SpaceBased, isEmpty } from "../utils/stringUtils";
import { showInputBox } from "../utils/showInputBox";
import { Wizard } from "./wizard";
import { ExtInputBoxOptions } from "./ExtInputBoxOptions";


export interface InputPromptStepOptions<T> {
    name: string
    displayName?: string
    options?: ExtInputBoxOptions
}


export class InputPromptStep<WizardContext> extends WizardPromptStep<WizardContext> {

    private readonly _options: ExtInputBoxOptions;
    private readonly _name: string;
    private readonly _displayName!: string;
    constructor(
        inputPromptStepOptions: InputPromptStepOptions<WizardContext>
    ) {
        super();
        this._name = inputPromptStepOptions.name;
        this.id = this._name;

        this._displayName = inputPromptStepOptions.displayName ?? convertPascalCase2SpaceBased(this._name);

        this._options = {
            ...inputPromptStepOptions.options
        };

        if (isEmpty(inputPromptStepOptions.options?.prompt)) {
            this._options.prompt = `Enter the ${this._displayName.toLowerCase()} name`;
        }

        if (isEmpty(inputPromptStepOptions.options?.placeHolder)) {
            this._options.placeHolder = `${capitalizeFirstLetter(this._displayName)} name`;
        }

        if (this._options.afterPrompt) {
            this.afterPrompt = this._options.afterPrompt
        }

        if (this._options.shouldPrompt) {
            this.shouldPrompt = this._options.shouldPrompt
        }

    }

    public async prompt(wizard: Wizard<WizardContext>, wizardContext: WizardContext): Promise<void> {
        const options = {...this._options}
        if (wizardContext[this.id]) {
            options.default = wizardContext[this.id]
        }
        wizardContext[this._name] = await showInputBox(wizard, options);
    }
}