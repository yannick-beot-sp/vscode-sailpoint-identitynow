import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchRolesTool } from "./tools/SearchRolesTool";
import { CreateRoleTool } from "./tools/CreateRoleTool";
import { UpdateRoleTool } from "./tools/UpdateRoleTool";

@App({
    id: "roles",
    name: "Roles",
    tools: [SearchRolesTool, CreateRoleTool, UpdateRoleTool],
})
export class RolesApp { }
