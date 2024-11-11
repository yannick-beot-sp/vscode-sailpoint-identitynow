import type { Client, KPIs } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
export class VsCodeClient implements Client {

    getKPIs(): Promise<KPIs> {
        return messageHandler.request(commands.GET_KPIS_AND_REVIEWERS);
    }
}