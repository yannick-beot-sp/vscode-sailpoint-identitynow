<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, type ChartType } from "chart.js/auto";
  import type { TotalAccessItems } from "../services/Client";

  interface Props {
    data: TotalAccessItems;
  }

  let { data }: Props = $props();

  const COLOR_OPENED = "#1c64f2",
    COLOR_APPROVED = "#16bdca",
    COLOR_REVOKED = "#e74694";

  const style = getComputedStyle(document.body);
  const fontfamily = style.getPropertyValue("--vscode-font-family"),
    fontweight = style.getPropertyValue("--vscode-font-weight"),
    fontsize = parseInt(style.getPropertyValue("--vscode-font-size")),
    fontcolor = style.getPropertyValue("--vscode-foreground");
  const labels = ["Approved", "Revoked", "Opened"];
  const backgroundColor = [COLOR_APPROVED, COLOR_REVOKED, COLOR_OPENED];

  const dataRoles: Chart.ChartData = {
    labels,
    datasets: [
      {
        label: "Roles",
        data: [data.rolesApproved, data.rolesRevoked, data.roleDecisionsTotal - data.roleDecisionsMade],
        backgroundColor,
      },
    ],
  };
  const dataAccessProfiles: Chart.ChartData = {
    labels,
    datasets: [
      {
        label: "Access Profiles",
        data: [
          data.accessProfilesRevoked,
          data.accessProfilesRevoked,
          data.accessProfileDecisionsTotal - data.accessProfileDecisionsMade,
        ],
        backgroundColor,
      },
    ],
  };
  const dataEntitlements: Chart.ChartData = {
    labels,
    datasets: [
      {
        label: "Entitlements",
        data: [
          data.entitlementsRevoked,
          data.entitlementsRevoked,
          data.entitlementDecisionsTotal - data.entitlementDecisionsMade,
        ],
        backgroundColor,
      },
    ],
  };
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

  const rolesOptions: Chart.ChartConfiguration = {
    type,
    data: dataRoles,
    options: {
      responsive: true,
      plugins: {
        legend,
        title: {
          display: false,
          text: "Roles",
        },
      },
    },
  };
  const accessProfilesOptions: Chart.ChartConfiguration = {
    type,
    data: dataAccessProfiles,
    options: {
      responsive: true,
      plugins: {
        legend,
        title: {
          display: false,
          text: "Access Profiles",
        },
      },
    },
  };
  const entitlementsOptions: Chart.ChartConfiguration = {
    type,
    data: dataEntitlements,
    options: {
      responsive: true,
      plugins: {
        legend,
        title: {
          display: false,
          text: "Entitlements",
        },
      },
    },
  };

  onMount(async () => {
    let ctx = document.getElementById("rolesChart") as HTMLCanvasElement;
    // @ts-ignore
    new Chart(ctx, rolesOptions);
    ctx = document.getElementById("accessProfilesChart") as HTMLCanvasElement;
    // @ts-ignore
    new Chart(ctx, accessProfilesOptions);
    ctx = document.getElementById("entitlementsChart") as HTMLCanvasElement;
    // @ts-ignore
    new Chart(ctx, entitlementsOptions);
  });
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
