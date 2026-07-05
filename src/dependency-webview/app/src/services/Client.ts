/**
 * A node in a dependency graph.
 *
 * `type` is intentionally a free-form string (not an enum) so the same webview can render
 * nodes for resource types it does not know about yet (sources, transforms, ...).
 */
export interface DependencyNodeData {
    /** Unique id within the graph */
    id: string;
    /** Resource type, e.g. "identity-attribute" | "identity-profile" | "transform" | "provisioning-policy" | "role" */
    type: string;
    label: string;
    description?: string | null;
    /** Id of the real ISC object, for future "open" actions */
    resourceId?: string;
    /** Extra key/values shown in the details panel */
    attributes?: Record<string, string>;
    /** Raw underlying ISC object, shown as-is in the details panel's JSON tab */
    data?: unknown;
}

export interface DependencyEdgeData {
    id: string;
    source: string;
    target: string;
    label?: string;
    /** Set when the source node can only ever have one such target, so the group-summary node would be pointless. */
    noGroup?: boolean;
}

export interface DependencyGraphData {
    rootId: string;
    nodes: DependencyNodeData[];
    edges: DependencyEdgeData[];
}

/**
 * UI state for a single flow node (dependency or group), keyed by the node's flow id.
 * Cached alongside the graph data so the layout survives refreshes/reopens.
 */
export interface NodeViewState {
    position?: { x: number; y: number };
    /** Only meaningful for group nodes. */
    expanded?: boolean;
}

/** Pan/zoom state of the graph view, so reopening a panel restores the exact same view. */
export interface ViewportState {
    x: number;
    y: number;
    zoom: number;
}

export interface Client {
    getDependencyGraph(resourceType: string, resourceId: string, resourceName: string, force: boolean): Promise<DependencyGraphData>
    /** Opens a new dependency graph panel rooted on the given node. */
    viewNodeDependencies(resourceType: string, resourceId: string, resourceName: string): void
    /** Opens the underlying ISC object of the given node in the editor. */
    openNodeResource(node: DependencyNodeData, parentId?: string): void
    /** Opens the underlying ISC object of the given node in the tenant's Web UI. */
    openNodeResourceUrl(node: DependencyNodeData, parentId?: string): void
    getNodeViewStates(resourceType: string, resourceId: string): Record<string, NodeViewState> | undefined
    setNodeViewStates(resourceType: string, resourceId: string, states: Record<string, NodeViewState>): void
    getLayoutAlgorithm(resourceType: string, resourceId: string): string | undefined
    setLayoutAlgorithm(resourceType: string, resourceId: string, algorithm: string): void
    getViewport(resourceType: string, resourceId: string): ViewportState | undefined
    setViewport(resourceType: string, resourceId: string, viewport: ViewportState): void
}
