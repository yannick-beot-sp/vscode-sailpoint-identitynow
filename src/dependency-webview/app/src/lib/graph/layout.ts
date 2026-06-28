import ELK from "elkjs/lib/elk.bundled.js";
import type { FlowEdge, FlowNode } from "./grouping";

export type LayoutAlgorithm = "layered" | "radial" | "mrtree";

export const LAYOUT_ALGORITHMS: { value: LayoutAlgorithm; label: string }[] = [
    { value: "layered", label: "Layered" },
    { value: "radial", label: "Radial" },
    { value: "mrtree", label: "Tree" }
];

const elk = new ELK();

// Rough estimate matching the rendered node size; elk only needs this to compute spacing.
const NODE_WIDTH = 190;
const NODE_HEIGHT = 46;

export async function runElkLayout(nodes: FlowNode[], edges: FlowEdge[], algorithm: LayoutAlgorithm): Promise<FlowNode[]> {
    if (nodes.length === 0) {
        return nodes;
    }

    const layouted = await elk.layout({
        id: "root",
        layoutOptions: {
            "elk.algorithm": algorithm,
            "elk.direction": "DOWN",
            "elk.spacing.nodeNode": "40",
            "elk.layered.spacing.nodeNodeBetweenLayers": "80"
        },
        children: nodes.map(n => ({ id: n.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
        edges: edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
    });

    const positionById = new Map((layouted.children ?? []).map(c => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]));

    return nodes.map(n => ({
        ...n,
        position: positionById.get(n.id) ?? n.position
    }));
}
