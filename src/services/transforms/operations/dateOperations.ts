import { VALID_OPERATORS } from '../../../constants.js';
import { applyDateMath, formatDate, parseDate } from '../dates.js';
import { TransformError } from '../TransformError.js';
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

/**
 * The input is only used when the expression does not start with 'now', so it is resolved here
 */
const dateMath: Operation = async (attributes, _input, engine) => {
    const expression = String(attributes.expression).trim();
    const roundUp = attributes.roundUp === true || attributes.roundUp === 'true';

    let date = new Date();
    if (!expression.startsWith('now')) {
        const input = attributes.input === undefined ? await engine.getImplicitInput() : await engine.resolveValue(attributes.input);
        if (input === undefined || input === null) {
            return null;
        }
        date = parseDate(String(input));
    }
    return formatDate(applyDateMath(expression, date, roundUp));
};
dateMath.rawInput = true;

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

    // Formats are ISO8601 (default), LDAP, PEOPLE_SOFT, EPOCH_TIME_JAVA, EPOCH_TIME_WIN32 or a Java SimpleDateFormat pattern
    dateFormat: onInput((input, attributes) =>
        formatDate(parseDate(input, attributes.inputFormat ?? 'ISO8601'), attributes.outputFormat ?? 'ISO8601')),

    dateMath,
};
