<script lang="ts">
  import { onMount } from "svelte";
  import { Chart } from "chart.js/auto";

  const COLOR_OPENED = "#1c64f2",
    COLOR_APPROVED = "#16bdca",
    COLOR_REVOKED = "#e74694";

  const style = getComputedStyle(document.body);
  const fontfamily = style.getPropertyValue("--vscode-font-family"),
    fontweight = style.getPropertyValue("--vscode-font-weight"),
    fontsize = parseInt(style.getPropertyValue("--vscode-font-size")),
    fontcolor = style.getPropertyValue("--vscode-foreground");

  console.log({ fontcolor });

  const data: Chart.ChartData = {
    labels: ["Approved", "Revoked", "Opened"],
    datasets: [
      {
        label: "Roles",
        data: [10, 50, 30],
        backgroundColor: [COLOR_APPROVED, COLOR_REVOKED, COLOR_OPENED],
      },
    ],
  };

  const rolesOptions: Chart.ChartConfiguration = {
    type: "pie",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
          labels: {
            usePointStyle: true,
            color: fontcolor,
            font: {
              size: fontsize,
              family: fontfamily,
            },
          },
        },
        title: {
          display: false,
          text: "Roles",
        },
      },
    },
  };

  onMount(async () => {
    const ctx = document.getElementById("rolesChart");
    new Chart(ctx, rolesOptions);
  });

  export let campaignId: string;
</script>

<div class="card card-chart">
  <h3>Roles</h3>
  <div class="chart-container">
    <canvas id="rolesChart"></canvas>
  </div>
</div>
<div class="card">
  <h3>Access Profiles</h3>
  <div class="chart-container">
    <canvas id="accessProfilesChart"></canvas>
  </div>
</div>
<div class="card">
  <h3>Entitlements</h3>
  <div class="chart-container">
    <canvas id="entitlementsChart"></canvas>
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
