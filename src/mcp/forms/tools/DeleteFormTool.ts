import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { isGuid } from "../../../utils/stringUtils";
import { formIdOrNameField } from "./formSchemas";

const inputSchema = z.object({
    tenantName: tenantNameField,
    idOrName: formIdOrNameField,
});

const outputSchema = z.object({
    status: z.literal("deleted"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "deleteForm",
    description:
        "Delete a form definition by GUID or name. " +
        "Use listForms to find the GUID or name before calling this tool.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Delete Form",
        readOnlyHint: false,
        destructiveHint: true,
    },
})
export class DeleteFormTool extends ToolContext {
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

            await client.deleteFormById(formId);
            return { status: "deleted" };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            if (err?.response?.status === 404 || err?.message?.includes("not found")) {
                throw new McpError(ErrorCodes.FORM_NOT_FOUND, `Form "${input.idOrName}" not found.`);
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, String(err?.message ?? err));
        }
    }
}
