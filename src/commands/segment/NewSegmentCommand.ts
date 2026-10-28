import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService.js";
import { SegmentsTreeItem } from '../../models/ISCTreeItem.js';
import { NEW_ID } from '../../constants.js';
import { ISCClient } from '../../services/ISCClient.js';
import { getResourceUri } from '../../utils/UriUtils.js';
import { Segment } from 'sailpoint-api-client/dist/segments/api.js';
import { runWizard } from '../../wizard/wizard.js';
import { InputPromptStep } from '../../wizard/inputPromptStep.js';
import { Validator } from '../../validator/validator.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep.js';
import { InputIdentityQueryStep } from '../../wizard/inputIdentityQueryStep.js';
import { QuickPickIdentityStep } from '../../wizard/quickPickIdentityStep.js';
import { createNewFile } from '../../utils/vsCodeHelpers.js';
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const segmentTemplate: Segment = require('../../../snippets/segment.json');

const segmentNameValidator = new Validator({
    required: true,
});

/**
 * Command used to create a segment.
 * Opens a new unsaved document based on a template. Saving it creates the segment.
 */
export class NewSegmentCommand {

    constructor(private readonly tenantService: TenantService) { }

    async newSegment(segmentsTreeItem?: SegmentsTreeItem): Promise<void> {

        console.log("> NewSegmentCommand.newSegment", segmentsTreeItem);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (segmentsTreeItem !== undefined && segmentsTreeItem instanceof SegmentsTreeItem) {
            context["tenant"] = this.tenantService.getTenant(segmentsTreeItem.tenantId);
        }

        let client: ISCClient | undefined = undefined;
        const values = await runWizard({
            title: "Creation of a segment",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "create a segment"),
                new InputPromptStep({
                    name: "segment",
                    options: {
                        validateInput: (s: string) => { return segmentNameValidator.validate(s); }
                    }
                }),
                new InputIdentityQueryStep(),
                new QuickPickIdentityStep(
                    "segment owner",
                    () => { return client!; }
                ),
            ]
        }, context);

        if (values === undefined) { return; }

        // Deep copy of the template
        const newSegment: Segment = JSON.parse(JSON.stringify(segmentTemplate));

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {
            const name = values["segment"].trim();
            const tenantName = values["tenant"].tenantName;
            const newUri = getResourceUri(tenantName, 'segments', NEW_ID, name);

            newSegment.name = name;
            newSegment.owner = {
                id: values["owner"].id,
                name: values["owner"].name,
                type: "IDENTITY"
            };

            await createNewFile(newUri, newSegment);
        });
    }
}
