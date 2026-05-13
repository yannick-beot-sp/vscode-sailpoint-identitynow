import "reflect-metadata";
import { Tool, ToolContext } from "@frontmcp/sdk";
import { z } from "zod";
import { getIscClient } from "../../plugins/TenantResolverPlugin";
import { ErrorCodes, McpError } from "../../errors";
import { tenantNameField } from "../../inputFields";
import { identityProfileIdOrNameField, parseMapping } from "./identityProfileSchemas";
import { isUuid } from "../../../utils/stringUtils";
import { IdentityAttributeTransform } from "sailpoint-api-client";

const inputSchema = z.object({
    tenantName: tenantNameField,
    identityProfile: identityProfileIdOrNameField,
    identityAttributeName: z.string().min(1).describe(
        "Name of the identity attribute to map (e.g. 'uid', 'email', 'identificationNumber')."
    ),
    sourceNameOrId: z.string().min(1).optional().describe(
        "Name or ID (32-char hex) of the source providing the account attribute. Required unless ruleId is provided."
    ),
    attributeName: z.string().min(1).optional().describe(
        "Account attribute name on the source (e.g. 'empid', 'email', 'contractEndDate'). Required unless ruleId is provided."
    ),
    transformName: z.string().optional().describe(
        "Name of an existing transform to apply to the account attribute value before mapping (e.g. 'ISO8601EndDateFormat'). " +
        "Omit this field for a direct mapping without a transform. Not applicable when ruleId is provided."
    ),
    ruleId: z.string().min(1).optional().describe(
        "ID (32-char hex) of the rule to apply for a rule-based mapping. " +
        "When provided, sourceNameOrId and attributeName are not required. " +
        "Use getIdentityProfile to read existing rule names and IDs from the current mappings."
    ),
});

const outputSchema = z.object({
    id: z.string().optional().describe("Identity profile ID."),
    name: z.string().describe("Identity profile name."),
    mappings: z.array(
        z.object({
            identityAttributeName: z.string(),
            sourceName: z.string().optional(),
            attributeName: z.string().optional(),
            transformName: z.string().optional(),
            ruleName: z.string().optional(),
        })
    ).describe("Updated list of all attribute mappings on the profile."),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

@Tool({
    name: "setIdentityProfileMapping",
    description:
        "Add or update an identity attribute mapping on an identity profile in SailPoint ISC. " +
        "If the identity attribute is not yet mapped, the mapping is added. " +
        "If it already exists, the existing mapping is replaced. " +
        "Supports three mapping types: (1) direct account attribute from a source, " +
        "(2) account attribute with a named transform applied, " +
        "(3) rule-based mapping via ruleId. " +
        "Use getIdentityProfile to inspect current mappings including rule names and IDs.",
    inputSchema,
    outputSchema,
    annotations: {
        title: "Set Identity Profile Mapping",
        readOnlyHint: false,
        destructiveHint: false,
    },
})
export class SetIdentityProfileMappingTool extends ToolContext {
    async execute(input: Input): Promise<Output> {
        const client = getIscClient(this);

        try {
            // Validate input combination
            if (!input.ruleId && (!input.sourceNameOrId || !input.attributeName)) {
                throw new McpError(
                    ErrorCodes.INVALID_INPUT,
                    "Either ruleId or both sourceNameOrId and attributeName must be provided."
                );
            }

            // Resolve identity profile
            let profileId: string;
            let profileName: string;
            if (isUuid(input.identityProfile)) {
                profileId = input.identityProfile;
                const profile = await client.getIdentityProfileById(profileId);
                profileName = profile.name ?? profileId;
            } else {
                const profile = await client.getIdentityProfileByName(input.identityProfile);
                if (!profile.id) {
                    throw new McpError(
                        ErrorCodes.IDENTITY_PROFILE_NOT_FOUND,
                        `Identity profile "${input.identityProfile}" not found.`
                    );
                }
                profileId = profile.id;
                profileName = profile.name ?? input.identityProfile;
            }

            // Build the mapping object
            let mapping: IdentityAttributeTransform;
            if (input.ruleId) {
                mapping = {
                    identityAttributeName: input.identityAttributeName,
                    transformDefinition: {
                        type: "rule",
                        attributes: {
                            id: input.ruleId,
                        },
                    },
                };
            } else {
                // Resolve source to obtain both name and ID
                let sourceName: string;
                let sourceId: string;
                if (isUuid(input.sourceNameOrId!)) {
                    sourceId = input.sourceNameOrId!;
                    const source = await client.getSourceById(sourceId);
                    sourceName = source.name;
                } else {
                    const source = await client.getSourceByName(input.sourceNameOrId!);
                    sourceName = source.name;
                    sourceId = source.id!;
                }

                mapping = input.transformName
                    ? {
                        identityAttributeName: input.identityAttributeName,
                        transformDefinition: {
                            type: "reference",
                            attributes: {
                                id: input.transformName,
                                input: {
                                    type: "accountAttribute",
                                    attributes: {
                                        sourceName,
                                        attributeName: input.attributeName!,
                                        sourceId,
                                    },
                                },
                            },
                        },
                    }
                    : {
                        identityAttributeName: input.identityAttributeName,
                        transformDefinition: {
                            type: "accountAttribute",
                            attributes: {
                                sourceName,
                                attributeName: input.attributeName!,
                                sourceId,
                            },
                        },
                    };
            }

            const updated = await client.setIdentityProfileMapping(profileId, mapping);

            return {
                id: updated.id,
                name: updated.name ?? profileName,
                mappings: (updated.identityAttributeConfig?.attributeTransforms ?? []).map(parseMapping),
            };
        } catch (err: any) {
            if (err instanceof McpError) { throw err; }
            const message = String(err?.message ?? err);
            if (message.includes("Could not find identity profile") || err?.response?.status === 404) {
                throw new McpError(
                    ErrorCodes.IDENTITY_PROFILE_NOT_FOUND,
                    `Identity profile "${input.identityProfile}" not found.`
                );
            }
            if (message.includes("Could not find source")) {
                throw new McpError(ErrorCodes.SOURCE_NOT_FOUND, `Source "${input.sourceNameOrId}" not found.`);
            }
            throw new McpError(ErrorCodes.ISC_API_ERROR, message);
        }
    }
}
