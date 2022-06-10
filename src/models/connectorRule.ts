export interface ConnectorRule {
    name: string
    description?: string
    type: string
    signature: Signature
    sourceCode: SourceCode
    attributes: Attributes
    id: string
    created: string
    modified: string
  }
  
  export interface Signature {
    input: Input[]
    output: Output
  }
  
  export interface Input {
    name: string
    description: string
    type: string
  }
  
  export interface Output {
    name: string
    description: string
    type: string
  }
  
  export interface SourceCode {
    version: string
    script: string
  }
  
  export interface Attributes {}