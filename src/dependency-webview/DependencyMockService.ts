import type { DependencyEdgeData, DependencyGraphData, DependencyNodeData } from './app/src/services/Client';

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function stall(): Promise<void> {
    const stallTime = getRandomInt(300, 800);
    await new Promise((resolve) => setTimeout(resolve, stallTime));
}

function capitalize(type: string): string {
    return type.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
}

/**
 * Phase-1 mock dependency generator: returns a plausible-looking dependency graph for any
 * identity attribute without calling ISC. Swap this out for real `ISCClient` lookups
 * (identity profiles, transforms, provisioning policies, roles) once the real queries are
 * implemented, behind the same `DependencyGraphData` contract.
 */
export class DependencyMockService {

    async getDependencyGraph(resourceType: string, resourceId: string, label: string): Promise<DependencyGraphData> {
        await stall();

        const rootId = "root";
        const nodes: DependencyNodeData[] = [
            { id: rootId, type: resourceType, label, resourceId }
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
                    description: `Mock ${type} #${i} depending on ${label}`,
                    resourceId: id,
                    attributes: makeAttributes?.(i)
                });
                edges.push({ id: `${rootId}-${id}`, source: rootId, target: id });
            }
        };

        addGroup("identity-profile", getRandomInt(1, 2), (i) => ({ transform: i % 2 === 0 ? "Concatenation" : "None" }));
        addGroup("transform", getRandomInt(2, 4));
        addGroup("provisioning-policy", getRandomInt(0, 2));
        addGroup("role", getRandomInt(0, 3));

        return { rootId, nodes, edges };
    }
}
