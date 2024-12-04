<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, type ChartType } from "chart.js/auto";
  interface Props {
    id?: string;
    title: string;
    data: number[];
    labels: string[];
    colors: string[];
  }

  let { id, title, data, labels, colors }: Props = $props();

  function slugify(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!id) {
    id = slugify(title);
  }
  const style = getComputedStyle(document.body);
  const fontfamily = style.getPropertyValue("--vscode-font-family"),
    fontweight = style.getPropertyValue("--vscode-font-weight"),
    fontsize = parseInt(style.getPropertyValue("--vscode-font-size")),
    fontcolor = style.getPropertyValue("--vscode-foreground");

  const type: ChartType = "pie";
  const legend = {
    position: "right",
    labels: {
      usePointStyle: true,
      color: fontcolor,
      font: {
        size: fontsize,
        family: fontfamily,
      },
    },
  };

  const chartData: Chart.ChartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: colors,
      },
    ],
  };

  const options: Chart.ChartConfiguration = {
    type,
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend,
        title: {
          display: false,
          text: title,
        },
      },
    },
  };

  onMount(async () => {
    let ctx = document.getElementById(id) as HTMLCanvasElement;
    // @ts-ignore
    new Chart(ctx, options);
  });
</script>

<div class="card card-chart">
  <h3>{title}</h3>
  <div class="chart-container">
    <canvas {id}></canvas>
  </div>
</div>

<style>
  .chart-container {
    position: relative;
    /* height:40vh; width:80vw" */
    min-height: 200px;
    align-items: center;
  }
  .chart-container canvas {
    margin: 0 auto;
  }
  .card-chart h3 {
    margin-bottom: 0;
  }
</style>
