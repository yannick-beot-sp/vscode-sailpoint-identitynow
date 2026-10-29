/* eslint-disable @typescript-eslint/naming-convention */
import { isEmpty } from '../../../utils/stringUtils.js';
import { EvaluationContext } from '../EvaluationContext.js';
import { compileFilter } from '../filters.js';
import { TransformError } from '../TransformError.js';
import { Operation, cloudServicesRule } from './Operation.js';

async function getIdentity(context: EvaluationContext, identityNameOrId: string): Promise<any> {
    const identity = await context.getIdentity(identityNameOrId);
    if (identity === undefined) {
        throw new TransformError(`Identity '${identityNameOrId}' couldn't be found`);
    }
    return identity;
}

/**
 * Sorts by an account property (created, modified, name, nativeIdentity, etc.) or else by an account attribute.
 * Accounts without a value come last.
 */
function sortAccounts(accounts: any[], sortAttribute: string, descending: boolean): void {
    const valueOf = (account: any) => account[sortAttribute] ?? account.attributes?.[sortAttribute] ?? null;
    accounts.sort((a, b) => {
        const first = valueOf(a), second = valueOf(b);
        if (first === null || second === null) {
            return first === second ? 0 : first === null ? 1 : -1;
        }
        const order = String(first).localeCompare(String(second), undefined, { numeric: true });
        return descending ? -order : order;
    });
}

/**
 * ("Preferred Name" or "Given Name") + "Family Name".
 * The input is a map of givenName, familyName and optionally preferredName, whose values can be transforms.
 */
const displayName: Operation = async (attributes, _input, engine) => {
    const input = attributes.input;
    if (input === undefined || input === null || typeof input !== 'object' || input.type !== undefined) {
        throw new TransformError("Attribute 'input' must be a map of 'givenName', 'familyName' and optionally 'preferredName'");
    }

    const preferredName = await engine.resolveValue(input.preferredName);
    const firstName = isEmpty(preferredName) ? await engine.resolveValue(input.givenName) : preferredName;
    const familyName = await engine.resolveValue(input.familyName);
    return [firstName, familyName].filter(name => !isEmpty(name)).join(' ');
};
displayName.rawInput = true;

export const IDENTITY_OPERATIONS: Record<string, Operation> = {
    accountAttribute: async (attributes, _input, engine) => {
        const { sourceName, attributeName } = attributes;
        const context = engine.context;

        const sourceId = await context.getSourceId(sourceName);
        if (sourceId === undefined) {
            throw new TransformError(`Source '${sourceName}' does not exist`);
        }

        const identityNameOrId = await engine.getIdentityNameOrId();
        const identity = await getIdentity(context, identityNameOrId);

        let accounts = (await context.getAccountsByIdentity(identity.id)).filter(account => account.sourceId === sourceId);
        if (accounts.length === 0) {
            throw new TransformError(`No account found for identity '${identityNameOrId}' in source '${sourceName}'`);
        }

        // accountFilter applies to the account properties, accountPropertyFilter to its attributes
        if (attributes.accountFilter) {
            const filter = compileFilter(attributes.accountFilter);
            accounts = accounts.filter(account => filter({ ...account, displayName: account.name, entitlements: account.hasEntitlements }));
        }
        if (attributes.accountPropertyFilter) {
            const filter = compileFilter(attributes.accountPropertyFilter);
            accounts = accounts.filter(account => filter(account.attributes ?? {}));
        }

        sortAccounts(accounts, attributes.accountSortAttribute ?? 'created', attributes.accountSortDescending === true || attributes.accountSortDescending === 'true');

        const values = accounts.map(account => account.attributes?.[attributeName] ?? null);
        if (attributes.accountReturnFirstLink === true || attributes.accountReturnFirstLink === 'true') {
            return values[0] ?? null;
        }
        return values.find(value => value !== null) ?? null;
    },

    displayName: displayName,

    identityAttribute: async (attributes, _input, engine) => {
        const identityNameOrId = await engine.getIdentityNameOrId();
        const identity = await getIdentity(engine.context, identityNameOrId);

        const value = identity.attributes?.[attributes.name];
        if (value === undefined) {
            throw new TransformError(`Missing or invalid value for identity '${identityNameOrId}' attribute '${attributes.name}'`);
        }
        return value;
    },

    'rule:getReferenceIdentityAttribute': cloudServicesRule(async (attributes, _input, engine) => {
        const { uid, attributeName } = attributes;
        const context = engine.context;

        let referenceName = uid;
        if (uid === 'manager') {
            const identityNameOrId = await engine.getIdentityNameOrId();
            const identity = await getIdentity(context, identityNameOrId);
            referenceName = identity.manager?.name;
            if (referenceName === undefined) {
                throw new TransformError(`Identity '${identityNameOrId}' has no manager`);
            }
        }

        const reference = await getIdentity(context, referenceName);
        const value = reference.attributes?.[attributeName] ?? reference[attributeName];
        if (value === undefined) {
            throw new TransformError(`Missing or invalid value for identity '${referenceName}' attribute '${attributeName}'`);
        }
        return value;
    }),
};
