import { WizardPromptStep } from "./wizardPromptStep";
import { WizardContext } from "./wizardContext";
import { IWizardOptions } from "./wizardOptions";
import { QuickPickObjectsByTypeStep } from "./quickPickObjectsByTypeStep";
import { ReassignOwnershipTargetStep } from "./reassignOwnershipTargetStep";
import { ISCClient } from "../services/ISCClient";
import { REASSIGN_MODE_CHOOSE } from "./quickPickReassignModeStep";
import { ReassignableObjectType, REASSIGNABLE_OBJECT_TYPES } from "../models/ReassignOwnership";

/**
 * Orchestrator step with no UI of its own (shouldPrompt always returns false).
 * Its only role is to compute, from the previous 2 steps' answers, the per-type
 * picker steps (only in "choose" mode), followed by ReassignOwnershipTargetStep
 * which itself decides -- once those pickers have actually run -- whether to ask
 * for a new owner at all.
 *
 * Wizard.prompt() invokes getSubWizard() right after prompt() regardless of whether
 * shouldPrompt() returned true (see wizard.ts), so this works without showing any UI.
 */
export class ReassignOwnershipPlanStep extends WizardPromptStep<WizardContext> {
    constructor(private readonly getISCClient: () => ISCClient) {
        super();
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async prompt(): Promise<void> {
        // no-op: this step only exists to compute getSubWizard()
    }

    public async getSubWizard(context: WizardContext): Promise<IWizardOptions<WizardContext> | undefined> {
        const rawTypes: string[] = Array.isArray(context["objectTypes"])
            ? context["objectTypes"]
            : [context["objectTypes"]];
        const selectedTypes = rawTypes
            .slice()
            .sort((a, b) => REASSIGNABLE_OBJECT_TYPES.indexOf(a as ReassignableObjectType) - REASSIGNABLE_OBJECT_TYPES.indexOf(b as ReassignableObjectType)) as ReassignableObjectType[];

        const promptSteps: WizardPromptStep<WizardContext>[] = [];

        if (context["reassignMode"] === REASSIGN_MODE_CHOOSE) {
            for (const type of selectedTypes) {
                promptSteps.push(new QuickPickObjectsByTypeStep(type, this.getISCClient));
            }
        }
        // else: REASSIGN_MODE_ALL -> no per-type UI; ReassignOwnershipTargetStep fetches
        // every owned object of each selected type directly to decide & cache for execution.

        promptSteps.push(new ReassignOwnershipTargetStep(this.getISCClient, selectedTypes));

        return { promptSteps };
    }
}
