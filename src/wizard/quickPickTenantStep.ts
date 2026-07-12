import { validateTenantReadonly } from "../commands/validateTenantReadonly";
import { UserCancelledError } from "../errors";
import { TenantInfoQuickPickItem } from "../models/TenantInfoQuickPickItem";
import { TenantService } from "../services/TenantService";
import { QuickPickPromptStep } from "./quickPickPromptStep";
import { WizardContext } from "./wizardContext";

export class QuickPickTenantStep extends QuickPickPromptStep<WizardContext, TenantInfoQuickPickItem> {
    constructor(
        tenantService: TenantService,
        afterPrompt: (wizardContext: WizardContext) => Promise<void>,
        actionName?: string,
        /**
         * Key used to store the selected tenant in the wizard context.
         * Defaults to "tenant". Use a different key (e.g. "targetTenant")
         * when a wizard needs to prompt for more than one tenant.
         */
        contextKey: string = "tenant"
    ) {
        super({
            name: contextKey,
            skipIfOne: true,
            items: async (context: WizardContext): Promise<TenantInfoQuickPickItem[]> => {
                const tenants = tenantService.getTenants();
                // Compute properties for QuickPickItem
                const tenantQuickPickItems = tenants
                    .map(obj => ({ ...obj, label: obj?.name, detail: obj?.tenantName }));
                return tenantQuickPickItems;
            },

        });
        this.afterPrompt = async (wizardContext: WizardContext) => {
            if (actionName !== undefined && !(await validateTenantReadonly(tenantService, wizardContext[contextKey].id, actionName))) {
                throw new UserCancelledError()
            }

            if (afterPrompt) {
                await afterPrompt(wizardContext)
            }
        };
    }
}