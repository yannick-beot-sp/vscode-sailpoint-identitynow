import type { FlowEdge, FlowNode } from "./grouping";

export type LayoutAlgorithm = "layered" | "radial" | "vertical" | "horizontal";

export const LAYOUT_ALGORITHMS: { value: LayoutAlgorithm; label: string }[] = [
    { value: "layered", label: "Layered" },
    { value: "radial", label: "Radial" },
    { value: "vertical", label: "Vertical" },
    { value: "horizontal", label: "Horizontal" }
];

// Maps our layout choice to the underlying elk algorithm + direction.
const ELK_OPTIONS: Record<LayoutAlgorithm, { algorithm: string; direction: string }> = {
    layered: { algorithm: "layered", direction: "DOWN" },
    radial: { algorithm: "radial", direction: "DOWN" },
    vertical: { algorithm: "mrtree", direction: "DOWN" },
    horizontal: { algorithm: "mrtree", direction: "RIGHT" }
};

// Rough estimate matching the rendered node size; elk only needs this to compute spacing.
const NODE_WIDTH = 190;
const NODE_HEIGHT = 46;

export async function runElkLayout(nodes: FlowNode[], edges: FlowEdge[], algorithm: LayoutAlgorithm): Promise<FlowNode[]> {
    if (nodes.length === 0) {
        return nodes;
    }

    // Dynamically imported so elkjs (the bulk of the bundle) lands in its own chunk.
    const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
    const elk = new ELK();

    const { algorithm: elkAlgorithm, direction } = ELK_OPTIONS[algorithm];

    const layouted = await elk.layout({
        id: "root",
        layoutOptions: {
            "elk.algorithm": elkAlgorithm,
            "elk.direction": direction,
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
