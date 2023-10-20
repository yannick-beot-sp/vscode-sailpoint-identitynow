import { QuickPickItem, QuickPickItemKind, QuickPickOptions } from "vscode";
import { WizardPromptStep } from "./wizardPromptStep";
import { Wizard } from "./wizard";
import { isEmpty } from "../utils/stringUtils";
import { showQuickPick } from "../utils/showQuickPick";


export interface QuickPickPromptStepOptions<WizardContext, T extends QuickPickItem> {
    name: string
    displayName?: string
    options?: QuickPickOptions
    items: string[] | T[] | ((context: WizardContext) => string[] | T[] | Promise<string[] | T[]>)
    /**
     * Function that will be used to get values from picked item(s)
     */
    project?(value: T): any;
}

export class QuickPickPromptStep<WizardContext, T extends QuickPickItem> extends WizardPromptStep<WizardContext> {
    private readonly _options: QuickPickOptions;
    private readonly _name: string;
    private readonly _displayName!: string;
    private readonly _items: string[] | T[] | ((context: WizardContext) => string[] | T[] | Promise<string[] | T[]>);
    private _project?(value: T): any;

    constructor(quickPickPromptStepOptions: QuickPickPromptStepOptions<WizardContext, T>) {
        super();
        this._name = quickPickPromptStepOptions.name;
        this.id = this._name;

        this._displayName = quickPickPromptStepOptions.displayName ?? this._name.toLowerCase();

        this._options = {
            ...quickPickPromptStepOptions.options
        };

        if (isEmpty(quickPickPromptStepOptions.options?.placeHolder)) {
            if (quickPickPromptStepOptions.options?.canPickMany) {
                this._options.placeHolder = `Choose ${this._displayName}`;
            } else {
                this._options.placeHolder = `Choose one ${this._displayName}`;
            }
        }
        this._items = quickPickPromptStepOptions.items;
        this._project = quickPickPromptStepOptions.project;
    }

    public async prompt(wizard: Wizard<WizardContext>, wizardContext: WizardContext): Promise<void> {
        const items = await this.getPicks(wizardContext);
        let value: T | T[] | string | string[] = await showQuickPick(wizard, items, this._options);
        if (this._project) {
            if (this._options.canPickMany) {
                value = (value as T[]).map(this._project);
            } else {
                value = this._project(value as T);
            }
        } else {
            if (this._options.canPickMany) {
                value = (value as T[]).map(x => x.label);
            } else {
                value = (value as T).label;
            }
        }
        wizardContext[this._name] = value;
    }

    protected async getPicks(wizardContext: WizardContext): Promise<T[]> {
        let items = this._items;
        if (typeof this._items === 'function') {
            items = await this._items(wizardContext);
        }

        if (Array.isArray(items) && items.every(it => typeof it === 'string')) {
            // If passing strings, very likely that QuickPickItem is enough
            items = ((items as string[]).map(it => ({ label: it, picked: true } as QuickPickItem))) as T[];
        }

        return items as T[];

    }
}