import type { InternalNode, Node } from "@xyflow/svelte";

/**
 * Where the straight line between two nodes' centers crosses `intersectionNode`'s rectangle.
 * Standard xyflow "floating edge" geometry: https://reactflow.dev/examples/edges/floating-edges
 */
function getNodeIntersection(intersectionNode: InternalNode<Node>, targetNode: InternalNode<Node>) {
    const w = (intersectionNode.measured.width ?? 0) / 2;
    const h = (intersectionNode.measured.height ?? 0) / 2;
    const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
    const targetPosition = targetNode.internals.positionAbsolute;

    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;
    const x1 = targetPosition.x + (targetNode.measured.width ?? 0) / 2;
    const y1 = targetPosition.y + (targetNode.measured.height ?? 0) / 2;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
    const xx3 = a * xx1;
    const yy3 = a * yy1;

    return {
        x: w * (xx3 + yy3) + x2,
        y: h * (-xx3 + yy3) + y2
    };
}

/**
 * The two points where the straight line between `source` and `target` crosses each node's
 * own rectangle — i.e. where an edge between them should actually start/end, regardless of
 * which side of either node faces the other (unlike a fixed-Handle anchor).
 */
export function getFloatingEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>) {
    const sourcePoint = getNodeIntersection(source, target);
    const targetPoint = getNodeIntersection(target, source);

    return {
        sourceX: sourcePoint.x,
        sourceY: sourcePoint.y,
        targetX: targetPoint.x,
        targetY: targetPoint.y
    };
}
