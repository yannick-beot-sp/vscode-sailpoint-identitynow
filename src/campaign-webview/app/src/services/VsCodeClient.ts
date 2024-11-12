import type { FetchOptions, PaginatedData } from "../lib/datatable/Model";
import type { Client, KPIs, Reviewer } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
export class VsCodeClient implements Client {

    async getKPIs(): Promise<KPIs> {
        return messageHandler.request(commands.GET_KPIS_AND_REVIEWERS);
    }
    async getReviewers(fetchOptions: FetchOptions): Promise<PaginatedData<Reviewer>> {
        return messageHandler.request(commands.GET_PAGINATED_REVIEWERS, fetchOptions);
    }
}