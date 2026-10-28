/**
 * Properties computed by ISC. They are returned by `GET /sod-policies/{id}`
 * but must not be sent back in a `PUT`.
 */
const READ_ONLY_PROPERTIES = ["created", "modified", "creatorId", "modifierId", "scheduled"];

/**
 * Payload of `PUT /sod-policies/{id}`: the edited document without the read-only properties.
 */
export function buildSodPolicyUpdatePayload(policy: Record<string, any>): Record<string, any> {
    const payload = { ...policy };
    for (const property of READ_ONLY_PROPERTIES) {
        delete payload[property];
    }
    return payload;
}
