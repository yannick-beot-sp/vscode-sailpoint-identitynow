/**
 * Cleans exported form definitions by removing "usedBy", which is specific to the tenant.
 */
export function cleanUpForms<T extends { object?: { usedBy?: any[] } }>(forms: T[]): T[] {
    return forms.map(item => ({
        ...item,
        object: {
            ...item.object,
            usedBy: []
        }
    }))
}
