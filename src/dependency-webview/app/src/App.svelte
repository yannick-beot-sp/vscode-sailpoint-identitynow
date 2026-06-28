<script lang="ts">
  import GraphView from "./lib/graph/GraphView.svelte";
  import DetailsPanel from "./lib/graph/DetailsPanel.svelte";
  import Refresh from "./lib/svgs/refresh.svelte";
  import { ClientFactory } from "./services/ClientFactory";
  import type { DependencyGraphData } from "./services/Client";
  import type { FlowNodeData } from "./lib/graph/grouping";

  const client = ClientFactory.getClient();

  let promiseGraph = $state<Promise<DependencyGraphData>>();
  let selected = $state<FlowNodeData | undefined>(undefined);

  const MIN_DETAILS_WIDTH = 220;
  const MAX_DETAILS_WIDTH = 640;
  let detailsPanelWidth = $state(280);

  function load(force: boolean = false) {
    selected = undefined;
    promiseGraph = client.getDependencyGraph(window.data.resourceType, window.data.resourceId, force);
  }

  function startResize(event: PointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = detailsPanelWidth;

    function onMove(moveEvent: PointerEvent) {
      const delta = startX - moveEvent.clientX;
      detailsPanelWidth = Math.min(MAX_DETAILS_WIDTH, Math.max(MIN_DETAILS_WIDTH, startWidth + delta));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  load(false);
</script>

<main>
  <section id="headerSection">
    <h1>{window.data.label}</h1>
    <div class="headerSection--buttons">
      <button class="btn" onclick={() => load(true)}>
        <span><Refresh /></span> Refresh
      </button>
    </div>
  </section>

  {#await promiseGraph}
    <div class="loading-container">
      <div class="loading"></div>
    </div>
  {:then graph}
    <div class="content">
      <GraphView graph={graph!} onSelectNode={(data) => (selected = data)} />
      <div class="resizer" onpointerdown={startResize} role="separator" aria-orientation="vertical"></div>
      <DetailsPanel {selected} width={detailsPanelWidth} />
    </div>
  {:catch error}
    <p class="error">Failed to load dependencies: {error?.message ?? error}</p>
  {/await}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    box-sizing: border-box;
  }

  .content {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .content :global(.graph-view) {
    flex: 1 1 auto;
  }

  .content :global(.details-panel) {
    flex: 0 0 auto;
  }

  .resizer {
    flex: 0 0 4px;
    cursor: col-resize;
    background: transparent;
  }

  .resizer:hover,
  .resizer:active {
    background: var(--vscode-focusBorder, #007fd4);
  }

  .loading-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error {
    padding: 1rem;
    color: var(--vscode-errorForeground);
  }
</style>
