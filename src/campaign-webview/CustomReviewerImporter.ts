import * as vscode from 'vscode';
import * as tmp from "tmp";

import { ISCClient } from '../services/ISCClient';
import { CSVLogWriter, CSVLogWriterLogType } from '../services/CSVLogWriter';
import { CSVReader } from '../services/CSVReader';
import { UserCancelledError } from '../errors';
import { error } from 'console';
import { DtoType, Index, Search } from 'sailpoint-api-client';

const VALID_REVIEWER_ATTRIBUTES = ["id", "name", "email"]
const VALID_ITEM_TYPES = [DtoType.Identity.toString(), DtoType.Entitlement.toString(), DtoType.AccessProfile.toString(), DtoType.Role.toString()]
const VALID_ITEM_SELECTOR_TYPES = ["id", "name", "query"]

interface CustomReviewerImportResult {
    success: number
    error: number
}

interface CustomReviewerCSVRecord {
    reviewerAttribute: string,
    reviewerValue: string,
    itemType: string,
    itemSelectorType: string,
    itemSelectorValue: string
}

export interface CustomReviewerCoverage {
    reviewerId: string,
    itemType: string,
    itemIds: string[]
}

export class CustomReviewerImporter {
    readonly client: ISCClient;
    readonly logFilePath: string;
    readonly logWriter: CSVLogWriter;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private campaignName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);

        this.logFilePath = tmp.tmpNameSync({
            prefix: 'import-roles',
            postfix: ".log",
        });

        try {
            this.logWriter = new CSVLogWriter(this.logFilePath);
        } catch (_exc: any) {
            console.error(_exc);
            throw _exc;
        }
    }

    async readFileWithProgression(): Promise<CustomReviewerCoverage[]> {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing custom reviewer configuration for campaign ${this.campaignName}...`,
            cancellable: true
        }, async (task, token): Promise<CustomReviewerCoverage[]> => {
            return await this.readFile(task, token)
        }
        );
    }

    protected async readFile(task: any, token: vscode.CancellationToken): Promise<CustomReviewerCoverage[]> {
        console.log("> CustomReviewerImporter.importFile");
        const csvReader = new CSVReader<CustomReviewerCSVRecord>(this.fileUri.fsPath);
        console.log(`> CustomReviewerImporter.importFile: Importing file from ${this.fileUri.fsPath} for campaign ${this.campaignName}`);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        let processedLines = 0;

        const result: CustomReviewerImportResult = {
            success: 0,
            error: 0
        }

        const customReviewerCoverageRecords: CustomReviewerCoverage[] = []

        try {
            await csvReader.processLine(async (data: CustomReviewerCSVRecord) => {
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                processedLines++
                task.report({ increment: incr, message: `Line ${processedLines}` });
                try {
                    // Confirm we have required values
                    if (!data.reviewerValue) {
                        throw new error(`Missing reviewer value in line ${processedLines}`)
                    }
                    if (!data.itemSelectorValue) {
                        throw new error(`Missing item selector value in line ${processedLines}`)
                    }
                    if (!data.reviewerAttribute || VALID_REVIEWER_ATTRIBUTES.indexOf(data.reviewerAttribute) === -1) {
                        throw new error(`Invalid reviewer attribute in line ${processedLines}. Accepted values: ${JSON.stringify(VALID_REVIEWER_ATTRIBUTES)}`)
                    }
                    if (!data.itemSelectorType || VALID_ITEM_SELECTOR_TYPES.indexOf(data.itemSelectorType) === -1) {
                        throw new error(`Invalid item selector type in line ${processedLines}. Accepted values: ${JSON.stringify(VALID_ITEM_SELECTOR_TYPES)}`)
                    }
                    if (!data.itemType || VALID_ITEM_TYPES.indexOf(data.itemType) === -1) {
                        throw new error(`Invalid item type in line ${processedLines}. Accepted values: ${JSON.stringify(VALID_ITEM_TYPES)}`)
                    }

                    // Name match for Entitlements is not unique
                    if (data.itemType === DtoType.Entitlement.toString() && data.itemSelectorType === "name") {
                        throw new error(`Selector type name is not supported with item type ${DtoType.Entitlement}`)
                    }

                    // Find an active reviewer using the supplied attribute/value
                    const identityFilter = `${data.reviewerAttribute === "name" ? "alias" : data.reviewerAttribute} eq "${data.reviewerValue}"`
                    const findReviewerResult = await this.client.listIdentities({ filters: identityFilter })
                    let reviewerId: string
                    for (const reviewer of findReviewerResult.data) {
                        if (reviewer.attributes['identityState'] === "ACTIVE") {
                            // only expecting one result but just in case fetching the first active identity
                            reviewerId = reviewer.id
                            break
                        }
                    }
                    if (!reviewerId) {
                        throw new error(`Unable to find an active reviewer using the Identities API filter: ${identityFilter}`)
                    }

                    // Get Item IDs
                    let itemIds = []
                    switch (data.itemSelectorType) {
                        case "id":
                            itemIds.push(data.itemSelectorValue)
                            break
                        case "name":
                            let itemId = await this.findItemIdByName(data.itemType, data.itemSelectorValue)
                            if (itemId) {
                                itemIds.push(itemId)
                            }
                            break
                        case "query":
                            itemIds = await this.findItemIdsByQuery(data.itemType, data.itemSelectorValue)
                            break
                        default:
                            break
                    }
                    if (itemIds.length === 0) {
                        throw new error(`No items found using item selector in line ${processedLines}`)
                    }

                    // Populate the custom coverage record and add to the return list
                    let customReviewerCoverageRecord: CustomReviewerCoverage = {
                        reviewerId: reviewerId,
                        itemType: data.itemType,
                        itemIds: itemIds
                    }
                    customReviewerCoverageRecords.push(customReviewerCoverageRecord)
                    result.success++;
                } catch (error: any) {
                    result.error++;
                    const errorMessage = (error instanceof Error) ? error.message : error.toString();
                    console.log(`> CustomReviewerImporter.importFile: Unable to process Custom Reviewer line: '${errorMessage}'`);
                }
            });
        } catch { }
        const message = `${processedLines} line(s) processed. ${result.success} sucessfully processed. ${result.error} error(s).`;

        if (result.error === processedLines) {
            vscode.window.showErrorMessage(message);
        } else if (result.error > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }

        return customReviewerCoverageRecords
    }

    private async findItemIdByName(itemType: string, itemName: string): Promise<string> {
        switch (itemType) {
            case DtoType.Identity.toString():
                const identity = await this.client.getIdentityByName(itemName)
                if (identity) {
                    return identity.id
                }
                break
            case DtoType.AccessProfile.toString():
                const accessProfile = await this.client.getAccessProfileByName(itemName)
                if (accessProfile) {
                    return accessProfile.id
                }
                break
            case DtoType.Role.toString():
                const role = await this.client.getRoleByName(itemName)
                if (role) {
                    return role.id
                }
                break
            default:
                return
        }
        return

    }

    private async findItemIdsByQuery(itemType: string, query: string): Promise<string[]> {
        const searchIndex: Index[] = []
        switch (itemType) {
            case DtoType.Identity.toString():
                searchIndex.push(Index.Identities)
                break
            case DtoType.Entitlement.toString():
                searchIndex.push(Index.Entitlements)
                break
            case DtoType.AccessProfile.toString():
                searchIndex.push(Index.Accessprofiles)
                break
            case DtoType.Role.toString():
                searchIndex.push(Index.Roles)
                break
            default:
                return []
        }
        const search: Search = {
            indices: searchIndex,
            query: {
                query: query
            },
            sort: ["id"],
            queryResultFilter: {
                includes: ["id"]
            }
        }
        // Run Search API
        const searchResults = await this.client.search(search)
        if (!searchResults.length || searchResults.length === 0) {
            return []
        } else {
            // Return only list of IDs
            return searchResults.map(searchResult => searchResult.id)
        }
    }

    private async writeLog(csvLine: number | string | null, objectName: string, type: CSVLogWriterLogType, message: string) {
        let logMessage = '';
        if (this.logWriter) {
            if (!csvLine) {
                csvLine = '0';
            }
            const lnStr = '' + csvLine; // Convert to string 'old skool casting ;-)' ;-)
            logMessage = `[CSV${lnStr.padStart(8, '0')}][${objectName}] ${message}`;
            await this.logWriter.writeLine(type, logMessage);
        }
    }
}