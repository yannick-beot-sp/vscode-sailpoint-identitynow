import { QuickPickItem } from "vscode";

export interface TransformQuickPickItem extends QuickPickItem {
    // Select all object types by default
    template: string;
}