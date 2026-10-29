/**
 * Everything the transform engine needs from the outside world: user prompts and tenant lookups.
 * Keeps the engine free of any VS Code or API dependency.
 */
export interface EvaluationContext {
    /**
     * Implicit input of the transforms that do not define `attributes.input`,
     * i.e. the source attribute of the identity profile mapping.
     * It can be typed, or read from an account of the evaluated identity with `readAccountAttribute`.
     */
    getImplicitInput(readAccountAttribute: (sourceName: string, attributeName: string) => Promise<any>): Promise<any>;

    /**
     * Name or id of the identity the transform is evaluated for
     */
    getIdentityNameOrId(): Promise<string>;

    getIdentity(identityNameOrId: string): Promise<any>;

    getSourceId(sourceName: string): Promise<string | undefined>;

    getAccountsByIdentity(identityId: string): Promise<any[]>;

    getTransformByName(name: string): Promise<any>;
}
