import { ExportPayloadBetaIncludeTypesEnum } from "sailpoint-api-client";
import { QuickPickItem } from "vscode";

export interface ObjectTypeQuickPickItem extends QuickPickItem {
    objectType: ExportPayloadBetaIncludeTypesEnum
}

export const OBJECT_TYPE_ITEMS: ObjectTypeQuickPickItem[] = [
    {
        objectType: ExportPayloadBetaIncludeTypesEnum.Source,
        label: "Sources",
        picked: true
    },
    {
        objectType: ExportPayloadBetaIncludeTypesEnum.TriggerSubscription,
        label: "Trigger subscriptions",
        picked: true
    },
    {
        objectType: ExportPayloadBetaIncludeTypesEnum.IdentityProfile,
        label: "Identity profiles",
        picked: true
    },
    {
        objectType: ExportPayloadBetaIncludeTypesEnum.Transform,
        label: "Transforms",
        picked: true
    },
    {
        objectType: ExportPayloadBetaIncludeTypesEnum.Rule,
        label: "Rules",
        picked: true
    }
];
