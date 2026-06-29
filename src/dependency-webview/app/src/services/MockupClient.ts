import type { Client, DependencyEdgeData, DependencyGraphData, DependencyNodeData, NodeViewState, ViewportState } from "./Client";

function cacheKey(resourceType: string, resourceId: string): string {
    return `${resourceType}/${resourceId}`;
}

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function stall() {
    const stallTime = getRandomInt(500, 1500);
    await new Promise((resolve) => setTimeout(resolve, stallTime));
}

function capitalize(type: string): string {
    return type.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function buildGraph(rootType: string, rootId: string, rootLabel: string): DependencyGraphData {
    const rootNodeId = "root";
    const nodes: DependencyNodeData[] = [
        { id: rootNodeId, type: rootType, label: rootLabel, resourceId: rootId }
    ];
    const edges: DependencyEdgeData[] = [];

    let counter = 0;
    const addGroup = (type: string, count: number, makeAttributes?: (i: number) => Record<string, string>) => {
        for (let i = 1; i <= count; i++) {
            const id = `${type}-${++counter}`;
            nodes.push({
                id,
                type,
                label: `${capitalize(type)} ${i}`,
                description: `Mock ${type} #${i} depending on ${rootLabel}`,
                resourceId: id,
                attributes: makeAttributes?.(i)
            });
            edges.push({ id: `${rootNodeId}-${id}`, source: rootNodeId, target: id });
        }
    };

    addGroup("identity-profile", getRandomInt(1, 2), (i) => ({ transform: i % 2 === 0 ? "Concatenation" : "None" }));
    addGroup("transform", getRandomInt(2, 4));
    addGroup("provisioning-policy", getRandomInt(0, 2));
    addGroup("role", getRandomInt(0, 3));

    return { rootId: rootNodeId, nodes, edges };
}

export class MockupClient implements Client {

    private nodeViewStates: Record<string, Record<string, NodeViewState>> = {};
    private layoutAlgorithms: Record<string, string> = {};
    private viewports: Record<string, ViewportState> = {};

    async getDependencyGraph(resourceType: string, resourceId: string, resourceName: string, force: boolean): Promise<DependencyGraphData> {
        await stall()
        console.log(">getDependencyGraph", { resourceType, resourceId, resourceName, force });
        return buildGraph(resourceType, resourceId, window.data.label ?? resourceId);
    }

    getNodeViewStates(resourceType: string, resourceId: string): Record<string, NodeViewState> | undefined {
        return this.nodeViewStates[cacheKey(resourceType, resourceId)];
    }

    setNodeViewStates(resourceType: string, resourceId: string, states: Record<string, NodeViewState>): void {
        this.nodeViewStates[cacheKey(resourceType, resourceId)] = states;
    }

    getLayoutAlgorithm(resourceType: string, resourceId: string): string | undefined {
        return this.layoutAlgorithms[cacheKey(resourceType, resourceId)];
    }

    setLayoutAlgorithm(resourceType: string, resourceId: string, algorithm: string): void {
        this.layoutAlgorithms[cacheKey(resourceType, resourceId)] = algorithm;
    }

    getViewport(resourceType: string, resourceId: string): ViewportState | undefined {
        return this.viewports[cacheKey(resourceType, resourceId)];
    }

    setViewport(resourceType: string, resourceId: string, viewport: ViewportState): void {
        this.viewports[cacheKey(resourceType, resourceId)] = viewport;
    }
}
