import { RoleCriteriaKeyType } from "sailpoint-api-client";

export interface Expression {

}

export class Attribute {

    private constructor() { }

    sourceName: string;
    property: string;
    type: RoleCriteriaKeyType;

    public static fromIdentityAttribute(identityAttribute: string): Attribute {
        const cls = new Attribute();
        cls.type = "IDENTITY";
        cls.property = identityAttribute;
        return cls;
    }
    public static fromSourceBased(sourceName: string, type: RoleCriteriaKeyType, property: string): Attribute {
        const cls = new Attribute();
        cls.type = type;
        cls.property = property;
        return cls;
    }

}

export class Literal {
    constructor(public readonly value: string) {
    }
}

export type LogicalOperation = "AND" | "OR";

export function isLogicalOperation(input: string) {
    return /^(and|or)$/i.test(input);
}


export class LogicalOperator implements Expression {
    constructor(
        public readonly operation: LogicalOperation,
        public readonly children: Expression[]) {
    }
}

export type ComparisonOperation = "eq" | "ne" | "co" | "sw" | "ew";

export function isComparisonOperation(input: string) {
    return /^(eq|ne|co|sw|ew)$/i.test(input);
}

export class ComparisonOperator implements Expression {
    constructor(
        public readonly operation: ComparisonOperation,
        public readonly attribute: Attribute,
        public readonly value: Literal) {

    }


}