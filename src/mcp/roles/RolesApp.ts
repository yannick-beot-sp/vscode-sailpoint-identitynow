import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchRolesTool } from "./tools/SearchRolesTool";
import { CreateRoleTool } from "./tools/CreateRoleTool";

@App({
    id: "roles",
    name: "Roles",
    tools: [SearchRolesTool, CreateRoleTool],
})
export class RolesApp { }
