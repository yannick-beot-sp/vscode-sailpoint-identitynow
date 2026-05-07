import { ISCClient } from "../../services/ISCClient";
import { isUuid } from "../../utils/stringUtils";
import { ErrorCodes, McpError } from "../errors";

/**
 * Resolves a source name or ID to its ISC source ID.
 *
 * Resolution order:
 * 1. If the input is a UUID, return it as-is.
 * 2. Call getSourceByName — if found, return the ID.
 *    Throws McpError SOURCE_NOT_FOUND if no source matches.
 */
export async function resolveSource(source: string, client: ISCClient): Promise<string> {
    if (isUuid(source)) {
        return source;
    }

    try {
        const result = await client.getSourceByName(source);
        return result.id!;
    } catch (err: any) {
        const message = String(err?.message ?? err);
        if (message.includes("Could not find")) {
            throw new McpError(ErrorCodes.SOURCE_NOT_FOUND, `Source "${source}" not found.`);
        }
        throw new McpError(ErrorCodes.ISC_API_ERROR, message);
    }
}
