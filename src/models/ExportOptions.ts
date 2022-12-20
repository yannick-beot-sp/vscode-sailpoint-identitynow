export interface ExportOptions {
    excludeTypes?: string[];
    includeTypes?: string[];
    objectOptions?: ObjectOptions;
}

export interface IncludeOptions {
    includedIds: string[];
    includedNames: string[];
}

export interface ObjectOptions {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TRIGGER_SUBSCRIPTION?: IncludeOptions;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SOURCE?: IncludeOptions;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RULE?: IncludeOptions;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TRANSFORM?: IncludeOptions;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    IDENTITY_PROFILE?: IncludeOptions;
}

