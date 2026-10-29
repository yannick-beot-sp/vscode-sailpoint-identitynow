/* eslint-disable @typescript-eslint/naming-convention */
import { CountryCode, isSupportedCountry, parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { TransformError } from '../TransformError.js';
import { normalizeNames } from '../normalizeNames.js';
import { Operation, cloudServicesRule, onInput, parseNumber } from './Operation.js';

export const STRING_OPERATIONS: Record<string, Operation> = {
    base64Decode: onInput(input => Buffer.from(input, 'base64').toString()),

    base64Encode: onInput(input => Buffer.from(input).toString('base64')),

    concat: async (attributes, _input, engine) => {
        const values = await engine.resolveValues(attributes.values);
        return values.map(value => String(value)).join('');
    },

    decomposeDiacriticalMarks: onInput(input => input.normalize('NFKD').replace(/[̀-ͯ]/g, '')),

    // An invalid phone number gives null
    e164phone: onInput((input, attributes) => {
        const defaultRegion = attributes.defaultRegion ?? 'US';
        if (!/^[A-Z]{2}$/.test(defaultRegion)) {
            throw new TransformError("The format of the 'defaultRegion' attribute should be in ISO 3166-1 alpha-2 format");
        }
        if (!isSupportedCountry(defaultRegion)) {
            throw new TransformError(`Invalid defaultRegion '${defaultRegion}'`);
        }
        const phoneNumber = parsePhoneNumberFromString(input, defaultRegion as CountryCode);
        return phoneNumber?.isValid() ? phoneNumber.number : null;
    }),

    indexOf: onInput(async (input, attributes, engine) => input.indexOf(await engine.resolveValue(attributes.substring))),

    lastIndexOf: onInput(async (input, attributes, engine) => input.lastIndexOf(await engine.resolveValue(attributes.substring))),

    leftPad: onInput((input, attributes) => input.padStart(parseNumber('length', attributes.length), attributes.padding ?? ' ')),

    lower: onInput(input => input.toLowerCase()),

    normalizeNames: onInput(input => normalizeNames(input)),

    replace: onInput((input, attributes) => input.replace(new RegExp(attributes.regex, 'g'), attributes.replacement)),

    replaceAll: onInput((input, attributes) => {
        let result = input;
        for (const [regex, replacement] of Object.entries(attributes.table)) {
            result = result.replace(new RegExp(regex, 'g'), replacement as string);
        }
        return result;
    }),

    rightPad: onInput((input, attributes) => input.padEnd(parseNumber('length', attributes.length), attributes.padding ?? ' ')),

    'rule:getEndOfString': cloudServicesRule(onInput((input, attributes) => {
        const numChars = parseNumber('numChars', attributes.numChars);
        return numChars > input.length ? null : input.substring(input.length - numChars);
    })),

    split: onInput((input, attributes) => {
        const index = parseNumber('index', attributes.index);
        const components = input.split(attributes.delimiter);
        if (index < components.length) {
            return components[index];
        }
        if (attributes.throws === true || attributes.throws === 'true') {
            throw new TransformError(`IndexOutOfBoundsException: index ${index} for ${components.length} element(s)`);
        }
        return null;
    }),

    substring: onInput(async (input, attributes, engine) => {
        // begin = -1 means the start of the string, and beginOffset is then ignored
        let begin = parseNumber('begin', await engine.resolveValue(attributes.begin));
        let beginOffset = 0;
        if (begin === -1) {
            begin = 0;
        } else if (attributes.beginOffset !== undefined) {
            beginOffset = parseNumber('beginOffset', attributes.beginOffset);
        }

        // end = -1 or no end means the end of the string, and endOffset is then ignored
        const end = attributes.end === undefined ? -1 : parseNumber('end', await engine.resolveValue(attributes.end));
        if (end === -1) {
            return input.substring(begin + beginOffset);
        }
        const endOffset = attributes.endOffset === undefined ? 0 : parseNumber('endOffset', attributes.endOffset);
        return input.substring(begin + beginOffset, end + endOffset);
    }),

    trim: onInput(input => input.trim()),

    upper: onInput(input => input.toUpperCase()),
};
