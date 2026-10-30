import * as vscode from "vscode";
import { SourceTreeItem } from "../../models/ISCTreeItem.js";
import { ISCClient } from "../../services/ISCClient.js";
import { TenantService } from "../../services/TenantService.js";
import * as commands from "../constants.js";
import { isTenantReadonly, validateTenantReadonly } from "../validateTenantReadonly.js";
import {
    findAuthoritativeProfiles, findIdentityAttributesUsingSource, findProfileMappings,
    findTransformsReferencingSource, getSourceAccessProfiles, getSourceApplications
} from "../../dependency-webview/SourceDependencies.js";
import { waitForTask } from "./sourceUtils.js";

const MAX_LISTED = 10;

interface DeletableItem {
    id: string;
    label: string;
}

interface DeletableGroup {
    title: string;
    items: DeletableItem[];
    remove: (id: string) => Promise<{ id?: string } | void>;
}

export class DeleteSourceWithDependenciesCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node: SourceTreeItem): Promise<void> {
        console.log("> DeleteSourceWithDependenciesCommand.execute", node?.label);
        if (!node) {
            return;
        }
        const sourceName = node.label as string;
        const sourceId = node.id!;
        const client = new ISCClient(node.tenantId, node.tenantName);

        // Order matters: identity profiles (their lifecycle states go with them), applications,
        // access profiles, then the source itself.
        let groups: DeletableGroup[];
        try {
            groups = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Looking for dependencies of ${sourceName}...`,
                cancellable: false
            }, async () => {
                const [allProfiles, applications, accessProfiles, allTransforms, identityAttributes] = await Promise.all([
                    client.getAllIdentityProfiles(),
                    getSourceApplications(client, sourceId),
                    getSourceAccessProfiles(client, sourceId),
                    client.getTransforms(),
                    client.getIdentityAttributes(),
                ]);
                const identityProfiles = findAuthoritativeProfiles(allProfiles, sourceId);
                const deletedProfileIds = new Set(identityProfiles.map(p => p.id));

                // Transforms pulling data from the source (possibly nested)
                const transforms = findTransformsReferencingSource(allTransforms, sourceName);
                const transformNames = new Set(transforms.map(t => t.name));

                // Identity profile attribute mappings using the source or one of the deleted transforms
                // (the mappings of the deleted identity profiles go with them)
                const mappings: DeletableItem[] = findProfileMappings(
                    allProfiles.filter(p => !deletedProfileIds.has(p.id)), sourceName, transformNames)
                    .map(({ profile, mapping }) => ({
                        id: `${profile.id}\n${mapping.identityAttributeName}`,
                        label: `${profile.name}: ${mapping.identityAttributeName}`
                    }));

                const attributes = findIdentityAttributesUsingSource(identityAttributes, sourceId)
                    .map(a => ({ id: a.name, label: a.displayName ? `${a.displayName} (${a.name})` : a.name }));

                const toItems = (list: { id?: string, name?: string }[]) =>
                    list.map(o => ({ id: o.id!, label: o.name ?? o.id! }));
                // Order matters: what references the source or the transforms must be removed first
                return [
                    { title: "Identity Profiles", items: toItems(identityProfiles), remove: (id: string) => client.deleteIdentityProfile(id) },
                    {
                        title: "Identity Profile mappings", items: mappings, remove: (id: string) => {
                            const [profileId, attributeName] = id.split("\n");
                            return client.removeIdentityProfileMapping(profileId, attributeName);
                        }
                    },
                    { title: "Identity Attribute sources", items: attributes, remove: (id: string) => client.removeSourceFromIdentityAttribute(id, sourceId) },
                    { title: "Transforms", items: toItems(transforms), remove: (id: string) => client.deleteTransformById(id) },
                    { title: "Applications", items: toItems(applications), remove: (id: string) => client.deleteApplication(id) },
                    { title: "Access Profiles", items: toItems(accessProfiles), remove: (id: string) => client.deleteAccessProfile(id) },
                ].filter(g => g.items.length > 0);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Cannot list dependencies of ${sourceName}: ${error?.message ?? error}`);
            return;
        }

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId);
        if (isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `delete source ${sourceName} with its dependencies`))) {
            return;
        }

        let detail = groups.length > 0
            ? `The following dependencies will be permanently deleted with the source:`
            : `The source has no dependency to delete.`;
        for (const group of groups) {
            const names = group.items.slice(0, MAX_LISTED).map(i => `   • ${i.label}`);
            if (group.items.length > MAX_LISTED) {
                names.push(`   • ... and ${group.items.length - MAX_LISTED} more`);
            }
            detail += `\n\n${group.title} (${group.items.length}):\n${names.join("\n")}`;
        }

        const answer = await vscode.window.showWarningMessage(
            `Delete source ${sourceName} with dependencies?`,
            { modal: true, detail },
            "Delete");
        if (answer !== "Delete") {
            console.log("< DeleteSourceWithDependenciesCommand.execute: cancelled");
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Deleting ${sourceName}...`,
                cancellable: true
            }, async (progress, token) => {
                const waitAndCheck = async (task: { id?: string } | void, what: string) => {
                    const taskId = task ? task.id : undefined;
                    if (!taskId) {
                        return;
                    }
                    const result = await waitForTask(client, taskId, token);
                    if (result === null) {
                        throw new Error(`Deletion of ${what} is still running or was cancelled.`);
                    }
                    if (result.completionStatus !== "SUCCESS" as any) {
                        throw new Error(`Deletion of ${what} ended with status ${result.completionStatus}: ${result.messages?.[0]?.key ?? ""}`);
                    }
                };

                for (const group of groups) {
                    for (const item of group.items) {
                        progress.report({ message: `${group.title}: ${item.label}` });
                        try {
                            await waitAndCheck(await group.remove(item.id), item.label);
                        } catch (error: any) {
                            throw new Error(`Cannot delete ${item.label} (${group.title}): ${error?.response?.data?.messages?.[0]?.text ?? error?.message ?? error}. The source was not deleted.`);
                        }
                    }
                }

                progress.report({ message: "Source" });
                await waitAndCheck(await client.deleteSource(sourceId), `source ${sourceName}`);
                vscode.window.showInformationMessage(`Successfully deleted source ${sourceName} and its dependencies`);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(error?.message ?? String(error));
        } finally {
            vscode.commands.executeCommand(commands.REFRESH_FORCED);
        }
    }
}
