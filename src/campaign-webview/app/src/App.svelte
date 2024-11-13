<script lang="ts">
  import { onMount } from "svelte";

  import ProgressIndicator from "./lib/ProgressIndicator.svelte";
  import PieCharts from "./lib/PieCharts.svelte";
  import DataTable from "./lib/datatable/DataTable.svelte";
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
  let client = ClientFactory.getClient();

  const actions: Action<Reviewer>[] = [];
  const multiSelectActions: MultiSelectAction<Reviewer>[] = [];

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
      },
      {
        label: "Send Reminder",
        callback: async (row: Reviewer) => {
          await client.sendReminders([row]);
        },
      }
    );
  }

  onMount(async () => {
    promiseResult = client.getKPIs();
  });

  const reviewerColumns: Column[] = [
    {
      field: "id",
      label: "Id",
    },
    {
      field: "name",
      label: "Name",
    },
    {
      field: "phase",
      label: "Phase",
    },
    {
      field: "email",
      label: "Email",
    },
  ];

  const fetchData: FetchDataCallback = async (fetchOptions: FetchOptions) => {
    console.log(">fetchData");
    console.log({ fetchOptions });
    return client.getReviewers(fetchOptions);
  };
</script>

<main>
  <section id="headerSection">
    <h1>{window.data.campaignName}</h1>
    <h2><span class="badge">{window.data.campaignStatus}</span></h2>
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
      <PieCharts data={data!.totalAccessItems} />
    </section>
    <section id="reviewers">
      <h2>Campaign Reviewers</h2>
      <DataTable columns={reviewerColumns} {fetchData} {actions} {multiSelectActions} />
    </section>
  {/await}
</main>
