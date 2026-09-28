import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchRolesTool } from "./tools/SearchRolesTool.js";
import { CreateRoleTool } from "./tools/CreateRoleTool.js";
import { UpdateRoleTool } from "./tools/UpdateRoleTool.js";

@App({
    id: "roles",
    name: "Roles",
    tools: [SearchRolesTool, CreateRoleTool, UpdateRoleTool],
})
export class RolesApp { }
