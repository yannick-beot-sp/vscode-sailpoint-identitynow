/* eslint-disable @typescript-eslint/naming-convention */
import { randomInt, randomUUID } from 'crypto';
import { TransformError } from '../TransformError.js';
import { Operation, cloudServicesRule, parseBoolean, parseNumber } from './Operation.js';

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SPECIAL_CHARS = '!@#$%&*()+<>?';
const MAX_LENGTH = 450;
const DEFAULT_LENGTH = 32;

function parseLength(value: any): number {
    const length = parseNumber('length', value);
    if (length < 0) {
        throw new TransformError("Attribute 'length' must be a positive number");
    }
    if (length > MAX_LENGTH) {
        throw new TransformError(`Maximum allowable length is ${MAX_LENGTH} characters`);
    }
    return length;
}

function randomString(availableChars: string, length: number): string {
    return Array.from({ length }, () => availableChars.charAt(randomInt(availableChars.length))).join('');
}

export const GENERATOR_OPERATIONS: Record<string, Operation> = {
    randomAlphaNumeric: async (attributes) => randomString(LETTERS + DIGITS, parseLength(attributes.length ?? DEFAULT_LENGTH)),

    randomNumeric: async (attributes) => randomString(DIGITS, parseLength(attributes.length ?? DEFAULT_LENGTH)),

    'rule:generateRandomString': cloudServicesRule(async (attributes) => {
        let availableChars = LETTERS;
        if (parseBoolean('includeNumbers', attributes.includeNumbers)) {
            availableChars += DIGITS;
        }
        if (parseBoolean('includeSpecialChars', attributes.includeSpecialChars)) {
            availableChars += SPECIAL_CHARS;
        }
        return randomString(availableChars, parseLength(attributes.length));
    }),

    uuid: async () => randomUUID(),
};
