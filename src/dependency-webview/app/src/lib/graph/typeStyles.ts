export interface TypeStyle {
    color: string;
    /** Short text differentiator shown in a colored chip, in addition to the color itself */
    badge: string;
    label: string;
}

const DEFAULT_STYLE: TypeStyle = { color: "#888888", badge: "?", label: "Resource" };

/**
 * Single place to extend when new resource types are added to the graph.
 */
const TYPE_STYLES: Record<string, TypeStyle> = {
    "identity-attribute": { color: "#3794ff", badge: "ATTR", label: "Identity Attribute" },
    "identity-profile": { color: "#89d185", badge: "IP", label: "Identity Profile" },
    "transform": { color: "#cca700", badge: "XFM", label: "Transform" },
    "provisioning-policy": { color: "#d18616", badge: "PP", label: "Provisioning Policy" },
    "role": { color: "#b180d7", badge: "ROLE", label: "Role" },
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
