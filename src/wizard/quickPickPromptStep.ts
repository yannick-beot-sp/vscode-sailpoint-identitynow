import { QuickPickItem, QuickPickItemKind, QuickPickOptions } from "vscode";
import { WizardPromptStep } from "./wizardPromptStep";
import { Wizard } from "./wizard";
import { convertPascalCase2SpaceBased, isEmpty } from "../utils/stringUtils";
import { showQuickPick } from "../utils/showQuickPick";
import { GoBackError } from "../errors";


export interface QuickPickPromptStepOptions<WizardContext, T extends QuickPickItem> {
    name: string
    displayName?: string
    options?: QuickPickOptions
    items: string[] | T[] | ((context: WizardContext) => string[] | T[] | Promise<string[] | T[]>)
    /**
     * Function that will be used to get values from picked item(s)
     */
    project?(value: T): any;

    /**
     * Strings are passed in the items. So expect to store in the context a string. 
     * Otherwise, store the QuickPickItem
     * It is possible to override this behavior by defining a custom _project
     */
    storeString?: boolean;

    skipIfOne?: boolean;

    shouldPrompt?: boolean | ((wizardContext: WizardContext) => boolean)
}

export class QuickPickPromptStep<WizardContext, T extends QuickPickItem> extends WizardPromptStep<WizardContext> {
    private readonly _options: QuickPickOptions;
    private readonly _name: string;
    private readonly _displayName!: string;
    private readonly _storeString!: boolean;
    private readonly _skipIfOne!: boolean;
    private readonly _items: string[] | T[] | ((context: WizardContext) => string[] | T[] | Promise<string[] | T[]>);
    private _project?(value: T): any;

    constructor(quickPickPromptStepOptions: QuickPickPromptStepOptions<WizardContext, T>) {
        super();
        this._name = quickPickPromptStepOptions.name;
        this.id = this._name;

        this._displayName = quickPickPromptStepOptions.displayName ?? convertPascalCase2SpaceBased(this._name).toLowerCase();

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
        this._storeString = quickPickPromptStepOptions.storeString ?? false;
        this._skipIfOne = quickPickPromptStepOptions.skipIfOne ?? false;
        if (this._storeString && !this._project) {
            this._project = (x: T) => { return x.label; };
        }

        if (quickPickPromptStepOptions.shouldPrompt !== undefined) {
            if (typeof quickPickPromptStepOptions.shouldPrompt === "boolean") {
                // @ts-ignore
                this.shouldPrompt = () => { return quickPickPromptStepOptions.shouldPrompt }
            } else {

                this.shouldPrompt = quickPickPromptStepOptions.shouldPrompt
            }
        }
    }

    public async prompt(wizard: Wizard<WizardContext>, wizardContext: WizardContext): Promise<void> {
        // special case as "await" will be done in showQuickPick
        const items = this.getPicks(wizardContext);
        try {

            let value: T | T[] | string | string[] = await showQuickPick(
                wizard,
                items,
                this._options,
                this._skipIfOne,
                this.onWayback
            );

            if (this._project) {
                if (this._options.canPickMany) {
                    value = (value as T[]).map(this._project);
                } else {
                    value = this._project(value as T);
                }
            }
            wizardContext[this._name] = value;
        } catch (err) {
            if (err instanceof GoBackError) {
                this.onWayback = false;
            }
            throw err;
        }
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