import type { Component } from "svelte";
import IdentityAttributeIcon from "../svgs/identity-attribute.svelte";
import IdentityProfileIcon from "../svgs/identity-profile.svelte";
import TransformIcon from "../svgs/transform.svelte";
import ProvisioningPolicyIcon from "../svgs/provisioning-policy.svelte";
import RoleIcon from "../svgs/role.svelte";
import ResourceIcon from "../svgs/resource.svelte";

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
