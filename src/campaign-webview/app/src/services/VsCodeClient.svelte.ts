import type { FetchOptions, PaginatedData } from "../lib/datatable/Model";
import type { Client, KPIs, Reviewer } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
import { Messenger } from "./Messenger";


interface State {
    status?: string;
    reviewers?: PaginatedData<Reviewer>
    kpis?: KPIs
    fetchOptions?: FetchOptions
}

export class VsCodeClient implements Client {

    private state: State = {}

    async getStatus(id: string, force: boolean = false): Promise<string> {
        console.log("> VsCodeClient.getStatus");
        const tmpstate = Messenger.getState() as State
        if (tmpstate?.status !== undefined && force === false) {
            console.log("Hit state!");
            return tmpstate.status
        }

        this.state.status = await messageHandler.request(commands.GET_STATUS, id) as string;
        Messenger.setState(this.state)
        return this.state.status
    }

    async escalateReviewers(r: Reviewer[], force: boolean): Promise<void> {
        console.log("> VsCodeClient.escalateReviewers");
        const snapshot = $state.snapshot(r)
        console.log(snapshot);
        await messageHandler.request(commands.ESCALATE_REVIEWERS, snapshot);
    }

    async sendReminders(r: Reviewer[], force: boolean): Promise<void> {
        console.log("> VsCodeClient.sendReminders");
        // Reviewer is a proxy, as reactive svelte object.
        // Create a snapshot for cloning
        const snapshot = $state.snapshot(r)
        console.log(snapshot);
        await messageHandler.request(commands.SEND_REMINDERS, snapshot);
    }

    /**
     * explicitly returning a Promise because used by "await"
     * @returns Promise
     */
    async getKPIs(force: boolean): Promise<KPIs> {
        console.log("> VsCodeClient.getKPIs");
        const tmpstate = Messenger.getState() as State
        if (tmpstate?.kpis !== undefined && force === false) {
            console.log("Hit state!");
            return Promise.resolve(tmpstate.kpis as KPIs);
        }
        const thiz = this;
        
        return messageHandler.request<KPIs>(commands.GET_KPIS_AND_REVIEWERS).then(
            (values) => {
                thiz.state.kpis = values
                Messenger.setState(thiz.state)
                return values
            }
        )
        
    }
    
    /**
     * explicitly returning a Promise because used by "await"
     * @returns Promise
    */
   async getReviewers(fetchOptions: FetchOptions, force: boolean): Promise<PaginatedData<Reviewer>> {
        console.log("> VsCodeClient.getReviewers");
        const tmpstate = Messenger.getState() as State
        if (tmpstate?.reviewers !== undefined
            && tmpstate.fetchOptions !== undefined
            && force === false
            && tmpstate.fetchOptions.currentPage === fetchOptions.currentPage
            && tmpstate.fetchOptions.pageSize === fetchOptions.pageSize
            && tmpstate.fetchOptions.sort === fetchOptions.sort
        ) {
            console.log("Hit state!");
            return Promise.resolve(tmpstate.reviewers);
        }

        const thiz = this;

        return messageHandler.request<PaginatedData<Reviewer>>(
            commands.GET_PAGINATED_REVIEWERS,
            $state.snapshot(fetchOptions))
            .then(
                (values) => {
                    thiz.state.reviewers = values
                    thiz.state.fetchOptions = fetchOptions
                    Messenger.setState(thiz.state)
                    return values
                }
            )
    }
}