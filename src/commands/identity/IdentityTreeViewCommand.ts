import * as vscode from 'vscode';
import { IdentityTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { formatAccountActivity, waitForAccountActivity } from './identityUtils';
import {
    compareUserLevels,
    getUserLevelCapabilityValue,
    isUserLevelAssigned,
    mergeUserLevels,
} from './identityUserLevels';

import { LifecycleState, UserLevelSummaryDTOV2025 } from '../../sailpointCompat';
interface LifecycleStateQuickPickItem extends vscode.QuickPickItem {
    lifecycleStateId: string;
}

interface UserLevelQuickPickItem extends vscode.QuickPickItem {
    capabilityValue: string;
}

export class IdentityTreeViewCommand {

    constructor() { }

    async deleteIdentity(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.deleteIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        vscode.window
            .showInformationMessage(`Are you sure you want to delete ${identityTreeItem.label}?`, "Yes", "No")
            .then(async (answer) => {
                if (answer === "Yes") {
                    const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
                    await client.deleteIdentity(identityTreeItem.id);
                    vscode.window.showInformationMessage("Identity Delete started");
                }
            })
    }

    async attSyncIdentity(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.attSyncIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        await client.syncIdentityAttributes(identityTreeItem.id);

        vscode.window.showInformationMessage("Identity Att Sync started");
    }

    async processIdentity(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.processIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        await client.processIdentity(identityTreeItem.id);

        vscode.window.showInformationMessage("Identity process started");
    }

    async inviteIdentity(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.inviteIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        try {
            const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
            await client.inviteIdentity(identityTreeItem.id!);
            vscode.window.showInformationMessage("Identity invite started");
        } catch (error: any) {
            vscode.window.showErrorMessage(`Could not invite identity: ${error.message ?? error}`);
        }
    }

    async setLifecycleState(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.setLifecycleState");

        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        const identityName = identityTreeItem.label as string;

        try {
            const { profileInfo, lifecycleStates } = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Loading lifecycle states...",
                    cancellable: false
                },
                async () => {
                    const info = await client.getIdentityProfileForIdentity(identityTreeItem.id!);
                    const states = (await client.getLifecycleStates(info.profileId))
                        .filter(state => state.enabled !== false);
                    return { profileInfo: info, lifecycleStates: states };
                }
            );

            if (lifecycleStates.length === 0) {
                vscode.window.showWarningMessage("No enabled lifecycle states found for this identity's profile.");
                return;
            }

            const items = this.buildLifecycleStateQuickPickItems(lifecycleStates, profileInfo.currentLifecycleState);
            const picked = await vscode.window.showQuickPick(items, {
                placeHolder: `Select lifecycle state for ${identityName}`,
                title: "Set lifecycle state"
            });
            if (picked === undefined) {
                return;
            }

            const pickedState = lifecycleStates.find(state => state.id === picked.lifecycleStateId);
            if (pickedState && this.isCurrentLifecycleState(pickedState, profileInfo.currentLifecycleState)) {
                vscode.window.showInformationMessage("Identity is already in this lifecycle state.");
                return;
            }

            const accountActivityId = await client.setIdentityLifecycleState(
                identityTreeItem.id!,
                picked.lifecycleStateId
            );

            if (!accountActivityId) {
                vscode.window.showInformationMessage("Lifecycle state update started");
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Updating lifecycle state for ${identityName}`,
                cancellable: true
            }, async (_progress, token) => {
                const activity = await waitForAccountActivity(client, accountActivityId, token);
                formatAccountActivity(activity, identityName, picked.label);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Could not set lifecycle state: ${error.message ?? error}`);
        }
    }

    async setUserLevel(identityTreeItem?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.setUserLevel");

        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        const identityName = identityTreeItem.label as string;

        try {
            const { userLevels, currentCapabilities } = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Loading user levels...",
                    cancellable: false
                },
                async () => {
                    const [customLevels, authUser] = await Promise.all([
                        client.listCustomUserLevels().catch(error => {
                            console.warn("Could not load custom user levels", error);
                            return [] as UserLevelSummaryDTOV2025[];
                        }),
                        client.getAuthUser(identityTreeItem.id!)
                    ]);
                    const currentCapabilities = authUser.capabilities ?? [];
                    return {
                        userLevels: mergeUserLevels(customLevels, currentCapabilities),
                        currentCapabilities
                    };
                }
            );

            if (userLevels.length === 0) {
                vscode.window.showWarningMessage("No user levels found");
                return;
            }

            const items = this.buildUserLevelQuickPickItems(userLevels, currentCapabilities);
            const picked = await vscode.window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: `Select user levels for ${identityName}`,
                title: "Set user level"
            });
            if (picked === undefined) {
                return;
            }

            const newCapabilities = picked.map(item => item.capabilityValue);
            if (this.areCapabilitySetsEqual(newCapabilities, currentCapabilities)) {
                vscode.window.showInformationMessage("Identity already has these user levels.");
                return;
            }

            await client.setAuthUserCapabilities(identityTreeItem.id!, newCapabilities);
            vscode.window.showInformationMessage("User levels updated");
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 404) {
                vscode.window.showErrorMessage("Could not set user level: identity has no auth user record yet.");
                return;
            }
            vscode.window.showErrorMessage(`Could not set user level: ${error.message ?? error}`);
        }
    }

    private buildUserLevelQuickPickItems(
        userLevels: UserLevelSummaryDTOV2025[],
        currentCapabilities: string[]
    ): UserLevelQuickPickItem[] {
        return userLevels
            .filter(level => getUserLevelCapabilityValue(level) !== "")
            .sort(compareUserLevels)
            .map(level => ({
                label: level.name ?? getUserLevelCapabilityValue(level),
                description: level.legacyGroup ?? (level.custom ? "Custom" : undefined),
                picked: isUserLevelAssigned(level, currentCapabilities),
                capabilityValue: getUserLevelCapabilityValue(level)
            }));
    }

    private areCapabilitySetsEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) {
            return false;
        }
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((value, index) => value === sortedB[index]);
    }

    private buildLifecycleStateQuickPickItems(
        lifecycleStates: LifecycleState[],
        currentLifecycleState?: string
    ): LifecycleStateQuickPickItem[] {
        return lifecycleStates
            .filter(state => state.id !== undefined)
            .map(state => {
            const isCurrent = this.isCurrentLifecycleState(state, currentLifecycleState);
            return {
                label: state.name ?? state.technicalName ?? state.id ?? "",
                description: state.description ?? undefined,
                detail: isCurrent ? "Current state" : undefined,
                lifecycleStateId: state.id!
            };
        });
    }

    private isCurrentLifecycleState(state: LifecycleState, currentLifecycleState?: string): boolean {
        if (!currentLifecycleState) {
            return false;
        }
        return state.technicalName === currentLifecycleState || state.name === currentLifecycleState;
    }
}
