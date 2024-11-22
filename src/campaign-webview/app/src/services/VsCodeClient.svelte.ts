import type { FetchOptions, PaginatedData } from "../lib/datatable/Model";
import type { Client, KPIs, Reviewer } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
export class VsCodeClient implements Client {
    
    async getStatus(id: string): Promise<string> {
        console.log("> VsCodeClient.escalateReviewers");
        return await messageHandler.request(commands.GET_STATUS, id);
    }

    async escalateReviewers(r: Reviewer[]): Promise<void> {
        console.log("> VsCodeClient.escalateReviewers");
        const snapshot = $state.snapshot(r)
        console.log(snapshot);
        await messageHandler.request(commands.ESCALATE_REVIEWERS, snapshot);
    }

    async sendReminders(r: Reviewer[]): Promise<void> {
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
    async getKPIs(): Promise<KPIs> {
        return messageHandler.request(commands.GET_KPIS_AND_REVIEWERS);
    }

    /**
     * explicitly returning a Promise because used by "await"
     * @returns Promise
     */
    async getReviewers(fetchOptions: FetchOptions): Promise<PaginatedData<Reviewer>> {
        return messageHandler.request(commands.GET_PAGINATED_REVIEWERS, $state.snapshot(fetchOptions));
    }
}