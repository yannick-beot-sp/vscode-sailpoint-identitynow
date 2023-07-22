import * as vscode from 'vscode';
import { IdentityNowClient } from "../../services/IdentityNowClient";
import { isEmpty } from 'lodash';
import { GenericCSVReader } from '../../services/GenericCSVReader';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';

interface RolesImportResult {
    success: number
    error: number
}

interface RoleCSVRecord {
    name: string
    description: string 
    enabled: boolean
    requestable: boolean
    owner: string
    commentsRequired: boolean
    denialCommentsRequired: boolean
    approvalSchemes: string
    revokeCommentsRequired: string
    revokeDenialCommentsRequired: string
    revokeApprovalSchemes: string
    accessProfiles: string
}

export class RoleImporterCommand {

    async execute(node?: RolesTreeItem): Promise<void> {
        console.log("> RoleImporterCommand.execute");
        if (node === undefined) {
            console.error("RoleImporterCommand: invalid item", node);
            throw new Error("RoleImporterCommand: invalid item");
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined ) { return; }

        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            0,
            fileUri
        );
        await roleImporter.importFileWithProgression();
    }
}

export class RoleImporter {
    readonly client: IdentityNowClient;

    logWriter: CSVLogWriter | undefined;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private roleName: string,
        private sourceId: string,
        private sourceCCId: number,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing roles to ${this.roleName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> RoleImporter.importFile");
        const csvReader = new GenericCSVReader(this.fileUri.fsPath);

        try{
            this.logWriter = new CSVLogWriter(this.fileUri.fsPath);
        } catch (_exc: any) {
            console.log(_exc);
            vscode.window.showErrorMessage(_exc);
            return;
        }

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        let processedLines = 0;

        const result: RolesImportResult = {
            success: 0,
            error: 0
        };

        await csvReader.processLine(async (data: RoleCSVRecord) => {

            processedLines++;

            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                const nameMessage = `Missing attribute 'name' in record`;
                await this.writeLog(processedLines, 'role', CSVLogWriterLogType.ERROR, nameMessage);
                vscode.window.showErrorMessage(nameMessage);
                return;
            }

            const apName = data.name;

            if (isEmpty(data.enabled)) {
                data.enabled = false;
            }

            if (isEmpty(data.requestable)) {
                data.requestable = false;
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

            if (isEmpty(data.owner)) {
                result.error++;
                const owMessage = `Missing 'owner' in CSV`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, owMessage);
                vscode.window.showErrorMessage(owMessage);
                return;
            }

            // Enrich Owner Id
            const owner = await this.client.getIdentity(data.owner);
            
            if (isEmpty(owner)) {
                console.log('TESTTEST');
                result.error++;
                const owMessage = `Unable to find owner with name '${data.owner}' in IDN`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, owMessage);
                vscode.window.showErrorMessage(owMessage);
                return;
            }

            const ownerId = owner.id;

            let outputAccessProfiles: any = [];

            if (!isEmpty(data.accessProfiles)) {
                const accessProfiles = await this.client.getAccessProfiles();
                const accessProfilesArray = data.accessProfiles.split(';');

                if (accessProfilesArray.length > 0) {
                    for (let appInd = 0; appInd < accessProfilesArray.length; appInd++) {
                        const app = accessProfilesArray[appInd];
                        let accessProfileId = '';

                        for (let index = 0; index < accessProfiles.length; index++) {
                            const sapp = accessProfiles[index];
                            if (sapp.name.trim() === app.trim()) {
                                accessProfileId = sapp.id;
                            }
                        }

                        if (accessProfileId.length > 0) {
                            outputAccessProfiles.push({
                                "id": accessProfileId,
                                "type": "ACCESS_PROFILE"
                            });
                        }
                        else {
                            const etMessage = `Unable to find role with name '${app.trim()}' in IDN, Role will be still created.`;
                            await this.writeLog(processedLines, apName, CSVLogWriterLogType.WARNING, etMessage);
                            vscode.window.showWarningMessage(etMessage);
                        }
                    }
                }
            }

            let approverJson: any[] = [];

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
                            const ggMessage = `Cannot find governance group with name '${approver}' in IDN, AP will be still created.`;
                            await this.writeLog(processedLines, apName, CSVLogWriterLogType.WARNING, ggMessage);
                            vscode.window.showWarningMessage(ggMessage);
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
                            const ggMessage = `Cannot find governance group with name '${approver}' in IDN, AP will be still created.`;
                            await this.writeLog(processedLines, apName, CSVLogWriterLogType.WARNING, ggMessage);
                            vscode.window.showWarningMessage(ggMessage);
                            return;
                        }
                        approverObj.approverId = governanceGroupId;
                    }

                    revokeApproverJson.push(approverObj);
                }
            }

            // Fix for carriage returns in the description field.
            data.description = data.description.replaceAll('\\r\\n', '\r\n').replaceAll('\\r', '\r').replaceAll('\\n', '\n');

            const rolePayload = {
                "name": data.name.trim(),
                "description": data.description,
                "enabled": data.enabled,
                "owner": {
                    "id": ownerId,
                    "type": "IDENTITY",
                    "name": data.owner
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
                "accessProfiles": outputAccessProfiles
            };

            try {
                await this.client.createResource('/v3/roles', JSON.stringify(rolePayload));
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.SUCCESS, `Successfully imported role '${data.name}'`);
                result.success++;
            } catch (error: any) {
                result.error++;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot create role: '${error.message}' in IDN`);
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

        try {
            this.logWriter?.end();
        } catch (_exc) {
            // do nothing hopefully
        }
    }

    protected lookupGovernanceGroupId(governanceGroups: any, governanceGroup: string) {
        if (governanceGroups !== undefined && governanceGroups instanceof Array) {
			for (let group of governanceGroups) {
                console.log(`${group.name} === ${governanceGroup}`);
                if (group.name.trim() === governanceGroup.trim()) {
                    return group.id;
                }
            }
        }
        return null;
    }

    private async writeLog(csvLine: number | string |  null, objectName: string, type: CSVLogWriterLogType, message: string) {
        let logMessage = '';
        if (this.logWriter) {
            if (!csvLine) {
                csvLine = '0';
            }
            const lnStr = '' + csvLine; // Convert to string 'old skool casting ;-)' ;-)
            logMessage =  `[CSV${lnStr.padStart(8, '0')}][${objectName}] ${message}`;
            await this.logWriter.writeLine(type, logMessage);
        }
    }
}