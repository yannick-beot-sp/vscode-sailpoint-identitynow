import type { TransformEngine } from '../TransformEngine.js';
import { TransformError } from '../TransformError.js';

/**
 * Implementation of a transform type.
 * `input` is the resolved input, or undefined if the type does not accept one.
 */
export type Operation = (attributes: any, input: any, engine: TransformEngine) => Promise<any>;

/**
 * Wraps an operation working on the input string. A null input gives a null result, as in ISC.
 */
export function onInput(fn: (input: string, attributes: any, engine: TransformEngine) => any): Operation {
    return async (attributes, input, engine) => {
        if (input === undefined || input === null) {
            return null;
        }
        return await fn(String(input), attributes, engine);
    };
}

const RULE_NAME = 'Cloud Services Deployment Utility';

/**
 * Wraps an operation of the Cloud Services Deployment Utility rule
 */
export function cloudServicesRule(operation: Operation): Operation {
    return async (attributes, input, engine) => {
        if (attributes.name !== RULE_NAME) {
            throw new TransformError(`Invalid attributes.name '${attributes.name}'. This must always be set to '${RULE_NAME}'`);
        }
        return await operation(attributes, input, engine);
    };
}

export function parseNumber(name: string, value: any): number {
    const result = Number(value);
    if (value === null || value === '' || !Number.isInteger(result)) {
        throw new TransformError(`Attribute '${name}' must be a number`);
    }
    return result;
}

export function parseBoolean(name: string, value: any): boolean {
    if (value === true || value === 'true') {
        return true;
    }
    if (value === false || value === 'false') {
        return false;
    }
    throw new TransformError(`Attribute '${name}' must be either "true" or "false"`);
}
