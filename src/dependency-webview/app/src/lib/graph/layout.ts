import { cluster, hierarchy, tree, type ClusterLayout, type TreeLayout } from "d3-hierarchy";
import type { FlowEdge, FlowNode } from "./grouping";

export type LayoutAlgorithm = "vertical" | "horizontal" | "radial" | "cluster";

export const LAYOUT_ALGORITHMS: { value: LayoutAlgorithm; label: string }[] = [
    { value: "vertical", label: "Vertical" },
    { value: "horizontal", label: "Horizontal" },
    { value: "radial", label: "Radial" },
    { value: "cluster", label: "Cluster" }
];

// "cluster" is a radial layout (all leaves at the same radius); the other three use plain tree().
function parseAlgorithm(algorithm: LayoutAlgorithm): { variant: "tree" | "cluster"; orientation: "vertical" | "horizontal" | "radial" } {
    return algorithm === "cluster" ? { variant: "cluster", orientation: "radial" } : { variant: "tree", orientation: algorithm };
}

// Rough estimate matching the rendered node size; only used to compute spacing.
const NODE_WIDTH = 190;
const NODE_HEIGHT = 46;
const SIBLING_GAP = 40;
// Tighter than SIBLING_GAP: in vertical mode, siblings sit side by side along the wide axis
// (node width), so the default gap makes the tree noticeably wider than it needs to be.
const VERTICAL_SIBLING_GAP = 16;
const LEVEL_GAP = 80;

interface TreeDatum {
    id: string;
    children: TreeDatum[];
}

/**
 * `buildDisplayGraph` always produces a strict tree (single root, each node visited once via DFS),
 * so every non-root node has exactly one incoming edge. That lets us feed it straight into
 * d3-hierarchy instead of a general-graph layout engine.
 */
function buildTree(nodes: FlowNode[], edges: FlowEdge[]): TreeDatum | undefined {
    const parentOf = new Map<string, string>();
    for (const edge of edges) {
        if (!parentOf.has(edge.target)) {
            parentOf.set(edge.target, edge.source);
        }
    }

    const datumById = new Map<string, TreeDatum>(nodes.map(n => [n.id, { id: n.id, children: [] }]));
    let root: TreeDatum | undefined;
    for (const node of nodes) {
        const datum = datumById.get(node.id)!;
        const parentDatum = datumById.get(parentOf.get(node.id) ?? "");
        if (parentDatum) {
            parentDatum.children.push(datum);
        } else {
            root = datum;
        }
    }
    return root;
}

function pointRadial(angle: number, radius: number): { x: number; y: number } {
    return { x: radius * Math.cos(angle - Math.PI / 2), y: radius * Math.sin(angle - Math.PI / 2) };
}

export async function runTreeLayout(nodes: FlowNode[], edges: FlowEdge[], algorithm: LayoutAlgorithm): Promise<FlowNode[]> {
    const root = buildTree(nodes, edges);
    if (!root) {
        return nodes;
    }

    const { variant, orientation } = parseAlgorithm(algorithm);
    const hierarchyRoot = hierarchy<TreeDatum>(root, d => d.children);
    const layout: TreeLayout<TreeDatum> | ClusterLayout<TreeDatum> = variant === "cluster" ? cluster<TreeDatum>() : tree<TreeDatum>();
    const positionById = new Map<string, { x: number; y: number }>();

    if (orientation === "radial") {
        const radius = hierarchyRoot.height * (NODE_HEIGHT + LEVEL_GAP * 2);
        const layoutRoot = layout
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)(hierarchyRoot);

        for (const node of layoutRoot.descendants()) {
            positionById.set(node.data.id, pointRadial(node.x, node.y));
        }
    } else {
        const horizontal = orientation === "horizontal";
        const breadthSpacing = horizontal ? NODE_HEIGHT + SIBLING_GAP : NODE_WIDTH + VERTICAL_SIBLING_GAP;
        const depthSpacing = (horizontal ? NODE_WIDTH : NODE_HEIGHT) + LEVEL_GAP;
        const layoutRoot = layout.nodeSize([breadthSpacing, depthSpacing])(hierarchyRoot);

        for (const node of layoutRoot.descendants()) {
            positionById.set(node.data.id, horizontal ? { x: node.y, y: node.x } : { x: node.x, y: node.y });
        }
    }

    return nodes.map(n => ({
        ...n,
        position: positionById.get(n.id) ?? n.position
    }));
}
