import type { Client, DependencyGraphData, NodeViewState } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
import { Messenger } from "./Messenger";

interface State {
    graphs?: Record<string, DependencyGraphData>;
    nodeViewStates?: Record<string, Record<string, NodeViewState>>;
    layoutAlgorithms?: Record<string, string>;
}

function cacheKey(resourceType: string, resourceId: string): string {
    return `${resourceType}/${resourceId}`;
}

export class VsCodeClient implements Client {

    async getDependencyGraph(resourceType: string, resourceId: string, force: boolean = false): Promise<DependencyGraphData> {
        console.log("> VsCodeClient.getDependencyGraph", { resourceType, resourceId, force });
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        const cached = state?.graphs?.[key]
        if (cached !== undefined && force === false) {
            console.log("Hit state!");
            return cached
        }

        const graph = await messageHandler.request<DependencyGraphData>(
            commands.GET_DEPENDENCY_GRAPH,
            { resourceType, resourceId })

        const latest = Messenger.getState() as State
        Messenger.setState({
            ...latest,
            graphs: { ...(latest?.graphs ?? {}), [key]: graph }
        })
        return graph
    }

    getNodeViewStates(resourceType: string, resourceId: string): Record<string, NodeViewState> | undefined {
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        return state?.nodeViewStates?.[key]
    }

    setNodeViewStates(resourceType: string, resourceId: string, states: Record<string, NodeViewState>): void {
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        Messenger.setState({
            ...state,
            nodeViewStates: { ...(state?.nodeViewStates ?? {}), [key]: states }
        })
    }

    getLayoutAlgorithm(resourceType: string, resourceId: string): string | undefined {
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        return state?.layoutAlgorithms?.[key]
    }

    setLayoutAlgorithm(resourceType: string, resourceId: string, algorithm: string): void {
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        Messenger.setState({
            ...state,
            layoutAlgorithms: { ...(state?.layoutAlgorithms ?? {}), [key]: algorithm }
        })
    }
}
