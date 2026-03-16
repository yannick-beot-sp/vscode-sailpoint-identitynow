import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchIdentityTool } from "./tools/SearchIdentityTool";
import { GetIdentityTool } from "./tools/GetIdentityTool";
import { IdentityResource } from "./IdentityResource";

/**
 * FrontMCP application grouping all Identity management tools and resources.
 */
@App({
    id: "identities",
    name: "Identities",
    tools: [
        SearchIdentityTool,
        GetIdentityTool,
    ],
    resources: [
        IdentityResource,
    ],
})
export class IdentityApp { }
