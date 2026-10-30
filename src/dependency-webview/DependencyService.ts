import { ISCClient } from '../services/ISCClient.js';
import { collectReferencedSourceNames, collectReferencedTransformNames } from './SourceDependencies.js';
import type { DependencyEdgeData, DependencyGraphData, DependencyNodeData } from './app/src/services/Client.js';

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

    protected collectReferencedSourceNames(transformDefinition: any): string[] {
        return collectReferencedSourceNames(transformDefinition);
    }

    protected collectReferencedTransformNames(transformDefinition: any): string[] {
        return collectReferencedTransformNames(transformDefinition);
    }

    abstract getDependencyGraph(): Promise<DependencyGraphData>;
}
