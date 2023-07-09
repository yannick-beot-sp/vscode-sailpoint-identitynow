import { AccessRevokeRequestConfig, CommonInfoType } from "./CommonModels";

/**
 * Access Profile models
 * https://developer.sailpoint.com/idn/api/v3/get-access-profile
 */

export interface AccessProfile {
    id?: string
    name: string
    description: any
    created: string
    modified: string
    enabled: boolean
    owner: CommonInfoType
    source: CommonInfoType
    entitlements: CommonInfoType[]
    requestable: boolean
    accessRequestConfig: AccessRevokeRequestConfig
    revocationRequestConfig: AccessRevokeRequestConfig
    segments: string[]
    provisioningCriteria: ProvisioningCriteria
}

export interface ProvisioningCriteria {
    operation: string
    attribute: string
    value: string
    children: ProvisioningCriteria[]
}