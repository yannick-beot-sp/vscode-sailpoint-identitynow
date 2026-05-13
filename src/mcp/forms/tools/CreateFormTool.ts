import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { resolveIdentity } from "../../utils/identityUtils";
import { getFormOwner } from "../formUtils";
import { descriptionField, formConditionSchema, formDefinitionInputSchema, formDetailOutputSchema, formElementSchema } from "./formSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
    name: z.string().min(1).describe("Name of the form definition."),
    description: descriptionField,
    owner: z.string().min(1).describe("Username (alias) or ID of the identity who owns the form."),
    formInput: z.array(formDefinitionInputSchema).optional().describe("Inputs required when creating a form instance."),
    formElements: z.array(formElementSchema).optional().describe("Nested form elements composing the form UI."),
    formConditions: z.array(formConditionSchema).optional().describe("Conditional logic for dynamic form modification."),
});

const outputSchema = formDetailOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "createForm",
    description:
        "Create a new form definition in SailPoint ISC. " +
        "Specify the form name, owner (identity alias or ID), and optionally a description, formInput, formElements, and formConditions. " +
        "Use searchIdentities to find the owner before calling this tool.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Create Form",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class CreateFormTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const ownerId = await resolveIdentity(input.owner, client);

            const created = await client.createForm({
                name: input.name,
                description: input.description,
                owner: { type: "IDENTITY", id: ownerId },
                formInput: input.formInput,
                formElements: input.formElements,
                formConditions: input.formConditions,
            });

            return {
                id: created.id,
                name: created.name,
                description: created.description,
                owner: getFormOwner(created.owner),
                created: created.created,
                modified: created.modified,
                formInput: created.formInput,
                formElements: created.formElements,
                formConditions: created.formConditions,
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
