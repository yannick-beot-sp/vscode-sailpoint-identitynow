import * as vscode from 'vscode';
import * as commands from "../constants.js";
import { TenantService } from "../../services/TenantService.js";
import { SegmentContentTreeItem, SegmentMemberTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import { runWizard } from '../../wizard/wizard.js';
import { InputPromptStep } from '../../wizard/inputPromptStep.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { WizardPromptStep } from '../../wizard/wizardPromptStep.js';
import { QuickPickAccessProfileStep } from '../../wizard/quickPickAccessProfileStep.js';
import { QuickPickEntitlementStep } from '../../wizard/quickPickEntitlementStep.js';
import { QuickPickRoleStep } from '../../wizard/quickPickRoleStep.js';
import { isTenantReadonly, validateTenantReadonly } from '../validateTenantReadonly.js';
import { confirm } from '../../utils/vsCodeHelpers.js';
import { isNotBlank } from '../../utils/stringUtils.js';
import type { SegmentMemberType } from '../../utils/segmentPatch.js';

interface MemberSettings {
    /** Singular, used in messages */
    noun: string;
    queryName: string;
    resultName: string;
    prompt: string;
    learnMoreLink: string;
    pickStep: (getClient: () => ISCClient) => WizardPromptStep<WizardContext>;
}

const MEMBER_SETTINGS: Record<SegmentMemberType, MemberSettings> = {
    "access-profiles": {
        noun: "access profile",
        queryName: "accessProfileQuery",
        resultName: "accessProfiles",
        prompt: "Enter a query to find access profiles",
        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-access-profile-data",
        pickStep: getClient => new QuickPickAccessProfileStep({ getISCClient: getClient }),
    },
    "entitlements": {
        noun: "entitlement",
        queryName: "entitlementQuery",
        resultName: "entitlements",
        prompt: "Enter a query to find entitlements",
        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-entitlement-data",
        pickStep: getClient => new QuickPickEntitlementStep(getClient),
    },
    "roles": {
        noun: "role",
        queryName: "roleQuery",
        resultName: "roles",
        prompt: "Enter a query to find roles",
        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-role-data",
        pickStep: getClient => new QuickPickRoleStep(getClient),
    },
};

/**
 * Commands to change the content of a segment: add access profiles, entitlements or roles to it,
 * or remove one from it. The segment is referenced by the `segments` property of these objects.
 */
export class SegmentContentCommand {

    constructor(private readonly tenantService: TenantService) { }

    async addItems(node: SegmentContentTreeItem): Promise<void> {
        console.log("> SegmentContentCommand.addItems", node);
        const settings = MEMBER_SETTINGS[node.memberType];
        const client = new ISCClient(node.tenantId, node.tenantName);

        if (isTenantReadonly(this.tenantService, node.tenantId)
            && !(await validateTenantReadonly(this.tenantService, node.tenantId, `add ${settings.noun}(s) to a segment`))) {
            console.log("< SegmentContentCommand.addItems: no add");
            return;
        }

        const values = await runWizard({
            title: `Add ${settings.noun}(s) to the segment`,
            hideStepCount: false,
            promptSteps: [
                new InputPromptStep({
                    name: settings.queryName,
                    options: {
                        prompt: settings.prompt,
                        placeHolder: "Enter search query",
                        learnMoreLink: settings.learnMoreLink,
                        validateInput: (s: string) => isNotBlank(s) ? undefined : "A query is required"
                    }
                }),
                settings.pickStep(() => client),
            ]
        }, {});

        if (values === undefined) { return; }

        // Wizard with skipIfOne=true does not always return an array
        let selected = values[settings.resultName];
        if (selected === undefined) { return; }
        if (!Array.isArray(selected)) {
            selected = [selected];
        }

        const failures: string[] = [];
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Adding ${settings.noun}(s) to the segment...`,
            cancellable: false
        }, async () => {
            for (const item of selected) {
                try {
                    await client.updateSegmentMembership(node.memberType, item.id, node.segmentId, "add");
                } catch (error) {
                    console.log(`Could not add ${item.name} to the segment`, error);
                    failures.push(item.name ?? item.id);
                }
            }
        });

        if (failures.length > 0) {
            vscode.window.showErrorMessage(`Could not add to the segment: ${failures.join(", ")}`);
        }
        await vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }

    async removeItem(node: SegmentMemberTreeItem): Promise<void> {
        console.log("> SegmentContentCommand.removeItem", node);
        const settings = MEMBER_SETTINGS[node.memberType];

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId);
        if ((isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `remove ${node.label} from the segment`)))
            || (!isReadOnly && !(await confirm(`Are you sure you want to remove the ${settings.noun} ${node.label} from the segment? The ${settings.noun} itself is not deleted.`)))) {
            console.log("< SegmentContentCommand.removeItem: no remove");
            return;
        }

        const client = new ISCClient(node.tenantId, node.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Removing ${settings.noun} from the segment...`,
            cancellable: false
        }, async () => {
            await client.updateSegmentMembership(node.memberType, node.resourceId, node.segmentId, "remove");
        });
        await vscode.commands.executeCommand(commands.REFRESH_FORCED, node.parentNode);
    }
}
