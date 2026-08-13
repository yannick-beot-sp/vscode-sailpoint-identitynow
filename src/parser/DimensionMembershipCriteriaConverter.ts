import { DimensionCriteriaKeyTypeV2025, DimensionCriteriaLevel1V2025, DimensionCriteriaOperationV2025, RoleCriteriaKeyType } from "sailpoint-api-client";
import { ParseException } from "../errors";
import { ComparisonOperator, Expression, LogicalOperator } from "./ast";
import { Parser } from "./parser";

/**
 * The Dimension API accepts more nesting levels than what DimensionCriteriaLevel1/2/3V2025
 * describe (an "or" group of values nested inside an "and" of attributes needs 4 levels),
 * so a local, self-referential type is used while building the tree and only cast to
 * DimensionCriteriaLevel1V2025 once fully built.
 */
export interface DimensionCriteriaKey {
    type: DimensionCriteriaKeyTypeV2025;
    property: string;
    sourceId: null;
}

export interface DimensionCriteriaNode {
    operation: DimensionCriteriaOperationV2025;
    key: DimensionCriteriaKey | null;
    stringValue: string | null;
    children: DimensionCriteriaNode[] | null;
}

const SUPPORTED_OPERATIONS = new Set(["eq", "in"]);

/**
 * Converts a membership criteria expression (same grammar as the one used for role
 * membership criteria) into the JSON criteria tree expected by the Dimension API.
 *
 * Dimension membership criteria only supports identity attributes compared with
 * "eq"/"in", combined with "and" across attributes and "or"/"in" for multiple values
 * of the same attribute. The resulting tree always uses the fixed envelope observed
 * from the ISC UI: 2 nested "and" nodes wrapping either plain "equals" leaves or "or"
 * groups of "equals" leaves.
 */
export class DimensionMembershipCriteriaConverter {

    private readonly parser = new Parser();

    public convert(input: string): DimensionCriteriaLevel1V2025 {
        const expression = this.parser.parse(input);
        const clauses = this.toClauses(expression);

        const inner: DimensionCriteriaNode = {
            operation: "AND",
            key: null,
            stringValue: "",
            children: clauses
        };

        const root: DimensionCriteriaNode = {
            operation: "AND",
            key: null,
            stringValue: "",
            children: [inner]
        };

        return root as unknown as DimensionCriteriaLevel1V2025;
    }

    /**
     * Flattens a (possibly nested) "and" expression into the list of clauses that
     * become the direct children of the "and" node under the criteria root.
     */
    private toClauses(expression: Expression): DimensionCriteriaNode[] {
        if (expression instanceof LogicalOperator && expression.operation === "AND") {
            return expression.children.flatMap(child => this.toClauses(child));
        }
        return [this.toClause(expression)];
    }

    private toClause(expression: Expression): DimensionCriteriaNode {
        if (expression instanceof ComparisonOperator) {
            return this.toLeafOrGroup(expression);
        }
        if (expression instanceof LogicalOperator && expression.operation === "OR") {
            const leaves = expression.children.flatMap(child => this.toLeaves(child));
            return leaves.length === 1 ? leaves[0] : this.toOrGroup(leaves);
        }
        throw new ParseException("Dimension membership criteria only supports a list of criteria combined with 'and', where each criterion is a single comparison or an 'or' of comparisons.");
    }

    private toLeaves(expression: Expression): DimensionCriteriaNode[] {
        if (expression instanceof ComparisonOperator) {
            return this.toLeafNodes(expression);
        }
        if (expression instanceof LogicalOperator && expression.operation === "OR") {
            return expression.children.flatMap(child => this.toLeaves(child));
        }
        throw new ParseException("Dimension membership criteria does not support an 'and' expression nested inside an 'or' group.");
    }

    private toLeafOrGroup(comparison: ComparisonOperator): DimensionCriteriaNode {
        const leaves = this.toLeafNodes(comparison);
        return leaves.length === 1 ? leaves[0] : this.toOrGroup(leaves);
    }

    private toOrGroup(leaves: DimensionCriteriaNode[]): DimensionCriteriaNode {
        return {
            operation: "OR",
            key: null,
            stringValue: null,
            children: leaves
        };
    }

    private toLeafNodes(comparison: ComparisonOperator): DimensionCriteriaNode[] {
        if (comparison.attribute.type !== RoleCriteriaKeyType.Identity) {
            const attributeName = comparison.attribute.sourceName
                ? `${comparison.attribute.sourceName}.${comparison.attribute.property}`
                : comparison.attribute.property;
            throw new ParseException(`Dimension membership criteria only supports identity attributes. '${attributeName}' is not an identity attribute.`);
        }
        if (!SUPPORTED_OPERATIONS.has(comparison.operation)) {
            throw new ParseException(`Unsupported operator '${comparison.operation}' for dimension membership criteria. Only 'eq' and 'in' are supported.`);
        }

        const key: DimensionCriteriaKey = {
            type: "IDENTITY",
            property: `attribute.${comparison.attribute.property}`,
            sourceId: null
        };

        const values = comparison.value.values as string[];

        return values.map(value => ({
            operation: "EQUALS",
            key,
            stringValue: value,
            children: null
        }));
    }
}
