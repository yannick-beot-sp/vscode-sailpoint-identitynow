<script lang="ts">
  import type { TotalAccessItems } from "../services/Client";
  import PieChartCard from "./PieChartCard.svelte";
  import { backgroundColors, labels } from "../constants";

  interface Props {
    data: TotalAccessItems;
  }

  let { data }: Props = $props();

  const dataRoles = [data.rolesApproved, data.rolesRevoked, data.roleDecisionsTotal - data.roleDecisionsMade];
  const dataAccessProfiles = [
    data.accessProfilesApproved,
    data.accessProfilesRevoked,
    data.accessProfileDecisionsTotal - data.accessProfileDecisionsMade,
  ];
  const dataEntitlements = [
    data.entitlementsApproved,
    data.entitlementsRevoked,
    data.entitlementDecisionsTotal - data.entitlementDecisionsMade,
  ];
</script>

<PieChartCard title="Roles" data={dataRoles} {labels} colors={backgroundColors} />
<PieChartCard title="Access Profiles" data={dataAccessProfiles} {labels} colors={backgroundColors} />
<PieChartCard title="Entitlements" data={dataEntitlements} {labels} colors={backgroundColors} />

<style>
</style>
