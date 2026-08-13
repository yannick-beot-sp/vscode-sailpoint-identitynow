import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { Parser } from '../../parser/parser';
import { Attribute, ComparisonOperator, Expression, Literal } from '../../parser/ast';
import { RoleCriteriaLevel1 } from 'sailpoint-api-client';
import { CacheService } from '../../services/cache/CacheService';
import { RoleMembershipSelectorConverter } from '../../parser/RoleMembershipSelectorConverter';


class MockupCache extends CacheService<string> {

    constructor() {
        super((key: string) => {
            if ("Active Directory" === key) { return "6ba6925ebc1a4e5d98ca6fd3fc542ea4"; }
            throw new Error("Invalid source name: " + key);
        });
    }

}

interface ParameterizedTest<I, E> { should: string, input: I, expected?: E };

const parser = new Parser();


function runExpressionTests(tests: ParameterizedTest<Expression, RoleCriteriaLevel1>[]) {
    tests.forEach((t: ParameterizedTest<Expression, RoleCriteriaLevel1>) => {
        it("should " + t.should, async () => {
            const converter = new RoleMembershipSelectorConverter(new MockupCache());
            await converter.visitExpression(t.input, undefined);
            assert.deepEqual(converter.root, t.expected);
        });
    });
}
function runParseTests(tests: ParameterizedTest<string, RoleCriteriaLevel1>[]) {
    tests.forEach((t: ParameterizedTest<string, RoleCriteriaLevel1>) => {
        it("should " + t.should, async () => {
            const converter = new RoleMembershipSelectorConverter(new MockupCache());
            const expression = parser.parse(t.input);
            await converter.visitExpression(expression, undefined);
            assert.deepEqual(converter.root, t.expected);
        });
    });
}

suite('RoleMembershipSelectorConverter Test Suite', () => {

    describe('1 level conversion', async () => {

        const expectedComparisonOperator: RoleCriteriaLevel1 = {
            "operation": "OR",
            "children": [
                {
                    "operation": "EQUALS",
                    "key": {
                        "type": "IDENTITY",
                        "property": "attribute.department",
                        sourceId: undefined
                    },
                    // @ts-ignore
                    "values": ["Customer Service"]
                }
            ]
        };

        const expressionTests: ParameterizedTest<Expression, RoleCriteriaLevel1>[] = [
            {
                should: "parse a ComparisonOperator",
                input: new ComparisonOperator(
                    "eq",
                    Attribute.fromIdentityAttribute("department"),
                    new Literal("Customer Service")
                ),
                expected: expectedComparisonOperator
            },
        ]
        runExpressionTests(expressionTests)

        const parseTests: ParameterizedTest<string, RoleCriteriaLevel1>[] = [
            {
                should: "parse an expression and convert it",
                input: "identity.department eq 'Customer Service'",
                expected: expectedComparisonOperator
            }
        ]

        runParseTests(parseTests)

    });

    describe('2 level conversion', async () => {
        const parseTests: ParameterizedTest<string, RoleCriteriaLevel1>[] = [
            {
                should: "should parse an expression with 2 comparisons and convert it",
                input: "identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active'",
                expected: {
                    "operation": "OR",
                    "children": [{
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.department",
                                    sourceId: undefined
                                },
                                // @ts-ignore
                                "values": ["Customer Service"]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                // @ts-ignore
                                "values": ["active"],
                            },
                        ]
                    }]
                }
            }, {
                should: "parse an expression with 2 non-identity and convert it",
                input: "'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\" and 'Active Directory'.attribute.departmentNumber eq \"1234\"",
                expected: {
                    "operation": "OR",
                    "children": [{
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "ENTITLEMENT",
                                    "property": "attribute.memberOf",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                //@ts-ignore
                                "values": [
                                    "CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com"
                                ]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "ACCOUNT",
                                    "property": "attribute.departmentNumber",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                //@ts-ignore
                                "values": [
                                    "1234",
                                ]
                            },
                        ]
                    }]
                }
            },{
                should: "parse an expression with new operators and convert it",
                input: "'Active Directory'.entitlement.memberOf sw 'CN=Accounting' and 'Active Directory'.attribute.departmentNumber gt \"1234\"",
                expected: {
                    "operation": "OR",
                    "children": [{
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "STARTS_WITH",
                                "key": {
                                    "type": "ENTITLEMENT",
                                    "property": "attribute.memberOf",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                //@ts-ignore
                                "values": [
                                    "CN=Accounting"
                                ]
                            },
                            {
                                //@ts-ignore
                                "operation": "GREATER_THAN",
                                "key": {
                                    "type": "ACCOUNT",
                                    "property": "attribute.departmentNumber",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                //@ts-ignore
                                "values": [
                                    "1234",
                                ]
                            },
                        ]
                    }]
                }
            }
        ]

        runParseTests(parseTests)

    });

    describe('3 level conversion', async () => {

        const parseTests: ParameterizedTest<string, RoleCriteriaLevel1>[] = [{
            should: "parse an expression and convert it",
            input: "(identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active') OR (identity.cloudLifecycleState eq 'active' AND identity.jobTitle co 'Accounts Payable Analyst')",
            expected: {
                "operation": "OR",
                "children": [
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.department",
                                    sourceId: undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "Customer Service"
                                ]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "active"
                                ]
                            },
                        ]
                    },
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "active"
                                ]
                            },
                            {
                                "operation": "CONTAINS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.jobTitle",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "Accounts Payable Analyst"
                                ]
                            }
                        ]
                    }
                ]
            }
        }]
        runParseTests(parseTests)


    });

    describe('unbalanced level conversion', async () => {
        const parseTests: ParameterizedTest<string, RoleCriteriaLevel1>[] = [{
            should: "parse an expression and convert it with parenthesis",
            input: "('Active Directory'.entitlement.ProfileId eq '00e1i000000eM2qAAE') or (identity.cloudLifecycleState eq 'active' and identity.usertype eq 'External')",
            expected: {
                "operation": "OR",
                "children": [
                    {
                        "operation": "EQUALS",
                        "key": {
                            "type": "ENTITLEMENT",
                            "property": "attribute.ProfileId",
                            "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                        },
                        //@ts-ignore
                        "values": [
                            "00e1i000000eM2qAAE"
                        ]
                    },
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "active"
                                ]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.usertype",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "External"
                                ]
                            }
                        ]
                    }
                ]
            }
        },{
            should: "parse an expression with in operator and convert it with parenthesis",
            input: "('Active Directory'.entitlement.ProfileId eq '00e1i000000eM2qAAE') or (identity.cloudLifecycleState in ('active',\"pre hire\") and identity.usertype eq 'External')",
            expected: {
                "operation": "OR",
                "children": [
                    {
                        "operation": "EQUALS",
                        "key": {
                            "type": "ENTITLEMENT",
                            "property": "attribute.ProfileId",
                            "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                        },
                        //@ts-ignore
                        "values": [
                            "00e1i000000eM2qAAE"
                        ]
                    },
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "active",
                                    "pre hire"
                                ]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.usertype",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "External"
                                ]
                            }
                        ]
                    }
                ]
            }
        }, {
            should: "parse an expression and convert it without parenthesis",
            input: "'Active Directory'.entitlement.ProfileId eq '00e1i000000eM2qAAE' or (identity.cloudLifecycleState eq 'active' and identity.usertype eq 'External')",
            expected: {
                "operation": "OR",
                "children": [
                    {
                        "operation": "EQUALS",
                        "key": {
                            "type": "ENTITLEMENT",
                            "property": "attribute.ProfileId",
                            "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                        },
                        //@ts-ignore
                        "values": [
                            "00e1i000000eM2qAAE"
                        ]
                    },
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "active"
                                ]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.usertype",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "External"
                                ]
                            }
                        ]
                    }
                ]
            }
        },{
            should: "parse an expression with in operator and convert it without parenthesis",
            input: "'Active Directory'.entitlement.ProfileId eq '00e1i000000eM2qAAE' or (identity.cloudLifecycleState in ('active',prehire) and identity.usertype eq 'External')",
            expected: {
                "operation": "OR",
                "children": [
                    {
                        "operation": "EQUALS",
                        "key": {
                            "type": "ENTITLEMENT",
                            "property": "attribute.ProfileId",
                            "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                        },
                        //@ts-ignore
                        "values": [
                            "00e1i000000eM2qAAE"
                        ]
                    },
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "active",
                                    "prehire"
                                ]
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.usertype",
                                    "sourceId": undefined
                                },
                                //@ts-ignore
                                "values": [
                                    "External"
                                ]
                            }
                        ]
                    }
                ]
            }
        }]
        runParseTests(parseTests)
    });

});
