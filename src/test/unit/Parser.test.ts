import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { Parser } from '../../parser/parser';
import { Attribute, ComparisonOperator, Expression, Literal } from '../../parser/ast';
import { RoleCriteriaKeyType } from 'sailpoint-api-client';


interface ParameterizedTest { should: string, input: string, expected?: Expression };

suite('Parser Test Suite', () => {
    const parser = new Parser();
    describe('Identity Attribute Membership Criteria', () => {
        const expected = new ComparisonOperator(
            "eq",
            Attribute.fromIdentityAttribute("department"),
            new Literal("Accounting")
        );
        const expected2 = new ComparisonOperator(
            "ne",
            Attribute.fromIdentityAttribute("department"),
            new Literal("Customer Service")
        );

        const tests:ParameterizedTest [] = [
            {
                should: "should parse an identity attribute",
                input: "identity.department eq \"Accounting\"",
                expected
            },
            {
                should: "should parse an identity attribute without quotes",
                input: "identity.department eq Accounting",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses",
                input: "(identity.department eq Accounting)",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses and space",
                input: "( identity.department eq Accounting )",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses and 1 space and the end",
                input: "(identity.department eq Accounting ) ",
                expected
            },
            {
                should: "should parse an identity attribute with space in value",
                input: "identity.department ne 'Customer Service' ",
                expected: expected2
            },
            {
                should: "should parse an identity attribute with space in value and double quotes",
                input: "identity.department ne \"Customer Service\"",
                expected: expected2
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = parser.parse(t.input);
                assert.deepEqual(result, t.expected);
            });
        });
    });

    describe('Invalid Identity expression', () => {
        const tests:ParameterizedTest [] = [
            {
                should: "No matching parenthese",
                input: "(identity.department eq \"Accounting\"",
                
            },
            {
                should: "No matching quote",
                input: "identity.department eq \"Accounting",
                
            },
            {
                should: "No identity attribute ",
                input: "identity eq Accounting",
            },
            {
                should: "Dot but no identity attribute ",
                input: "identity eq Accounting",
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it("should throw an exception as " + t.should, () => {
                assert.throws(
                    () => parser.parse(t.input)
                );

                
            });
        });
    });

    describe('Account Attribute Membership Criteria', () => {
        const expected = new ComparisonOperator(
            "eq",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Account,
                "departmentNumber"),
            new Literal("1234")
        );
        const expected2 = new ComparisonOperator(
            "sw",
            Attribute.fromSourceBased(
                "PRISM",
                RoleCriteriaKeyType.Account,
                "status"),
            new Literal("true")
        );

        const tests:ParameterizedTest [] = [
            {
                should: "should parse an account attribute",
                input: "'Active Directory'.attribute.departmentNumber eq \"1234\"",
                expected
            },
            {
                should: "should parse an account attribute without quotes",
                input: "'Active Directory'.attribute.departmentNumber eq 1234",
                expected
            },
            {
                should: "should parse an account attribute with source without quotes",
                input: "PRISM.attribute.status sw true",
                expected: expected2
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = parser.parse(t.input);
                assert.deepEqual(result, t.expected);
            });
        });
    });

    describe('Entitlement Membership Criteria', () => {
        const expected = new ComparisonOperator(
            "eq",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Entitlement,
                "memberOf"),
            new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
        );

        
        const tests:ParameterizedTest [] = [
            {
                should: "should parse an account attribute",
                input: "'Active Directory'.entitlement.memberOf eq \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\"",
                expected
            },
            {
                should: "should parse an account attribute with single-quoted value",
                input: "'Active Directory'.entitlement.memberOf eq 'CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com'",
                expected
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = parser.parse(t.input);
                assert.deepEqual(result, t.expected);
            });
        });
    });
});
