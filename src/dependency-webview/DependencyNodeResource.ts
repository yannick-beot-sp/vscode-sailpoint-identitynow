import * as path from 'path';
import { Uri } from 'vscode';
import { getPathByUri, getResourceUri, getUIUrl } from '../utils/UriUtils';
import type { DependencyNodeData } from './app/src/services/Client';

/**
 * Maps a dependency graph node's `type` to the resourceType used to build its `idn:` uri, for
 * node types that map 1:1 to an ISC resource (mirrors the various ISCResourceTreeItem subclasses
 * in ISCTreeItem.ts). "dimension" and "provisioning-policy" are handled separately below since
 * they are sub-resources that also need their parent's id.
 */
const RESOURCE_TYPE_BY_NODE_TYPE: Record<string, string> = {
    source: "sources",
    transform: "transforms",
    workflow: "workflows",
    "identity-profile": "identity-profiles",
    role: "roles",
    "access-profile": "access-profiles",
    application: "source-apps",
    "identity-attribute": "identity-attributes",
};

/**
 * Builds the uri to open the underlying ISC object of a dependency graph node in the editor,
 * mirroring how ISCResourceTreeItem (see ISCTreeItem.ts) builds `.uri`. Returns undefined for
 * node types that don't map to an openable resource, or when a required parent id is missing.
 */
export function getDependencyNodeUri(tenantName: string, node: DependencyNodeData, parentId?: string): Uri | undefined {
    const resourceId = node.resourceId ?? node.id;

    if (node.type === "dimension") {
        if (!parentId) {
            return undefined;
        }
        const parentUri = getResourceUri(tenantName, "roles", parentId, node.label);
        return parentUri.with({
            path: path.posix.join(getPathByUri(parentUri) || "", "dimensions", resourceId, node.label)
        });
    }

    if (node.type === "provisioning-policy") {
        const usageType = node.attributes?.usageType;
        if (!parentId || !usageType) {
            return undefined;
        }
        const parentUri = getResourceUri(tenantName, "sources", parentId, node.label);
        return parentUri.with({
            path: path.posix.join(getPathByUri(parentUri) || "", "provisioning-policies", usageType, node.label)
        });
    }

    const resourceType = RESOURCE_TYPE_BY_NODE_TYPE[node.type];
    if (!resourceType) {
        return undefined;
    }
    return getResourceUri(tenantName, resourceType, resourceId, node.label);
}

/**
 * Builds the Web UI url of a dependency graph node's underlying ISC object, mirroring the
 * `getUrl()` overrides in ISCTreeItem.ts. Returns undefined for node types whose tree item does
 * not override `getUrl()` (e.g. transforms, identity attributes, provisioning policies), or when
 * a required parent id is missing.
 */
export function getDependencyNodeUrl(tenantName: string, node: DependencyNodeData, parentId?: string): Uri | undefined {
    const resourceId = node.resourceId ?? node.id;

    switch (node.type) {
        case "source":
            return getUIUrl(tenantName, "ui/a/admin/connections/sources", resourceId);
        case "workflow":
            return getUIUrl(tenantName, "ui/wf/edit", resourceId);
        case "identity-profile":
            return getUIUrl(tenantName, "ui/ip/admin/identity-profiles", resourceId);
        case "role":
            return getUIUrl(tenantName, "ui/a/admin/access/roles/manage", resourceId);
        case "dimension":
            return parentId
                ? getUIUrl(tenantName, "ui/a/admin/access/roles/manage", parentId, "dimensions", resourceId, "basic-config")
                : undefined;
        case "access-profile":
            return getUIUrl(tenantName, "ui/a/admin/access/access-profiles/manage", resourceId);
        case "application":
            return getUIUrl(tenantName, "ui/admin", `#admin:apps:${resourceId}`);
        default:
            return undefined;
    }
}
