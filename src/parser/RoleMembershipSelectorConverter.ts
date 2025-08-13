
import { RoleCriteriaKey, RoleCriteriaKeyType, RoleCriteriaLevel1, RoleCriteriaOperation } from "sailpoint-api-client";
import { CacheService } from "../services/cache/CacheService";
import { Attribute, ComparisonOperation, ComparisonOperator, Expression, Literal, LogicalOperator, Visitor } from "./ast";

function comparisonOperationMapper(op: ComparisonOperation): RoleCriteriaOperation {
    switch (op) {
        case "eq":
        case "in":
            return "EQUALS";
        case "ne":
            return "NOT_EQUALS";
        case "co":
            return "CONTAINS";
        case "sw":
            return "STARTS_WITH";
        case "ew":
            return "ENDS_WITH";
        case "nc":
            /* Waiting for API update cf. https://github.com/sailpoint-oss/developer.sailpoint.com/issues/867
            /* @ts-ignore */
            return "DOES_NOT_CONTAIN";
        case "ge":
            /* @ts-ignore */
            return "GREATER_THAN_EQUALS";
        case "gt":
            /* @ts-ignore */
            return "GREATER_THAN";
        case "lt":
            /* @ts-ignore */
            return "LESS_THAN";
        case "le":
            /* @ts-ignore */
            return "LESS_THAN_EQUALS";
        default:
            throw new Error("Invalid operation");
    }
}

export class RoleMembershipSelectorConverter implements Visitor<RoleCriteriaLevel1> {

    root: RoleCriteriaLevel1 | undefined = undefined;

    constructor(private readonly sourceNameToId: CacheService<string>) {

    }

    async visitExpression(val: Expression, arg: RoleCriteriaLevel1): Promise<void> {
        await val.accept(this, arg);

        if (this.root?.children === undefined || this.root?.children.length === 0) {
            // We have only 1 level so far. Needs to create at least 2 levels artifically
            this.root = {
                operation: "OR",
                children: [this.root]
            };
        } else if (this.root.children.every(x => x.children === undefined || x.children.length === 0)) {
            // We have already 2 level2. Needs to create 1 level artifically
            this.root = {
                operation: this.root.operation === "AND" ? "OR" : "AND",
                children: [this.root]
            };
        }

    }

    async visitAttribute(val: Attribute, arg: RoleCriteriaLevel1): Promise<void> {
        const keyType = val.type;
        let property = `attribute.${val.property}`;
        let sourceId: string | undefined;
        if (keyType !== RoleCriteriaKeyType.Identity) {
            sourceId = await this.sourceNameToId.get(val.sourceName);
        }

        const key: RoleCriteriaKey = {
            type: keyType,
            property,
            sourceId
        };
        arg.key = key;
    }

    visitLiteral(val: Literal, arg: RoleCriteriaLevel1): void | Promise<void> {
        // cf. https://github.com/sailpoint-oss/developer.sailpoint.com/issues/867
        // @ts-ignore
        arg.values = val.values;
    }

    async visitComparisonOperator(val: ComparisonOperator, arg: RoleCriteriaLevel1): Promise<void> {

        const roleCriteriaValue: RoleCriteriaLevel1 = {
            operation: comparisonOperationMapper(val.operation),
        };

        await val.value.accept(this, roleCriteriaValue);
        await val.attribute.accept(this, roleCriteriaValue);

        if (arg !== undefined) {
            arg.children.push(roleCriteriaValue);
        } else {
            this.root = roleCriteriaValue;
        }
    }

    async visitLogicalOperator(val: LogicalOperator, arg: RoleCriteriaLevel1): Promise<void> {
        const roleCriteriaValue: RoleCriteriaLevel1 = {
            operation: val.operation,
            children: []
        };
        for (const x of val.children) {
            await x.accept(this, roleCriteriaValue);
        }

        if (arg !== undefined) {
            arg.children.push(roleCriteriaValue);
        } else {
            this.root = roleCriteriaValue;
        }
    }

}