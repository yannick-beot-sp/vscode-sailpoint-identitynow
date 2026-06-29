import { ISCClient } from '../services/ISCClient';
import type { DependencyEdgeData, DependencyGraphData, DependencyNodeData } from './app/src/services/Client';

export abstract class DependencyService {

    protected nodes: DependencyNodeData[];
    protected edges: DependencyEdgeData[] = [];
    protected client: ISCClient;
    public static readonly rootId = "root";
    private readonly nodeIds: Set<string>;

    constructor(
        protected readonly tenantId: string,
        protected readonly tenantName: string,
        protected readonly tenantDisplayname: string,
        protected readonly resourceType: string,
        protected readonly resourceId: string,
        protected readonly resourceName: string,
        protected readonly label: string
    ) {
        this.nodes = [
            { id: DependencyService.rootId, type: resourceType, label, resourceId }
        ];
        this.nodeIds = new Set([DependencyService.rootId]);
        this.client = new ISCClient(tenantId, tenantName)
    }

    /**
     * Adds a node unless one with the same id was already added. Several traversal paths
     * (e.g. the same source reached through different identity attributes) can reference the
     * same underlying object, and the graph should only contain one node for it.
     */
    protected addNodeOnce(node: DependencyNodeData): void {
        if (this.nodeIds.has(node.id)) {
            return;
        }
        this.nodeIds.add(node.id);
        this.nodes.push(node);
    }

    /**
     * Collects the distinct source names pulled from by "accountAttribute" transforms nested
     * anywhere inside the given transform definition (e.g. inside a composite transform).
     */
    protected collectReferencedSourceNames(transformDefinition: any): string[] {
        const names = new Set<string>();
        this.walkTransformDefinition(transformDefinition, t => {
            if (t.type === "accountAttribute" && typeof t.attributes?.sourceName === "string") {
                names.add(t.attributes.sourceName);
            }
        });
        return Array.from(names);
    }

    /**
     * Collects the distinct named transforms ("reference" transforms) used anywhere inside the
     * given transform definition (e.g. inside a composite transform).
     */
    protected collectReferencedTransformNames(transformDefinition: any): string[] {
        const names = new Set<string>();
        this.walkTransformDefinition(transformDefinition, t => {
            if (t.type === "reference" && typeof t.attributes?.id === "string") {
                names.add(t.attributes.id);
            }
        });
        return Array.from(names);
    }

    private walkTransformDefinition(transform: any, visit: (transform: any) => void): void {
        if (!transform || typeof transform !== "object") {
            return;
        }
        visit(transform);
        for (const value of Object.values(transform.attributes ?? {})) {
            if (Array.isArray(value)) {
                value.forEach((v: any) => this.walkTransformDefinition(v, visit));
            } else {
                this.walkTransformDefinition(value, visit);
            }
        }
    }

    abstract getDependencyGraph(): Promise<DependencyGraphData>;
}
