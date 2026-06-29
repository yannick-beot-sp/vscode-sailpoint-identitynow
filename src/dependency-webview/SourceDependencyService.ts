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
            ]
        )

        const data = await exporter.exportConfigWithProgression();
        this.filterTransform(data);
        this.filterIdentityProfile(data);
        await this.filterAccessProfile();
        await this.filterApplication();

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
                label: "account attribute transform"
            });
        }
    }

    /**
     * An identity attribute mapping references this source the same way as a transform: through
     * an "accountAttribute" transform whose "sourceName" attribute holds this source's name. The
     * same source may be used by several attribute mappings within the same identity profile, so
     * a profile can end up with more than one edge to the root.
     */
    private filterIdentityProfile(data: SpConfigExportResultsBeta | null) {

        const profiles = (data?.objects ?? []).filter(o => o.self?.type === "IDENTITY_PROFILE");

        for (const profileObject of profiles) {
            const profile = profileObject.object;
            const matchingAttributeTransforms = (profile?.identityAttributeConfig?.attributeTransforms ?? [])
                .filter((at: any) => this.transformReferencesSource(at.transformDefinition, this.resourceName));
            if (!profile || matchingAttributeTransforms.length === 0) {
                continue;
            }

            this.nodes.push({
                id: profile.id,
                type: "identity-profile",
                label: profile.name,
                description: profile.description ?? undefined,
                resourceId: profile.id,
                attributes: {
                    identityAttributes: matchingAttributeTransforms.map((at: any) => at.identityAttributeName).join(", ")
                },
                data: profile
            });

            for (const attributeTransform of matchingAttributeTransforms) {
                const transformUsage = this.describeTransformUsage(attributeTransform.transformDefinition);
                this.edges.push({
                    id: `${DependencyService.rootId}-${profile.id}-${attributeTransform.identityAttributeName}`,
                    source: DependencyService.rootId,
                    target: profile.id,
                    label: transformUsage
                        ? `${attributeTransform.identityAttributeName} (${transformUsage})`
                        : attributeTransform.identityAttributeName
                });
            }
        }
    }

    /**
     * fetched through the access profiles endpoint instead.
     */
    private async filterAccessProfile() {
        const response = await this.client.getAccessProfiles({
            filters: `source.id eq "${this.resourceId}"`
        });

        for (const accessProfile of response.data ?? []) {
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
    }

    /**
     * Applications referencing this source as their account source.
     */
    private async filterApplication() {
        const response = await this.client.getPaginatedApplications(`accountSource.id eq "${this.resourceId}"`);

        for (const application of response.data ?? []) {
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

    /**
     * Describes how a transform definition uses this source, beyond a bare "accountAttribute"
     * pull, e.g. when it goes through a named transform or a composite transform.
     */
    private describeTransformUsage(transformDefinition: any): string | undefined {
        if (transformDefinition?.type === "accountAttribute") {
            return undefined;
        }
        if (transformDefinition?.type === "reference") {
            return `via transform "${transformDefinition.attributes?.id}"`;
        }
        return `via ${transformDefinition?.type} transform`;
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
