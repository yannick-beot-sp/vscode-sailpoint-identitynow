import * as vscode from "vscode";
import { BaseTreeItem, PageableNode } from "../models/IdentityNowTreeItem";
import * as commands from "../commands/constants";
import { FILTER_PREFIX } from "../configurationConstants";
import { setConfigKey } from "../utils/configurationUtils";


export class FilterCommand {

    async execute(node: PageableNode & BaseTreeItem): Promise<void> {
        let newFilter = await vscode.window.showInputBox({
            value: node.filters,
            ignoreFocusOut: true,
            placeHolder: 'Filter using search',
            title: `Enter a filter for ${node.label}`
        });

        if (newFilter === undefined) {
            // cancel by user
            return;
        }
        newFilter = newFilter.trim();
        if (newFilter === "") {
            newFilter = "*";
        }
        node.filters = newFilter;
        setConfigKey(`${FILTER_PREFIX}.${node.contextValue}`, newFilter);
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}