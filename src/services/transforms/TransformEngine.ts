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
 * Evaluation of one transform, with its nested transforms
 */
export interface TraceNode {
    label: string;
    input?: any;
    result?: any;
    error?: string;
    children: TraceNode[];
}

// Their other attributes are variables
const TYPES_WITH_VARIABLES = ['static', 'conditional'];

/**
 * Evaluates a transform locally.
 * Errors are thrown as TransformError, and everything external goes through the EvaluationContext.
 * Use one instance per evaluation, as the prompted values are cached.
 */
export class TransformEngine {
    private implicitInput?: Promise<any>;
    private identityNameOrId?: Promise<string>;
    private readonly stack: TraceNode[] = [];

    /**
     * Evaluated transforms, in the order of the evaluation
     */
    readonly trace: TraceNode[] = [];

    /**
     * Possible mistakes that do not prevent the evaluation, e.g. unknown attributes
     */
    readonly warnings: string[] = [];

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
        const node: TraceNode = { label: transform.name ? `${typeKey} '${transform.name}'` : typeKey, children: [] };
        (this.stack.length > 0 ? this.stack[this.stack.length - 1].children : this.trace).push(node);
        this.stack.push(node);

        try {
            const definition: TransformDefinition = ATTRIBUTES[typeKey];
            validateRequiredAttributes(definition, transform.attributes);

            const attributes = transform.attributes ?? {};
            for (const name of findUnknownAttributes(typeKey, definition, attributes)) {
                this.warnings.push(`${this.currentPath()}: Unknown attribute '${name}'`);
            }

            const operation = OPERATIONS[typeKey];
            if (operation === undefined) {
                throw new NotImplementedError(`Transform '${typeKey}' not yet implemented`);
            }

            const input = operation.rawInput ? attributes.input : await this.resolveInput(typeKey, definition, attributes);
            if (!operation.rawInput) {
                node.input = input;
            }

            node.result = await operation(attributes, input, this);
            return node.result;
        } catch (error) {
            if (error instanceof TransformError && error.path === undefined) {
                error.path = this.stack.map(n => n.label);
            }
            node.error = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            this.stack.pop();
        }
    }

    private currentPath(): string {
        return this.stack.map(n => n.label).join(' › ');
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

function findUnknownAttributes(typeKey: string, definition: TransformDefinition, attributes: any): string[] {
    if (TYPES_WITH_VARIABLES.includes(typeKey)) {
        return [];
    }
    const known = new Set([...definition.required, ...definition.optional, 'input']);
    return Object.keys(attributes).filter(name => !known.has(name));
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
