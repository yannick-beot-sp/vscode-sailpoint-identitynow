import { RoleCriteriaKeyType } from "sailpoint-api-client";

export interface Visitor<T> {
    visitComparisonOperator(val: ComparisonOperator, arg: T): void | Promise<void>;
    visitLogicalOperator(val: LogicalOperator, arg: T): void | Promise<void>;
    visitExpression(val: Expression, arg: T): void | Promise<void>;
    visitAttribute(val: Attribute, arg: T): void | Promise<void>;
    visitLiteral(val: Literal, arg: T): void | Promise<void>;
}

export interface Expression {
    accept<T>(v: Visitor<T>, arg: T): void | Promise<void>;
}

export class Attribute implements Expression {

    sourceName: string;
    property: string;
    type: RoleCriteriaKeyType;
    private constructor() { }

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
        cls.sourceName = sourceName;
        return cls;
    }

    public async accept<T>(v: Visitor<T>, arg: T): Promise<void> {
        await v.visitAttribute(this, arg);
    }

}

export class Literal implements Expression {
    constructor(public readonly value: string) {
    }

    public async accept<T>(v: Visitor<T>, arg: T): Promise<void> {
        await v.visitLiteral(this, arg);
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

    public async accept<T>(v: Visitor<T>, arg: T) {
        await v.visitLogicalOperator(this, arg);
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

    public async accept<T>(v: Visitor<T>, arg: T) {
        await v.visitComparisonOperator(this, arg);
    }
}
