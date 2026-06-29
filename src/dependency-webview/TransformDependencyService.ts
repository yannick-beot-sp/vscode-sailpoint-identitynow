import { ExportPayloadV2025IncludeTypesV2025, SpConfigExportResultsBeta } from 'sailpoint-api-client';
import { SimpleSPConfigExporter } from '../commands/spconfig-export/SimpleSPConfigExporter';
import type { DependencyGraphData } from './app/src/services/Client';
import { DependencyService } from './DependencyService';

export class TransformDependencyService extends DependencyService {

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

        return {
            rootId: DependencyService.rootId,
            nodes: this.nodes,
            edges: this.edges
        };
    }

    /**
     * Other transforms reference this one through a "reference" transform whose "id"
     * attribute holds this transform's name rather than its id.
     */
    private filterTransform(data: SpConfigExportResultsBeta | null) {

        const transforms = (data?.objects ?? []).filter(o => o.self?.type === "TRANSFORM");

        for (const transformObject of transforms) {
            const transform = transformObject.object;
            if (!transform || transform.id === this.resourceId || !this.transformReferencesTransform(transform, this.resourceName)) {
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
                label: "transform reference"
            });
        }
    }

    /**
     * An identity attribute mapping references this transform the same way: a "reference"
     * transform whose "id" attribute holds this transform's name. The same transform may be
     * used by several attribute mappings within the same identity profile, so a profile can
     * end up with more than one edge to the root.
     */
    private filterIdentityProfile(data: SpConfigExportResultsBeta | null) {

        const profiles = (data?.objects ?? []).filter(o => o.self?.type === "IDENTITY_PROFILE");

        for (const profileObject of profiles) {
            const profile = profileObject.object;
            const matchingTransforms = (profile?.identityAttributeConfig?.attributeTransforms ?? [])
                .filter((at: any) => this.transformReferencesTransform(at.transformDefinition, this.resourceName));
            if (!profile || matchingTransforms.length === 0) {
                continue;
            }

            this.nodes.push({
                id: profile.id,
                type: "identity-profile",
                label: profile.name,
                description: profile.description ?? undefined,
                resourceId: profile.id,
                attributes: {
                    identityAttributes: matchingTransforms.map((at: any) => at.identityAttributeName).join(", ")
                },
                data: profile
            });

            for (const attributeTransform of matchingTransforms) {
                this.edges.push({
                    id: `${DependencyService.rootId}-${profile.id}-${attributeTransform.identityAttributeName}`,
                    source: DependencyService.rootId,
                    target: profile.id,
                    label: attributeTransform.identityAttributeName
                });
            }
        }
    }

    /**
     * A "reference" transform points to another transform by name through its "id"
     * attribute. The reference may be nested inside other transforms (composite transforms).
     */
    private transformReferencesTransform(transform: any, transformName: string): boolean {
        if (!transform || typeof transform !== "object") {
            return false;
        }
        if (transform.type === "reference" && transform.attributes?.id === transformName) {
            return true;
        }
        return Object.values(transform.attributes ?? {}).some((value: any) =>
            Array.isArray(value)
                ? value.some((v: any) => this.transformReferencesTransform(v, transformName))
                : this.transformReferencesTransform(value, transformName));
    }
}
