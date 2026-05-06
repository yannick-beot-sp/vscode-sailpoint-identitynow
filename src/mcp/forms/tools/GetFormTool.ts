import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { isGuid } from "../../../utils/stringUtils";
import { formDetailOutputSchema } from "./formSchemas";
import { formIdOrNameField } from "./formSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
    idOrName: formIdOrNameField,
});

const outputSchema = formDetailOutputSchema;

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "getForm",
    description:
        "Get the details of a form definition by GUID or name, including formInput, formElements, and formConditions. " +
        "Use listForms to discover form names and IDs.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Get Form",
        readOnlyHint: true,
    },
})
export class GetFormTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            const form = isGuid(input.idOrName)
                ? await client.getFormById(input.idOrName)
                : await client.getFormByName(input.idOrName);

            return {
                id: form.id,
                name: form.name,
                description: form.description,
                owner: {
                    ...form.owner,
                    name: form.owner?.name ?? ((form.owner) as any)?.fullName // casting to any because fullName is not part of schema
                },
                created: form.created,
                modified: form.modified,
                formInput: form.formInput,
                formElements: form.formElements,
                formConditions: form.formConditions,
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            if (err?.response?.status === 404 || err?.message?.includes("not found")) {
                throw new McpError(ErrorCodes.FORM_NOT_FOUND, `Form "${input.idOrName}" not found.`);
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
