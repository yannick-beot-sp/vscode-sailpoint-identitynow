<script lang="ts">
  import { BaseEdge, useInternalNode, getStraightPath, type EdgeProps } from "@xyflow/svelte";
  import { getFloatingEdgeParams } from "./floatingEdgeParams";

  let { id, source, target }: EdgeProps = $props();

  const sourceNode = $derived(useInternalNode(source));
  const targetNode = $derived(useInternalNode(target));

  // Ignores the sourceX/sourceY/targetX/targetY/sourcePosition/targetPosition props that xyflow
  // derives from the (hidden, structurally-required) Handles: this edge always connects at the
  // point on each node's border that actually faces the other node, so it looks correct under
  // any layout (radial, tree, ...), not just the top-down "layered" one.
  const path = $derived.by(() => {
    if (!sourceNode.current || !targetNode.current) {
      return undefined;
    }
    const { sourceX, sourceY, targetX, targetY } = getFloatingEdgeParams(sourceNode.current, targetNode.current);
    const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    return edgePath;
  });
</script>

{#if path}
  <BaseEdge {id} {path} />
{/if}
