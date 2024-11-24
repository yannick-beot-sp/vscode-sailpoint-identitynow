<script lang="ts">
  import { onMount } from "svelte";

  import ProgressIndicator from "./lib/ProgressIndicator.svelte";
  import SearchCampaignPieCharts from "./lib/SearchCampaignPieCharts.svelte";
  import SourceOwnerPieCharts from "./lib/SourceOwnerPieCharts.svelte";
  import DataTable from "./lib/datatable/DataTable.svelte";
  import Refresh from "./lib/datatable/svgs/refresh.svelte";
  import type {
    Action,
    Column,
    FetchDataCallback,
    FetchOptions,
    MultiSelectAction,
  } from "./lib/datatable/Model";
  import { ClientFactory } from "./services/ClientFactory";
  import type { KPIs, Reviewer } from "./services/Client";

  let promiseResult = $state<Promise<KPIs>>();
  let promiseStatus = $state<Promise<string>>();
  let client = ClientFactory.getClient();

  const actions: Action<Reviewer>[] = [];
  const multiSelectActions: MultiSelectAction<Reviewer>[] = [];

  const onlyActive = (row: Reviewer) =>
    row.phase !== "SIGNED" || (row.identitiesRemaining !== undefined && row.identitiesRemaining > 0);
  if (window.data.campaignStatus !== "COMPLETED") {
    multiSelectActions.push(
      {
        label: "Escalate",
        callback: async (rows: Reviewer[]) => {
          await client.escalateReviewers(rows);
        },
      },
      {
        label: "Send Reminder",
        callback: async (rows: Reviewer[]) => {
          await client.sendReminders(rows);
        },
      }
    );

    actions.push(
      {
        label: "Escalate",
        callback: async (row: Reviewer) => {
          await client.escalateReviewers([row]);
        },
        condition: onlyActive,
      },
      {
        label: "Send Reminder",
        callback: async (row: Reviewer) => {
          await client.sendReminders([row]);
        },
        condition: onlyActive,
      }
    );
  }

  function updateKPIsAndStatus(force: boolean = true) {
    promiseResult = client.getKPIs(force);
    promiseStatus = client.getStatus(window.data.campaignId, force);
  }

  onMount(async () => {
    updateKPIsAndStatus(false);
  });

  let reviewerColumns: Column[] = $state([
    // {
    //   field: "id",
    //   label: "Id",
    // },
    {
      field: "name",
      label: "Name",
      sortable: true,
    },
    {
      field: "phase",
      label: "Phase",
    },
    {
      field: "email",
      label: "Email",
    },
    {
      field: "identitiesRemaining",
      label: "Identities Remaining",
    },
    {
      field: "identitiesTotal",
      label: "Total Identities",
      visible: false,
    },
    {
      field: "identitiesCompleted",
      label: "Completed Identities",
      visible: false,
    },
    {
      field: "decisionsTotal",
      label: "Total Decision",
      visible: false,
    },
    {
      field: "decisionsMade",
      label: "Decisions Made",
      visible: false,
    },
    {
      field: "decisionsRemaining",
      label: "Decisions Remaining",
      visible: false,
    },
    {
      field: "reassignmentName",
      label: "Reassigned From",
      visible: false,
    },
    {
      field: "reassignmentComment",
      label: "Reassignment Comment",
      visible: false,
    },
    {
      field: "reassignmentEmail",
      label: "Reassigned From (Email)",
      visible: false,
    },
  ]);

  const fetchData: FetchDataCallback = async (fetchOptions: FetchOptions) => {
    console.log(">fetchData");
    console.log({ fetchOptions });
    return client.getReviewers(fetchOptions, fetchOptions.force ?? false);
  };
</script>

<main>
  <section id="headerSection">
    <div>
      <h1>{window.data.campaignName}</h1>
      {#await promiseStatus then value}
        <h2><span class="badge"> {value}</span></h2>
      {/await}
    </div>
    <div class="headerSection--buttons">
      <button class="btn" onclick={updateKPIsAndStatus}
        ><span>
          <Refresh />
        </span>
      </button>
    </div>
  </section>
  {#await promiseResult}
    <!-- promise is pending -->
    <div class="loading"></div>
  {:then data}
    <section id="kpi">
      <div class="item">
        <ProgressIndicator
          name="Access Review Completed"
          current={data!.totals.totalAccessReviewsCompleted}
          total={data!.totals.totalAccessReviews}
        />
      </div>
      <div class="item">
        <ProgressIndicator
          name="Identities Completed"
          current={data!.totals.totalIdentitiesCompleted}
          total={data!.totals.totalIdentities}
        />
      </div>
      <div class="item">
        <ProgressIndicator
          name="Items Completed"
          current={data!.totals.totalAccessItemsCompleted}
          total={data!.totals.totalAccessItems}
        />
      </div>
    </section>
    <section id="accessitems">
      {#if window.data.campaignType == "SOURCE_OWNER" || window.data.campaignType == "MACHINE_ACCOUNT"}
        <SourceOwnerPieCharts data={data!.totalAccessItems} />
      {:else}
        <SearchCampaignPieCharts data={data!.totalAccessItems} />
      {/if}
    </section>
  {/await}
  <section id="reviewers">
    <h2>Campaign Reviewers</h2>
    <DataTable bind:columns={reviewerColumns} {fetchData} {actions} {multiSelectActions} />
  </section>
</main>
