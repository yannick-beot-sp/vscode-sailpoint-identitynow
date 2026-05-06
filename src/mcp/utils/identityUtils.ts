import { ISCClient } from "../../services/ISCClient";
import { isUuid } from "../../utils/stringUtils";
import { ErrorCodes, McpError } from "../errors";

/**
 * Resolves an identity alias, display name, or ID to its ISC identity ID.
 *
 * Resolution order:
 * 1. If the input is a 32-char hex UUID, return it as-is.
 * 2. Try getPublicIdentityByAlias — if found, return the ID.
 * 3. Fall back to a full-text search on the Identities index.
 *    Exactly one result is required; zero or multiple results raise a McpError.
 */
export async function resolveIdentity(idOrName: string, client: ISCClient): Promise<string> {
    if (isUuid(idOrName)) {
        return idOrName;
    }

    try {
        const identity = await client.getPublicIdentityByAlias(idOrName);
        return identity.id!;
    } catch (err: any) {
        if (err instanceof McpError) { throw err; }
        const message = String(err?.message ?? err);
        if (!message.includes("Could not find")) {
            throw new McpError(ErrorCodes.ISC_API_ERROR, message);
        }
    }

    const results = await client.searchAllIdentities(`"${idOrName}"`, 2, ["id", "name"]);
    if (results.length === 0) {
        throw new McpError(ErrorCodes.IDENTITY_NOT_FOUND, `Identity "${idOrName}" not found.`);
    }
    if (results.length > 1) {
        throw new McpError(
            ErrorCodes.INVALID_INPUT,
            `Multiple identities match "${idOrName}". Provide a more specific name or use the identity ID.`
        );
    }
    return results[0].id;
}
