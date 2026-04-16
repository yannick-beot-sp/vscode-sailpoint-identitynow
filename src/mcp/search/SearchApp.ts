import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchAuditEventsTool } from "./tools/SearchAuditEventsTool";
import { SearchAccountActivitiesTool } from "./tools/SearchAccountActivitiesTool";

/**
 * FrontMCP application grouping all Search API tools (audit events, account activities).
 */
@App({
    id: "search",
    name: "Search",
    tools: [
        SearchAuditEventsTool,
        SearchAccountActivitiesTool,
    ],
})
export class SearchApp { }
