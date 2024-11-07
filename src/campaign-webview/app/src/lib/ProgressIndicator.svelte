<script lang="ts">
  // Define the props with TypeScript types
  export let name: string;
  export let promiseResult: Promise<any>;
</script>

<!-- Component template -->
<div class="card">
  <h3 class="kpi-name">{name}</h3>
  <div class="kpi-values">
    {#await promiseResult}
      <!-- promise is pending -->
      <div class="loading"></div>
    {:then value}
      <div class="kpi-value-summary">
        <p class="kpi-value-outof">{value.current} / {value.total}</p>
      </div>
      <div class="kpi-bar">
        <div
          class="kpi-bar-completed"
          style:width="{Math.round((value.current / value.total) * 100) || 0}%"
        >
          {Math.round((value.current / value.total) * 100) || 0}%
        </div>
      </div>
    {/await}
  </div>
</div>

<style>
  .kpi-bar {
    line-height: 1rem;
    width: 100%;
    background-color: var(--vscode-disabledForeground);
    display: flex;
    align-items: center;
  }

  .kpi-bar-completed {
    background-color: var(--vscode-progressBar-background);
    /* justify-content: center;
    display: flex;
    flex-direction: column; */
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
