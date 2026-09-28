import { ExportPayloadExcludeTypesEnum as ExportPayloadExcludeTypes, ImportOptionsIncludeTypesEnum as ImportOptionsIncludeTypes } from "sailpoint-api-client/dist/sp_config/api.js";
import { QuickPickItem } from "vscode";

export interface ExportableObjectTypeQuickPickItem extends QuickPickItem {
    objectType: ExportPayloadExcludeTypes
}

export const EXPORTABLE_OBJECT_TYPE_ITEMS: ExportableObjectTypeQuickPickItem[] = [
    { objectType: ExportPayloadExcludeTypes.AccessProfile, label: "Access Profiles", picked: true },
    { objectType: ExportPayloadExcludeTypes.AccessRequestConfig, label: "Access Request Configuration", picked: true },
    { objectType: ExportPayloadExcludeTypes.AttrSyncSourceConfig, label: "Attribute Sync Source Configuration", picked: true },
    { objectType: ExportPayloadExcludeTypes.AuthOrg, label: "Authentication Configuration", picked: true },
    { objectType: ExportPayloadExcludeTypes.CampaignFilter, label: "Campaign Filters", picked: true },
    { objectType: ExportPayloadExcludeTypes.FormDefinition, label: "Form Definitions", picked: true },
    { objectType: ExportPayloadExcludeTypes.GovernanceGroup, label: "Governance Groups", picked: true },
    { objectType: ExportPayloadExcludeTypes.IdentityObjectConfig, label: "Identity Object Configuration", picked: true },
    { objectType: ExportPayloadExcludeTypes.IdentityProfile, label: "Identity Profiles", picked: true },
    { objectType: ExportPayloadExcludeTypes.LifecycleState, label: "Lifecycle States", picked: true },
    { objectType: ExportPayloadExcludeTypes.NotificationTemplate, label: "Notification Templates", picked: true },
    { objectType: ExportPayloadExcludeTypes.PasswordPolicy, label: "Password Policies", picked: true },
    { objectType: ExportPayloadExcludeTypes.PasswordSyncGroup, label: "Password Sync Groups", picked: true },
    { objectType: ExportPayloadExcludeTypes.PublicIdentitiesConfig, label: "Public Identities Configuration", picked: true },
    { objectType: ExportPayloadExcludeTypes.Role, label: "Roles", picked: true },
    { objectType: ExportPayloadExcludeTypes.ConnectorRule, label: "Connector Rules", picked: true },
    { objectType: ExportPayloadExcludeTypes.Rule, label: "Cloud Rules", picked: true },
    { objectType: ExportPayloadExcludeTypes.Segment, label: "Segments", picked: true },
    { objectType: ExportPayloadExcludeTypes.SodPolicy, label: "Separation of Duties Policies", picked: true },
    { objectType: ExportPayloadExcludeTypes.ServiceDeskIntegration, label: "Service Desk Integrations", picked: true },
    { objectType: ExportPayloadExcludeTypes.Source, label: "Sources", picked: true },
    { objectType: ExportPayloadExcludeTypes.Tag, label: "Tags", picked: true },
    { objectType: ExportPayloadExcludeTypes.Transform, label: "Transforms", picked: true },
    { objectType: ExportPayloadExcludeTypes.TriggerSubscription, label: "Event Trigger Subscriptions", picked: true },
    { objectType: ExportPayloadExcludeTypes.Workflow, label: "Workflows", picked: true },
]

export interface ImportableObjectTypeQuickPickItem extends QuickPickItem {
    objectType: ImportOptionsIncludeTypes
}

export const IMPORTABLE_OBJECT_TYPE_ITEMS: ImportableObjectTypeQuickPickItem[] = [
    { objectType: ImportOptionsIncludeTypes.TriggerSubscription, label: "Event Trigger subscriptions", picked: true },
    { objectType: ImportOptionsIncludeTypes.IdentityObjectConfig, label: "Identity Object Configuration", picked: true },
    { objectType: ImportOptionsIncludeTypes.IdentityProfile, label: "Identity Profiles", picked: true },
    { objectType: ImportOptionsIncludeTypes.ConnectorRule, label: "Connector Rules", picked: true },
    { objectType: ImportOptionsIncludeTypes.Rule, label: "Cloud Rules", picked: true },
    { objectType: ImportOptionsIncludeTypes.Source, label: "Sources", picked: true },
    { objectType: ImportOptionsIncludeTypes.Transform, label: "Transforms", picked: true },
];
