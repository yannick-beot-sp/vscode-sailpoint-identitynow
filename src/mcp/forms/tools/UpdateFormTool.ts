import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { isGuid } from "../../../utils/stringUtils";
import { resolveIdentity } from "../../utils/identityUtils";
import { descriptionField, formConditionSchema, formDefinitionInputSchema, formDetailOutputSchema, formElementSchema } from "./formSchemas";
import { formIdOrNameField } from "./formSchemas";
import { JsonPatchOperationV2025 } from "sailpoint-api-client";

const inputSchema = z.object({
    tenantName: tenantNameField,
    idOrName: formIdOrNameField,
    description: descriptionField,
    owner: z.string().optional().describe("Username (alias) or ID of the new owner identity."),
    formInput: z.array(formDefinitionInputSchema).optional().describe("Replacement list of inputs required when creating a form instance."),
    formElements: z.array(formElementSchema).optional().describe("Replacement list of nested form elements composing the form UI."),
    formConditions: z.array(formConditionSchema).optional().describe("Replacement list of conditional logic for dynamic form modification."),
});

const outputSchema = formDetailOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "updateForm",
    description:
        "Update an existing form in SailPoint ISC. " +
        "Identify it by GUID or name, then specify only the fields to change. " +
        "Providing formInput, formElements, or formConditions replaces the existing arrays entirely. " +
        "Use listForms to find the GUID or name before calling this tool.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Update Form",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class UpdateFormTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            let formId: string;
            if (isGuid(input.idOrName)) {
                formId = input.idOrName;
            } else {
                const form = await client.getFormByName(input.idOrName);
                if (!form.id) {
                    throw new McpError(ErrorCodes.FORM_NOT_FOUND, `Form "${input.idOrName}" not found.`);
                }
                formId = form.id;
            }

            const patches: Array<JsonPatchOperationV2025> = [];

            if (input.description !== undefined) {
                patches.push({ op: "replace", path: "/description", value: input.description });
            }
            if (input.owner !== undefined) {
                const ownerId = await resolveIdentity(input.owner, client);
                patches.push({ op: "replace", path: "/owner", value: { type: "IDENTITY", id: ownerId } });
            }
            if (input.formInput !== undefined) {
                patches.push({ op: "replace", path: "/formInput", value: input.formInput });
            }
            if (input.formElements !== undefined) {
                patches.push({ op: "replace", path: "/formElements", value: input.formElements });
            }
            if (input.formConditions !== undefined) {
                patches.push({ op: "replace", path: "/formConditions", value: input.formConditions });
            }

            if (patches.length === 0) {
                throw new McpError(ErrorCodes.INVALID_INPUT, "No fields to update were provided.");
            }

            // @ts-ignore
            const updated = await client.patchForm(formId, patches);

            return {
                id: updated.id,
                name: updated.name,
                description: updated.description,
                owner: {
                    ...updated.owner,
                    name: updated.owner?.name ?? ((updated.owner) as any)?.fullName // casting to any because fullName is not part of schema
                },
                created: updated.created,
                modified: updated.modified,
                formInput: updated.formInput,
                formElements: updated.formElements,
                formConditions: updated.formConditions,
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            if (err?.message?.includes("not found")) {
                throw new McpError(ErrorCodes.FORM_NOT_FOUND, `Form "${input.idOrName}" not found.`);
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
