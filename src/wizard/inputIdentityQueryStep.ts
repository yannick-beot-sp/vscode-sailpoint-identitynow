import { requiredValidator } from "../validator/requiredValidator.js";
import { InputPromptStep } from "./inputPromptStep.js";
import { WizardContext } from "./wizardContext.js";

export class InputIdentityQueryStep extends InputPromptStep<WizardContext> {
    constructor(name = "ownerQuery", displayName = "owner",) {
        super({
            name,
            displayName,
            options: {
                validateInput: (s: string) => { return requiredValidator.validate(s); },
                learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-identity-data"
            }
        });
    }
}