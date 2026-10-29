import { NotImplementedError, TransformError } from '../TransformError.js';
import { findCountry, findLanguageTag } from '../countries.js';
import { getReferencedVariables, renderVelocity } from '../velocity.js';
import { Operation, onInput } from './Operation.js';

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

    // The input is a country code (alpha-2, alpha-3 or numeric) or an English country name
    iso3166: onInput((input, attributes) => {
        const format = attributes.format ?? 'alpha2';
        if (!ISO3166_FORMATS.includes(format)) {
            throw new TransformError(`Invalid format '${format}'. Valid values are 'alpha2', 'alpha3' and 'numeric'`);
        }
        const country = findCountry(input);
        return country === undefined ? null : country[format as 'alpha2' | 'alpha3' | 'numeric'];
    }),

    // The input is an English language name or an ISO 639 code
    rfc5646: onInput(input => findLanguageTag(input) ?? null),

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

    // value is a Velocity template, whose variables are the other attributes.
    // Only the referenced attributes are evaluated.
    usernameGenerator: async () => {
        throw new NotImplementedError("Transform 'usernameGenerator' cannot be evaluated locally: it only runs in an account create profile, and its uniqueness checks need the source");
    },

    static: async (attributes, _input, engine) => {
        const template = attributes.value;
        if (typeof template !== 'string') {
            return await engine.resolveValue(template);
        }
        const ignoreErrors = attributes.ignoreErrors === true || attributes.ignoreErrors === 'true';

        const variables: Record<string, any> = {};
        for (const name of getReferencedVariables(template)) {
            if (attributes[name] === undefined) {
                continue;
            }
            try {
                variables[name] = await engine.resolveValue(attributes[name]);
            } catch (error) {
                if (!ignoreErrors || !(error instanceof TransformError)) {
                    throw error;
                }
                console.warn(`> static: ignoring error for variable '${name}'`, error.message);
            }
        }
        return renderVelocity(template, variables);
    },
};
