<script lang="ts">
  interface Props {
    options?: number[];
    pageSize: number;
    onUpdatePage: () => void | Promise<void>;
  }
  let { options = [5, 10, 20, 50, 100], pageSize = $bindable(), onUpdatePage }: Props = $props();
</script>

<div>
  <span>Page size:</span>
  <select bind:value={pageSize} onchange={() => onUpdatePage()}>
    {#each options as option}
      <option value={option}>{option}</option>
    {/each}
  </select>
</div>

<style>
</style>
