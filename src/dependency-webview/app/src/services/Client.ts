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
    description?: string;
    /** Id of the real ISC object, for future "open" actions */
    resourceId?: string;
    /** Extra key/values shown in the details panel */
    attributes?: Record<string, string>;
}

export interface DependencyEdgeData {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface DependencyGraphData {
    rootId: string;
    nodes: DependencyNodeData[];
    edges: DependencyEdgeData[];
}

export interface Client {
    getDependencyGraph(resourceType: string, resourceId: string, force: boolean): Promise<DependencyGraphData>
}
