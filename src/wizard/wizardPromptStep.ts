import { Wizard } from "./wizard";
import { WizardContext } from "./wizardContext";
import { IWizardOptions } from "./wizardOptions";

export abstract class WizardPromptStep<T extends WizardContext>  {
    public hideStepCount: boolean = false;
    public supportsDuplicateSteps: boolean = false;
    public effectiveTitle: string | undefined;
    public hasSubWizard = false;
    public numSubPromptSteps!: number;
    public propertiesBeforePrompt!: string[];
    public prompted = false;
    public id?: string;

    public abstract prompt(wizard: Wizard<T>, wizardContext: T): Promise<void>;

    public getSubWizard?(wizardContext: T): Promise<IWizardOptions<T> | undefined>;
    public undo?(wizardContext: T): void;

    public configureBeforePrompt?(wizardContext: T): Promise<void>;
    public shouldPrompt(wizardContext: T): boolean {
        return true;
    }

    public reset(): void {
        this.hasSubWizard = false;
        this.prompted = false;
    }
}
