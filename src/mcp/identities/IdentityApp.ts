import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchIdentityTool } from "./tools/SearchIdentityTool.js";
import { GetIdentityTool } from "./tools/GetIdentityTool.js";
import { ListIdentityAttributesTool } from "./tools/ListIdentityAttributesTool.js";
import { IdentityResource } from "./IdentityResource.js";

/**
 * FrontMCP application grouping all Identity management tools and resources.
 */
@App({
    id: "identities",
    name: "Identities",
    tools: [
        SearchIdentityTool,
        GetIdentityTool,
        ListIdentityAttributesTool,
    ],
    resources: [
        IdentityResource,
    ],
})
export class IdentityApp { }
