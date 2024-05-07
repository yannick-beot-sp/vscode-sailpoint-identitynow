import { WizardPromptStep } from "./wizardPromptStep";
import { capitalizeFirstLetter, isEmpty } from "../utils/stringUtils";
import { showInputBox } from "../utils/showInputBox";
import { Wizard } from "./wizard";
import { ExtInputBoxOptions } from "./ExtInputBoxOptions";


export interface InputPromptStepOptions {
    name: string
    displayName?: string
    options?: ExtInputBoxOptions
}


export class InputPromptStep<WizardContext> extends WizardPromptStep<WizardContext> {

    private readonly _options: ExtInputBoxOptions;
    private readonly _name: string;
    private readonly _displayName!: string;
    constructor(
        inputPromptStepOptions: InputPromptStepOptions
    ) {
        super();
        this._name = inputPromptStepOptions.name;
        this.id = this._name;

        this._displayName = inputPromptStepOptions.displayName ?? this._name;


        this._options = {
            ...inputPromptStepOptions.options
        };

        if (isEmpty(inputPromptStepOptions.options?.prompt)) {
            this._options.prompt = `Enter the ${this._displayName.toLowerCase()} name`;
        }

        if (isEmpty(inputPromptStepOptions.options?.placeHolder)) {
            this._options.placeHolder = `${capitalizeFirstLetter(this._displayName)} name`;
        }
    }

    public async prompt(wizard: Wizard<WizardContext>, wizardContext: WizardContext): Promise<void> {
        wizardContext[this._name] = await showInputBox(wizard, this._options);
    }
}