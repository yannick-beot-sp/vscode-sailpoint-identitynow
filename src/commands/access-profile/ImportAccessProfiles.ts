import * as vscode from 'vscode';
import { IdentityNowClient } from "../../services/IdentityNowClient";
import { isEmpty } from 'lodash';
import { GenericCSVReader } from '../../services/GenericCSVReader';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { AccessProfilesTreeItem } from '../../models/IdentityNowTreeItem';

interface AccessProfileImportResult {
    success: number
    error: number
}

interface AccessProfileCSVRecord {
    name: string
    description: string 
    enabled: boolean
    requestable: boolean
    source: string
    owner: string
    entitlements: string
    commentsRequired: boolean
    denialCommentsRequired: boolean
    revokeCommentsRequired: string
    revokeDenialCommentsRequired: string
    revokeApprovalSchemes: string
    approvalSchemes: string
}

export class AccessProfileImporterCommand {

    async execute(node?: AccessProfilesTreeItem): Promise<void> {
        console.log("> AccessProfileImporterCommand.execute");
        if (node === undefined) {
            console.error("AccessProfileImporterCommand: invalid item", node);
            throw new Error("AccessProfileImporterCommand: invalid item");
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined ) { return; }

        const accessProfileImporter = new AccessProfileImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            0,
            fileUri
        );
        await accessProfileImporter.importFileWithProgression();
    }
}

export class AccessProfileImporter {
    readonly client: IdentityNowClient;
    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private sourceName: string,
        private sourceId: string,
        private sourceCCId: number,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing access profiles to ${this.sourceName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccessProfileImporter.importFile");
        const csvReader = new GenericCSVReader(this.fileUri.fsPath);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        const result: AccessProfileImportResult = {
            success: 0,
            error: 0
        };

        // Get the Sources to use for lookup of Id
        const sources = await this.client.getSources();

        await csvReader.processLine(async (data: AccessProfileCSVRecord) => {
            
            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                console.log('Missing name in file');
                return;
            }

            if (isEmpty(data.enabled)) {
                data.enabled = false;
            }

            if (isEmpty(data.requestable)) {
                data.requestable = false;
            }

            if (isEmpty(data.source)) {
                result.error++;
                console.log('Missing source in file');
                return;
            }

            if (isEmpty(data.owner)) {
                result.error++;
                console.log('Missing owner in file');
                return;
            }

            if (isEmpty(data.commentsRequired)) {
                data.commentsRequired = false;
            }

            if (isEmpty(data.denialCommentsRequired)) {
                data.denialCommentsRequired = false;
            }

            if (isEmpty(data.revokeCommentsRequired)) {
                data.commentsRequired = false;
            }

            if (isEmpty(data.revokeDenialCommentsRequired)) {
                data.denialCommentsRequired = false;
            }

            // Enrich source Id
            const sourceId = this.lookupSourceId(sources, data.source);
            if (isEmpty(sourceId)) {
                result.error++;
                console.log('Cannot find source');
                return;
            }

            // Enrich Owner Id
            const owner = await this.client.getIdentity(data.owner);
            if (isEmpty(owner)) {
                result.error++;
                console.log('Cannot find owner');
                return;
            }
            const ownerId = owner.id;

            let outputEntititlements: any = [];

            if (!isEmpty(data.entitlements)) {
                // Get entitlements for source
                const sourceEntitlements = await this.client.getEntitlementsBySource(sourceId);
                const entitlementsArray = data.entitlements.split(';');

                if (entitlementsArray.length > 0) {
                    for (let entInd = 0; entInd < entitlementsArray.length; entInd++) {
                        const ent = entitlementsArray[entInd];
                        let entitlementId = '';

                        for (let index = 0; index < sourceEntitlements.length; index++) {
                            const sent = sourceEntitlements[index];
                            if (sent.name.trim() === ent.trim()) {
                                entitlementId = sent.id;
                            }
                        }

                        if (entitlementId.length > 0) {
                            outputEntititlements.push({
                                "id": entitlementId,
                                "type": "ENTITLEMENT"
                            });
                        }
                    }
                }
            }

            let approverJson:any[] = [];

            const governanceGroups = await this.client.getGovernanceGroups();

            if (!isEmpty(data.approvalSchemes)) {
                const approversList = data.approvalSchemes.split(';');
                for (let index=0; index < approversList.length; index++) {
                    const approver = approversList[index];
                    console.log("Approver: " + approver);
                    let approverObj: any = {
                        "approverType": approver
                    };

                    if (!(approver === 'APP_OWNER' || approver === 'OWNER' || approver === 'SOURCE_OWNER' || approver === 'MANAGER')) {
                        approverObj.approverType = 'GOVERNANCE_GROUP';

                        const governanceGroupId = this.lookupGovernanceGroupId(governanceGroups, approver);
                        if (isEmpty(governanceGroupId)) {
                            result.error++;
                            console.log('Cannot find governance group');
                            return;
                        }
                        approverObj.approverId = governanceGroupId;
                    }

                    approverJson.push(approverObj);
                }
            }

            let revokeApproverJson: any[] = [];

            if (!isEmpty(data.revokeApprovalSchemes)) {
                const approversList = data.revokeApprovalSchemes.split(';');
                for (let index=0; index < approversList.length; index++) {
                    const approver = approversList[index];
                    console.log("Approver: " + approver);
                    let approverObj: any = {
                        "approverType": approver
                    };

                    if (!(approver === 'APP_OWNER' || approver === 'OWNER' || approver === 'SOURCE_OWNER' || approver === 'MANAGER')) {
                        approverObj.approverType = 'GOVERNANCE_GROUP';

                        const governanceGroupId = this.lookupGovernanceGroupId(governanceGroups, approver);
                        if (isEmpty(governanceGroupId)) {
                            result.error++;
                            console.log('Cannot find governance group');
                            return;
                        }
                        approverObj.approverId = governanceGroupId;
                    }

                    revokeApproverJson.push(approverObj);
                }
            }

            // Fix for carriage returns in the description field.
            data.description = data.description.replaceAll('\\r\\n', '\r\n').replaceAll('\\r', '\r').replaceAll('\\n', '\n');

            const accessProfilePayload = {
                "name": data.name,
                "description": data.description, // need to add description at some point
                "enabled": data.enabled,
                "owner": {
                    "id": ownerId,
                    "type": "IDENTITY",
                    "name": data.owner
                },
                "source": {
                    "id": sourceId,
                    "type": "SOURCE",
                    "name": data.source
                },
                "accessRequestConfig": {
                    "commentsRequired": data.commentsRequired,
                    "denialCommentsRequired": data.denialCommentsRequired,
                    "approvalSchemes": approverJson
                },
                "revocationRequestConfig": {
                    "commentsRequired": data.revokeCommentsRequired,
                    "denialCommentsRequired": data.revokeDenialCommentsRequired,
                    "approvalSchemes": revokeApproverJson
                },
                "entitlements": outputEntititlements
            };

            approverJson = [];

            try {
                await this.client.createResource('/v3/access-profiles', JSON.stringify(accessProfilePayload));
                result.success++;
            } catch (error) {
                result.error++;
                console.error(error);
            }
        });

        const message = `${nbLines} line(s) processed. ${result.success} sucessfully import. ${result.error} error(s).`;

        if (result.error === nbLines) {
            vscode.window.showErrorMessage(message);
        } else if (result.error > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }
    }

    protected lookupSourceId(sources: any, sourceName: string) {
        if (sources !== undefined && sources instanceof Array) {
			for (let source of sources) {
                console.log(sourceName);
                if (source.name.trim() === sourceName.trim()) {
                    return source.id;
                }
            }
        }
        return null;
    }

    protected lookupGovernanceGroupId(governanceGroups: any, governanceGroup: string) {
        if (governanceGroups !== undefined && governanceGroups instanceof Array) {
			for (let group of governanceGroups) {
                console.log(`${group.name} === ${governanceGroup}`);
                if (group.name.trim() === governanceGroup.trim()) {
                    console.log('Found Governance Group!');
                    return group.id;
                }
            }
        }
        return null;
    }
}