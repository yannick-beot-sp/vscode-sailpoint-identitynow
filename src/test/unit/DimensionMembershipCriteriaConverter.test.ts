import * as assert from 'assert';
import { it, describe, suite } from 'mocha';
import { DimensionMembershipCriteriaConverter, DimensionCriteriaNode } from '../../parser/DimensionMembershipCriteriaConverter';

interface ParameterizedTest { should: string, input: string, expected: DimensionCriteriaNode };
interface ParameterizedErrorTest { should: string, input: string };

function leaf(property: string, value: string): DimensionCriteriaNode {
    return {
        operation: "EQUALS",
        key: { type: "IDENTITY", property: `attribute.${property}`, sourceId: null },
        stringValue: value,
        children: null
    };
}

function orGroup(...children: DimensionCriteriaNode[]): DimensionCriteriaNode {
    return {
        operation: "OR",
        key: null,
        stringValue: null,
        children
    };
}

function envelope(...clauses: DimensionCriteriaNode[]): DimensionCriteriaNode {
    return {
        operation: "AND",
        key: null,
        stringValue: "",
        children: [
            {
                operation: "AND",
                key: null,
                stringValue: "",
                children: clauses
            }
        ]
    };
}

suite('DimensionMembershipCriteriaConverter Test Suite', () => {
    const converter = new DimensionMembershipCriteriaConverter();

    describe('Single criterion', () => {
        const tests: ParameterizedTest[] = [
            {
                should: "should convert a single identity attribute criterion",
                input: "identity.country eq 'FR'",
                expected: envelope(leaf("country", "FR"))
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = converter.convert(t.input);
                assert.deepStrictEqual(result, t.expected);
            });
        });
    });

    describe('Multiple values for a single attribute (or / in)', () => {
        const tests: ParameterizedTest[] = [
            {
                should: "should convert an 'or' of the same attribute into an 'or' group",
                input: "identity.country eq 'ES' or identity.country eq 'EN'",
                expected: envelope(orGroup(leaf("country", "ES"), leaf("country", "EN")))
            },
            {
                should: "should convert an 'in' with 2 values into an 'or' group",
                input: "identity.country in ('EN','ES')",
                expected: envelope(orGroup(leaf("country", "EN"), leaf("country", "ES")))
            },
            {
                should: "should convert an 'in' with more than 2 values into an 'or' group",
                input: "identity.country in ('FR','BE','DE')",
                expected: envelope(orGroup(leaf("country", "FR"), leaf("country", "BE"), leaf("country", "DE")))
            },
            {
                should: "should convert more than 2 'or' of the same attribute into an 'or' group",
                input: "identity.country eq 'FR' or identity.country eq 'BE' or identity.country eq 'DE'",
                expected: envelope(orGroup(leaf("country", "FR"), leaf("country", "BE"), leaf("country", "DE")))
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = converter.convert(t.input);
                assert.deepStrictEqual(result, t.expected);
            });
        });
    });

    describe('Multiple attributes combined with and', () => {
        const tests: ParameterizedTest[] = [
            {
                should: "should convert 2 attributes combined with 'and'",
                input: "identity.country eq 'BE' and identity.department eq 'Accounting'",
                expected: envelope(leaf("country", "BE"), leaf("department", "Accounting"))
            },
            {
                should: "should convert more than 2 attributes combined with 'and'",
                input: "identity.country eq 'FR' and identity.department eq 'IT' and identity.city eq 'Paris'",
                expected: envelope(leaf("country", "FR"), leaf("department", "IT"), leaf("city", "Paris"))
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = converter.convert(t.input);
                assert.deepStrictEqual(result, t.expected);
            });
        });
    });

    describe('Multiple attributes, each with multiple values', () => {
        const expected = envelope(
            orGroup(leaf("country", "DE"), leaf("country", "SE")),
            orGroup(leaf("department", "Accounting"), leaf("department", "Finance"))
        );

        const tests: ParameterizedTest[] = [
            {
                should: "should convert 'or' groups combined with 'and', using parentheses",
                input: "(identity.country eq 'DE' or identity.country eq 'SE') and (identity.department eq 'Accounting' or identity.department eq 'Finance')",
                expected
            },
            {
                should: "should convert 'in' groups combined with 'and'",
                input: "identity.country in ('DE', 'SE') and identity.department in ('Accounting','Finance')",
                expected
            },
            {
                should: "should convert a mix of an 'or' group and an 'in' group combined with 'and'",
                input: "(identity.country eq 'DE' or identity.country eq 'SE') and identity.department in ('Accounting','Finance')",
                expected
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = converter.convert(t.input);
                assert.deepStrictEqual(result, t.expected);
            });
        });
    });

    describe('An "or" across different attributes', () => {
        const tests: ParameterizedTest[] = [
            {
                should: "should convert an 'or' group even when attributes differ",
                input: "identity.country eq 'FR' or identity.department eq 'IT'",
                expected: envelope(orGroup(leaf("country", "FR"), leaf("department", "IT")))
            }
        ];
        tests.forEach((t: ParameterizedTest) => {
            it(t.should, () => {
                const result = converter.convert(t.input);
                assert.deepStrictEqual(result, t.expected);
            });
        });
    });

    describe('Invalid dimension membership criteria', () => {
        const tests: ParameterizedErrorTest[] = [
            {
                should: "an account attribute is used",
                input: "'Active Directory'.attribute.departmentNumber eq '1234'",
            },
            {
                should: "an entitlement is used",
                input: "'Active Directory'.entitlement.memberOf eq 'CN=Accounting,OU=Groups,OU=Demo,DC=seri,DC=sailpointdemo,DC=com'",
            },
            {
                should: "the 'ne' operator is used",
                input: "identity.country ne 'FR'",
            },
            {
                should: "the 'co' operator is used",
                input: "identity.country co 'FR'",
            },
            {
                should: "the 'gt' operator is used",
                input: "identity.country gt 'FR'",
            },
            {
                should: "an 'and' is nested inside an 'or' group",
                input: "(identity.country eq 'FR' and identity.department eq 'IT') or identity.city eq 'Paris'",
            },
        ];
        tests.forEach((t: ParameterizedErrorTest) => {
            it("should throw an exception when " + t.should, () => {
                const converter = new DimensionMembershipCriteriaConverter();
                assert.throws(
                    () => converter.convert(t.input)
                );
            });
        });
    });
});
