<script lang="ts">
  // Define the props with TypeScript types

  interface Props {
    name: string;
    current: number;
    total: number;
  }

  let { name, current, total }: Props = $props();
</script>

<!-- Component template -->
<div class="card">
  <h3 class="kpi-name">{name}</h3>
  <div class="kpi-values">
    <div class="kpi-value-summary">
      <p class="kpi-value-outof">{current} / {total}</p>
    </div>
    <div class="kpi-bar">
      <div class="kpi-bar-completed" style:width="{Math.round((current / total) * 100) || 0}%">
        {Math.round((current / total) * 100) || 0}%
      </div>
    </div>
  </div>
</div>

<style>
  .kpi-bar {
    line-height: 1rem;
    width: 100%;
    background-color: var(--vscode-input-background);
    display: flex;
    align-items: center;
    color: var(--vscode-button-foreground);
  }

  .kpi-bar-completed {
    background-color: var(--vscode-progressBar-background);
    text-align: center;
  }

  .kpi-bar,
  .kpi-bar-completed {
    border-radius: 9999px;
  }

  .kpi-value-outof {
    margin: 0;
    margin-left: auto;
  }

  .kpi-value-summary {
    display: flex;
    flex-direction: row;
    /* gap: 1rem; */
    /* justify-content: space-between; */
    /* align-items: center; */
    font-size: 11px;
    font-weight: 700;
  }

  .kpi-name {
    line-height: 1.625;
    font-weight: 700;
  }
</style>
