import * as vscode from 'vscode';
import { IdentityNowClient } from "../../services/IdentityNowClient";
import { isEmpty } from 'lodash';
import { GenericCSVReader } from '../../services/GenericCSVReader';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { AccessProfilesTreeItem } from '../../models/IdentityNowTreeItem';
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';

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

    storedEntitlements: any = {};

    logWriter: CSVLogWriter | undefined;

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

        const result: AccessProfileImportResult = {
            success: 0,
            error: 0
        };

        // Get the Sources to use for lookup of Id
        const sources = await this.client.getSources();

        let processedLines = 0;

        await csvReader.processLine(async (data: AccessProfileCSVRecord) => {

            processedLines++;
            
            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                const nameMessage = `Missing attribute 'name' in record`;
                await this.writeLog(processedLines, 'Access Profile', CSVLogWriterLogType.ERROR, nameMessage);
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

            if (isEmpty(data.source)) {
                result.error++;
                const srcMessage = `Missing 'source' in CSV`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            if (isEmpty(data.owner)) {
                result.error++;
                const owMessage = `Missing 'owner' in CSV`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, owMessage);
                vscode.window.showErrorMessage(owMessage);
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
                const srcMessage = `Unable to find source with name '${data.source}' in IDN`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            // Enrich Owner Id
            const owner = await this.client.getIdentity(data.owner);
            if (isEmpty(owner)) {
                result.error++;
                const owMessage = `Unable to find owner with name '${data.owner}' in IDN`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, owMessage);
                vscode.window.showErrorMessage(owMessage);
                return;
            }
            const ownerId = owner.id;

            let outputEntititlements: any = [];

            if (!isEmpty(data.entitlements)) {
                // Get entitlements for source
                const sourceEntitlements = await this.getEntitlementsForSource(sourceId, data.source);
                const entitlementsArray = data.entitlements.split(';');

                if (entitlementsArray.length > 0) {
                    for (let entInd = 0; entInd < entitlementsArray.length; entInd++) {
                        const ent = entitlementsArray[entInd];
                        let entitlementId = '';

                        for (let index = 0; index < sourceEntitlements.length; index++) {
                            const sent = sourceEntitlements[index];
                            // console.log(`${sent.name.trim()} === ${ent.trim()}`);
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
                        else {
                            const etMessage = `Unable to find entitlement with name '${ent.trim()}' in IDN, AP will be still created.`;
                            await this.writeLog(processedLines, apName, CSVLogWriterLogType.WARNING, etMessage);
                            vscode.window.showWarningMessage(etMessage);
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
                    // console.log("Approver: " + approver);
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
                            continue;
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
                            continue;
                        }
                        approverObj.approverId = governanceGroupId;
                    }

                    revokeApproverJson.push(approverObj);
                }
            }

            // Fix for carriage returns in the description field.
            data.description = data.description.replaceAll('\\r\\n', '\r\n').replaceAll('\\r', '\r').replaceAll('\\n', '\n');

            const accessProfilePayload = {
                "name": data.name.trim(),
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
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.SUCCESS, `Successfully imported access profile '${data.name}'`);
                result.success++;
            } catch (error:any) {
                result.error++;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot create access profile: '${error.message}' in IDN`);
            }
        });

        const message = `${nbLines} line(s) processed. ${result.success} sucessfully imported. ${result.error} error(s).`;

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
                    return group.id;
                }
            }
        }
        return null;
    }

    protected async getEntitlementsForSource(sourceId: string, sourceName: string): Promise<any> {
        if (!this.storedEntitlements[sourceId]) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Retrieving entitlements for source '${sourceName}'...`,
                cancellable: false
            }, async (task, token) =>
                {
                    const entitlements = await this.client.getAllEntitlementsBySource(sourceId);
                    this.storedEntitlements[sourceId] = entitlements;
                    const count = this.storedEntitlements[sourceId].length;
                    vscode.window.showInformationMessage(`Found '${count}' entitlements for source '${sourceName}...`);
                }
            );
        }
        return await this.storedEntitlements[sourceId];
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