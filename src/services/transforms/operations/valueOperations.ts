import { NotImplementedError, TransformError } from '../TransformError.js';
import { Operation } from './Operation.js';

const ISO3166_FORMATS = ['alpha2', 'alpha3', 'numeric'];

export const VALUE_OPERATIONS: Record<string, Operation> = {
    // Only the 'eq' operator is supported. Only the selected branch is evaluated.
    conditional: async (attributes, _input, engine) => {
        const expression: string = attributes.expression;
        const operands = expression.split(' eq ');
        if (operands.length !== 2) {
            throw new TransformError(expression.includes(' eq ')
                ? `Invalid expression '${expression}'`
                : `Invalid expression '${expression}'. Operation must be 'eq'`);
        }

        const left = await engine.resolveVariable(operands[0].replaceAll('"', ''), attributes);
        const right = await engine.resolveVariable(operands[1].replaceAll('"', ''), attributes);

        return left === right
            ? await engine.resolveVariable(attributes.positiveCondition, attributes)
            : await engine.resolveVariable(attributes.negativeCondition, attributes);
    },

    // Values are evaluated in order, and the evaluation stops at the first non-null value
    firstValid: async (attributes, _input, engine) => {
        if (!Array.isArray(attributes.values)) {
            throw new TransformError("Attribute 'values' must be an array");
        }
        const ignoreErrors = attributes.ignoreErrors === true || attributes.ignoreErrors === 'true';

        for (const value of attributes.values) {
            let result;
            try {
                result = await engine.resolveValue(value);
            } catch (error) {
                if (!ignoreErrors || !(error instanceof TransformError)) {
                    throw error;
                }
                console.warn('> firstValid: ignoring error', error.message);
                continue;
            }
            if (result !== undefined && result !== null) {
                return result;
            }
        }
        return null;
    },

    iso3166: async (attributes) => {
        const format = attributes.format ?? 'alpha2';
        if (!ISO3166_FORMATS.includes(format)) {
            throw new TransformError(`Invalid format '${format}'. Valid values are 'alpha2', 'alpha3' and 'numeric'`);
        }
        throw new NotImplementedError("Transform 'iso3166' not yet implemented");
    },

    lookup: async (attributes, input) => {
        const table = attributes.table;
        if (input !== undefined && input !== null && table[input] !== undefined) {
            return table[input];
        }
        return table['default'] ?? null;
    },

    reference: async (attributes, _input, engine) => {
        const transform = await engine.context.getTransformByName(attributes.id);
        if (transform === undefined) {
            throw new TransformError(`Transform '${attributes.id}' does not exist`);
        }
        return await engine.evaluateTransform(transform);
    },

    static: async (attributes, _input, engine) => {
        const value = attributes.value;
        if (typeof value === 'string' && value.startsWith('#')) {
            throw new NotImplementedError('Velocity template is not yet implemented');
        }
        return await engine.resolveVariable(value, attributes);
    },
};
