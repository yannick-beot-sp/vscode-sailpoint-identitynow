<script lang="ts">
  import { onMount } from "svelte";
  import ProgressIndicator from "./lib/ProgressIndicator.svelte";

  function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  async function stall() {
    const stallTime = getRandomInt(500, 3000);
    await new Promise((resolve) => setTimeout(resolve, stallTime));
  }

  async function generateKPI(): Promise<{ current: number; total: number }> {
    await stall();
    const total = getRandomInt(50, 200);
    const current = getRandomInt(10, total);
    return { current, total };
  }

  let accessReviewCompleted = generateKPI();
  let identitiesCompleted = generateKPI();
  let itemsCompleted = generateKPI();
</script>

<main>
  <h1>{window.data.campaignName}</h1>

  <section id="kpi">
    <div class="item">
      <ProgressIndicator name="Access Review Completed" bind:promiseResult={accessReviewCompleted} />
    </div>
    <div class="item">
      <ProgressIndicator name="Identities Completed" bind:promiseResult={identitiesCompleted} />
    </div>
    <div class="item">
      <ProgressIndicator name="Items Completed" bind:promiseResult={itemsCompleted} />
    </div>
  </section>
</main>
