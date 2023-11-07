import { RoleCriteriaKeyType } from "sailpoint-api-client";
import { ParseException } from "../errors";
import { Attribute, ComparisonOperation, ComparisonOperator, Expression, Literal, LogicalOperation, LogicalOperator, isComparisonOperation, isLogicalOperation } from "./ast";
import { END_OF_STRING, StringIterator, isSpace } from "./stringIterator";

export class Parser {

    public parse(str: string): Expression {
        const stringIterator = new StringIterator(str.trim());
        let current = stringIterator.current;
        const children: Expression[] = [];
        let operator: LogicalOperation | undefined;

        while (current !== END_OF_STRING) {

            if (current === '(') {
                stringIterator.advance(); // skip '('
                const expStr = stringIterator.moveTo('\\)');
                children.push(this.parse(expStr.trim()));
            } else if (!isSpace(current)) {
                const token = stringIterator.readToken();

                if (isLogicalOperation(token)) {
                    operator = token.toLowerCase() === "and" ? "AND" : "OR";
                } else if (token.toLowerCase() === "identity") {
                    children.push(this.parseIdentityCriteria(stringIterator));
                } else {
                    children.push(this.parseSourceBasedCriteria(stringIterator, token));
                }

            }
            current = stringIterator.advance();
        }

        if (children.length === 0) {
            throw new ParseException("No valid expression found");
        }

        if (children.length === 1) {
            return children[0];
        }

        if (operator === undefined) {
            throw new ParseException("No valid expression found");
        }

        return new LogicalOperator(
            operator,
            children
        );
    }

    private parseSourceBasedCriteria(stringIterator: StringIterator, sourceName: string): Expression {
        this.checkDot(stringIterator);

        const what = stringIterator.readToken();
        let type: RoleCriteriaKeyType;
        if ("attribute" === what?.toLowerCase()) {
            type = RoleCriteriaKeyType.Account;
        } else if ("entitlement" === what?.toLowerCase()) {
            type = RoleCriteriaKeyType.Entitlement;
        } else {
            throw new ParseException("Was expection either attribute or entitlement");
        }

        this.checkDot(stringIterator);
        const attributeName = stringIterator.readToken();

        const op = this.parseComparisonOperation(stringIterator);

        const value = this.parseLiteral(stringIterator);
        
        return new ComparisonOperator(
            op,
            Attribute.fromSourceBased(sourceName, type, attributeName),
            value
        );
    }

    /**
     * Next character should be a dot
     */
    private checkDot(stringIterator: StringIterator) {
        const tmpChar = stringIterator.current;
        // checking we have a '.'. The expected format is identity.attributeName
        if ("." !== tmpChar) {
            throw new ParseException(`Invalid charater ${tmpChar}. Expecting '.'`);
        }
        stringIterator.advance(); // skip '.'
    }

    private parseIdentityCriteria(stringIterator: StringIterator): Expression {
        this.checkDot(stringIterator);

        const identityAttribute = stringIterator.readToken();
        const op = this.parseComparisonOperation(stringIterator);
        const value = this.parseLiteral(stringIterator);
        return new ComparisonOperator(
            op,
            Attribute.fromIdentityAttribute(identityAttribute),
            value
        );
    }

    private parseComparisonOperation(stringIterator: StringIterator): ComparisonOperation {
        const opStr = stringIterator.readToken();
        if (!isComparisonOperation(opStr)) {
            throw new ParseException("Invalid operator :" + opStr);

        }
        return opStr as ComparisonOperation;
    }

    private parseLiteral(stringIterator: StringIterator): Literal {
        const value = stringIterator.readToken();
        return new Literal(value);
    }
}