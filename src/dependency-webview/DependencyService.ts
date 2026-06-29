import { ISCClient } from '../services/ISCClient';
import type { DependencyEdgeData, DependencyGraphData, DependencyNodeData } from './app/src/services/Client';

export abstract class DependencyService {

    protected nodes: DependencyNodeData[];
    protected edges: DependencyEdgeData[] = [];
    protected client: ISCClient;
    public static readonly rootId = "root";

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
        this.client = new ISCClient(tenantId, tenantName)
    }

    abstract getDependencyGraph(): Promise<DependencyGraphData>;
}
