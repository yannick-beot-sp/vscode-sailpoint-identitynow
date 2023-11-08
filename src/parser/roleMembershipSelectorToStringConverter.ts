import { RoleCriteriaKeyType, RoleCriteriaLevel1, RoleCriteriaLevel2, RoleCriteriaLevel3, RoleCriteriaOperation } from "sailpoint-api-client";
import { CacheService } from "../services/cache/CacheService";
import { ComparisonOperation, isLogicalOperation } from "./ast";

/**
 * Single quote is privileged as in the CSV export, long string are between double quotes. So a double quote should be properly escaped, resulting in a double double-quote.
 * As I support single quote for import, I'll use single quote for now
 */
const EXPORT_QUOTE="'";

export async function roleMembershipSelectorToStringConverter(
    roleCriteriaLevel1: RoleCriteriaLevel1,
    sourceIdToName: CacheService<string>): Promise<string> {

    if (roleCriteriaLevel1 === undefined
        || roleCriteriaLevel1.children === undefined
        || roleCriteriaLevel1.children.length === 0) {
        return "";
    }

    if (roleCriteriaLevel1.children.length === 1) {
        return await convertRoleCriteriaLevel2(roleCriteriaLevel1.children[0], sourceIdToName);
    }

    if (isLogicalOperation(roleCriteriaLevel1.children[0].operation)) {
        return join(roleCriteriaLevel1.operation,
            (await Promise.all(
                roleCriteriaLevel1.children
                    .map(async x => await convertRoleCriteriaLevel2(x, sourceIdToName))))
                .map(x => `(${x})`));
    }

    return join(roleCriteriaLevel1.operation,
        (await Promise.all(
            roleCriteriaLevel1.children
                .map(async x => await convertRoleCriteriaLevel3(x, sourceIdToName)))));

}

function join(op: RoleCriteriaOperation, expressions: string[]) {
    return expressions.join(` ${op.toLowerCase()} `);
}

async function convertRoleCriteriaLevel2(
    roleCriteriaLevel2: RoleCriteriaLevel2,
    sourceIdToName: CacheService<string>): Promise<string> {

    return join(roleCriteriaLevel2.operation,
        (await Promise.all(
            roleCriteriaLevel2.children?.map(
                async x => await convertRoleCriteriaLevel3(x, sourceIdToName)))));
}

async function convertRoleCriteriaLevel3(
    roleCriteriaLevel3: RoleCriteriaLevel3,
    sourceIdToName: CacheService<string>): Promise<string> {

    const attributeName = roleCriteriaLevel3.key.property.replace("attribute.", "");

    let left: string;
    if (RoleCriteriaKeyType.Identity === roleCriteriaLevel3.key.type) {
        left = `identity.${attributeName}`;
    } else {
        const sourceName = await sourceIdToName.get(roleCriteriaLevel3.key.sourceId);
        const middle = RoleCriteriaKeyType.Entitlement === roleCriteriaLevel3.key.type ? "entitlement" : "attribute";
        left = `${EXPORT_QUOTE}${sourceName}${EXPORT_QUOTE}.${middle}.${attributeName}`;
    }

    return `${left} ${comparisonOperationMapper(roleCriteriaLevel3.operation)} ${EXPORT_QUOTE}${roleCriteriaLevel3.stringValue}${EXPORT_QUOTE}`;
}

function comparisonOperationMapper(op: RoleCriteriaOperation): ComparisonOperation {
    switch (op) {
        case "EQUALS":
            return "eq";
        case "NOT_EQUALS":
            return "ne";
        case "CONTAINS":
            return "co";
        case "STARTS_WITH":
            return "ew";
        case "ENDS_WITH":
            return "sw";
        default:
            throw new Error("Invalid operation");
    }
}