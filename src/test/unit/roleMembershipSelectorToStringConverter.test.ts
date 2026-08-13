import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { RoleCriteriaLevel1 } from 'sailpoint-api-client';
import { CacheService } from '../../services/cache/CacheService';
import {  roleMembershipSelectorToStringConverter } from '../../parser/roleMembershipSelectorToStringConverter';


class MockupCache extends CacheService<string>{

    constructor() {
        super((key: string) => "Active Directory");
    }

}

suite('await roleMembershipSelectorToStringConverter Test Suite', () => {
    const cache = new MockupCache();
    
    describe('1 level conversion', async () => {
        it("should parse an expression and convert it", async () => {
            const roleCriteria1: RoleCriteriaLevel1 = {
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
            const result = await roleMembershipSelectorToStringConverter(roleCriteria1, cache);
            const expected = "identity.department eq 'Customer Service'";

            assert.deepEqual(result, expected);
        });
    });
    
    describe('2 level conversion', async () => {
        it("should parse an expression with 2 comparisons and convert it", async () => {
            const roleCriteria2: RoleCriteriaLevel1 = {
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

            const result = await roleMembershipSelectorToStringConverter(roleCriteria2, cache);

            const expected = "identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active'";

            assert.deepEqual(result, expected);
        });
        it("should parse an expression with 2 non-identity and convert it", async () => {
            const roleCriteria3: RoleCriteriaLevel1 = {
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
                                //@ts-ignore
                                "operation": "GREATER_THAN",
                                "key": {
                                    "type": "ACCOUNT",
                                    "property": "attribute.departmentNumber",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                //@ts-ignore
                                "values": [
                                    "1234"
                                ]
                            },
                        ]
                    }
                ]
            };

            const result = await roleMembershipSelectorToStringConverter(roleCriteria3, cache);

            const expected = "'Active Directory'.entitlement.memberOf eq 'CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com' and 'Active Directory'.attribute.departmentNumber gt '1234'";

            assert.deepEqual(result, expected);

        });
    });

    describe('3 level conversion', async () => {
        it("should parse an expression and convert it", async () => {
            const roleCriteria4: RoleCriteriaLevel1 = {
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

            const result = await roleMembershipSelectorToStringConverter(roleCriteria4, cache);

            const expected = "(identity.department eq 'Customer Service' and identity.cloudLifecycleState eq 'active') or (identity.cloudLifecycleState eq 'active' and identity.jobTitle co 'Accounts Payable Analyst')";

            assert.deepEqual(result, expected);
        });

    });

    describe('Unbalanced criteria', async () => {
        it("should parse an expression and convert it", async () => {
            const roleCriteria4: RoleCriteriaLevel1 = {
                "operation": "OR",
                "key": null,
                "stringValue": "",
                "children": [
                    {
                        "operation": "EQUALS",
                        "key": {
                            "type": "ENTITLEMENT",
                            "property": "attribute.ProfileId",
                            "sourceId": "2c9180887229516601722cabce3f0ad5"
                        },
                        "stringValue": "00e1i000000eM2qAAE",
                        "children": []
                    },
                    {
                        "operation": "AND",
                        "key": null,
                        "stringValue": "",
                        "children": [
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.cloudLifecycleState",
                                    "sourceId": ""
                                },
                                "stringValue": "active",
                            },
                            {
                                "operation": "EQUALS",
                                "key": {
                                    "type": "IDENTITY",
                                    "property": "attribute.usertype",
                                    "sourceId": ""
                                },
                                "stringValue": "External",
                            }
                        ]
                    }
                ]
            };

            const result = await roleMembershipSelectorToStringConverter(roleCriteria4, cache);

            const expected = "('Active Directory'.entitlement.ProfileId eq '00e1i000000eM2qAAE') or (identity.cloudLifecycleState eq 'active' and identity.usertype eq 'External')";

            assert.deepEqual(result, expected);
        });

    });

    describe('conversion with new operators', async () => {
        it("should parse an expression and convert it", async () => {
            const roleCriteria5: RoleCriteriaLevel1 = {
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
                                   "Customer Service",
                                   "Accounting"
                                ]
                                
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
                                //@ts-ignore
                                "operation": "GREATER_THAN",
                                "key": {
                                    "type": "ACCOUNT",
                                    "property": "attribute.departmentNumber",
                                    "sourceId": "6ba6925ebc1a4e5d98ca6fd3fc542ea4"
                                },
                                //@ts-ignore
                                "values": [
                                    "1234"
                                ]
                            },
                        ]
                    }
                ]
            };

            const result = await roleMembershipSelectorToStringConverter(roleCriteria5, cache);

            const expected = "(identity.department in ('Customer Service','Accounting') and identity.cloudLifecycleState eq 'active') or (identity.cloudLifecycleState eq 'active' and 'Active Directory'.attribute.departmentNumber gt '1234')";

            assert.deepEqual(result, expected);
        });

    });
});
