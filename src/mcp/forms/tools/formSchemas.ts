import { z } from "zod";
import { refSchema } from "../../inputFields";

export const formIdOrNameField = z.string().min(1).describe(
    "GUID (e.g. '603d301c-a57b-4ec4-939b-263ec0407b95') or name of the form definition."
);

export const descriptionField = z.string().optional().describe("Description of the form definition.")

export const formDefinitionInputSchema = z.object({
    id: z.string().optional().describe("Unique identifier for the form input."),
    type: z.enum(["STRING", "ARRAY"]).optional().describe("Input type: STRING or ARRAY."),
    label: z.string().optional().describe("Name for the form input."),
    description: z.string().optional().describe("Description of the form input."),
});

export const formElementValidationsSetSchema = z.object({
    validationType: z.enum([
        "REQUIRED", "MIN_LENGTH", "MAX_LENGTH", "REGEX", "DATE",
        "MAX_DATE", "MIN_DATE", "LESS_THAN_DATE", "PHONE", "EMAIL",
        "DATA_SOURCE", "TEXTAREA",
    ]).optional().describe("Validation type."),
});

export const formElementSchema = z.object({
    id: z.string().optional().describe("Form element identifier."),
    elementType: z.enum([
        "TEXT", "TOGGLE", "TEXTAREA", "HIDDEN", "PHONE", "EMAIL",
        "SELECT", "DATE", "SECTION", "COLUMN_SET", "IMAGE", "DESCRIPTION",
    ]).optional().describe("Element type."),
    config: z.record(z.string(), z.any()).optional().describe("Configuration key-value pairs for the element."),
    key: z.string().optional().describe("Technical key identifying the element."),
    validations: z.array(formElementValidationsSetSchema).nullable().optional().describe("Validation rules."),
});

export const conditionRuleSchema = z.object({
    sourceType: z.enum(["INPUT", "ELEMENT"]).optional().describe("Source type: INPUT (form input) or ELEMENT (form element)."),
    source: z.string().optional().describe("Name of the form input or technical key of the form element."),
    operator: z.enum([
        "EQ", "NE", "CO", "NOT_CO", "IN", "NOT_IN", "EM", "NOT_EM",
        "SW", "NOT_SW", "EW", "NOT_EW",
    ]).optional().describe("Comparison operator (EQ=equals, NE=not equals, CO=contains, EM=empty, SW=starts with, EW=ends with)."),
    valueType: z.enum(["STRING", "STRING_LIST", "INPUT", "ELEMENT", "LIST", "BOOLEAN"]).optional().describe("Type of the comparison value."),
    value: z.string().optional().describe("The value to compare against."),
});

export const conditionEffectConfigSchema = z.object({
    defaultValueLabel: z.string().optional().describe("Label for the effect."),
    element: z.string().optional().describe("Identifier of the element to target."),
});

export const conditionEffectSchema = z.object({
    effectType: z.enum([
        "HIDE", "SHOW", "DISABLE", "ENABLE", "REQUIRE", "OPTIONAL",
        "SUBMIT_MESSAGE", "SUBMIT_NOTIFICATION", "SET_DEFAULT_VALUE",
    ]).optional().describe("Type of effect to apply when the condition is met."),
    config: conditionEffectConfigSchema.optional(),
});

export const formConditionSchema = z.object({
    ruleOperator: z.enum(["AND", "OR"]).optional().describe("Logical operator combining the rules."),
    rules: z.array(conditionRuleSchema).optional().describe("Condition rules that must be satisfied."),
    effects: z.array(conditionEffectSchema).optional().describe("Effects applied when the conditions are met."),
});

export const formBaseOutputSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    owner: refSchema,
    created: z.string().optional(),
    modified: z.string().optional(),
});

export const formDetailOutputSchema = formBaseOutputSchema.extend({
    formInput: z.array(formDefinitionInputSchema).optional().describe("Inputs required when creating a form instance."),
    formElements: z.array(formElementSchema).optional().describe("Nested form elements composing the form UI."),
    formConditions: z.array(formConditionSchema).optional().describe("Conditional logic for dynamic form modification."),
});
