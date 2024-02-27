import { ExportPayloadBetaIncludeTypesEnum } from "sailpoint-api-client";
import { QuickPickItem } from "vscode";

export interface ObjectTypeQuickPickItem extends QuickPickItem {
    objectType: ExportPayloadBetaIncludeTypesEnum
}

export const EXPORTABLE_OBJECT_TYPE_ITEMS: ObjectTypeQuickPickItem[] = [

    { objectType: ExportPayloadBetaIncludeTypesEnum.AccessProfile, label: "Access Profiles", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.AccessRequestConfig, label: "Access Request Configuration", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.AttrSyncSourceConfig, label: "Attribute Sync Source Configuration", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.AuthOrg, label: "Authentication Configuration", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.CampaignFilter, label: "Campaign Filters", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.FormDefinition, label: "Form Definitions", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.GovernanceGroup, label: "Governance Groups", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.IdentityObjectConfig, label: "Identity Object Configuration", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.IdentityProfile, label: "Identity Profiles", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.LifecycleState, label: "Lifecycle States", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.NotificationTemplate, label: "Notification Templates", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.PasswordPolicy, label: "Password Policies", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.PasswordSyncGroup, label: "Password Sync Groups", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.PublicIdentitiesConfig, label: "Public Identities Configuration", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Role, label: "Roles", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Rule, label: "Rules", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Segment, label: "Segments", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.SodPolicy, label: "Separation of Duties Policies", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.ServiceDeskIntegration, label: "Service Desk Integrations", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Source, label: "Sources", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Tag, label: "Tags", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Transform, label: "Transforms", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.TriggerSubscription, label: "Event Trigger Subscriptions", picked: true },
    { objectType: ExportPayloadBetaIncludeTypesEnum.Workflow, label: "Workflows", picked: true },
]

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
