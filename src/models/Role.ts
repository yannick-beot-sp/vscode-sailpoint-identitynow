import { AccessRevokeRequestConfig, CommonInfoType } from "./CommonModels";

/**
 * Role models
 * https://developer.sailpoint.com/idn/api/v3/get-role/
 */

export interface Role {
    id: string
    name: string
    created: string
    modified: string
    description: any
    owner: CommonInfoType
    accessProfiles: CommonInfoType[]
    membership: MembershipCriteriaType
    legacyMembershipInfo: any
    enabled: boolean
    requestable: boolean
    accessRequestConfig: AccessRevokeRequestConfig
    revocationRequestConfig: AccessRevokeRequestConfig
    segments: string[]
}

export interface MembershipType {
    type: string
}

export interface MembershipCriteriaType {
    operation: string
    key: MembershipCriteriaKeyType
    stringValue: string
    children: MembershipCriteriaType[]
}

export interface MembershipCriteriaKeyType {
    type: string
    property: string
    sourceId: string
}