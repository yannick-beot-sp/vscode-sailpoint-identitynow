import type { Client, DependencyEdgeData, DependencyGraphData, DependencyNodeData } from "./Client";

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

    async getDependencyGraph(resourceType: string, resourceId: string, force: boolean): Promise<DependencyGraphData> {
        await stall()
        console.log(">getDependencyGraph", { resourceType, resourceId, force });
        return buildGraph(resourceType, resourceId, window.data.label ?? resourceId);
    }
}
