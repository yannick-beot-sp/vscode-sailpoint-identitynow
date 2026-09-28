import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListSourcesTool } from "./tools/ListSourcesTool.js";
import { GetSourceSchemasTool } from "./tools/GetSourceSchemasTool.js";

/**
 * FrontMCP application grouping all Source management tools and resources.
 */
@App({
    id: "sources",
    name: "Sources",
    tools: [
        ListSourcesTool,
        GetSourceSchemasTool,
    ],
    resources: [],
})
export class SourcesApp { }
