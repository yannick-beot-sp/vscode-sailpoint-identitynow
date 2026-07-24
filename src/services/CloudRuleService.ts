import {
    ExportPayloadBetaIncludeTypesBeta,
    ImportOptionsBetaIncludeTypesBeta,
    ObjectExportImportOptionsBeta,
    SpConfigExportResultsBeta,
    SpConfigJobBetaStatusBeta,
} from 'sailpoint-api-client';
import * as vscode from 'vscode';
import { waitForImportJob } from '../commands/spconfig-import/utils';
import { delay } from '../utils';
import { ISCClient } from './ISCClient';

export interface CloudRuleSummary {
    id: string;
    name: string;
    type?: string;
    description?: string;
}

export interface CloudRuleLookup {
    id?: string;
    name?: string;
}

export interface SpConfigObjectBeta {
    object: any;
    self: {
        id: string;
        name: string;
        type: string;
    };
}

const RULE_OBJECT_TYPE = ExportPayloadBetaIncludeTypesBeta.Rule;

export class CloudRuleService {
    private static readonly instances = new Map<string, CloudRuleService>();

    private cachedRules: CloudRuleSummary[] | null = null;
    private cachedExportData: SpConfigExportResultsBeta | null = null;

    private constructor(
        private readonly client: ISCClient,
        private readonly tenantDisplayName: string
    ) { }

    public static getInstance(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string
    ): CloudRuleService {
        if (!CloudRuleService.instances.has(tenantId)) {
            CloudRuleService.instances.set(
                tenantId,
                new CloudRuleService(new ISCClient(tenantId, tenantName), tenantDisplayName)
            );
        }
        return CloudRuleService.instances.get(tenantId)!;
    }

    public resetCache(): void {
        this.cachedRules = null;
        this.cachedExportData = null;
    }

    public async listCloudRules(): Promise<CloudRuleSummary[]> {
        if (this.cachedRules !== null) {
            return this.cachedRules;
        }

        const data = await this.exportRulesWithProgress(
            `Loading cloud rules from ${this.tenantDisplayName}...`
        );
        this.cachedExportData = data;
        this.cachedRules = this.mapExportToSummaries(data);
        return this.cachedRules;
    }

    public async getCloudRule(lookup: CloudRuleLookup): Promise<SpConfigObjectBeta> {
        if (lookup.name) {
            const byName = await this.getCloudRuleByName(lookup.name);
            if (byName) {
                return byName;
            }
        }
        if (lookup.id) {
            return await this.getCloudRuleById(lookup.id, lookup.name);
        }
        throw new Error('Cloud rule not found: id or name is required');
    }

    public async getCloudRuleById(id: string, name?: string): Promise<SpConfigObjectBeta> {
        const cached = this.findCachedConfigObject({ id, name });
        if (cached) {
            return cached;
        }

        const data = await this.exportRulesWithProgress(
            `Fetching cloud rule from ${this.tenantDisplayName}...`,
            { [RULE_OBJECT_TYPE]: { includedIds: [id] } }
        );
        const configObject = this.findConfigObject(data, { id, name });
        if (!configObject) {
            throw new Error(`Could not find cloud rule with id ${id}`);
        }
        return configObject;
    }

    public async getCloudRuleByName(name: string): Promise<SpConfigObjectBeta | undefined> {
        const cached = this.findCachedConfigObject({ name });
        if (cached) {
            return cached;
        }

        const data = await this.exportRulesWithProgress(
            `Fetching cloud rule from ${this.tenantDisplayName}...`,
            { [RULE_OBJECT_TYPE]: { includedNames: [name] } }
        );
        return this.findConfigObject(data, { name });
    }

    public getScriptFromConfigObject(configObject: SpConfigObjectBeta | any): string {
        const ruleObject = configObject?.object ?? configObject;
        return ruleObject?.sourceCode?.script ?? ruleObject?.body ?? ruleObject?.script ?? '';
    }

    public async importCloudRule(configObject: SpConfigObjectBeta): Promise<void> {
        await this.importCloudRuleConfig(configObject);
    }

    public async importCloudRuleConfig(configObject: SpConfigObjectBeta): Promise<void> {
        const importData = this.buildImportPayload([configObject]);
        await this.importWithProgress(importData);
        this.resetCache();
    }

    public buildConfigObjectFromRuleData(
        ruleData: any,
        self?: { id?: string; name?: string }
    ): SpConfigObjectBeta {
        return {
            object: ruleData,
            self: {
                id: self?.id ?? ruleData?.id ?? '',
                name: self?.name ?? ruleData?.name ?? '',
                type: 'RULE',
            },
        };
    }

    private mapExportToSummaries(data: SpConfigExportResultsBeta): CloudRuleSummary[] {
        return (data.objects ?? [])
            .filter((entry) => entry.self?.type === 'RULE')
            .map((entry) => ({
                id: entry.self!.id!,
                name: entry.self!.name!,
                type: entry.object?.type,
                description: entry.object?.description,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    private findCachedConfigObject(lookup: CloudRuleLookup): SpConfigObjectBeta | undefined {
        if (!this.cachedExportData) {
            return undefined;
        }
        return this.findConfigObject(this.cachedExportData, lookup);
    }

    private findConfigObject(
        data: SpConfigExportResultsBeta,
        lookup: CloudRuleLookup
    ): SpConfigObjectBeta | undefined {
        return (data.objects ?? []).find((entry) => {
            if (entry.self?.type !== 'RULE') {
                return false;
            }
            if (lookup.name && entry.self.name === lookup.name) {
                return true;
            }
            if (lookup.id && entry.self.id === lookup.id) {
                return true;
            }
            return false;
        }) as SpConfigObjectBeta | undefined;
    }

    private buildImportPayload(configObjects: SpConfigObjectBeta[]): string {
        return JSON.stringify({ objects: configObjects });
    }

    private async exportRulesWithProgress(
        title: string,
        objectOptions: { [key: string]: ObjectExportImportOptionsBeta } = {}
    ): Promise<SpConfigExportResultsBeta> {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable: false,
        }, async (_task, token) => {
            return await this.executeExportJob([RULE_OBJECT_TYPE], objectOptions, token);
        });
    }

    private async executeExportJob(
        objectTypes: ExportPayloadBetaIncludeTypesBeta[],
        objectOptions: { [key: string]: ObjectExportImportOptionsBeta },
        token: vscode.CancellationToken
    ): Promise<SpConfigExportResultsBeta> {
        const jobId = await this.client.startExportJob(objectTypes, objectOptions);

        let jobStatus;
        do {
            if (token.isCancellationRequested) {
                throw new Error('Cloud rule export cancelled');
            }
            await delay(1000);
            jobStatus = await this.client.getExportJobStatus(jobId);
        } while (
            jobStatus.status === SpConfigJobBetaStatusBeta.NotStarted
            || jobStatus.status === SpConfigJobBetaStatusBeta.InProgress
        );

        if (jobStatus.status !== SpConfigJobBetaStatusBeta.Complete) {
            throw new Error(`Could not export cloud rules: ${(jobStatus as any).message ?? jobStatus.status}`);
        }

        return await this.client.getExportJobResult(jobId);
    }

    private async importWithProgress(data: string): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing cloud rule to ${this.tenantDisplayName}...`,
            cancellable: false,
        }, async (_task, token) => {
            const jobId = await this.client.startImportJob(data, {
                includeTypes: [ImportOptionsBetaIncludeTypesBeta.Rule],
            });
            const jobStatus = await waitForImportJob(this.client, jobId, token);
            const importJobResult = await this.client.getImportJobResult(jobId);
            const result = { ...importJobResult, ...jobStatus };

            const errors: string[] = [];
            const ruleResults = result.results?.RULE;
            ruleResults?.errors?.forEach((element: any) => {
                errors.push(
                    element.details?.exceptionMessage
                    ?? element.detail?.exceptionMessage
                    ?? element.text
                );
            });

            if (errors.length > 0) {
                throw new Error(errors.join('. '));
            }
            if (result.status === 'FAILED') {
                throw new Error((result as any).message ?? 'Cloud rule import failed');
            }
        });
    }
}
