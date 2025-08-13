import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { Parser } from '../../parser/parser';
import { Attribute, ComparisonOperator, Expression, Literal, LogicalOperator } from '../../parser/ast';
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

        const tests: ParameterizedTest[] = [
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
        const tests: ParameterizedTest[] = [
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
            },
            {
                should: "Mix between AND and OR",
                input: "identity.department EQ 'Accounting' and 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\" or 'Active Directory'.attribute.departmentNumber eq \"1234\"",
            },
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

        const tests: ParameterizedTest[] = [
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

    describe('Account Attribute Membership Criteria with new operator', () => {
        const expected = new ComparisonOperator(
            "gt",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Account,
                "departmentNumber"),
            new Literal("1234")
        );
        const expected2 = new ComparisonOperator(
            "ge",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Account,
                "departmentNumber"),
            new Literal("1234")
        );
        const expected3 = new ComparisonOperator(
            "lt",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Account,
                "departmentNumber"),
            new Literal("1234")
        );
        const expected4 = new ComparisonOperator(
            "le",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Account,
                "departmentNumber"),
            new Literal("1234")
        );
        const expected5 = new ComparisonOperator(
            "nc",
            Attribute.fromSourceBased(
                "Active Directory",
                RoleCriteriaKeyType.Account,
                "departmentNumber"),
            new Literal("1234")
        );

        const tests: ParameterizedTest[] = [
            {
                should: "should parse an account attribute gt",
                input: "'Active Directory'.attribute.departmentNumber gt \"1234\"",
                expected
            },
            {
                should: "should parse an account attribute without quotes ge",
                input: "'Active Directory'.attribute.departmentNumber ge 1234",
                expected: expected2
            },
            {
                should: "should parse an account attribute lt",
                input: "'Active Directory'.attribute.departmentNumber lt \"1234\"",
                expected: expected3
            },
            {
                should: "should parse an account attribute without quotes le",
                input: "'Active Directory'.attribute.departmentNumber le 1234",
                expected: expected4
            },
            {
                should: "should parse an account attribute without quotes nc",
                input: "'Active Directory'.attribute.departmentNumber nc '1234'",
                expected: expected5
            },
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


        const tests: ParameterizedTest[] = [
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

    describe('Complex expression Membership Criteria', () => {

        const expected = new LogicalOperator(
            "AND", [
            new ComparisonOperator(
                "eq",
                Attribute.fromIdentityAttribute("department"),
                new Literal("Accounting")
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Entitlement,
                    "memberOf"),
                new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
            )
        ]
        );

        const expected2 = new LogicalOperator(
            "OR", [
            new ComparisonOperator(
                "eq",
                Attribute.fromIdentityAttribute("department"),
                new Literal("Accounting")
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Entitlement,
                    "memberOf"),
                new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
            )
        ]
        );

        const expected3 = new LogicalOperator(
            "AND", [
            new ComparisonOperator(
                "eq",
                Attribute.fromIdentityAttribute("department"),
                new Literal("Accounting")
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Entitlement,
                    "memberOf"),
                new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Account,
                    "departmentNumber"),
                new Literal("1234")
            )
        ]
        );

        const expected4 = new LogicalOperator(
            "OR", [
            new LogicalOperator(
                "AND", [
                new ComparisonOperator(
                    "eq",
                    Attribute.fromIdentityAttribute("department"),
                    new Literal("Accounting")
                ),
                new ComparisonOperator(
                    "eq",
                    Attribute.fromSourceBased(
                        "Active Directory",
                        RoleCriteriaKeyType.Entitlement,
                        "memberOf"),
                    new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
                )
            ]),
            new ComparisonOperator(
                "eq",
                Attribute.fromIdentityAttribute("department"),
                new Literal("Customer Service")
            )
        ]);

        const tests: ParameterizedTest[] = [
            {
                should: "should parse a complex expression with parentheses",
                input: "(identity.department eq 'Accounting') and ('Active Directory'.entitlement.memberOf eq \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\")",
                expected
            },
            {
                should: "should parse a complex expression without parentheses",
                input: "identity.department eq 'Accounting' and 'Active Directory'.entitlement.memberOf eq \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\"",
                expected
            },
            {
                should: "should parse a complex OR expression uppercase operators",
                input: "identity.department EQ Accounting OR 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\"",
                expected: expected2
            },
            {
                should: "should parse multiple ANDs",
                input: "identity.department EQ 'Accounting' and 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\" and 'Active Directory'.attribute.departmentNumber eq \"1234\"",
                expected: expected3
            },
            {
                should: "should parse nested complex expression",
                input: "(identity.department EQ 'Accounting' and 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\") or identity.department EQ 'Customer Service' ",
                expected: expected4
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = parser.parse(t.input);
                assert.deepEqual(result, t.expected);
            });
        });
    });

    describe('Identity Attribute Membership Criteria with in operator', () => {
        const expected = new ComparisonOperator(
            "in",
            Attribute.fromIdentityAttribute("department"),
            new Literal("Accounting")
        );
        const expected2 = new ComparisonOperator(
            "in",
            Attribute.fromIdentityAttribute("department"),
            new Literal(["Accounting", "IT"])
        );

        const tests: ParameterizedTest[] = [
            {
                should: "should parse an identity attribute",
                input: "identity.department in (\"Accounting\")",
                expected
            },
            {
                should: "should parse an identity attribute without quotes",
                input: "identity.department in (Accounting)",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses",
                input: "(identity.department in (Accounting))",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses and space",
                input: "( identity.department in (Accounting) )",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses and 1 space and the end",
                input: "(identity.department in (Accounting) ) ",
                expected
            },
            {
                should: "should parse an identity attribute with parentheses and spaces before parenthesis",
                input: "(identity.department in ( Accounting ) ) ",
                expected
            },
            {
                should: "should parse an identity attribute with 2 values",
                input: "identity.department in (\"Accounting\",\"IT\")",
                expected: expected2
            },
            {
                should: "should parse an identity attribute without quotes",
                input: "identity.department in (Accounting, IT)",
                expected: expected2

            },
            {
                should: "should parse an identity attribute with parentheses",
                input: "(identity.department in (Accounting,IT))",
                expected: expected2
            },
            {
                should: "should parse an identity attribute with parentheses and space and single quote",
                input: "( identity.department in ('Accounting', 'IT') )",
                expected: expected2
            },
            {
                should: "should parse an identity attribute with parentheses and 1 space and the end",
                input: "(identity.department in (Accounting, IT) ) ",
                expected: expected2
            },
            {
                should: "should parse an identity attribute with parentheses and spaces before parenthesis",
                input: "(identity.department in ( Accounting, \"IT\" ) ) ",
                expected: expected2
            },
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = parser.parse(t.input);
                assert.deepStrictEqual(result, t.expected);
            });
        });
    });

    describe('Complex expression Membership Criteria with in operator', () => {

        const expected = new LogicalOperator(
            "AND", [
            new ComparisonOperator(
                "in",
                Attribute.fromIdentityAttribute("department"),
                new Literal(["Accounting", "IT"])
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Entitlement,
                    "memberOf"),
                new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
            )
        ]
        );

        const expected2 = new LogicalOperator(
            "OR", [
            new ComparisonOperator(
                "in",
                Attribute.fromIdentityAttribute("department"),
                new Literal(["Accounting", "IT"])
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Entitlement,
                    "memberOf"),
                new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
            )
        ]
        );

        const expected3 = new LogicalOperator(
            "AND", [
            new ComparisonOperator(
                "in",
                Attribute.fromIdentityAttribute("department"),
                new Literal(["Accounting", "IT"])
            ),
            new ComparisonOperator(
                "eq",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Entitlement,
                    "memberOf"),
                new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
            ),
            new ComparisonOperator(
                "in",
                Attribute.fromSourceBased(
                    "Active Directory",
                    RoleCriteriaKeyType.Account,
                    "departmentNumber"),
                new Literal(["1234", "4567"])
            )
        ]
        );

        const expected4 = new LogicalOperator(
            "OR", [
            new LogicalOperator(
                "AND", [
                new ComparisonOperator(
                    "in",
                    Attribute.fromIdentityAttribute("department"),
                    new Literal(["Accounting", "IT"])
                ),
                new ComparisonOperator(
                    "eq",
                    Attribute.fromSourceBased(
                        "Active Directory",
                        RoleCriteriaKeyType.Entitlement,
                        "memberOf"),
                    new Literal("CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com")
                )
            ]),
            new ComparisonOperator(
                "eq",
                Attribute.fromIdentityAttribute("department"),
                new Literal("Customer Service")
            )
        ]);

        const tests: ParameterizedTest[] = [
            {
                should: "should parse a complex expression with parentheses",
                input: "(identity.department in ('Accounting','IT')) and ('Active Directory'.entitlement.memberOf eq \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\")",
                expected
            },
            {
                should: "should parse a complex expression without parentheses",
                input: "identity.department in ('Accounting','IT') and 'Active Directory'.entitlement.memberOf eq \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\"",
                expected
            },
            {
                should: "should parse a complex OR expression uppercase operators",
                input: "identity.department in ('Accounting','IT') OR 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\"",
                expected: expected2
            },
            {
                should: "should parse multiple ANDs",
                input: "identity.department IN ('Accounting','IT') and 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\" and 'Active Directory'.attribute.departmentNumber in (\"1234\",4567)",
                expected: expected3
            },
            {
                should: "should parse nested complex expression",
                input: "(identity.department in ('Accounting','IT') and 'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\") or identity.department EQ 'Customer Service' ",
                expected: expected4
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
