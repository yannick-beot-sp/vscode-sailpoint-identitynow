<script lang="ts">
  import { SvelteFlow, Background, Controls, MiniMap, Panel } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { untrack } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import type { DependencyGraphData, NodeViewState, ViewportState } from "../../services/Client";
  import { ClientFactory } from "../../services/ClientFactory";
  import { buildDisplayGraph, VIEWABLE_DEPENDENCY_TYPES, OPEN_RESOURCE_DEPENDENCY_TYPES, OPEN_URL_DEPENDENCY_TYPES, type DependencyFlowNodeData, type FlowNode, type FlowEdge, type FlowNodeData } from "./grouping";
  import { runTreeLayout, LAYOUT_ALGORITHMS, type LayoutAlgorithm } from "./layout";
  import DependencyNode from "./DependencyNode.svelte";
  import GroupNode from "./GroupNode.svelte";
  import FloatingEdge from "./FloatingEdge.svelte";

  let { graph, resourceType, resourceId, onSelectNode }: {
    graph: DependencyGraphData;
    resourceType: string;
    resourceId: string;
    onSelectNode: (data: FlowNodeData | undefined) => void;
  } = $props();

  const nodeTypes = { dependency: DependencyNode, "group-summary": GroupNode };
  const edgeTypes = { floating: FloatingEdge };
  const defaultEdgeOptions = { type: "floating" as const };
  const proOptions = { hideAttribution: true };
  // VS Code adds one of these classes to <body>; xyflow's built-in chrome (controls/minimap/
  // background) needs to be told explicitly since it can't see our CSS-variable-based theming.
  const colorMode = document.body.classList.contains("vscode-light") ? "light" : "dark";

  const client = ClientFactory.getClient();

  // Per-node UI state (position, group expansion) cached for this resource, keyed by flow node id.
  // Read once on mount: resourceType/resourceId are stable for the lifetime of this component
  // (a new instance is created whenever the parent switches resource or forces a reload).
  let nodeViewStates: Record<string, NodeViewState> = untrack(
    () => ({ ...(client.getNodeViewStates(resourceType, resourceId) ?? {}) })
  );

  const expandedGroupIds = new SvelteSet<string>(
    Object.entries(nodeViewStates).filter(([, s]) => s.expanded).map(([id]) => id)
  );

  const savedLayoutAlgorithm = untrack(() => client.getLayoutAlgorithm(resourceType, resourceId));
  let layoutAlgorithm = $state<LayoutAlgorithm>(
    LAYOUT_ALGORITHMS.some(o => o.value === savedLayoutAlgorithm) ? savedLayoutAlgorithm as LayoutAlgorithm : "vertical"
  );

  // Restored once on mount; when present it replaces fitView so reopening the panel shows
  // exactly the same pan/zoom the user left it at.
  const savedViewport = untrack(() => client.getViewport(resourceType, resourceId));

  let nodes = $state.raw<FlowNode[]>([]);
  let edges = $state.raw<FlowEdge[]>([]);

  // $state.raw (not deeply-proxied $state): `data.node` is forwarded as-is to postMessage when
  // opening a resource, and a reactive Proxy cannot be structured-cloned across the webview bridge.
  let contextMenu = $state.raw<{ x: number; y: number; data: DependencyFlowNodeData } | undefined>(undefined);

  function persistNodeViewStates() {
    client.setNodeViewStates(resourceType, resourceId, nodeViewStates);
  }

  function handleMoveEnd(_event: MouseEvent | TouchEvent | null, viewport: ViewportState) {
    client.setViewport(resourceType, resourceId, viewport);
  }

  $effect(() => {
    client.setLayoutAlgorithm(resourceType, resourceId, layoutAlgorithm);
  });

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
            const expanded = !expandedGroupIds.has(n.id);
            if (expanded) {
              expandedGroupIds.add(n.id);
            } else {
              expandedGroupIds.delete(n.id);
            }
            nodeViewStates = { ...nodeViewStates, [n.id]: { ...nodeViewStates[n.id], expanded } };
            persistNodeViewStates();
          }
        }
      };
    });

    runTreeLayout(rawNodes, rawEdges, layoutAlgorithm).then((positioned) => {
      const positionById = new Map(positioned.map(n => [n.id, n.position]));
      nodes = decoratedNodes.map(n => ({
        ...n,
        position: nodeViewStates[n.id]?.position ?? positionById.get(n.id) ?? n.position
      }));
      edges = rawEdges;
    });
  });

  function handleNodeClick({ node }: { node: FlowNode }) {
    onSelectNode(node.data);
    contextMenu = undefined;
  }

  function handlePaneClick() {
    onSelectNode(undefined);
    contextMenu = undefined;
  }

  /** Resolves a node's parent id from the raw graph edges (dimensions/provisioning policies have exactly one owner). */
  function findParentId(nodeId: string): string | undefined {
    return graph.edges.find(edge => edge.target === nodeId)?.source;
  }

  function handleNodeContextMenu({ event, node }: { event: MouseEvent; node: FlowNode }) {
    event.preventDefault();
    if (node.data.kind !== "dependency") {
      contextMenu = undefined;
      return;
    }
    const { type } = node.data.node;
    if (!VIEWABLE_DEPENDENCY_TYPES.has(type)
      && !OPEN_RESOURCE_DEPENDENCY_TYPES.has(type)
      && !OPEN_URL_DEPENDENCY_TYPES.has(type)) {
      contextMenu = undefined;
      return;
    }
    contextMenu = { x: event.clientX, y: event.clientY, data: node.data };
  }

  function handleViewDependencies() {
    if (contextMenu) {
      const { type, resourceId, id, label } = contextMenu.data.node;
      client.viewNodeDependencies(type, resourceId ?? id, label);
    }
    contextMenu = undefined;
  }

  /**
   * xyflow keeps its own reactive copy of the nodes it renders, so the `node` handed to us by its
   * event handlers is wrapped in a Proxy we don't control (independent of our own `$state.raw`
   * usage) — and a Proxy cannot be structured-cloned by `postMessage`. Round-tripping through
   * JSON strips any such wrapper and guarantees a plain, cloneable object.
   */
  function toPlainNode(node: DependencyFlowNodeData["node"]): DependencyFlowNodeData["node"] {
    return JSON.parse(JSON.stringify(node));
  }

  function handleOpenResource() {
    if (contextMenu) {
      const node = toPlainNode(contextMenu.data.node);
      client.openNodeResource(node, findParentId(node.id));
    }
    contextMenu = undefined;
  }

  function handleOpenUrl() {
    if (contextMenu) {
      const node = toPlainNode(contextMenu.data.node);
      client.openNodeResourceUrl(node, findParentId(node.id));
    }
    contextMenu = undefined;
  }

  function handleNodeDragStop({ targetNode }: { targetNode: FlowNode | null }) {
    if (!targetNode) {
      return;
    }
    nodeViewStates = { ...nodeViewStates, [targetNode.id]: { ...nodeViewStates[targetNode.id], position: targetNode.position } };
    persistNodeViewStates();
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
    fitView={savedViewport === undefined}
    initialViewport={savedViewport}
    nodesDraggable={true}
    nodesConnectable={false}
    elementsSelectable={true}
    deleteKey={null}
    onnodeclick={handleNodeClick}
    onnodecontextmenu={handleNodeContextMenu}
    onnodedragstop={handleNodeDragStop}
    onpaneclick={handlePaneClick}
    onmoveend={handleMoveEnd}
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

  {#if contextMenu}
    <button class="context-menu-backdrop" aria-label="Close menu" onclick={() => (contextMenu = undefined)}></button>
    <ul class="context-menu" style="left: {contextMenu.x}px; top: {contextMenu.y}px">
      {#if VIEWABLE_DEPENDENCY_TYPES.has(contextMenu.data.node.type)}
        <li><button onclick={handleViewDependencies}>View dependencies</button></li>
      {/if}
      {#if OPEN_RESOURCE_DEPENDENCY_TYPES.has(contextMenu.data.node.type)}
        <li><button onclick={handleOpenResource}>Open</button></li>
      {/if}
      {#if OPEN_URL_DEPENDENCY_TYPES.has(contextMenu.data.node.type)}
        <li><button onclick={handleOpenUrl}>Open in Web UI</button></li>
      {/if}
    </ul>
  {/if}
</div>

<style>
  .graph-view {
    width: 100%;
    height: 100%;
  }

  /* xyflow only ships hardcoded dark/light palettes selected via the `colorMode` class;
     override the background var directly so it always follows the actual VS Code theme
     instead of xyflow's built-in (and in practice always-dark) default. */
  .graph-view :global(.svelte-flow) {
    --xy-background-color: var(--vscode-editor-background);
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

  .context-menu-backdrop {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    padding: 0;
    cursor: default;
    z-index: 10;
  }

  .context-menu {
    position: fixed;
    z-index: 11;
    margin: 0;
    padding: 4px;
    list-style: none;
    min-width: 160px;
    background: var(--vscode-menu-background, #252526);
    color: var(--vscode-menu-foreground, #ccc);
    border: 1px solid var(--vscode-menu-border, #454545);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  }

  .context-menu button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    color: inherit;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 3px;
    cursor: pointer;
  }

  .context-menu button:hover {
    background: var(--vscode-menu-selectionBackground, #04395e);
    color: var(--vscode-menu-selectionForeground, #fff);
  }
</style>
