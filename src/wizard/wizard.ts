import { GoBackError, isUserCancelledError } from "../errors";
import { WizardContext } from "./wizardContext";
import { IWizardOptions } from "./wizardOptions";
import { WizardPromptStep } from "./wizardPromptStep";


/**
 * cf. https://github.com/microsoft/vscode-azuretools/blob/49b7438dccf3873f95fd9fc3ac19cd64d286428f/utils/src/wizard/AzureWizard.ts
 */

export class Wizard<T extends WizardContext> {
    public title: string | undefined;
    public currentStepId: string | undefined;
    private readonly _promptSteps: WizardPromptStep<T>[];
    private readonly _finishedPromptSteps: WizardPromptStep<T>[] = [];
    private readonly _context: T;
    private _stepHideStepCount?: boolean;
    private _wizardHideStepCount?: boolean;
    private _showLoadingPrompt?: boolean;

    public constructor(context: T, options: IWizardOptions<T>) {
        // reverse steps to make it easier to use push/pop
        this._promptSteps = (<WizardPromptStep<T>[]>options.promptSteps || []).reverse();
        this._promptSteps.forEach(s => { s.effectiveTitle = options.title; });
        this._context = context;
        this._wizardHideStepCount = options.hideStepCount;
        this._showLoadingPrompt = options.showLoadingPrompt;
    }

    public get hideStepCount(): boolean {
        return !!(this._wizardHideStepCount || this._stepHideStepCount);
    }

    public get currentStep(): number {
        return this._finishedPromptSteps.filter(s => s.prompted).length + 1;
    }

    public get totalSteps(): number {
        return this._finishedPromptSteps.filter(s => s.prompted).length + this._promptSteps.filter(s => s.shouldPrompt(this._context)).length + 1;
    }

    public get showBackButton(): boolean {
        return this.currentStep > 1;
    }

    public get showTitle(): boolean {
        return this.totalSteps > 1;
    }

    public getCachedInputBoxValue(): any | undefined {
        return this.currentStepId ? this._context[this.currentStepId] : undefined;
    }

    public async prompt(): Promise<void> {
        let step: WizardPromptStep<T> | undefined = this._promptSteps.pop();
        while (step) {
            step.reset();
            this.title = step.effectiveTitle;
            this._stepHideStepCount = step.hideStepCount;

            if (step.configureBeforePrompt) {
                await step.configureBeforePrompt(this._context);
            }

            if (step.shouldPrompt(this._context)) {
                try {
                    this.currentStepId = getEffectiveStepId(step);
                    await step.prompt(this, this._context);
                    step.prompted = true;
                    step.onWayback = false;
                } catch (err) {
                    if (err instanceof GoBackError) {
                        step = this.goBack(step);
                        continue;
                    } else {
                        throw err;
                    }
                } finally {
                    this.currentStepId = undefined;
                }
            }

            if (step.getSubWizard) {

                const subWizard: IWizardOptions<T> | void = await step.getSubWizard(this._context);
                if (subWizard) {
                    this.addSubWizard(step, subWizard);
                }
            }

            if (step.afterPrompt) {
                await step.afterPrompt(this._context);
            }

            this._finishedPromptSteps.push(step);
            step = this._promptSteps.pop();
        }
    }

    private addSubWizard(step: WizardPromptStep<T>, subWizard: IWizardOptions<T>): void {
        step.hasSubWizard = true;

        if (subWizard.promptSteps) {
            subWizard.promptSteps = subWizard.promptSteps.filter(s1 => {
                return s1.supportsDuplicateSteps || !this._finishedPromptSteps.concat(this._promptSteps).some(s2 => getEffectiveStepId(s1) === getEffectiveStepId(s2));
            });
            this._promptSteps.push(...<WizardPromptStep<T>[]>subWizard.promptSteps.reverse());
            step.numSubPromptSteps = subWizard.promptSteps.length;
            subWizard.promptSteps.forEach(s => { (<WizardPromptStep<T>>s).effectiveTitle = subWizard.title || step.effectiveTitle; });
        }
    }

    private goBack(currentStep: WizardPromptStep<T>): WizardPromptStep<T> {
        let step: WizardPromptStep<T> | undefined = currentStep;
        do {
            this._promptSteps.push(step);
            step = this._finishedPromptSteps.pop();
            step?.undo?.(this._context);
            if (!step) {
                throw new GoBackError();
            }

            if (step.hasSubWizard) {
                removeFromEnd(this._promptSteps, step.numSubPromptSteps);
            }
        } while (!step.prompted);
        // let key: keyof T = step.id;
        // delete this._context[key];
        step.onWayback = true;
        return step;
    }

}

function getEffectiveStepId<T extends WizardContext>(step: WizardPromptStep<T>): string {
    return step.id || step.constructor.name;
}

function removeFromEnd<T>(array: T[], n: number): void {
    array.splice(n * -1, n);
}

export async function runWizard<T extends WizardContext>(options: IWizardOptions<T>, context?: T): Promise<T|undefined> {
    if (!context) {
        context = {} as T;
    }
    const wizard = new Wizard(context, options);
    try {
        await wizard.prompt();
    } catch (err) {
        if (isUserCancelledError(err)) {
            return undefined;
        } else {
            throw err;
        }
    }
    console.log("< runWizard",  { context });
    return context;
}
