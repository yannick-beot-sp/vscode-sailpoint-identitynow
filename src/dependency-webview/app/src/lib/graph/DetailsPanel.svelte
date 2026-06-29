<script lang="ts">
  import { getTypeStyle, pluralizeTypeLabel } from "./typeStyles";
  import type { FlowNodeData } from "./grouping";
  import { highlightJson } from "./jsonHighlight";

  let { selected, width }: { selected: FlowNodeData | undefined; width: number } = $props();

  let activeTab = $state<"attributes" | "json">("attributes");

  $effect(() => {
    selected;
    activeTab = "attributes";
  });

  const jsonValue = $derived(
    selected === undefined
      ? undefined
      : selected.kind === "dependency"
        ? (selected.node.data ?? selected.node)
        : { groupType: selected.groupType, count: selected.count, expanded: selected.expanded }
  );

  const jsonHtml = $derived(jsonValue === undefined ? "" : highlightJson(jsonValue));
</script>

<aside class="details-panel" style="width: {width}px">
  {#if selected === undefined}
    <p class="placeholder">Select a node to see its details.</p>
  {:else}
    <div class="tabs" role="tablist">
      <button class="tab" class:active={activeTab === "attributes"} role="tab" aria-selected={activeTab === "attributes"} onclick={() => (activeTab = "attributes")}>
        Attributes
      </button>
      <button class="tab" class:active={activeTab === "json"} role="tab" aria-selected={activeTab === "json"} onclick={() => (activeTab = "json")}>
        JSON
      </button>
    </div>

    {#if activeTab === "attributes"}
      {#if selected.kind === "dependency"}
        {@const style = getTypeStyle(selected.node.type)}
        {@const Icon = style.icon}
        <h2>{selected.node.label}</h2>
        <span class="chip" style="--accent: {style.color}"><Icon />{style.label}</span>

        <dl>
          <dt>Id</dt>
          <dd>{selected.node.resourceId ?? selected.node.id}</dd>

          {#if selected.node.description}
            <dt>Description</dt>
            <dd>{selected.node.description}</dd>
          {/if}

          {#each Object.entries(selected.node.attributes ?? {}) as [key, value] (key)}
            <dt>{key}</dt>
            <dd>{value}</dd>
          {/each}
        </dl>

        <section class="actions">
          <h3>Actions</h3>
          <p class="placeholder">No actions available yet.</p>
        </section>
      {:else}
        {@const style = getTypeStyle(selected.groupType)}
        {@const Icon = style.icon}
        <h2>{selected.count} {pluralizeTypeLabel(selected.groupType, selected.count)}</h2>
        <span class="chip" style="--accent: {style.color}"><Icon />{style.label}</span>
        <p class="placeholder">
          {selected.expanded
            ? "Double-click this node in the graph to collapse it."
            : "Double-click this node in the graph to expand it."}
        </p>
      {/if}
    {:else}
      <pre class="json-view"><code>{@html jsonHtml}</code></pre>
    {/if}
  {/if}
</aside>

<style>
  .details-panel {
    height: 100%;
    box-sizing: border-box;
    padding: 1rem;
    overflow-y: auto;
    background: var(--vscode-editor-background, #1e1e1e);
    border-left: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1em;
    word-break: break-word;
  }

  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 0.95em;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--accent);
    color: #1e1e1e;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 600;
  }

  .placeholder {
    color: var(--vscode-descriptionForeground, rgba(204, 204, 204, 0.7));
  }

  dl {
    margin-top: 1rem;
  }

  dt {
    font-size: 0.8em;
    color: var(--vscode-descriptionForeground, rgba(204, 204, 204, 0.7));
    margin-top: 0.5rem;
  }

  dd {
    margin: 0;
    word-break: break-word;
  }

  .actions {
    margin-top: 1.5rem;
    border-top: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
    padding-top: 0.75rem;
  }

  .tabs {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
    margin: -1rem -1rem 1rem -1rem;
    padding: 0 1rem;
  }

  .tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--vscode-descriptionForeground, rgba(204, 204, 204, 0.7));
    padding: 0.5rem 0.25rem;
    font-size: 0.85em;
    cursor: pointer;
  }

  .tab:hover {
    color: var(--vscode-foreground, #ccc);
  }

  .tab.active {
    color: var(--vscode-foreground, #ccc);
    border-bottom-color: var(--vscode-focusBorder, #007fd4);
  }

  .json-view {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: var(--vscode-editor-font-size, 0.85em);
  }

  .json-view :global(.json-key) {
    color: var(--vscode-symbolIcon-fieldForeground, #9cdcfe);
  }

  .json-view :global(.json-string) {
    color: var(--vscode-debugTokenExpression-string, #ce9178);
  }

  .json-view :global(.json-number) {
    color: var(--vscode-debugTokenExpression-number, #b5cea8);
  }

  .json-view :global(.json-boolean),
  .json-view :global(.json-null) {
    color: var(--vscode-debugTokenExpression-boolean, #569cd6);
  }
</style>
