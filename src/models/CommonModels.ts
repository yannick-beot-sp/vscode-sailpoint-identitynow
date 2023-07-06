/**
 * Common models used in APIs
 */

/**
 * Used mainly in APIs to identify owner etc.
 */
export interface CommonInfoType {
    id: string
    name: string
    type: string
}

// Access request models
export interface AccessRevokeRequestConfig {
    commentsRequired: boolean
    denialCommentsRequired: boolean
    approvalSchemes: ApprovalScheme[]
}

export interface ApprovalScheme {
    approverType: string
    approverId: string
}