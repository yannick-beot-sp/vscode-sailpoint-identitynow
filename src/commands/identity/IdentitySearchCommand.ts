import * as vscode from 'vscode';
import { IdentityDefinitionTreeItem, SourceTreeItem } from '../../models/ISCTreeItem';
import { PathProposer } from '../../services/PathProposer';
import { askFile } from '../../utils/vsCodeHelpers';
import { BaseCSVExporter } from '../BaseExporter';
import { IdentityBeta,IdentitiesBetaApi,Configuration,PublicIdentitiesApi,LifecycleStatesApi } from 'sailpoint-api-client';
import { ISCClient } from '../../services/ISCClient';

import { runWizard } from '../../wizard/wizard';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { InputIdentityQueryStep } from '../../wizard/inputIdentityQueryStep';
import { QuickPickIdentityStep } from '../../wizard/quickPickIdentityStep';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { Validator } from '../../validator/validator';

import { TenantService } from "../../services/TenantService";

const identityNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});

export class IdentitySearchCommand {


    constructor(private readonly tenantService: TenantService) { }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(identitySearchItem?: IdentityDefinitionTreeItem) {
        console.log("> IdentitySearchCommand.execute");

        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (identitySearchItem !== undefined && identitySearchItem instanceof IdentityDefinitionTreeItem) {
            context["tenant"] = await this.tenantService.getTenant(identitySearchItem.tenantId);
        }

        let client: ISCClient | undefined = undefined;    

        const values = await runWizard({
            title: "Search for an Identity",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),
                new InputPromptStep({
                    name: "identityName",
                    options: {
                        prompt: "Enter the identity name or id",
                        placeHolder: "sailpoint.admin",
                        validateInput: (s: string) => { return identityNameValidator.validate(s); }
                    }
                }),
            ]
        }, context);

        console.log({ values });
        if (values === undefined) { return; }

        const result = client.getIdentityData(values);

        //identityApi.deleteIdentity
        //identityApi.getIdentity
        //identityApi.getIdentityOwnershipDetails
        //identityApi.listIdentities
        //identityApi.startIdentityProcessing
        //identityApi.synchronizeAttributesForIdentity

        //publicIdentityApi.getPublicIdentities

        //lcsApi.setLifecycleState()

        
        
        //await exporter.exportFileWithProgression();
    }
}




