import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { ListSourcesTool } from "./tools/ListSourcesTool";
import { GetSourceSchemasTool } from "./tools/GetSourceSchemasTool";

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
