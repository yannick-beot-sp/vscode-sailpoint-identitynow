<script lang="ts">
  import ChevronDoubleLeft from "./svgs/chevron-double-left.svelte";
  import ChevronDoubleRight from "./svgs/chevron-double-right.svelte";
  import ChevronLeft from "./svgs/chevron-left.svelte";
  import ChevronRight from "./svgs/chevron-right.svelte";

  interface Props {
    currentPage: number;
    pageSize: number;
    totalResults: number;
    onUpdatePage: () => void | Promise<void>;
  }

  let {
    currentPage = $bindable(),
    pageSize = $bindable(),
    totalResults = $bindable(),
    onUpdatePage,
  }: Props = $props();

  let numberPages = $derived(Math.ceil(totalResults / pageSize));
  let hasNext = $derived(currentPage + 1 < numberPages);
  let hasPrevious = $derived(currentPage > 0);

  const next = (event: Event) => {
    // Prevent default navigation
    event.preventDefault();
    if (hasNext) {
      currentPage++;
      onUpdatePage();
    }
  };

  const previous = (event: Event) => {
    // Prevent default navigation
    event.preventDefault();
    if (hasPrevious) {
      currentPage--;
      onUpdatePage();
    }
  };
  const first = (event: Event) => {
    // Prevent default navigation
    event.preventDefault();
    if (currentPage > 0) {
      currentPage = 0;
      onUpdatePage();
    }
  };
  const last = (event: Event) => {
    // Prevent default navigation
    event.preventDefault();
    currentPage = numberPages - 1;
    onUpdatePage();
  };
  const goto = (page: number, event: Event) => {
    // Prevent default navigation
    event.preventDefault();
    if (page >= 0 && page < numberPages) {
      currentPage = page;
      onUpdatePage();
    }
  };
</script>

<nav aria-label="Page navigation">
  <ul class="pagination">
    <li>
      {#if hasPrevious}
        <a href="#" class="" onclick={first}>
          <ChevronDoubleLeft />
        </a>
      {:else}
        <span class="disabled">
          <ChevronDoubleLeft />
        </span>
      {/if}
    </li>
    <li>
      {#if hasPrevious}
        <a href="#" class="" onclick={previous}>
          <ChevronLeft />
        </a>
      {:else}
        <span class="disabled">
          <ChevronLeft />
        </span>
      {/if}
    </li>
    {#each Array(numberPages) as _, i}
      <li>
        {#if i == currentPage}
          <span class="active">{i + 1}</span>
        {:else}
          <a href="#" class="" onclick={(event) => goto(i, event)}>{i + 1}</a>
        {/if}
      </li>
    {/each}
    <li>
      {#if hasNext}
        <a href="#" class="" onclick={next}>
          <ChevronRight />
        </a>
      {:else}
        <span class="disabled">
          <ChevronRight />
        </span>
      {/if}
    </li>
    <li>
      {#if hasNext}
        <a href="#" class="" onclick={last}>
          <ChevronDoubleRight />
        </a>
      {:else}
        <span class="disabled">
          <ChevronDoubleRight />
        </span>
      {/if}
    </li>
  </ul>
</nav>

<style>
  ul.pagination li {
    border: 1px solid var(--vscode-button-separator);
    box-sizing: border-box;
    display: flex;
  }
  ul.pagination {
    align-items: center;
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    line-height: 1.5rem;
    align-items: center;
    height: 2rem;
  }

  /* ul.pagination li:first-child {
    border-top-left-radius: var;
 
}
  ul.pagination li:last-child {
 
} */

  ul.pagination span.active {
    background-color: var(--vscode-button-background);
  }

  ul.pagination span.disabled {
    background-color: var(--vscode-disabledForeground);
  }

  ul.pagination a:hover {
    background-color: var(--vscode-button-hoverBackground);
  }
  ul.pagination a,
  ul.pagination span {
    text-decoration: none;
    color: var(--vscode-foreground);
    padding-left: 1rem;
    padding-right: 1rem;
    align-items: center;
    height: 2rem;
    display: flex;
    font-family: var(--vscode-font-family);
    font-weight: 700;
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
  }
</style>
