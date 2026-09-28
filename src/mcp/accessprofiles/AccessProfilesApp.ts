import "reflect-metadata";
import { App } from "@frontmcp/sdk";
import { SearchAccessProfilesTool } from "./tools/SearchAccessProfilesTool.js";
import { CreateAccessProfileTool } from "./tools/CreateAccessProfileTool.js";
import { UpdateAccessProfileTool } from "./tools/UpdateAccessProfileTool.js";

@App({
    id: "accessprofiles",
    name: "Access Profiles",
    tools: [SearchAccessProfilesTool, CreateAccessProfileTool, UpdateAccessProfileTool],
})
export class AccessProfilesApp { }
