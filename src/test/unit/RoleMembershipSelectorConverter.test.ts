import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { Parser } from '../../parser/parser';
import { Attribute, ComparisonOperator, Literal } from '../../parser/ast';
import { RoleCriteriaLevel1 } from 'sailpoint-api-client';
import { CacheService } from '../../services/cache/CacheService';
import { RoleMembershipSelectorConverter } from '../../parser/RoleMembershipSelectorConverter';


class MockupCache extends CacheService<string>{

    constructor() {
        super((key: string) => {
            if ("Active Directory" === key) { return "6ba6925ebc1a4e5d98ca6fd3fc542ea4"; }
            throw new Error("Invalid source name: " + key);
        });
    }

}

suite('RoleMembershipSelectorConverter Test Suite', () => {
    const parser = new Parser();
    describe('1 level conversion', async () => {

        const expectedComparisonOperator: RoleCriteriaLevel1 = {
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
                            "stringValue": "Customer Service"
                        }
                    ]
                }
            ]
        };

        it("should parse a ComparisonOperator", async () => {
            const converter = new RoleMembershipSelectorConverter(new MockupCache());

            const expression = new ComparisonOperator(
                "eq",
                Attribute.fromIdentityAttribute("department"),
                new Literal("Customer Service")
            );


            await converter.visitExpression(expression, undefined);

            assert.deepEqual(converter.root, expectedComparisonOperator);
        });

        it("should parse an expression and convert it", async () => {
            const converter = new RoleMembershipSelectorConverter(new MockupCache());

            const expression = parser.parse("identity.department eq 'Customer Service'");

            await converter.visitExpression(expression, undefined);

            assert.deepEqual(converter.root, expectedComparisonOperator);
        });
    });
    describe('2 level conversion', async () => {
        it("should parse an expression with 2 comparisons and convert it", async () => {
            const expectedComparisonOperator2: RoleCriteriaLevel1 = {
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
                                "stringValue": "Customer Service"
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                "stringValue": "active",
                            },
                        ]
                    }
                ]
            };

            const converter = new RoleMembershipSelectorConverter(new MockupCache());

            const expression = parser.parse("identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active'");

            await converter.visitExpression(expression, undefined);

            assert.deepEqual(converter.root, expectedComparisonOperator2);
        });
        it("should parse an expression with 2 non-identity and convert it", async () => {
            const expectedComparisonOperator3: RoleCriteriaLevel1 = {
                "operation": "OR",
                "children": [
                    {
                        "operation": "AND",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "ENTITLEMENT",
                                    "property": "attribute.memberOf",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                "stringValue": "CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com",
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "ACCOUNT",
                                    "property": "attribute.departmentNumber",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                "stringValue": "1234",
                            },
                        ]
                    }
                ]
            }

            const converter = new RoleMembershipSelectorConverter(new MockupCache());

            const expression = parser.parse("'Active Directory'.entitlement.memberOf EQ \"CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com\" and 'Active Directory'.attribute.departmentNumber eq \"1234\"");

            await converter.visitExpression(expression, undefined);

            assert.deepEqual(converter.root, expectedComparisonOperator3);
        });
    });

    describe('3 level conversion', async () => {
        it("should parse an expression and convert it", async () => {
            const expectedComparisonOperator2: RoleCriteriaLevel1 = {
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
                                "stringValue": "Customer Service"
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": undefined
                                },
                                "stringValue": "active",
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
                                "stringValue": "active",
                            },
                            {
                                "operation": "CONTAINS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.jobTitle",
                                    "sourceId": undefined
                                },
                                "stringValue": "Accounts Payable Analyst",
                            }
                        ]
                    }
                ]
            };

            const converter = new RoleMembershipSelectorConverter(new MockupCache());

            const expression = parser.parse("(identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active') OR (identity.cloudLifecycleState eq 'active' AND identity.jobTitle co 'Accounts Payable Analyst')");

            await converter.visitExpression(expression, undefined);

            assert.deepEqual(converter.root, expectedComparisonOperator2);
        });

    });
});
