import { ExportPayloadBetaExcludeTypesBeta, ImportOptionsBetaIncludeTypesBeta } from "sailpoint-api-client";
import { QuickPickItem } from "vscode";

export interface ExportableObjectTypeQuickPickItem extends QuickPickItem {
    objectType: ExportPayloadBetaExcludeTypesBeta
}

export const EXPORTABLE_OBJECT_TYPE_ITEMS: ExportableObjectTypeQuickPickItem[] = [
    { objectType: ExportPayloadBetaExcludeTypesBeta.AccessProfile, label: "Access Profiles", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.AccessRequestConfig, label: "Access Request Configuration", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.AttrSyncSourceConfig, label: "Attribute Sync Source Configuration", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.AuthOrg, label: "Authentication Configuration", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.CampaignFilter, label: "Campaign Filters", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.FormDefinition, label: "Form Definitions", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.GovernanceGroup, label: "Governance Groups", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.IdentityObjectConfig, label: "Identity Object Configuration", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.IdentityProfile, label: "Identity Profiles", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.LifecycleState, label: "Lifecycle States", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.NotificationTemplate, label: "Notification Templates", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.PasswordPolicy, label: "Password Policies", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.PasswordSyncGroup, label: "Password Sync Groups", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.PublicIdentitiesConfig, label: "Public Identities Configuration", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Role, label: "Roles", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.ConnectorRule, label: "Connector Rules", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Rule, label: "Rules", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Segment, label: "Segments", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.SodPolicy, label: "Separation of Duties Policies", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.ServiceDeskIntegration, label: "Service Desk Integrations", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Source, label: "Sources", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Tag, label: "Tags", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Transform, label: "Transforms", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.TriggerSubscription, label: "Event Trigger Subscriptions", picked: true },
    { objectType: ExportPayloadBetaExcludeTypesBeta.Workflow, label: "Workflows", picked: true },
]

export interface ImportableObjectTypeQuickPickItem extends QuickPickItem {
    objectType: ImportOptionsBetaIncludeTypesBeta
}

export const IMPORTABLE_OBJECT_TYPE_ITEMS: ImportableObjectTypeQuickPickItem[] = [
    { objectType: ImportOptionsBetaIncludeTypesBeta.TriggerSubscription, label: "Event Trigger subscriptions", picked: true },
    { objectType: ImportOptionsBetaIncludeTypesBeta.IdentityObjectConfig, label: "Identity Object Configuration", picked: true },
    { objectType: ImportOptionsBetaIncludeTypesBeta.IdentityProfile, label: "Identity Profiles", picked: true },
    { objectType: ImportOptionsBetaIncludeTypesBeta.ConnectorRule, label: "Connector Rules", picked: true },
    { objectType: ImportOptionsBetaIncludeTypesBeta.Rule, label: "Rules", picked: true },
    { objectType: ImportOptionsBetaIncludeTypesBeta.Source, label: "Sources", picked: true },
    { objectType: ImportOptionsBetaIncludeTypesBeta.Transform, label: "Transforms", picked: true },
];
