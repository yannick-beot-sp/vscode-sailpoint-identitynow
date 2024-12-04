<script lang="ts">
  import type { TotalAccessItems } from "../services/Client";
  import PieChartCard from "./PieChartCard.svelte";
  import { backgroundColors, labels } from "../constants";

  interface Props {
    data: TotalAccessItems;
  }

  let { data }: Props = $props();

  const dataAccessProfiles = [
    data.accessProfilesRevoked,
    data.accessProfilesRevoked,
    data.accessProfileDecisionsTotal - data.accessProfileDecisionsMade,
  ];
  const dataEntitlements = [
    data.entitlementsRevoked,
    data.entitlementsRevoked,
    data.entitlementDecisionsTotal - data.entitlementDecisionsMade,
  ];
</script>

<PieChartCard title="Access Profiles" data={dataAccessProfiles} {labels} colors={backgroundColors} />
<PieChartCard title="Entitlements" data={dataEntitlements} {labels} colors={backgroundColors} />

<style>
</style>
