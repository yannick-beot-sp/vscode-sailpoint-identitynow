import type { Component } from "svelte";
import IdentityAttributeIcon from "../svgs/identity-attribute.svelte";
import IdentityProfileIcon from "../svgs/identity-profile.svelte";
import TransformIcon from "../svgs/transform.svelte";
import ProvisioningPolicyIcon from "../svgs/provisioning-policy.svelte";
import RoleIcon from "../svgs/role.svelte";
import ResourceIcon from "../svgs/resource.svelte";
import SourceIcon from "../svgs/source.svelte";
import SegmentIcon from "../svgs/segment.svelte";
import PublicIdentitiesConfigIcon from "../svgs/public-identities-config.svelte";
import WorkflowIcon from "../svgs/workflow.svelte";
import EventTriggerIcon from "../svgs/event-trigger.svelte";
import AccessProfileIcon from "../svgs/access-profile.svelte";
import ApplicationIcon from "../svgs/application.svelte";
import DimensionIcon from "../svgs/dimension.svelte";
import LifecycleStateIcon from "../svgs/lifecycle-state.svelte";

export interface TypeStyle {
    color: string;
    /** Icon shown in a colored chip, in addition to the color itself */
    icon: Component;
    label: string;
}

const DEFAULT_STYLE: TypeStyle = { color: "#888888", icon: ResourceIcon, label: "Resource" };

/**
 * Single place to extend when new resource types are added to the graph.
 */
const TYPE_STYLES: Record<string, TypeStyle> = {
    "identity-attribute": { color: "#3794ff", icon: IdentityAttributeIcon, label: "Identity Attribute" },
    "identity-profile": { color: "#89d185", icon: IdentityProfileIcon, label: "Identity Profile" },
    "transform": { color: "#cca700", icon: TransformIcon, label: "Transform" },
    "provisioning-policy": { color: "#d18616", icon: ProvisioningPolicyIcon, label: "Provisioning Policy" },
    "role": { color: "#b180d7", icon: RoleIcon, label: "Role" },
    "source": { color: "#4ec9b0", icon: SourceIcon, label: "Source" },
    "segment": { color: "#f14c4c", icon: SegmentIcon, label: "Segment" },
    "public-identities-config": { color: "#c586c0", icon: PublicIdentitiesConfigIcon, label: "Public Identities Config" },
    "workflow": { color: "#3d8c34", icon: WorkflowIcon, label: "Workflow" },
    "event-trigger": { color: "#e2b93d", icon: EventTriggerIcon, label: "Event Trigger" },
    "access-profile": { color: "#ce9178", icon: AccessProfileIcon, label: "Access Profile" },
    "application": { color: "#9cdcfe", icon: ApplicationIcon, label: "Application" },
    "dimension": { color: "#c9a26d", icon: DimensionIcon, label: "Dimension" },
    "lifecycle-state": { color: "#6a9955", icon: LifecycleStateIcon, label: "Lifecycle State" },
};

export function getTypeStyle(type: string): TypeStyle {
    return TYPE_STYLES[type] ?? DEFAULT_STYLE;
}

export function pluralizeTypeLabel(type: string, count: number): string {
    const label = getTypeStyle(type).label;
    if (count === 1) {
        return label;
    }
    return label.endsWith("y") ? `${label.slice(0, -1)}ies` : `${label}s`;
}
