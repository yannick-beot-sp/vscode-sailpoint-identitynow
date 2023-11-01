import * as vscode from 'vscode';
import * as commands from '../commands/constants';
import { IdentityNowResourceTreeItem, IdentityProfileSorting, IdentityProfilesTreeItem } from "../models/IdentityNowTreeItem";

/**
 * Command used to open a source or a transform
 */
export class SortIdentityProfileCommand {

    async sortByName(node?: IdentityNowResourceTreeItem, nodes?: IdentityNowResourceTreeItem[]): Promise<void> {

        console.log("> SortIdentityProfileCommand.sortByName", node);
        // assessing that item is a SourceTreeItem
        if (node === undefined || !(node instanceof IdentityProfilesTreeItem)) {
            console.log("WARNING: SortIdentityProfileCommand.sortByName: invalid item", node);
            throw new Error("SortIdentityProfileCommand.sortByName: invalid item");
        }

        await this.sortBy(IdentityProfileSorting.name, node);
    }

    async sortByPriority(node?: IdentityNowResourceTreeItem, nodes?: IdentityNowResourceTreeItem[]): Promise<void> {

        console.log("> SortIdentityProfileCommand.sortByPriority", node);
        // assessing that item is a SourceTreeItem
        if (node === undefined || !(node instanceof IdentityProfilesTreeItem)) {
            console.log("WARNING: SortIdentityProfileCommand.sortByPriority: invalid item", node);
            throw new Error("SortIdentityProfileCommand.sortByPriority: invalid item");
        }

        await this.sortBy(IdentityProfileSorting.priority, node);
    }

    private async  sortBy(criteria: IdentityProfileSorting, node?: IdentityProfilesTreeItem): Promise<void> {
        node?.sortBy(criteria);
        await vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}
