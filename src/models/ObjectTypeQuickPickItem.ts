import { QuickPickItem } from "vscode";

export interface ObjectTypeQuickPickItem extends QuickPickItem {
    objectType: string
}

export const OBJECT_TYPE_ITEMS: ObjectTypeQuickPickItem[] = [
    {
        "objectType": "SOURCE",
        "label": "Sources",
        picked: true
    },
    {
        "objectType": "TRIGGER_SUBSCRIPTION",
        "label": "Trigger subscriptions",
        picked: true
    },
    {
        "objectType": "IDENTITY_PROFILE",
        "label": "Identity profiles",
        picked: true
    },
    {
        "objectType": "TRANSFORM",
        "label": "Transforms",
        picked: true
    },
    {
        "objectType": "RULE",
        "label": "Rules",
        picked: true
    }
];
