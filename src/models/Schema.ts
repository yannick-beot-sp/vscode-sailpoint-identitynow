export interface Schema {
    nativeObjectType: string
    identityAttribute: string
    displayAttribute: string
    hierarchyAttribute: any
    includePermissions: boolean
    features: any[]
    configuration: Object
    attributes: Attribute[]
    id: string
    name: string
    created: string
    modified: string
  }
  

  
  export interface Attribute {
    name: string
    type: string
    schema?: SchemaRef
    description: string
    isMulti: boolean
    isEntitlement: boolean
    isGroup: boolean
  }
  
  export interface SchemaRef {
    type: string
    id: string
    name: string
  }
  