export interface IdentityProfile {
    id: string
    name: string
    created: boolean
    modified: boolean
    description: string
    owner: ReferenceType
    priority: number
    authoritativeSource: ReferenceType
    identityRefreshRequired: boolean
    identityCount: number
    identityAttributeConfig: IdentityAttributeConfig
    identityExceptionReportReference: IdentityExceptionReportReference
    hasTimeBasedAttr: boolean
}

export interface ReferenceType {
    type: string
    id: string
    name: string
}

export interface IdentityAttributeConfig {
    enabled: boolean
    attributeTransforms: AttributeTransform[]
}

export interface AttributeTransform {
    identityAttributeName: string
    transformDefinition: TransformDefinition
}

export interface TransformDefinition {
    type: string
    attributes: Attributes
}

export interface Attributes {
    attributeName: string
    sourceName: string
    sourceId: string
}

export interface IdentityExceptionReportReference {
    taskResultId: string
    reportName: string
}

export interface LifeCycleState {
    id: string
    name: string
    created: string
    modified: string
    enabled: boolean
    technicalName: string
    description: string
    identityCount: number
    emailNotificationOption: EmailNotificationOption
    accountActions: AccountAction[]
    accessProfileIds: string[]
  }
  
  export interface EmailNotificationOption {
    notifyManagers: boolean
    notifyAllAdmins: boolean
    notifySpecificUsers: boolean
    emailAddressList: string[]
  }
  
  export interface AccountAction {
    action: string
    sourceIds: string[]
  }
  
