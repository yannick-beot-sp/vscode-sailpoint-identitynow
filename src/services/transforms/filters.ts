import { TransformError } from './TransformError.js';

/*
 * SailPoint filter strings, as used by the accountFilter and accountPropertyFilter of accountAttribute, e.g.
 * !(nativeIdentity.startsWith("*DELETED*")) && (department == "IT" || type.in({"Employee", "Contractor"}))
 */

type Predicate = (record: any) => boolean;

type TokenType = 'identifier' | 'string' | 'number' | 'literal' | 'operator';
interface Token {
    type: TokenType;
    value: any;
}

const OPERATORS = ['==', '!=', '<=', '>=', '&&', '||', '<', '>', '!', '(', ')', '{', '}', ','];

function tokenize(filter: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < filter.length) {
        const rest = filter.substring(i);
        const whitespace = /^\s+/.exec(rest);
        if (whitespace) {
            i += whitespace[0].length;
            continue;
        }
        if (rest[0] === '"') {
            let value = '';
            let j = 1;
            while (j < rest.length && rest[j] !== '"') {
                value += rest[j] === '\\' && j + 1 < rest.length ? rest[++j] : rest[j];
                j++;
            }
            if (j >= rest.length) {
                throw new Error('unterminated string');
            }
            tokens.push({ type: 'string', value });
            i += j + 1;
            continue;
        }
        const number = /^-?\d+(\.\d+)?/.exec(rest);
        if (number) {
            tokens.push({ type: 'number', value: Number(number[0]) });
            i += number[0].length;
            continue;
        }
        const identifier = /^[A-Za-z_][\w.]*/.exec(rest);
        if (identifier) {
            const word = identifier[0];
            if (word === 'true' || word === 'false' || word === 'null') {
                tokens.push({ type: 'literal', value: word === 'null' ? null : word === 'true' });
            } else {
                tokens.push({ type: 'identifier', value: word });
            }
            i += word.length;
            continue;
        }
        const operator = OPERATORS.find(op => rest.startsWith(op));
        if (!operator) {
            throw new Error(`unexpected character '${rest[0]}'`);
        }
        tokens.push({ type: 'operator', value: operator });
        i += operator.length;
    }
    return tokens;
}

function getValue(record: any, path: string): any {
    return path.split('.').reduce((value, key) => value === undefined || value === null ? undefined : value[key], record);
}

function asList(value: any): any[] {
    return Array.isArray(value) ? value : [value];
}

/**
 * Compares as numbers when both values are numeric, otherwise as strings
 */
function compare(left: any, right: any): number {
    const leftNumber = Number(left), rightNumber = Number(right);
    if (left !== '' && right !== '' && !isNaN(leftNumber) && !isNaN(rightNumber)) {
        return leftNumber - rightNumber;
    }
    return String(left).localeCompare(String(right));
}

function equals(left: any, right: any): boolean {
    if (left === undefined || left === null || right === null) {
        return (left ?? null) === right;
    }
    return compare(left, right) === 0;
}

const METHODS: Record<string, (value: any, args: any[]) => boolean> = {
    startsWith: (value, [arg]) => asList(value).some(v => v !== null && v !== undefined && String(v).startsWith(arg)),
    endsWith: (value, [arg]) => asList(value).some(v => v !== null && v !== undefined && String(v).endsWith(arg)),
    contains: (value, [arg]) => Array.isArray(value) ? value.some(v => equals(v, arg)) : value !== null && value !== undefined && String(value).includes(arg),
    startsWithIgnoreCase: (value, [arg]) => METHODS.startsWith(asList(value).map(v => String(v).toLowerCase()), [String(arg).toLowerCase()]),
    endsWithIgnoreCase: (value, [arg]) => METHODS.endsWith(asList(value).map(v => String(v).toLowerCase()), [String(arg).toLowerCase()]),
    containsIgnoreCase: (value, [arg]) => METHODS.contains(Array.isArray(value) ? value.map(v => String(v).toLowerCase()) : String(value ?? '').toLowerCase(), [String(arg).toLowerCase()]),
    equalsIgnoreCase: (value, [arg]) => asList(value).some(v => v !== null && v !== undefined && String(v).toLowerCase() === String(arg).toLowerCase()),
    in: (value, [list]) => asList(value).some(v => asList(list).some(item => equals(v, item))),
    containsAll: (value, [list]) => asList(list).every(item => asList(value).some(v => equals(v, item))),
    isNull: value => value === undefined || value === null,
    notNull: value => value !== undefined && value !== null,
    isEmpty: value => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0),
};

class Parser {
    private position = 0;

    constructor(private readonly tokens: Token[]) { }

    parse(): Predicate {
        const predicate = this.parseOr();
        if (this.position < this.tokens.length) {
            throw new Error(`unexpected '${this.tokens[this.position].value}'`);
        }
        return predicate;
    }

    private peek(value: string): boolean {
        const token = this.tokens[this.position];
        return token?.type === 'operator' && token.value === value;
    }

    private expect(value: string): void {
        if (!this.peek(value)) {
            throw new Error(`'${value}' expected`);
        }
        this.position++;
    }

    private next(): Token {
        const token = this.tokens[this.position++];
        if (!token) {
            throw new Error('unexpected end of filter');
        }
        return token;
    }

    private parseOr(): Predicate {
        const predicates = [this.parseAnd()];
        while (this.peek('||')) {
            this.position++;
            predicates.push(this.parseAnd());
        }
        return predicates.length === 1 ? predicates[0] : record => predicates.some(p => p(record));
    }

    private parseAnd(): Predicate {
        const predicates = [this.parseUnary()];
        while (this.peek('&&')) {
            this.position++;
            predicates.push(this.parseUnary());
        }
        return predicates.length === 1 ? predicates[0] : record => predicates.every(p => p(record));
    }

    private parseUnary(): Predicate {
        if (this.peek('!')) {
            this.position++;
            const predicate = this.parseUnary();
            return record => !predicate(record);
        }
        if (this.peek('(')) {
            this.position++;
            const predicate = this.parseOr();
            this.expect(')');
            return predicate;
        }
        return this.parseComparison();
    }

    private parseValue(): any {
        if (this.peek('{')) {
            this.position++;
            const values = [];
            while (!this.peek('}')) {
                values.push(this.parseValue());
                if (!this.peek('}')) {
                    this.expect(',');
                }
            }
            this.position++;
            return values;
        }
        const token = this.next();
        if (token.type === 'identifier' || token.type === 'operator') {
            throw new Error(`value expected instead of '${token.value}'`);
        }
        return token.value;
    }

    private parseComparison(): Predicate {
        const token = this.next();
        if (token.type !== 'identifier') {
            throw new Error(`property expected instead of '${token.value}'`);
        }

        if (this.peek('(')) {
            // property.method(args)
            const separator = token.value.lastIndexOf('.');
            const property = token.value.substring(0, separator);
            const method = METHODS[token.value.substring(separator + 1)];
            if (separator === -1 || !method) {
                throw new Error(`unknown method '${token.value}'`);
            }
            this.position++;
            const args = [];
            while (!this.peek(')')) {
                args.push(this.parseValue());
                if (!this.peek(')')) {
                    this.expect(',');
                }
            }
            this.position++;
            return record => method(getValue(record, property), args);
        }

        const operator = this.next();
        if (operator.type !== 'operator' || !['==', '!=', '<', '>', '<=', '>='].includes(operator.value)) {
            throw new Error(`comparison operator expected after '${token.value}'`);
        }
        const expected = this.parseValue();
        const property = token.value;
        switch (operator.value) {
            case '==': return record => asList(getValue(record, property)).some(v => equals(v, expected));
            case '!=': return record => !asList(getValue(record, property)).some(v => equals(v, expected));
            case '<': return record => compare(getValue(record, property), expected) < 0;
            case '>': return record => compare(getValue(record, property), expected) > 0;
            case '<=': return record => compare(getValue(record, property), expected) <= 0;
            default: return record => compare(getValue(record, property), expected) >= 0;
        }
    }
}

/**
 * Compiles a SailPoint filter string into a predicate
 */
export function compileFilter(filter: string): Predicate {
    try {
        return new Parser(tokenize(filter)).parse();
    } catch (error) {
        throw new TransformError(`Invalid filter '${filter}': ${error instanceof Error ? error.message : error}`);
    }
}
