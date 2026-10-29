import { DATE_OPERATIONS } from './dateOperations.js';
import { GENERATOR_OPERATIONS } from './generatorOperations.js';
import { IDENTITY_OPERATIONS } from './identityOperations.js';
import { Operation } from './Operation.js';
import { STRING_OPERATIONS } from './stringOperations.js';
import { VALUE_OPERATIONS } from './valueOperations.js';

/**
 * Supported transforms, by type key (cf. ATTRIBUTES)
 */
export const OPERATIONS: Record<string, Operation> = {
    ...DATE_OPERATIONS,
    ...GENERATOR_OPERATIONS,
    ...IDENTITY_OPERATIONS,
    ...STRING_OPERATIONS,
    ...VALUE_OPERATIONS,
};
