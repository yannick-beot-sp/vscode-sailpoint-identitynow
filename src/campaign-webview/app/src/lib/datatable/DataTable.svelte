<script lang="ts">
  import { onMount } from "svelte";
  import RowsPerPage from "./RowsPerPage.svelte";
  import Pagination from "./Pagination.svelte";
  import type { FetchOptions, FetchDataCallback, Column } from "./Model";
  let data: any = $state([]);
  let currentPage = $state(0);
  let pageSize = $state(10);
  let totalResults = $state(0);
  let fetchOptions: FetchOptions = $derived({ currentPage, pageSize });

  interface Props {
    columns: Column[];
    fetchData: FetchDataCallback;
  }
  let { columns, fetchData }: Props = $props();

  let selectedRows: any[] = [];

  const handleRowSelect = (row: any) => {
    if (selectedRows.includes(row)) {
      selectedRows = selectedRows.filter((r) => r !== row);
    } else {
      selectedRows = [...selectedRows, row];
    }
  };

  async function updateData() {
    console.log({ currentPage, pageSize, fetchOptions });

    const response = await fetchData(fetchOptions);
    data = response.data;
    totalResults = response.count;
  }

  onMount(async () => {
    await updateData();
  });
</script>

<div class="datatable">
  <div class="header">
    <div>
      <span>Results: {totalResults}</span>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th> <input type="checkbox" /></th>
        {#each columns as column}
          <th>{column.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each data as row, i}
        <tr class:selected={selectedRows.includes(row)}>
          <td>
            <input
              type="checkbox"
              checked={selectedRows.includes(row)}
              onchange={() => handleRowSelect(row)}
            />
          </td>
          {#each columns as column}
            <td>{row[column.field]}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class="footer">
    <RowsPerPage bind:pageSize={pageSize} onUpdatePage={updateData} />
    <Pagination  bind:currentPage={currentPage} bind:pageSize={pageSize} bind:totalResults={totalResults} onUpdatePage={updateData} />
  </div>
</div>

<style>
  .datatable {
    width: 100%;
    font-family: Arial, sans-serif;
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
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
  }

  .selected {
    background-color: #e6f7ff;
  }
</style>
