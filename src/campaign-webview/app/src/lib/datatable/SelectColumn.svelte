<script lang="ts">
  import type { Column } from "./Model";
  import ColumnsSvg from "./svgs/columns.svelte";
  interface Props {
    columns: Column[];
  }
  let { columns = $bindable() }: Props = $props();
  let show = $state(false);
  function toggle() {
    show = !show;
  }

  function clickOutside(element: any, callbackFunction: any) {
    function onClick(event: any) {
      console.log(">onClick");
      console.log(element);
      console.log(event.target);
      if (!element.contains(event.target)) {
        callbackFunction();
      }
    }

    document.body.addEventListener("click", onClick);

    // return {
    //   update(newCallbackFunction: any) {
    //     callbackFunction = newCallbackFunction;
    //   },
    //   destroy() {
    //     document.body.removeEventListener("click", onClick);
    //   },
    // };
  }
</script>

<div class="dropdown">
  <button onclick={toggle} class="btn dropbtn"
    ><span>
      <ColumnsSvg />
    </span></button
  >
  <div class="dropdown-content" class:show>
    <!-- use:clickOutside={() => {
      if (show) {
        show = false;
      }
    }} -->
    {#each columns as column}
      <div class="checkbox">
        <input
          type="checkbox"
          
          bind:checked={column.visible}
          id="checkbox-columns-{column.field}"
        />
        <label for="checkbox-columns-{column.field}">{column.label}</label><br />
      </div>
    {/each}
  </div>
</div>

<style>
  /* The container <div> - needed to position the dropdown content */
  .dropdown {
    position: relative;
    display: inline-block;
  }

  /* Dropdown Content (Hidden by Default) */
  .dropdown-content {
    display: none;
    position: absolute;
    background-color: var(--vscode-button-background);
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
    z-index: 1;
    text-align: left;
  }

  /* Links inside the dropdown */
  .dropdown-content .checkbox {
    color: var(--vscode-button-foreground);
    padding: 5px 5px;
  }
  .show {
    display: block;
  }
</style>
