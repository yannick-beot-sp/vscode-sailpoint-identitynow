import type { Client, DependencyGraphData, NodeViewState, ViewportState } from "./Client";
import * as commands from "./Commands";
import { messageHandler } from "./MessageHandler";
import { Messenger } from "./Messenger";

interface State {
    graphs?: Record<string, DependencyGraphData>;
    nodeViewStates?: Record<string, Record<string, NodeViewState>>;
    layoutAlgorithms?: Record<string, string>;
    viewports?: Record<string, ViewportState>;
}

function cacheKey(resourceType: string, resourceId: string): string {
    return `${resourceType}/${resourceId}`;
}

export class VsCodeClient implements Client {

    async getDependencyGraph(resourceType: string, resourceId: string, resourceName: string, force: boolean = false): Promise<DependencyGraphData> {
        console.log("> VsCodeClient.getDependencyGraph", { resourceType, resourceId, resourceName, force });
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        const cached = state?.graphs?.[key]
        if (cached !== undefined && force === false) {
            console.log("Hit state!");
            return cached
        }

        const graph = await messageHandler.request<DependencyGraphData>(
            commands.GET_DEPENDENCY_GRAPH,
            { resourceType, resourceId, resourceName })

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

    getViewport(resourceType: string, resourceId: string): ViewportState | undefined {
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        return state?.viewports?.[key]
    }

    setViewport(resourceType: string, resourceId: string, viewport: ViewportState): void {
        const key = cacheKey(resourceType, resourceId)
        const state = Messenger.getState() as State
        Messenger.setState({
            ...state,
            viewports: { ...(state?.viewports ?? {}), [key]: viewport }
        })
    }
}
