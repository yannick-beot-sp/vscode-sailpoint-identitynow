import { RoleCriteriaKeyType } from "sailpoint-api-client";
import { ParseException } from "../errors";
import { Attribute, ComparisonOperation, ComparisonOperator, Expression, Literal, LogicalOperation, LogicalOperator, isComparisonOperation, isLogicalOperation } from "./ast";
import { END_OF_STRING, StringIterator, isSpace } from "./stringIterator";
import { isNotEmpty } from "../utils/stringUtils";
import { parse as parseSync } from 'csv-parse/sync';

export class Parser {

    public parse(str: string): Expression {
        const stringIterator = new StringIterator(str.trim());
        let current = stringIterator.current;
        const children: Expression[] = [];
        let operator: LogicalOperation | undefined;

        while (current !== END_OF_STRING) {

            if (current === '(') {
                stringIterator.advance(); // skip '('
                const expStr = stringIterator.moveToClosingParenthesis();
                children.push(this.parse(expStr.trim()));
            } else if (!isSpace(current)) {
                const token = stringIterator.readToken();

                if (isLogicalOperation(token)) {
                    const currentOperator = token.toLowerCase() === "and" ? "AND" : "OR";
                    if (operator !== undefined && operator !== currentOperator) {
                        throw new ParseException("All operators should be either \"and\" or \"or\"");
                    }
                    operator = currentOperator;

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
     * Next character should be a dot and skip it
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
        let op = this.parseComparisonOperation(stringIterator);
        const value = this.parseLiteral(stringIterator);
        return new ComparisonOperator(
            op,
            Attribute.fromIdentityAttribute(identityAttribute),
            value
        );
    }

    private parseComparisonOperation(stringIterator: StringIterator): ComparisonOperation {
        const opStr = stringIterator.readToken().toLowerCase();
        if (!isComparisonOperation(opStr)) {
            throw new ParseException("Invalid operator :" + opStr);

        }
        return opStr as ComparisonOperation;
    }

    private parseLiteral(stringIterator: StringIterator): Literal {
        let value = stringIterator.readToken();
        // Used with operation ("in")
        if (isNotEmpty(value)) {
            return new Literal(value);
        }
        if (stringIterator.current !== "(") {
            throw new ParseException(`Invalid charater ${stringIterator.current}. Expecting '('`);
        }
        stringIterator.advance()
        const valuesStr = stringIterator.moveToClosingParenthesis()
        const values = this.parseCSVString(valuesStr);
        return new Literal(values);
    }
    private parseCSVString(input: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar: string | null = null;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (!inQuotes) {
                // Not inside quotes
                if (char === '"' || char === "'") {
                    // Start of quoted value
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === ',') {
                    // End of current value
                    result.push(current.trim());
                    current = '';
                } else {
                    // Regular character
                    current += char;
                }
            } else {
                // Inside quotes
                if (char === quoteChar) {
                    // Check for escaped quote (double quote)
                    if (i + 1 < input.length && input[i + 1] === quoteChar) {
                        // Escaped quote - add one quote to current and skip next
                        current += char;
                        i++; // Skip the next quote
                    } else {
                        // End of quoted value
                        inQuotes = false;
                        quoteChar = null;
                    }
                } else {
                    // Regular character inside quotes
                    current += char;
                }
            }
        }

        // Add the last value
        result.push(current.trim());

        return result;
    }


}