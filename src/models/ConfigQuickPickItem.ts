import { QuickPickItem } from "vscode";

export interface ObjectTypeItem extends QuickPickItem {
    // Select all object types by default
    objectType: string;
}