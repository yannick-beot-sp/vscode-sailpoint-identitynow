import * as vscode from 'vscode';

import { ISCClient } from '../services/ISCClient';
import { CSVReader } from '../services/CSVReader';
import { UserCancelledError } from '../errors';
import { error } from 'console';
import { Index, Search } from 'sailpoint-api-client';

const VALID_REVIEWER_ATTRIBUTES = ["id", "name", "email"]
const VALID_ITEM_TYPES = ["IDENTITY", "ENTITLEMENT", "ACCESS_PROFILE", "ROLE", "ALL"]
const VALID_ITEM_SELECTOR_TYPES = ["id", "name", "query", "all"]

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
    isAllItems: boolean
}

export class CustomReviewerImporter {
    readonly client: ISCClient;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private campaignName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);
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
                task.report({ increment: incr, message: `Processing line ${processedLines}` });
                try {
                    // Confirm reviewer values
                    if (!data.reviewerValue) {
                        throw new error(`reviewerValue is empty`)
                    }
                    if (!data.reviewerAttribute || VALID_REVIEWER_ATTRIBUTES.indexOf(data.reviewerAttribute) === -1) {
                        throw new error(`Invalid reviewerAttribute. Accepted values: ${JSON.stringify(VALID_REVIEWER_ATTRIBUTES)}`)
                    }
                    // Confirm itemType value
                    if (!data.itemType || VALID_ITEM_TYPES.indexOf(data.itemType) === -1) {
                        throw new error(`Invalid itemType. Accepted values: ${JSON.stringify(VALID_ITEM_TYPES)}`)
                    }
                    // Confirm itemSelector values unless using itemType:ALL
                    if (data.itemType !== "ALL") {
                        if (!data.itemSelectorType || VALID_ITEM_SELECTOR_TYPES.indexOf(data.itemSelectorType) === -1) {
                            throw new error(`Invalid itemSelectorType. Accepted values: ${JSON.stringify(VALID_ITEM_SELECTOR_TYPES)}`)
                        }
                        // Confirm itemSelectorValue unless using itemSelectorType:all
                        if (data.itemSelectorType !== "all") {
                            if (!data.itemSelectorValue) {
                                throw new error(`itemSelectorValue is empty`)
                            }
                            // Confirm not using itemSelectorType name with itemType ENTITLEMENT
                            if (data.itemType === "ENTITLEMENT" && data.itemSelectorType === "name") {
                                throw new error(`'itemSelectorType:${data.itemSelectorType}' is not supported with 'itemType:${data.itemType}'`)
                            }
                        }
                    }

                    // Find an active reviewer using the supplied attribute/value
                    const identityFilter = `${data.reviewerAttribute === "name" ? "alias" : data.reviewerAttribute} eq "${data.reviewerValue}"`
                    const findReviewerResult = await this.client.listIdentities({ filters: identityFilter })
                    let reviewerId: string
                    // only expecting one result but just in case fetching the first active identity
                    for (const reviewer of findReviewerResult.data) {
                        if (reviewer.attributes['identityState'] === "ACTIVE") {
                            reviewerId = reviewer.id
                            break
                        }
                    }
                    if (!reviewerId) {
                        throw new error(`Unable to find an active reviewer using the Identities API filter: ${identityFilter}`)
                    }

                    let itemIds = []
                    const isAllItems = data.itemType === "ALL" || data.itemSelectorType === "all" || data.itemSelectorValue === "*"
                    // Only get Item IDs if not using ANY/all/* selectors
                    if (!isAllItems) {
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
                            throw new error(`No items found using 'itemType:${data.itemType}' and 'itemSelector:${data.itemSelectorType}'`)
                        }
                    }

                    // Populate the custom coverage record and add to the return list
                    let customReviewerCoverageRecord: CustomReviewerCoverage = {
                        reviewerId: reviewerId,
                        itemType: data.itemType,
                        itemIds: itemIds,
                        isAllItems: isAllItems
                    }
                    customReviewerCoverageRecords.push(customReviewerCoverageRecord)
                    result.success++;
                } catch (error: any) {
                    result.error++;
                    const errorMessage = (error instanceof Error) ? error.message : error.toString();
                    console.log(`> CustomReviewerImporter.importFile: Invalid configuration in Custom Reviewer line ${processedLines}: ${errorMessage}`);
                }
            });
        } catch { }
        const message = `${processedLines} line(s) imported. ${result.success} sucessfully imported. ${result.error} invalid line(s).`;

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
            case "IDENTITY":
                const identity = await this.client.getIdentityByName(itemName)
                if (identity) {
                    return identity.id
                }
                break
            case "ACCESS_PROFILE":
                const accessProfile = await this.client.getAccessProfileByName(itemName)
                if (accessProfile) {
                    return accessProfile.id
                }
                break
            case "ENTITLEMENT":
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
            case "IDENTITY":
                searchIndex.push(Index.Identities)
                break
            case "ENTITLEMENT":
                searchIndex.push(Index.Entitlements)
                break
            case "ACCESS_PROFILE":
                searchIndex.push(Index.Accessprofiles)
                break
            case "ROLE":
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
}