<script lang="ts">
  import { SvelteFlow, Background, Controls, MiniMap, Panel } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { SvelteSet } from "svelte/reactivity";
  import type { DependencyGraphData } from "../../services/Client";
  import { buildDisplayGraph, type FlowNode, type FlowEdge, type FlowNodeData } from "./grouping";
  import { runElkLayout, LAYOUT_ALGORITHMS, type LayoutAlgorithm } from "./layout";
  import DependencyNode from "./DependencyNode.svelte";
  import GroupNode from "./GroupNode.svelte";
  import FloatingEdge from "./FloatingEdge.svelte";

  let { graph, onSelectNode }: {
    graph: DependencyGraphData;
    onSelectNode: (data: FlowNodeData | undefined) => void;
  } = $props();

  const nodeTypes = { dependency: DependencyNode, group: GroupNode };
  const edgeTypes = { floating: FloatingEdge };
  const defaultEdgeOptions = { type: "floating" as const };
  const proOptions = { hideAttribution: true };
  // VS Code adds one of these classes to <body>; xyflow's built-in chrome (controls/minimap/
  // background) needs to be told explicitly since it can't see our CSS-variable-based theming.
  const colorMode = document.body.classList.contains("vscode-light") ? "light" : "dark";

  const expandedGroupIds = new SvelteSet<string>();
  let layoutAlgorithm = $state<LayoutAlgorithm>("layered");

  let nodes = $state.raw<FlowNode[]>([]);
  let edges = $state.raw<FlowEdge[]>([]);

  $effect(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildDisplayGraph(graph, expandedGroupIds);

    const decoratedNodes: FlowNode[] = rawNodes.map(n => {
      if (n.data.kind !== "group") {
        return n;
      }
      const data = n.data;
      return {
        ...n,
        data: {
          ...data,
          onToggle: () => {
            if (expandedGroupIds.has(data.groupKey)) {
              expandedGroupIds.delete(data.groupKey);
            } else {
              expandedGroupIds.add(data.groupKey);
            }
          }
        }
      };
    });

    runElkLayout(rawNodes, rawEdges, layoutAlgorithm).then((positioned) => {
      const positionById = new Map(positioned.map(n => [n.id, n.position]));
      nodes = decoratedNodes.map(n => ({ ...n, position: positionById.get(n.id) ?? n.position }));
      edges = rawEdges;
    });
  });

  function handleNodeClick({ node }: { node: FlowNode }) {
    onSelectNode(node.data);
  }

  function handlePaneClick() {
    onSelectNode(undefined);
  }
</script>

<div class="graph-view">
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    {edgeTypes}
    {defaultEdgeOptions}
    {colorMode}
    {proOptions}
    fitView
    nodesDraggable={true}
    nodesConnectable={false}
    elementsSelectable={true}
    deleteKey={null}
    onnodeclick={handleNodeClick}
    onpaneclick={handlePaneClick}
  >
    <Background />
    <Controls />
    <MiniMap />
    <Panel position="top-left">
      <label class="layout-select">
        Layout:
        <select bind:value={layoutAlgorithm}>
          {#each LAYOUT_ALGORITHMS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>
    </Panel>
  </SvelteFlow>
</div>

<style>
  .graph-view {
    width: 100%;
    height: 100%;
  }

  .layout-select {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--vscode-editorWidget-background, #252526);
    color: var(--vscode-editorWidget-foreground, #ccc);
    border: 1px solid var(--vscode-editorWidget-border, #454545);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
  }

  select {
    background: var(--vscode-dropdown-background, #3c3c3c);
    color: var(--vscode-dropdown-foreground, #f0f0f0);
    border: 1px solid var(--vscode-dropdown-border, #3c3c3c);
    border-radius: 2px;
  }
</style>
