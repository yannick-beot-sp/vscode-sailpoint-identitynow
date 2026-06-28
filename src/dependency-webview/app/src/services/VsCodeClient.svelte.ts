import type { Client, DependencyGraphData } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
import { Messenger } from "./Messenger";

interface State {
    graphs?: Record<string, DependencyGraphData>;
}

function cacheKey(resourceType: string, resourceId: string): string {
    return `${resourceType}/${resourceId}`;
}

export class VsCodeClient implements Client {

    private state: State = {}

    async getDependencyGraph(resourceType: string, resourceId: string, force: boolean = false): Promise<DependencyGraphData> {
        console.log("> VsCodeClient.getDependencyGraph", { resourceType, resourceId, force });
        const key = cacheKey(resourceType, resourceId)
        const tmpstate = Messenger.getState() as State
        const cached = tmpstate?.graphs?.[key]
        if (cached !== undefined && force === false) {
            console.log("Hit state!");
            return cached
        }

        const graph = await messageHandler.request<DependencyGraphData>(
            commands.GET_DEPENDENCY_GRAPH,
            { resourceType, resourceId })

        this.state.graphs = { ...(tmpstate?.graphs ?? {}), [key]: graph }
        Messenger.setState(this.state)
        return graph
    }
}
