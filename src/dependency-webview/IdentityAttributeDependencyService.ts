import { ExportPayloadV2025IncludeTypesV2025, SpConfigExportResultsBeta } from 'sailpoint-api-client';
import { SimpleSPConfigExporter } from '../commands/spconfig-export/SimpleSPConfigExporter';
import type { DependencyGraphData } from './app/src/services/Client';
import { DependencyService } from './DependencyService';

export class IdentityAttributeDependencyService extends DependencyService {

    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayname: string,
        resourceType: string,
        resourceId: string,
        resourceName: string,
        label: string
    ) {
        super(
            tenantId,
            tenantName,
            tenantDisplayname,
            resourceType,
            resourceId,
            resourceName,
            label
        )
    }

    async getDependencyGraph(): Promise<DependencyGraphData> {
        const exporter = new SimpleSPConfigExporter(
            this.client,
            this.tenantDisplayname,
            {},
            [
                ExportPayloadV2025IncludeTypesV2025.Source,
                ExportPayloadV2025IncludeTypesV2025.AttrSyncSourceConfig,
                ExportPayloadV2025IncludeTypesV2025.Role,
                ExportPayloadV2025IncludeTypesV2025.IdentityProfile,
                ExportPayloadV2025IncludeTypesV2025.Transform,
                ExportPayloadV2025IncludeTypesV2025.Workflow,
                ExportPayloadV2025IncludeTypesV2025.PublicIdentitiesConfig,
                ExportPayloadV2025IncludeTypesV2025.Segment,
                ExportPayloadV2025IncludeTypesV2025.TriggerSubscription,
            ]


        )

        const data = await exporter.exportConfigWithProgression();
        this.filterRole(data);
        this.filterSegment(data);
        this.filterPublicIdentitiesConfig(data);
        this.filterSource(data);
        this.filterEventTrigger(data);
        this.filterTransform(data);
        this.filterIdentityProfile(data);

        return {
            rootId: DependencyService.rootId,
            nodes: this.nodes,
            edges: this.edges
        };
    }

    private filterRole(data: SpConfigExportResultsBeta | null) {

        const roles = (data?.objects ?? []).filter(o => o.self?.type === "ROLE");
        const attributeProperty = `attribute.${this.resourceName}`;

        for (const roleObject of roles) {
            const role = roleObject.object;
            if (!role || !this.roleReferencesAttribute(role, attributeProperty)) {
                continue;
            }

            this.nodes.push({
                id: role.id,
                type: "role",
                label: role.name,
                description: role.description ?? undefined,
                resourceId: role.id,
                attributes: {
                    enabled: String(role.enabled ?? false),
                    requestable: String(role.requestable ?? false)
                },
                data: role
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${role.id}`,
                source: DependencyService.rootId,
                target: role.id,
                label: "membership criteria"
            });
        }
    }

    private filterSegment(data: SpConfigExportResultsBeta | null) {

        const segments = (data?.objects ?? []).filter(o => o.self?.type === "SEGMENT");

        for (const segmentObject of segments) {
            const segment = segmentObject.object;
            if (!segment || !this.expressionReferencesAttribute(segment.visibilityCriteria?.expression, this.resourceName)) {
                continue;
            }

            this.nodes.push({
                id: segment.id,
                type: "segment",
                label: segment.name,
                description: segment.description ?? undefined,
                resourceId: segment.id,
                attributes: {
                    active: String(segment.active ?? false)
                },
                data: segment
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${segment.id}`,
                source: DependencyService.rootId,
                target: segment.id,
                label: "visibility criteria"
            });
        }
    }

    private filterPublicIdentitiesConfig(data: SpConfigExportResultsBeta | null) {

        const configs = (data?.objects ?? []).filter(o => o.self?.type === "PUBLIC_IDENTITIES_CONFIG");

        for (const configObject of configs) {
            const config = configObject.object;
            const matchedAttribute = (config?.attributes ?? []).find((attr: any) => attr.key === this.resourceName);
            if (!config || !configObject.self?.id || !matchedAttribute) {
                continue;
            }

            const id = configObject.self.id;
            this.nodes.push({
                id,
                type: "public-identities-config",
                label: configObject.self.name ?? "Public Identities Config",
                resourceId: id,
                attributes: {
                    name: matchedAttribute.name
                },
                data: config
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${id}`,
                source: DependencyService.rootId,
                target: id,
                label: "public identity attribute"
            });
        }
    }

    private filterSource(data: SpConfigExportResultsBeta | null) {

        const sources = (data?.objects ?? []).filter(o => o.self?.type === "SOURCE");
        const syncConfigs = (data?.objects ?? []).filter(o => o.self?.type === "ATTR_SYNC_SOURCE_CONFIG");

        for (const sourceObject of sources) {
            const source = sourceObject.object;
            if (!source) {
                continue;
            }

            const matchingPolicies = (source.provisioningPolicies ?? []).filter((policy: any) =>
                (policy.fields ?? []).some((field: any) => this.fieldReferencesAttribute(field, this.resourceName)));

            const syncConfig = syncConfigs.find(o => o.object?.source?.id === source.id);
            const synchronized = syncConfig?.object?.attributes?.some((attr: any) => attr.name === this.resourceName && attr.enabled);

            if (matchingPolicies.length === 0 && !synchronized) {
                continue;
            }

            this.nodes.push({
                id: source.id,
                type: "source",
                label: source.name,
                description: source.description ?? undefined,
                resourceId: source.id,
                attributes: {
                    synchronized: String(synchronized)
                },
                data: source
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${source.id}`,
                source: DependencyService.rootId,
                target: source.id,
                label: synchronized ? "synchronized attribute" : "provisioning policy"
            });

            for (const policy of matchingPolicies) {
                const policyId = `${source.id}::${policy.name}`;
                this.nodes.push({
                    id: policyId,
                    type: "provisioning-policy",
                    label: policy.usageType,
                    description: policy.description ?? undefined,
                    resourceId: policyId,
                    attributes: {
                        usageType: policy.usageType
                    },
                    data: policy
                });

                this.edges.push({
                    id: `${source.id}-${policyId}`,
                    source: source.id,
                    target: policyId,
                    label: "provisioning policy"
                });
            }
        }
    }

    /**
     * Event triggers listening to "idn:identity-attributes-changed". A trigger may optionally
     * restrict itself to a subset of attributes via a JSONPath filter (e.g.
     * `$.changes[?(@.attribute == "department")]`) — when present, we just check that the
     * attribute name appears in it. When the trigger is backed by a workflow, we show a
     * "workflow" node (joined against the workflow export for its description) instead of a
     * generic "event-trigger" node.
     */
    private filterEventTrigger(data: SpConfigExportResultsBeta | null) {

        const triggers = (data?.objects ?? []).filter(o => o.self?.type === "TRIGGER_SUBSCRIPTION");
        const workflows = (data?.objects ?? []).filter(o => o.self?.type === "WORKFLOW");

        for (const triggerObject of triggers) {
            const trigger = triggerObject.object;
            if (!trigger || trigger.triggerId !== "idn:identity-attributes-changed") {
                continue;
            }
            if (typeof trigger.filter === "string" && !trigger.filter.includes(this.resourceName)) {
                continue;
            }

            if (trigger.type === "WORKFLOW") {
                const workflowId = trigger.workflowConfig?.workflowId;
                const workflow = workflows.find(o => o.object?.id === workflowId)?.object;

                this.nodes.push({
                    id: trigger.id,
                    type: "workflow",
                    label: trigger.name,
                    description: workflow?.description || trigger.description || undefined,
                    resourceId: workflowId ?? trigger.id,
                    attributes: {
                        enabled: String(trigger.enabled ?? false)
                    },
                    data: workflow ?? trigger
                });
            } else {
                this.nodes.push({
                    id: trigger.id,
                    type: "event-trigger",
                    label: trigger.name,
                    description: trigger.description ?? undefined,
                    resourceId: trigger.id,
                    attributes: {
                        enabled: String(trigger.enabled ?? false),
                        dispatch: trigger.type
                    },
                    data: trigger
                });
            }

            this.edges.push({
                id: `${DependencyService.rootId}-${trigger.id}`,
                source: DependencyService.rootId,
                target: trigger.id,
                label: "identity attributes changed"
            });
        }
    }

    private filterTransform(data: SpConfigExportResultsBeta | null) {

        const transforms = (data?.objects ?? []).filter(o => o.self?.type === "TRANSFORM");

        for (const transformObject of transforms) {
            const transform = transformObject.object;
            if (!transform || !this.transformReferencesAttribute(transform, this.resourceName)) {
                continue;
            }

            this.nodes.push({
                id: transform.id,
                type: "transform",
                label: transform.name,
                resourceId: transform.id,
                attributes: {
                    type: transform.type
                },
                data: transform
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${transform.id}`,
                source: DependencyService.rootId,
                target: transform.id,
                label: "identityAttribute transform"
            });
        }
    }

    /**
     * An identity attribute is mapped to at most one attributeTransform per identity profile.
     */
    private filterIdentityProfile(data: SpConfigExportResultsBeta | null) {

        const profiles = (data?.objects ?? []).filter(o => o.self?.type === "IDENTITY_PROFILE");

        for (const profileObject of profiles) {
            const profile = profileObject.object;
            const attributeTransform = (profile?.identityAttributeConfig?.attributeTransforms ?? [])
                .find((at: any) => at.identityAttributeName === this.resourceName);
            if (!profile || !attributeTransform) {
                continue;
            }

            this.nodes.push({
                id: profile.id,
                type: "identity-profile",
                label: profile.name,
                description: profile.description ?? undefined,
                resourceId: profile.id,
                attributes: this.transformDefinitionAttributes(attributeTransform.transformDefinition),
                data: profile
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${profile.id}`,
                source: DependencyService.rootId,
                target: profile.id,
                label: "attribute mapping"
            });
        }
    }

    private transformDefinitionAttributes(transformDefinition: any): Record<string, string> {
        if (transformDefinition?.type === "accountAttribute") {
            return {
                sourceName: transformDefinition.attributes?.sourceName ?? "",
                attributeName: transformDefinition.attributes?.attributeName ?? "",
                sourceId: transformDefinition.attributes?.sourceId ?? ""
            };
        }
        if (transformDefinition?.type === "reference") {
            const input = transformDefinition.attributes?.input;
            return {
                sourceName: input?.attributes?.sourceName ?? "",
                attributeName: input?.attributes?.attributeName ?? "",
                sourceId: input?.attributes?.sourceId ?? "",
                transformName: transformDefinition.attributes?.id ?? ""
            };
        }
        return {};
    }

    /**
     * A provisioning policy field references the attribute either through an "identityAttribute"
     * transform (possibly nested inside a composite transform), or through a "$(attributeName)"
     * token in its template.
     */
    private fieldReferencesAttribute(field: any, attributeName: string): boolean {
        if (this.transformReferencesAttribute(field.transform, attributeName)) {
            return true;
        }
        const template = field.attributes?.template;
        return typeof template === "string" && template.includes(`$(${attributeName})`);
    }

    private transformReferencesAttribute(transform: any, attributeName: string): boolean {
        if (!transform || typeof transform !== "object") {
            return false;
        }
        if (transform.type === "identityAttribute" && transform.attributes?.name === attributeName) {
            return true;
        }
        return Object.values(transform.attributes ?? {}).some((value: any) =>
            Array.isArray(value)
                ? value.some((v: any) => this.transformReferencesAttribute(v, attributeName))
                : this.transformReferencesAttribute(value, attributeName));
    }

    private expressionReferencesAttribute(expression: any, attributeName: string): boolean {
        if (!expression) {
            return false;
        }
        if (expression.attribute === attributeName) {
            return true;
        }
        const children = Array.isArray(expression.children) ? expression.children : [];
        return children.some((child: any) => this.expressionReferencesAttribute(child, attributeName));
    }

    /**
     * A role references the attribute either through its own membership criteria, or
     * through one of its dimensions' membership criteria.
     */
    private roleReferencesAttribute(role: any, attributeProperty: string): boolean {
        if (this.criteriaReferencesAttribute(role.membership?.criteria, attributeProperty)) {
            return true;
        }
        return (role.dimensions ?? []).some((dimension: any) =>
            this.criteriaReferencesAttribute(dimension.membership?.criteria, attributeProperty));
    }

    private criteriaReferencesAttribute(criteria: any, attributeProperty: string): boolean {
        if (!criteria) {
            return false;
        }
        if (criteria.key?.type === "IDENTITY" && criteria.key?.property === attributeProperty) {
            return true;
        }
        return (criteria.children ?? []).some((child: any) =>
            this.criteriaReferencesAttribute(child, attributeProperty));
    }
}
