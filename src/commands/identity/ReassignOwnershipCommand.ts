import * as vscode from 'vscode';
import { IdentitiesTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { runWizard } from '../../wizard/wizard';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickObjectTypeStep } from '../../wizard/quickPickObjectTypeStep';
import { QuickPickReassignModeStep, REASSIGN_MODE_ALL } from '../../wizard/quickPickReassignModeStep';
import { ReassignOwnershipPlanStep } from '../../wizard/reassignOwnershipPlanStep';
import {
    allModeCacheKey,
    listOwnedObjects,
    normalizeToArray,
    objectsContextKey,
    reassignOne,
    ReassignableObject,
    ReassignableObjectType,
    REASSIGNABLE_OBJECT_TYPES
} from '../../models/ReassignOwnership';

interface ReassignResult {
    type: ReassignableObjectType;
    id: string;
    name: string;
    status: "ok" | "error";
    error?: string;
}

export class ReassignOwnershipCommand {

    async execute(identityTreeItem?: IdentitiesTreeItem): Promise<void> {
        console.log("> ReassignOwnershipCommand.execute");
        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        const context: WizardContext = {
            sourceIdentityId: identityTreeItem.id,
            sourceIdentityName: identityTreeItem.label
        };

        const values = await runWizard({
            title: `Reassign ownership from ${identityTreeItem.label}`,
            hideStepCount: false,
            promptSteps: [
                new QuickPickObjectTypeStep(),
                new QuickPickReassignModeStep(),
                new ReassignOwnershipPlanStep(() => client),
            ]
        }, context);

        if (values === undefined) {
            return;
        }

        const objectTypes = normalizeToArray<string>(values["objectTypes"])
            .sort((a, b) => REASSIGNABLE_OBJECT_TYPES.indexOf(a as ReassignableObjectType) - REASSIGNABLE_OBJECT_TYPES.indexOf(b as ReassignableObjectType)) as ReassignableObjectType[];

        if (objectTypes.length === 0) {
            vscode.window.showInformationMessage("No object types selected; nothing to reassign.");
            return;
        }

        if (values["noObjectsFound"]) {
            vscode.window.showWarningMessage("No objects to reassign.");
            return;
        }

        const newOwner = values["newOwner"];
        if (newOwner.id === identityTreeItem.id) {
            vscode.window.showErrorMessage("The new owner must be different from the current owner.");
            return;
        }

        await this.performReassignment(client, identityTreeItem.id!, objectTypes, values);
    }

    private async performReassignment(
        client: ISCClient,
        sourceId: string,
        objectTypes: ReassignableObjectType[],
        values: WizardContext
    ): Promise<void> {
        const newOwnerId: string = values["newOwner"].id;
        const newOwnerName: string = values["newOwner"].name ?? values["newOwner"].label;
        const reassignMode: string = values["reassignMode"];
        const reason: string | undefined = values["reassignReason"];

        const results: ReassignResult[] = [];

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Reassigning ownership...",
            cancellable: false
        }, async (progress) => {
            for (const type of objectTypes) {
                progress.report({ message: type });

                let targets: ReassignableObject[];
                if (reassignMode === REASSIGN_MODE_ALL) {
                    // Already fetched by ReassignOwnershipTargetStep to decide whether to
                    // even ask for a new owner -- reuse it instead of fetching again.
                    targets = values[allModeCacheKey(type)] ?? await listOwnedObjects(client, type, sourceId);
                } else {
                    const picked = normalizeToArray<any>(values[objectsContextKey(type)]);
                    targets = picked.map(x => ({ id: x.id, name: x.label ?? x.name }));
                }

                for (const target of targets) {
                    try {
                        await reassignOne(client, type, target.id, newOwnerId, reason);
                        results.push({ type, id: target.id, name: target.name, status: "ok" });
                    } catch (err: any) {
                        results.push({ type, id: target.id, name: target.name, status: "error", error: err.message ?? String(err) });
                    }
                }
            }
        });

        const successes = results.filter(r => r.status === "ok");
        const errors = results.filter(r => r.status === "error");

        if (successes.length > 0) {
            const summary = objectTypes
                .map(type => ({ type, count: successes.filter(r => r.type === type).length }))
                .filter(({ count }) => count > 0)
                .map(({ type, count }) => `${count} ${type}`)
                .join(", ");
            vscode.window.showInformationMessage(
                `${summary} reassigned to ${newOwnerName} successfully.`);
        }

        if (errors.length > 0) {
            const detail = errors.map(r => `${r.type} "${r.name}": ${r.error}`).join("\n");
            vscode.window.showWarningMessage(
                `${errors.length} object(s) failed to reassign to ${newOwnerName}.`,
                { detail }
            );
        }
    }
}
