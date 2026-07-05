import { Uri } from 'vscode';
import { getResourceUriByKind, getResourceWebUrl } from '../utils/UriUtils';
import type { DependencyNodeData } from './app/src/services/Client';

/**
 * Builds the uri to open the underlying ISC object of a dependency graph node in the editor.
 * Returns undefined for node types that don't map to an openable resource, or when a required
 * parent id is missing. URL computation lives in UriUtils.ts, shared with ISCTreeItem.ts.
 */
export function getDependencyNodeUri(tenantName: string, node: DependencyNodeData, parentId?: string): Uri | undefined {
    const resourceId = node.resourceId ?? node.id;
    return getResourceUriByKind(tenantName, node.type, resourceId, node.label, {
        parentId, usageType: node.attributes?.usageType,
    });
}

/**
 * Builds the Web UI url of a dependency graph node's underlying ISC object. Returns undefined for
 * node types with no web URL, or when a required parent id is missing. URL computation lives in
 * UriUtils.ts, shared with ISCTreeItem.ts.
 */
export function getDependencyNodeUrl(tenantName: string, node: DependencyNodeData, parentId?: string): Uri | undefined {
    const resourceId = node.resourceId ?? node.id;
    return getResourceWebUrl(tenantName, node.type, resourceId, {
        parentId, subtype: node.attributes?.subtype,
    });
}
