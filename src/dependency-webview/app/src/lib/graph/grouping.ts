import type { Edge, Node } from "@xyflow/svelte";
import type { DependencyEdgeData, DependencyGraphData, DependencyNodeData } from "../../services/Client";

// `type` aliases (not `interface`) so these structurally satisfy xyflow's `Record<string, unknown>`
// constraint on node data without needing an explicit index signature.
export type DependencyFlowNodeData = {
    kind: "dependency";
    node: DependencyNodeData;
};

export type GroupFlowNodeData = {
    kind: "group";
    /** Key identifying this group, e.g. "<sourceNodeId>::<type>". Used to track expansion state. */
    groupKey: string;
    groupType: string;
    count: number;
    expanded: boolean;
    /** Set by GraphView once the node is built; not produced by buildDisplayGraph itself. */
    onToggle?: () => void;
};

export type FlowNodeData = DependencyFlowNodeData | GroupFlowNodeData;

export type FlowNode = Node<FlowNodeData, "dependency" | "group-summary">;
export type FlowEdge = Edge;

export function groupKey(sourceNodeId: string, type: string): string {
    return `${sourceNodeId}::${type}`;
}

/** Types that never need a group wrapper because a single node can only ever have one such neighbor. */
const NO_GROUP_TYPES = new Set(["public-identities-config"]);

/**
 * Builds the nodes/edges to render for the current expansion state.
 *
 * For every node in the graph, its outgoing neighbors are grouped by `type` into one group node
 * per type. The group node is always present (never replaced) so it can act as a permanent,
 * double-clickable toggle: when its flow id is in `expandedGroupIds`, its individual children are
 * additionally rendered (hanging off the group node, not the original source) and recursed into.
 * This is evaluated per-node (not hardcoded to the root) so deeper multi-hop graphs group/expand
 * the same way, even though phase-1 mock data is only one hop deep from the root.
 */
export function buildDisplayGraph(
    graph: DependencyGraphData,
    expandedGroupIds: ReadonlySet<string>
): { nodes: FlowNode[]; edges: FlowEdge[] } {
    const nodeById = new Map(graph.nodes.map(n => [n.id, n]));
    const outgoingBySource = new Map<string, DependencyEdgeData[]>();
    for (const edge of graph.edges) {
        if (!outgoingBySource.has(edge.source)) {
            outgoingBySource.set(edge.source, []);
        }
        outgoingBySource.get(edge.source)!.push(edge);
    }

    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const visited = new Set<string>();

    function visit(nodeId: string): void {
        if (visited.has(nodeId)) {
            return;
        }
        visited.add(nodeId);

        const node = nodeById.get(nodeId);
        if (!node) {
            return;
        }
        nodes.push({ id: nodeId, type: "dependency", data: { kind: "dependency", node }, position: { x: 0, y: 0 } });

        const byType = new Map<string, DependencyEdgeData[]>();
        for (const edge of outgoingBySource.get(nodeId) ?? []) {
            const target = nodeById.get(edge.target);
            if (!target) {
                continue;
            }
            if (!byType.has(target.type)) {
                byType.set(target.type, []);
            }
            byType.get(target.type)!.push(edge);
        }

        for (const [type, edgesOfType] of byType) {
            if (NO_GROUP_TYPES.has(type)) {
                for (const edge of edgesOfType) {
                    edges.push({ id: edge.id, source: nodeId, target: edge.target, label: edge.label });
                    visit(edge.target);
                }
                continue;
            }

            const key = groupKey(nodeId, type);
            const groupNodeId = `group:${key}`;
            const expanded = expandedGroupIds.has(groupNodeId);

            nodes.push({
                id: groupNodeId,
                type: "group-summary",
                data: { kind: "group", groupKey: key, groupType: type, count: edgesOfType.length, expanded },
                position: { x: 0, y: 0 }
            });
            edges.push({ id: `${nodeId}->${groupNodeId}`, source: nodeId, target: groupNodeId });

            if (expanded) {
                for (const edge of edgesOfType) {
                    edges.push({ id: edge.id, source: groupNodeId, target: edge.target, label: edge.label });
                    visit(edge.target);
                }
            }
        }
    }

    visit(graph.rootId);
    return { nodes, edges };
}
