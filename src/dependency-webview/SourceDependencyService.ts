import { ExportPayloadV2025IncludeTypesV2025, SpConfigExportResultsBeta } from 'sailpoint-api-client';
import { SimpleSPConfigExporter } from '../commands/spconfig-export/SimpleSPConfigExporter';
import type { DependencyGraphData } from './app/src/services/Client';
import { DependencyService } from './DependencyService';

export class SourceDependencyService extends DependencyService {

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
                ExportPayloadV2025IncludeTypesV2025.Transform,
                ExportPayloadV2025IncludeTypesV2025.IdentityProfile,
                ExportPayloadV2025IncludeTypesV2025.Role,
            ]
        )

        const [data, accessProfileIds] = await Promise.all([
            exporter.exportConfigWithProgression(),
            this.filterAccessProfile(),
            this.filterApplication()
        ]);
        this.filterTransform(data);
        this.filterIdentityProfile(data);
        this.filterRole(data, accessProfileIds);

        return {
            rootId: DependencyService.rootId,
            nodes: this.nodes,
            edges: this.edges
        };
    }

    /**
     * A transform references this source through an "accountAttribute" transform whose
     * "sourceName" attribute holds this source's name rather than its id. The reference may be
     * nested inside other transforms (composite transforms).
     */
    private filterTransform(data: SpConfigExportResultsBeta | null) {

        const transforms = (data?.objects ?? []).filter(o => o.self?.type === "TRANSFORM");

        for (const transformObject of transforms) {
            const transform = transformObject.object;
            if (!transform || !this.transformReferencesSource(transform, this.resourceName)) {
                continue;
            }

            this.addNodeOnce({
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
                label: "account attribute transform"
            });
        }
    }

    /**
     * An identity attribute mapping references this source the same way as a transform: through
     * an "accountAttribute" transform whose "sourceName" attribute holds this source's name. The
     * same source may be used by several attribute mappings within the same identity profile, so
     * each mapping is surfaced as its own "identity-attribute" node hanging off the profile
     * (rather than a single profile node listing every attribute name), so the named transform
     * applied on top of the source for that attribute, if any, can hang off the attribute node.
     */
    private filterIdentityProfile(data: SpConfigExportResultsBeta | null) {

        const profiles = (data?.objects ?? []).filter(o => o.self?.type === "IDENTITY_PROFILE");
        const transforms = (data?.objects ?? []).filter(o => o.self?.type === "TRANSFORM");

        for (const profileObject of profiles) {
            const profile = profileObject.object;
            const matchingAttributeTransforms = (profile?.identityAttributeConfig?.attributeTransforms ?? [])
                .filter((at: any) => this.transformReferencesSource(at.transformDefinition, this.resourceName));
            if (!profile || matchingAttributeTransforms.length === 0) {
                continue;
            }

            this.addNodeOnce({
                id: profile.id,
                type: "identity-profile",
                label: profile.name,
                description: profile.description ?? undefined,
                resourceId: profile.id,
                data: profile
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${profile.id}`,
                source: DependencyService.rootId,
                target: profile.id,
                label: "attribute mapping"
            });

            for (const attributeTransform of matchingAttributeTransforms) {
                const attributeNodeId = `${profile.id}::${attributeTransform.identityAttributeName}`;

                this.addNodeOnce({
                    id: attributeNodeId,
                    type: "identity-attribute",
                    label: attributeTransform.identityAttributeName,
                    resourceId: attributeTransform.identityAttributeName,
                    data: attributeTransform
                });

                this.edges.push({
                    id: `${profile.id}-${attributeNodeId}`,
                    source: profile.id,
                    target: attributeNodeId
                });

                const transformNames = this.collectReferencedTransformNames(attributeTransform.transformDefinition);
                for (const transformName of transformNames) {
                    const transform = transforms.find(o => o.object?.name === transformName)?.object;
                    if (!transform) {
                        continue;
                    }

                    this.addNodeOnce({
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
                        id: `${attributeNodeId}-${transform.id}`,
                        source: attributeNodeId,
                        target: transform.id,
                        label: "transform reference",
                        // An identity attribute mapping uses at most one named transform.
                        noGroup: true
                    });
                }
            }
        }
    }

    /**
     * fetched through the access profiles endpoint instead. Returns the ids of the access
     * profiles found, so filterRole can tell which roles use one of them without querying the
     * access profiles endpoint again.
     */
    private async filterAccessProfile(): Promise<Set<string>> {
        const accessProfiles = await this.client.getAllAccessProfiles(`source.id eq "${this.resourceId}"`);

        const accessProfileIds = new Set<string>();

        for (const accessProfile of accessProfiles) {
            accessProfileIds.add(accessProfile.id!);

            this.nodes.push({
                id: accessProfile.id!,
                type: "access-profile",
                label: accessProfile.name,
                description: accessProfile.description,
                resourceId: accessProfile.id,
                attributes: {
                    enabled: String(accessProfile.enabled ?? false),
                    requestable: String(accessProfile.requestable ?? false)
                },
                data: accessProfile
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${accessProfile.id}`,
                source: DependencyService.rootId,
                target: accessProfile.id!,
                label: "access profile"
            });
        }

        return accessProfileIds;
    }

    /**
     * A role references this source either directly, through an entitlement of this source
     * listed in its criteria, or indirectly, through an access profile of this source it grants.
     * The access profile match reuses the ids collected by filterAccessProfile so the access
     * profiles endpoint is only ever called once.
     */
    private filterRole(data: SpConfigExportResultsBeta | null, accessProfileIds: Set<string>) {
        const roles = (data?.objects ?? []).filter(o => o.self?.type === "ROLE");

        for (const roleObject of roles) {
            const role = roleObject.object;
            if (!role) {
                continue;
            }

            const matchingEntitlements = (role.entitlements ?? [])
                // The sp-config export encodes entitlement.sourceId as a dashed GUID
                // (e.g. "da8b3d55-ba26-439b-90ca-abb9f3c4e6c1"), unlike the undashed source id
                // used elsewhere (e.g. "da8b3d55ba26439b90caabb9f3c4e6c1"), so dashes must be
                // stripped from both sides before comparing.
                .filter((entitlement: any) => entitlement.sourceId?.replace(/-/g, "") === this.resourceId);
            const matchingAccessProfiles = (role.accessProfiles ?? [])
                .filter((accessProfile: any) => accessProfileIds.has(accessProfile.id));

            if (matchingEntitlements.length === 0 && matchingAccessProfiles.length === 0) {
                continue;
            }

            this.addNodeOnce({
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

            if (matchingEntitlements.length > 0) {
                this.edges.push({
                    id: `${DependencyService.rootId}-${role.id}`,
                    source: DependencyService.rootId,
                    target: role.id,
                    label: "role entitlement"
                });
            }

            for (const accessProfile of matchingAccessProfiles) {
                this.edges.push({
                    id: `${accessProfile.id}-${role.id}`,
                    source: accessProfile.id,
                    target: role.id,
                    label: "role access profile"
                });
            }
        }
    }

    /**
     * Applications referencing this source as their account source.
     */
    private async filterApplication() {
        const applications = await this.client.getAllApplications(`accountSource.id eq "${this.resourceId}"`);

        for (const application of applications) {
            this.nodes.push({
                id: application.id!,
                type: "application",
                label: application.name!,
                description: application.description ?? undefined,
                resourceId: application.id,
                attributes: {
                    enabled: String(application.enabled ?? false)
                },
                data: application
            });

            this.edges.push({
                id: `${DependencyService.rootId}-${application.id}`,
                source: DependencyService.rootId,
                target: application.id!,
                label: "application"
            });
        }
    }

    private transformReferencesSource(transform: any, sourceName: string): boolean {
        if (!transform || typeof transform !== "object") {
            return false;
        }
        if (transform.type === "accountAttribute" && transform.attributes?.sourceName === sourceName) {
            return true;
        }
        return Object.values(transform.attributes ?? {}).some((value: any) =>
            Array.isArray(value)
                ? value.some((v: any) => this.transformReferencesSource(v, sourceName))
                : this.transformReferencesSource(value, sourceName));
    }
}
