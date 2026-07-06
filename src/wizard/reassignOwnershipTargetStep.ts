import { WizardPromptStep } from "./wizardPromptStep";
import { WizardContext } from "./wizardContext";
import { IWizardOptions } from "./wizardOptions";
import { InputPromptStep } from "./inputPromptStep";
import { InputIdentityQueryStep } from "./inputIdentityQueryStep";
import { QuickPickIdentityStep } from "./quickPickIdentityStep";
import { ISCClient } from "../services/ISCClient";
import { REASSIGN_MODE_CHOOSE } from "./quickPickReassignModeStep";
import { requiredValidator } from "../validator/requiredValidator";
import {
    ReassignableObjectType,
    TYPE_REQUIRES_REASON,
    allModeCacheKey,
    listOwnedObjects,
    normalizeToArray,
    objectsContextKey
} from "../models/ReassignOwnership";

/**
 * Runs after all per-type pickers (in "choose" mode -- there are none to wait for in
 * "all" mode) have been prompted. No UI of its own (shouldPrompt always false); its
 * getSubWizard() tallies how many objects were actually selected/found across the
 * selected types and:
 *  - if there's nothing to reassign at all, sets context["noObjectsFound"] and injects
 *    no further steps -- the command shows a warning instead of asking for a new owner.
 *  - otherwise, injects the new-owner search pair and, if needed, the reason input.
 *
 * For "all" mode, the per-type counts have to be fetched here to decide; the results
 * are cached in context (allModeCacheKey) so the execution step reuses them instead of
 * fetching the same objects a second time.
 */
export class ReassignOwnershipTargetStep extends WizardPromptStep<WizardContext> {
    constructor(
        private readonly getISCClient: () => ISCClient,
        private readonly selectedTypes: ReassignableObjectType[]
    ) {
        super();
    }

    public shouldPrompt(): boolean {
        return false;
    }

    public async prompt(): Promise<void> {
        // no-op: this step only exists to compute getSubWizard()
    }

    public async getSubWizard(context: WizardContext): Promise<IWizardOptions<WizardContext> | undefined> {
        const client = this.getISCClient();
        const sourceId = context["sourceIdentityId"];
        const mode = context["reassignMode"];

        let totalCount = 0;
        let reasonRequiredCount = 0;
        for (const type of this.selectedTypes) {
            let count: number;
            if (mode === REASSIGN_MODE_CHOOSE) {
                count = normalizeToArray(context[objectsContextKey(type)]).length;
            } else {
                const objects = await listOwnedObjects(client, type, sourceId);
                context[allModeCacheKey(type)] = objects;
                count = objects.length;
            }
            totalCount += count;
            if (TYPE_REQUIRES_REASON.has(type)) {
                reasonRequiredCount += count;
            }
        }

        if (totalCount === 0) {
            context["noObjectsFound"] = true;
            return { promptSteps: [] };
        }

        const promptSteps: WizardPromptStep<WizardContext>[] = [
            new InputIdentityQueryStep("newOwnerQuery", "new owner"),
            new QuickPickIdentityStep("new owner", this.getISCClient, "newOwner", "newOwnerQuery")
        ];

        if (reasonRequiredCount > 0) {
            promptSteps.push(new InputPromptStep({
                name: "reassignReason",
                displayName: "reassignment reason",
                options: {
                    prompt: "Enter a reason/comment for reassigning pending certifications and/or pending approvals",
                    placeHolder: "Reason",
                    validateInput: (s: string) => requiredValidator.validate(s)
                }
            }));
        }

        return { promptSteps };
    }
}
