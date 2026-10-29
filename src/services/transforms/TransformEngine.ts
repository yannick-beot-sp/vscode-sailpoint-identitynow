import { ATTRIBUTES } from '../../models/TransformAttributes.js';
import { isEmpty } from '../../utils/stringUtils.js';
import { EvaluationContext } from './EvaluationContext.js';
import { NotImplementedError, TransformError } from './TransformError.js';
import { OPERATIONS } from './operations/index.js';

interface TransformDefinition {
    required: string[];
    optional: string[];
}

/**
 * Evaluates a transform locally.
 * Errors are thrown as TransformError, and everything external goes through the EvaluationContext.
 * Use one instance per evaluation, as the prompted values are cached.
 */
export class TransformEngine {
    private implicitInput?: Promise<any>;
    private identityNameOrId?: Promise<string>;

    constructor(readonly context: EvaluationContext) { }

    /**
     * Evaluates a root transform, i.e. a transform as stored in ISC
     */
    async evaluate(transform: any): Promise<any> {
        if (isEmpty(transform?.name)) {
            throw new TransformError("Missing required attribute 'name'");
        }
        return await this.evaluateTransform(transform);
    }

    /**
     * Evaluates a root or nested transform
     */
    async evaluateTransform(transform: any): Promise<any> {
        const typeKey = getTypeKey(transform);
        const definition: TransformDefinition = ATTRIBUTES[typeKey];
        validateRequiredAttributes(definition, transform.attributes);

        const attributes = transform.attributes ?? {};
        const operation = OPERATIONS[typeKey];
        if (operation === undefined) {
            throw new NotImplementedError(`Transform '${typeKey}' not yet implemented`);
        }

        const input = operation.rawInput ? attributes.input : await this.resolveInput(typeKey, definition, attributes);

        const result = await operation(attributes, input, this);
        console.log(`> transform ${typeKey}:`, result);
        return result;
    }

    /**
     * Implicit input of the transforms that do not define `attributes.input`. Asked once per evaluation.
     */
    getImplicitInput(): Promise<any> {
        return this.implicitInput ??= this.context.getImplicitInput((sourceName, attributeName) =>
            this.evaluateTransform({ type: 'accountAttribute', attributes: { sourceName, attributeName } }));
    }

    /**
     * Identity the transform is evaluated for. Asked once per evaluation.
     */
    getIdentityNameOrId(): Promise<string> {
        return this.identityNameOrId ??= this.context.getIdentityNameOrId();
    }

    /**
     * Returns the value of an attribute, evaluating it first if it is a nested transform
     */
    async resolveValue(value: any): Promise<any> {
        if (value !== null && typeof value === 'object') {
            return await this.evaluateTransform(value);
        }
        return value;
    }

    /**
     * Resolves the values in order, so that prompts appear in the order of the transform
     */
    async resolveValues(values: any): Promise<any[]> {
        if (!Array.isArray(values)) {
            throw new TransformError("Attribute 'values' must be an array");
        }
        const result = [];
        for (const value of values) {
            result.push(await this.resolveValue(value));
        }
        return result;
    }

    /**
     * Resolves a `$name` variable against the other attributes of the transform.
     * Any other value is resolved as is.
     */
    async resolveVariable(token: any, attributes: any): Promise<any> {
        if (typeof token !== 'string' || !token.startsWith('$')) {
            return await this.resolveValue(token);
        }

        const name = token.substring(1);
        if (name.includes(' ')) {
            throw new TransformError(`Invalid variable '${token}'`);
        }
        if (attributes[name] === undefined) {
            throw new TransformError(`Missing attribute '${name}' for variable replacement`);
        }
        return await this.resolveValue(attributes[name]);
    }

    private async resolveInput(typeKey: string, definition: TransformDefinition, attributes: any): Promise<any> {
        const acceptsInput = definition.required.includes('input') || definition.optional.includes('input');

        if (!acceptsInput) {
            if (attributes.input !== undefined && attributes.input !== null) {
                throw new TransformError(`Transforms of type '${typeKey}' do not require attribute 'input'`);
            }
            return undefined;
        }

        if (attributes.input !== undefined) {
            return await this.resolveValue(attributes.input);
        }
        return await this.getImplicitInput();
    }
}

/**
 * Key of the transform in ATTRIBUTES and OPERATIONS.
 * Rules are identified by their operation, e.g. `rule:getEndOfString`.
 */
function getTypeKey(transform: any): string {
    const type = transform?.type;
    if (isEmpty(type)) {
        throw new TransformError("Missing required attribute 'type'");
    }

    const typeKey = type === 'rule' && transform.attributes?.operation !== undefined
        ? `rule:${transform.attributes.operation}`
        : type;

    if (ATTRIBUTES[typeKey] === undefined) {
        throw new TransformError(`Invalid transform type '${typeKey}'`);
    }
    return typeKey;
}

function validateRequiredAttributes(definition: TransformDefinition, attributes: any): void {
    const required = definition.required.filter(name => name !== 'input');
    if (required.length === 0) {
        return;
    }
    if (!attributes) {
        throw new TransformError("Missing required attribute 'attributes'");
    }

    const missing = required.filter(name => attributes[name] === undefined);
    if (missing.length > 0) {
        throw new TransformError(`Missing required attribute(s) [${missing}]`);
    }
}
