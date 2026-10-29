/* eslint-disable @typescript-eslint/naming-convention */
import { NotImplementedError, TransformError } from './TransformError.js';

/*
 * Dates of the transforms, in UTC.
 * Patterns follow java.text.SimpleDateFormat, which ISC uses for dateFormat.
 */

const NAMED_PATTERNS: Record<string, string> = {
    ISO8601: "yyyy-MM-dd'T'HH:mm:ss.SSSX",
    LDAP: 'yyyyMMddHHmmss.Z',
    PEOPLE_SOFT: 'MM/dd/yyyy',
};
const EPOCH_TIME_JAVA = 'EPOCH_TIME_JAVA';
const EPOCH_TIME_WIN32 = 'EPOCH_TIME_WIN32';
// 100-nanosecond intervals between 1601-01-01 and 1970-01-01
const WIN32_EPOCH_OFFSET = 116444736000000000n;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NUMERIC_LETTERS = 'yYMLdHkKhmsSu';

interface Token {
    letter?: string;
    count: number;
    literal?: string;
}

function tokenize(pattern: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < pattern.length) {
        const char = pattern[i];
        if (char === "'") {
            // '' is a quote, 'text' is literal text
            const end = pattern.indexOf("'", i + 1);
            if (end === i + 1) {
                tokens.push({ literal: "'", count: 1 });
                i += 2;
                continue;
            }
            if (end === -1) {
                throw new TransformError(`Unterminated quote in date format '${pattern}'`);
            }
            tokens.push({ literal: pattern.substring(i + 1, end).replaceAll("''", "'"), count: 1 });
            i = end + 1;
        } else if (/[a-zA-Z]/.test(char)) {
            let count = 1;
            while (pattern[i + count] === char) {
                count++;
            }
            if (!'GyYMLdEuaHkKhmsSzZX'.includes(char)) {
                throw new NotImplementedError(`Date format letter '${char}' not yet implemented in '${pattern}'`);
            }
            tokens.push({ letter: char, count });
            i += count;
        } else {
            tokens.push({ literal: char, count: 1 });
            i++;
        }
    }
    return tokens;
}

function pad(value: number, count: number): string {
    return String(value).padStart(count, '0');
}

function formatToken(date: Date, { letter, count }: Token): string {
    switch (letter) {
        case 'G': return 'AD';
        case 'y':
        case 'Y': return count === 2 ? pad(date.getUTCFullYear() % 100, 2) : pad(date.getUTCFullYear(), count);
        case 'M':
        case 'L': {
            const month = date.getUTCMonth();
            if (count >= 4) { return MONTHS[month]; }
            if (count === 3) { return MONTHS[month].substring(0, 3); }
            return pad(month + 1, count);
        }
        case 'd': return pad(date.getUTCDate(), count);
        case 'E': return count >= 4 ? DAYS[date.getUTCDay()] : DAYS[date.getUTCDay()].substring(0, 3);
        case 'u': return pad(date.getUTCDay() === 0 ? 7 : date.getUTCDay(), count);
        case 'a': return date.getUTCHours() < 12 ? 'AM' : 'PM';
        case 'H': return pad(date.getUTCHours(), count);
        case 'k': return pad(date.getUTCHours() === 0 ? 24 : date.getUTCHours(), count);
        case 'K': return pad(date.getUTCHours() % 12, count);
        case 'h': return pad(date.getUTCHours() % 12 === 0 ? 12 : date.getUTCHours() % 12, count);
        case 'm': return pad(date.getUTCMinutes(), count);
        case 's': return pad(date.getUTCSeconds(), count);
        case 'S': return pad(date.getUTCMilliseconds(), count);
        case 'z': return count >= 4 ? 'Coordinated Universal Time' : 'UTC';
        case 'Z': return '+0000';
        case 'X': return 'Z';
        default: return '';
    }
}

function formatPattern(date: Date, pattern: string): string {
    return tokenize(pattern).map(token => token.literal ?? formatToken(date, token)).join('');
}

function namesRegex(names: string[], short: boolean): string {
    return names.map(name => short ? name.substring(0, 3) : name).join('|');
}

/**
 * Regex of a token. Numeric fields followed by another numeric field use their fixed width, as Java does.
 */
function tokenRegex(token: Token, next: Token | undefined): string {
    const { letter, count } = token;
    if (token.literal !== undefined) {
        return token.literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const fixedWidth = next?.letter !== undefined && NUMERIC_LETTERS.includes(next.letter);

    switch (letter) {
        case 'G': return '(AD|BC)';
        case 'M':
        case 'L':
            if (count >= 4) { return `(${namesRegex(MONTHS, false)})`; }
            if (count === 3) { return `(${namesRegex(MONTHS, true)})`; }
            break;
        case 'E': return count >= 4 ? `(${namesRegex(DAYS, false)})` : `(${namesRegex(DAYS, true)})`;
        case 'a': return '(AM|PM)';
        case 'z': return '(UTC|GMT(?:[+-]\\d{1,2}:?\\d{2})?|Coordinated Universal Time)';
        case 'Z': return '(Z|[+-]\\d{4})';
        case 'X': return '(Z|[+-]\\d{2}(?::?\\d{2})?)';
    }
    return fixedWidth ? `(\\d{${count}})` : '(\\d+)';
}

/**
 * Offset in minutes of a time zone, as parsed by the z, Z and X letters
 */
function parseOffset(value: string): number {
    const match = /([+-])(\d{1,2}):?(\d{2})$/.exec(value);
    if (!match) {
        return 0;
    }
    const minutes = Number(match[2]) * 60 + Number(match[3]);
    return match[1] === '-' ? -minutes : minutes;
}

/**
 * Two-digit years are within 80 years before and 20 years after now, as in Java
 */
function expandTwoDigitYear(year: number): number {
    const now = new Date().getUTCFullYear();
    let result = Math.floor((now - 80) / 100) * 100 + year;
    if (result < now - 80) {
        result += 100;
    }
    return result;
}

function parsePattern(value: string, pattern: string): Date {
    const tokens = tokenize(pattern);
    // As java.text.DateFormat.parse(String), the text after the pattern is ignored
    const regex = new RegExp('^' + tokens.map((token, i) => tokenRegex(token, tokens[i + 1])).join(''), 'i');
    const match = regex.exec(value);
    if (!match) {
        throw new TransformError(`Date '${value}' does not match the format '${pattern}'`);
    }

    let year = 1970, month = 0, day = 1, hours = 0, minutes = 0, seconds = 0, milliseconds = 0, offset = 0;
    let pm: boolean | undefined;
    let group = 1;
    for (const { letter, count } of tokens) {
        if (letter === undefined) {
            continue;
        }
        const text = match[group++];
        const number = Number(text);
        switch (letter) {
            case 'y':
            case 'Y': year = count === 2 && text.length === 2 ? expandTwoDigitYear(number) : number; break;
            case 'M':
            case 'L':
                month = count >= 3
                    ? MONTHS.findIndex(name => (count >= 4 ? name : name.substring(0, 3)).toLowerCase() === text.toLowerCase())
                    : number - 1;
                break;
            case 'd': day = number; break;
            case 'a': pm = text.toUpperCase() === 'PM'; break;
            case 'H':
            case 'k': hours = number % 24; break;
            case 'K':
            case 'h': hours = number % 12; break;
            case 'm': minutes = number; break;
            case 's': seconds = number; break;
            case 'S': milliseconds = number; break;
            case 'z':
            case 'Z':
            case 'X': offset = parseOffset(text); break;
        }
    }
    if (pm) {
        hours += 12;
    }
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds) - offset * 60000);
}

/**
 * Parses a date in a named format (ISO8601, LDAP, PEOPLE_SOFT, EPOCH_TIME_JAVA, EPOCH_TIME_WIN32) or a Java pattern
 */
export function parseDate(value: string, format = 'ISO8601'): Date {
    let date: Date;
    if (format === 'ISO8601') {
        date = new Date(value);
    } else if (format === EPOCH_TIME_JAVA) {
        date = new Date(Number(value));
    } else if (format === EPOCH_TIME_WIN32) {
        if (!/^\d+$/.test(value)) {
            throw new TransformError(`Date '${value}' is not a ${EPOCH_TIME_WIN32} value`);
        }
        date = new Date(Number((BigInt(value) - WIN32_EPOCH_OFFSET) / 10000n));
    } else if (format === 'LDAP') {
        // Generalized time, e.g. 20201231235959Z or 20201231235959.0Z
        const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:[.,](\d+))?(Z|[+-]\d{4})?/.exec(value);
        if (!match) {
            throw new TransformError(`Date '${value}' is not an LDAP generalized time`);
        }
        const [, y, mo, d, h, mi, s, fraction, zone] = match;
        const milliseconds = fraction ? Math.round(Number(`0.${fraction}`) * 1000) : 0;
        date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s), milliseconds) - parseOffset(zone ?? '') * 60000);
    } else {
        date = parsePattern(value, NAMED_PATTERNS[format] ?? format);
    }

    if (isNaN(date.getTime())) {
        throw new TransformError(`Invalid date '${value}' for format '${format}'`);
    }
    return date;
}

/**
 * Formats a date in a named format (ISO8601, LDAP, PEOPLE_SOFT, EPOCH_TIME_JAVA, EPOCH_TIME_WIN32) or a Java pattern
 */
export function formatDate(date: Date, format = 'ISO8601'): string {
    if (format === EPOCH_TIME_JAVA) {
        return String(date.getTime());
    }
    if (format === EPOCH_TIME_WIN32) {
        return String(BigInt(date.getTime()) * 10000n + WIN32_EPOCH_OFFSET);
    }
    return formatPattern(date, NAMED_PATTERNS[format] ?? format);
}

const UNITS = 'yMwdhms';

function addUnits(date: Date, amount: number, unit: string): Date {
    const result = new Date(date.getTime());
    switch (unit) {
        case 'y':
        case 'M': {
            // As Joda-Time, the day is clamped to the end of the target month, e.g. Jan 31 + 1M = Feb 28
            const months = unit === 'y' ? amount * 12 : amount;
            const day = result.getUTCDate();
            result.setUTCDate(1);
            result.setUTCMonth(result.getUTCMonth() + months);
            const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
            result.setUTCDate(Math.min(day, lastDay));
            return result;
        }
        case 'w': result.setUTCDate(result.getUTCDate() + amount * 7); return result;
        case 'd': result.setUTCDate(result.getUTCDate() + amount); return result;
        case 'h': result.setUTCHours(result.getUTCHours() + amount); return result;
        case 'm': result.setUTCMinutes(result.getUTCMinutes() + amount); return result;
        default: result.setUTCSeconds(result.getUTCSeconds() + amount); return result;
    }
}

function roundDown(date: Date, unit: string): Date {
    const parts = [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];
    if (unit === 'w') {
        // Weeks start on Monday
        const daysSinceMonday = (date.getUTCDay() + 6) % 7;
        return new Date(Date.UTC(parts[0], parts[1], parts[2] - daysSinceMonday));
    }
    const kept = { y: 1, M: 2, d: 3, h: 4, m: 5, s: 6 }[unit] as number;
    const [year, month = 0, day = 1, hours = 0, minutes = 0, seconds = 0] = parts.slice(0, kept);
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}

/**
 * Applies a date math expression, e.g. `now-5d/d` or `+1M`, as Elasticsearch date math.
 * `/unit` rounds down to the start of the unit, or up to its last millisecond with roundUp.
 */
export function applyDateMath(expression: string, date: Date, roundUp: boolean): Date {
    const operations = expression.startsWith('now') ? expression.substring(3) : expression;
    const regex = new RegExp(`([+-])(\\d+)([${UNITS}])|/([${UNITS}])`, 'y');

    let result = date;
    let position = 0;
    let rounded = false;
    while (position < operations.length) {
        regex.lastIndex = position;
        const match = regex.exec(operations);
        if (!match || rounded) {
            throw new TransformError(`Invalid date math expression '${expression}'`);
        }
        if (match[4]) {
            const start = roundDown(result, match[4]);
            result = roundUp ? new Date(addUnits(start, 1, match[4]).getTime() - 1) : start;
            rounded = true;
        } else {
            result = addUnits(result, (match[1] === '-' ? -1 : 1) * Number(match[2]), match[3]);
        }
        position = regex.lastIndex;
    }
    return result;
}
