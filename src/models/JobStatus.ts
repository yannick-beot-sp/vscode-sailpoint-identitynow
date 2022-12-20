export interface JobStatus {
    jobId: string
    status: string
    type: string
    message: string
    description: string | null
    expiration: string
    created: string
    modified: string
    completed: string | null
}


export interface ImportJobResults {
    results: Results
}

export interface Results {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TRIGGER_SUBSCRIPTION?: ImportJobResult;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SOURCE?: ImportJobResult;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RULE?: ImportJobResult;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TRANSFORM?: ImportJobResult;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    IDENTITY_PROFILE?: ImportJobResult;
}

export interface ImportJobResult {
    infos: any[]
    warnings: any[]
    errors: any[]
    importedObjects: ImportedObject[]
}

export interface ImportedObject {
    name: string
    id: string
    type: string
}
