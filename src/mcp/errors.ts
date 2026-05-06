/**
 * MCP error codes for functional and technical errors.
 */
export const ErrorCodes = {
    TENANT_NOT_FOUND:         "TENANT_NOT_FOUND",
    TENANT_READ_ONLY:         "TENANT_READ_ONLY",
    IDENTITY_NOT_FOUND:       "IDENTITY_NOT_FOUND",
    TRANSFORM_NOT_FOUND:      "TRANSFORM_NOT_FOUND",
    WORKFLOW_NOT_FOUND:       "WORKFLOW_NOT_FOUND",
    SOURCE_NOT_FOUND:         "SOURCE_NOT_FOUND",
    ENTITLEMENT_NOT_FOUND:    "ENTITLEMENT_NOT_FOUND",
    ACCESS_PROFILE_NOT_FOUND: "ACCESS_PROFILE_NOT_FOUND",
    ROLE_NOT_FOUND:           "ROLE_NOT_FOUND",
    FORM_NOT_FOUND:           "FORM_NOT_FOUND",
    INVALID_INPUT:            "INVALID_INPUT",
    ISC_API_ERROR:            "ISC_API_ERROR",
    MCP_INTERNAL_ERROR:       "MCP_INTERNAL_ERROR",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Standard MCP error that serialises to { error: { code, message } }.
 */
export class McpError extends Error {
    constructor(public readonly code: ErrorCode, message: string) {
        super(JSON.stringify({ error: { code, message } }));
        this.name = "McpError";
    }
}
