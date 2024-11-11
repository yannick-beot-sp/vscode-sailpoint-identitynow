import type { Client } from "./Client";
import { MockupClient } from "./MockupClient";
import { VsCodeClient } from "./VsCodeClient";

export class ClientFactory {

    public static getClient(): Client {
        if ("development" === process.env.NODE_ENV) {
            return new MockupClient()
        } else {
            return new VsCodeClient()
        }
    }

}