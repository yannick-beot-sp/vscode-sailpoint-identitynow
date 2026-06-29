<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";
  import { getTypeStyle, pluralizeTypeLabel } from "./typeStyles";
  import type { GroupFlowNodeData } from "./grouping";

  let { data }: NodeProps & { data: GroupFlowNodeData } = $props();

  const style = $derived(getTypeStyle(data.groupType));
  const Icon = $derived(style.icon);
</script>

<div
  class="group-node"
  class:expanded={data.expanded}
  style="--accent: {style.color}"
  role="button"
  tabindex="0"
  ondblclick={() => data.onToggle?.()}
  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && data.onToggle?.()}
  title={data.expanded ? "Double-click to collapse" : "Double-click to expand"}
>
  <Handle type="target" position={Position.Top} isConnectable={false} />
  <span class="chip" title={style.label}><Icon /></span>
  <span class="label">{data.count} {pluralizeTypeLabel(data.groupType, data.count)}</span>
  <Handle type="source" position={Position.Bottom} isConnectable={false} />
</div>

<style>
  .group-node {
    display: flex;
    align-items: center;
    gap: 6px;
    width: max-content;
    padding: 6px 10px;
    border-radius: 16px;
    border: 2px dashed var(--accent);
    background: var(--vscode-editorWidget-background, #252526);
    color: var(--vscode-editorWidget-foreground, #ccc);
    font-size: 12px;
    cursor: pointer;
  }

  .group-node.expanded {
    border-style: solid;
  }

  .chip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: var(--accent);
    color: #1e1e1e;
    border-radius: 4px;
    font-size: 11px;
  }

  .label {
    white-space: nowrap;
  }

  /* Required by xyflow for edge bookkeeping, but FloatingEdge ignores their position, so they
     don't need to be visible or anchor edges to a fixed point. */
  .group-node :global(.svelte-flow__handle) {
    opacity: 0;
    pointer-events: none;
  }
</style>
