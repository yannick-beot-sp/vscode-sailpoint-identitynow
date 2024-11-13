<script lang="ts">
  import { onMount } from "svelte";
  import RowsPerPage from "./RowsPerPage.svelte";
  import Pagination from "./Pagination.svelte";
  import type { FetchOptions, FetchDataCallback, Column, Action, MultiSelectAction } from "./Model";

  interface Props {
    columns: Column[];
    fetchData: FetchDataCallback;
    multiSelectActions: MultiSelectAction<any>[];
    actions: Action<any>[];
  }
  let { columns, fetchData, multiSelectActions = [], actions = [] }: Props = $props();

  let data: any = $state([]);
  let currentPage = $state(0);
  let pageSize = $state(10);
  let totalResults = $state(0);
  let fetchOptions: FetchOptions = $derived({ currentPage, pageSize });
  let selectedRows: any[] = $state([]);
  let hasSelection: boolean = $derived(selectedRows.length > 0);
  let hasMultiSelectActions: boolean = $derived(multiSelectActions.length > 0);
  let selectAll: boolean = $derived(selectedRows.length === data.length);

  const handleRowSelect = (row: any) => {
    if (selectedRows.includes(row)) {
      selectedRows = selectedRows.filter((r) => r !== row);
    } else {
      selectedRows = [...selectedRows, row];
    }
  };

  async function updateData() {
    console.log({ currentPage, pageSize, fetchOptions });
    if (currentPage * pageSize > totalResults) {
      currentPage = 0;
    }

    const response = await fetchData(fetchOptions);
    data = response.data;
    totalResults = response.count;
  }

  function handleSelectAll() {
    if (selectAll) {
      // All rows were selected. Need to unselect all
      selectedRows = [];
    } else {
      // Not all rows selected. Selecting all rows
      selectedRows = [...data];
    }
  }

  onMount(async () => {
    await updateData();
  });
</script>

<div class="datatable">
  <div class="header">
    {#if hasSelection}
      <div>
        <span>{selectedRows.length} of {data.length} selected</span>
      </div>
      <div class="actions">
        {#each multiSelectActions as action}
          <button id={action.id} class={action.class} onclick={() => action.callback(selectedRows)}>
            {action.label}
          </button>
        {/each}
      </div>
    {:else}
      <div>
        <span>Results: {totalResults}</span>
      </div>
    {/if}
  </div>
  <table>
    <thead>
      <tr>
        {#if hasMultiSelectActions}
          <!-- Needs checkbox only if there are actions for multi sections-->
          <th> <input type="checkbox" checked={selectAll} onclick={handleSelectAll} /></th>
        {/if}
        {#each columns as column}
          <th>{column.label}</th>
        {/each}

        {#if actions.length > 0}
          <th>Actions</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each data as row, i}
        <tr class:selected={selectedRows.includes(row)}>
          {#if hasMultiSelectActions}
            <!-- Needs checkbox only if there are actions for multi sections-->
            <td>
              <input
                type="checkbox"
                checked={selectedRows.includes(row)}
                onchange={() => handleRowSelect(row)}
              />
            </td>
          {/if}
          {#each columns as column}
            <td>{row[column.field]}</td>
          {/each}
          {#if actions.length > 0}
            <td>
              {#each actions as action}
                {#if action.condition === undefined || action.condition(row)}
                  <button id={action.id} class={action.class} onclick={() => action.callback(row)}>
                    {action.label}
                  </button>
                {/if}
              {/each}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class="footer">
    <div class="page-size">
      <RowsPerPage bind:pageSize onUpdatePage={updateData} />
    </div>
    <div class="pagination">
      <Pagination bind:currentPage bind:pageSize bind:totalResults onUpdatePage={updateData} />
    </div>
  </div>
</div>

<style>
  tbody button,
  .actions button {
    color: var(--vscode-button-foreground);
    background-color: var(--vscode-button-background);
    border-radius: 0;
    margin-left: 5px;
  }

  tbody button:hover,
  .actions button:hover {
    background-color: var(--vscode-button-hoverBackground);
  }
  .footer {
    padding-top: 1rem;
    display: flex;
    align-items: center;
  }
  .footer .page-size {
    font-weight: 700;
  }
  .footer .pagination {
    margin-left: auto;
  }
  .datatable {
    width: 100%;
    font-family: var(--vscode-font-family);
    font-weight: var(--vscode-font-weight);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--vscode-textSeparator-foreground);
    resize: horizontal;
    overflow: auto;
  }

  tr:nth-child(odd) td {
    background-color: var(--vscode-scrollbarSlider-background);
  }
  tr:hover td {
    background-color: var(--vscode-scrollbarSlider-hoverBackground);
  }

  th {
    border-color: rgba(255, 255, 255, 0.69);
  }

  .selected {
    background-color: var(--vscode-scrollbarSlider-activeBackground);
  }
</style>
