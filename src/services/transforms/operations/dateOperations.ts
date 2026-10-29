import { VALID_OPERATORS } from '../../../constants.js';
import { NotImplementedError, TransformError } from '../TransformError.js';
import { Operation, onInput } from './Operation.js';

const COMPARATORS: Record<string, (first: Date, second: Date) => boolean> = {
    lt: (first, second) => first < second,
    lte: (first, second) => first <= second,
    gt: (first, second) => first > second,
    gte: (first, second) => first >= second,
};

function toDate(name: string, value: any): Date {
    const date = value === 'now' ? new Date() : new Date(value);
    if (isNaN(date.getTime())) {
        throw new TransformError(`Invalid date '${value}' for attribute '${name}'`);
    }
    return date;
}

export const DATE_OPERATIONS: Record<string, Operation> = {
    dateCompare: async (attributes, _input, engine) => {
        const firstDate = toDate('firstDate', await engine.resolveValue(attributes.firstDate));
        const secondDate = toDate('secondDate', await engine.resolveValue(attributes.secondDate));

        const operator = String(attributes.operator).toLowerCase();
        if (!VALID_OPERATORS.includes(operator)) {
            throw new TransformError(`Invalid operator '${operator}'. Valid values are 'lt', 'lte', 'gt', and 'gte'.`);
        }

        return COMPARATORS[operator](firstDate, secondDate)
            ? await engine.resolveValue(attributes.positiveCondition)
            : await engine.resolveValue(attributes.negativeCondition);
    },

    // Only ISO8601 is supported, as input and output
    dateFormat: onInput((input, attributes) => {
        const outputFormat = attributes.outputFormat ?? 'ISO8601';
        if (outputFormat !== 'ISO8601') {
            throw new NotImplementedError(`Output format '${outputFormat}' not yet implemented`);
        }
        return toDate('input', input).toISOString();
    }),
};
