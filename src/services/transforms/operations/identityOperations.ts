/* eslint-disable @typescript-eslint/naming-convention */
import { isEmpty } from '../../../utils/stringUtils.js';
import { EvaluationContext } from '../EvaluationContext.js';
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
    // Optional attributes (accountFilter, accountSortAttribute, etc.) are not supported
    accountAttribute: async (attributes, _input, engine) => {
        const { sourceName, attributeName } = attributes;
        const context = engine.context;

        const sourceId = await context.getSourceId(sourceName);
        if (sourceId === undefined) {
            throw new TransformError(`Source '${sourceName}' does not exist`);
        }

        const identityNameOrId = await engine.getIdentityNameOrId();
        const identity = await getIdentity(context, identityNameOrId);

        const nativeIdentity = identity.accounts?.find((account: any) => account.source?.id === sourceId)?.accountId;
        if (nativeIdentity === undefined) {
            throw new TransformError(`No account found for identity '${identityNameOrId}' in source '${sourceName}'`);
        }

        const account = await context.getAccountBySource(sourceId, nativeIdentity);
        if (account === undefined) {
            throw new TransformError(`Account '${nativeIdentity}' in source '${sourceName}' couldn't be found`);
        }

        const value = account.attributes?.[attributeName];
        if (value === undefined) {
            throw new TransformError(`Attribute '${attributeName}' for account '${nativeIdentity}' in source '${sourceName}' does not exist or is null`);
        }
        return value;
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
